import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, LogOut, Copy, Check, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { DownloadReceiptButton } from '@/components/ReceiptPDF'
import { load } from '@cashfreepayments/cashfree-js'
import emailjs from '@emailjs/browser'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        await fetchBookings(currentUser.uid)
      } else {
        navigate('/book')
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [navigate])

  const fetchBookings = async (uid: string) => {
    try {
      const q = query(
        collection(db, "bookings"), 
        where("userId", "==", uid),
        // orderBy("createdAt", "desc") // Requires index, skipping for now
      )
      const querySnapshot = await getDocs(q)
      const bks: any[] = []
      querySnapshot.forEach((doc) => {
        bks.push({ id: doc.id, ...doc.data() })
      })
      
      // Sort in memory since we didn't index
      bks.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis())
      
      setBookings(bks)
    } catch (err) {
      console.error("Error fetching bookings:", err)
    }
  }

  const handleSignOut = () => {
    signOut(auth).then(() => {
      navigate('/')
    })
  }

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handlePayment = async (booking: any, paymentType: 'advance' | 'full' | 'remaining') => {
    setPayingBookingId(booking.id)
    try {
      // 1. Create order on backend
      const res = await fetch('/.netlify/functions/create-cashfree-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, paymentType })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      // 2. Initialize Cashfree Drop-in
      const cashfree = await load({ mode: import.meta.env.VITE_CASHFREE_ENV === 'production' ? 'production' : 'sandbox' });
      
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_modal" as const,
      };

      const result = await cashfree.checkout(checkoutOptions);

      if (result.error) {
        console.error("Payment error:", result.error);
        setNotification({ type: 'error', message: "Payment was not completed. Please try again." });
      } else if (result.paymentDetails) {
        // 3. Verify on backend
        const verifyRes = await fetch('/.netlify/functions/verify-cashfree-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.order_id, bookingId: booking.id })
        });
        const verifyData = await verifyRes.json();
        
        if (verifyData.status === 'PAID') {
          setNotification({ type: 'success', message: 'Payment successful! Your booking is confirmed.' });
          
          // Trigger EmailJS on payment success
          const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
          const templateId = import.meta.env.VITE_EMAILJS_PAYMENT_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
          const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
          
          if (serviceId && templateId && publicKey) {
            const amount = paymentType === 'full' ? booking.totalAmount : paymentType === 'remaining' ? ((booking.totalAmount || 0) - (booking.amountPaid || 0)) : booking.advanceAmount;
            const pStatus = paymentType === 'full' ? 'fully_paid' : paymentType === 'remaining' ? 'fully_paid' : 'advance_paid';
            
            emailjs.send(
              serviceId,
              templateId,
              {
                booking_id: booking.id,
                customer_name: booking.userName || user.displayName || 'Customer',
                customer_email: booking.userEmail || user.email || '',
                amount_paid: amount,
                payment_status: pStatus,
                event_date: booking.eventDate,
                event_type: booking.eventType
              },
              publicKey
            ).catch(err => console.error("EmailJS payment success notification error:", err));
          }
          
          await fetchBookings(user.uid);
        } else {
          setNotification({ type: 'info', message: `Payment status is ${verifyData.status}. Please check later or contact support.` });
        }
      }
    } catch (e: any) {
      console.error(e);
      setNotification({ type: 'error', message: 'Error initiating payment: ' + e.message });
    } finally {
      setPayingBookingId(null);
    }
  }

  if (loading) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-charcoal-900">
        <section className="container mx-auto px-4 mb-8">
          <div className="bg-charcoal-800 border border-white/5 p-6 rounded-md mb-12 animate-pulse">
            <div className="h-8 bg-charcoal-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-charcoal-700 rounded w-1/3"></div>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-charcoal-800 border border-white/5 rounded-md p-6 shadow-xl animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="h-6 bg-charcoal-700 rounded w-1/3"></div>
                  <div className="h-6 bg-charcoal-700 rounded w-1/5"></div>
                </div>
                <div className="h-px bg-white/5 w-full mb-4"></div>
                <div className="space-y-3 mb-6">
                  <div className="h-4 bg-charcoal-700 rounded w-3/4"></div>
                  <div className="h-4 bg-charcoal-700 rounded w-1/2"></div>
                  <div className="h-4 bg-charcoal-700 rounded w-2/3"></div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 bg-charcoal-700 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="pt-32 pb-24 min-h-screen bg-charcoal-900 relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-4 z-50 max-w-sm w-full bg-charcoal-800 border-l-4 border-gold-500 shadow-2xl p-4 flex items-start gap-3 rounded-r-md animate-fade-in">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-cream-100 uppercase tracking-wider">
              {notification.type === 'success' ? 'Success' : notification.type === 'error' ? 'Error' : 'Notification'}
            </h4>
            <p className="text-sm text-cream-400 mt-1">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-cream-400 hover:text-cream-200 text-lg leading-none">
            &times;
          </button>
        </div>
      )}

      <section className="container mx-auto px-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center bg-charcoal-800 border border-white/5 p-6 rounded-md mb-12">
          <div>
            <h1 className="text-2xl font-serif text-cream-100 mb-1">Welcome, {user?.displayName || 'Guest'}</h1>
            <p className="text-cream-400 text-sm">{user?.email}</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-4">
            <Button to="/book" variant="outline">New Booking</Button>
            <Button variant="ghost" onClick={handleSignOut} className="text-cream-400 hover:text-red-400">
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>

        <h2 className="text-xl font-serif text-cream-100 mb-6">Your Bookings</h2>
        
        {bookings.length === 0 ? (
          <div className="bg-charcoal-800 border border-white/5 rounded-md p-10 text-center">
            <Calendar className="w-12 h-12 text-cream-400/30 mx-auto mb-4" />
            <p className="text-cream-200 mb-4">You have no bookings yet.</p>
            <Button to="/book">Make a Reservation</Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                key={booking.id} 
                className="bg-charcoal-800 border border-white/5 rounded-md overflow-hidden"
              >
                <div className="p-6 sm:p-8 flex flex-col md:flex-row justify-between gap-6">
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="text-xs text-gold-400 uppercase tracking-widest mb-1">{booking.eventType}</div>
                        <h3 className="text-xl font-serif text-cream-100">
                          {booking.eventDate ? format(new Date(booking.eventDate), 'EEEE, MMMM do, yyyy') : 'Date TBD'}
                        </h3>
                      </div>
                      <StatusBadge status={booking.bookingStatus} />
                    </div>
                    
                    <BookingTimeline status={booking.bookingStatus} />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm bg-charcoal-900/50 p-4 rounded-md border border-white/5 mb-2">
                      <div>
                        <span className="text-cream-400 block mb-1 text-xs uppercase tracking-wider">Guest Count</span>
                        <span className="text-cream-200 font-medium">{booking.guestCount} Guests</span>
                      </div>
                      <div>
                        <span className="text-cream-400 block mb-1 text-xs uppercase tracking-wider">Booking ID</span>
                        <div className="flex items-center text-cream-200 font-medium font-mono text-xs">
                          {booking.id}
                          <CopyButton text={booking.id} />
                        </div>
                      </div>
                    </div>

                    <BookingStatusMessage booking={booking} />

                    <div className="text-[10px] text-cream-400/50 mt-6 leading-relaxed">
                      * Cancellations made 7 days prior to the event will receive a full refund of the advance amount. Cancellations within 7 days are non-refundable. Please review our full terms and conditions.
                    </div>
                  </div>

                  <div className="md:w-64 bg-charcoal-900 border border-white/5 p-5 rounded-lg flex flex-col justify-between shadow-inner">
                    <div>
                      <h4 className="text-sm font-serif text-cream-100 mb-3 border-b border-white/5 pb-2">Payment Details</h4>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-cream-400">Total</span>
                          <span className="text-cream-200">₹{(booking.totalAmount || booking.estimatedAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-cream-400">Paid</span>
                          <span className="text-green-400">₹{(booking.amountPaid || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-medium pt-2 border-t border-white/5">
                          <span className="text-cream-100">Due Now</span>
                          <span className="text-gold-400">
                            {booking.bookingStatus === 'awaiting_payment' 
                              ? `₹${(booking.advanceAmount || 5000).toLocaleString()}` 
                              : `₹${Math.max(0, (booking.totalAmount || booking.estimatedAmount || 0) - (booking.amountPaid || 0)).toLocaleString()}`
                            }
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-charcoal-800 rounded-full h-1.5 mb-5 overflow-hidden border border-white/5 shadow-inner">
                        <div 
                          className="bg-gold-400 h-1.5 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(212,175,55,0.8)]" 
                          style={{ width: `${Math.min(100, ((booking.amountPaid || 0) / (booking.totalAmount || booking.estimatedAmount || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-auto space-y-3">
                      {booking.bookingStatus === 'awaiting_payment' && (
                        <Button 
                          className="w-full bg-gold-400 hover:bg-gold-300 text-black font-black text-sm py-2 shadow-[0_0_15px_rgba(212,175,55,0.4)]" 
                          onClick={() => handlePayment(booking, 'advance')}
                          disabled={payingBookingId === booking.id}
                        >
                          {payingBookingId === booking.id ? 'Processing...' : 'Pay Advance'}
                        </Button>
                      )}

                      {booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'advance_paid' && ((booking.totalAmount || 0) - (booking.amountPaid || 0) > 0) && (
                        <Button 
                          className="w-full bg-gold-400 hover:bg-gold-300 text-black font-black text-sm py-2 shadow-[0_0_15px_rgba(212,175,55,0.4)]" 
                          onClick={() => handlePayment(booking, 'remaining')}
                          disabled={payingBookingId === booking.id}
                        >
                          {payingBookingId === booking.id ? 'Processing...' : 'Pay Balance'}
                        </Button>
                      )}

                      {['confirmed', 'completed'].includes(booking.bookingStatus) && (
                        <DownloadReceiptButton 
                          booking={booking} 
                          className="w-full flex items-center justify-center gap-2 bg-charcoal-800 border border-white/10 text-cream-200 hover:text-white px-4 py-2 rounded-md text-sm hover:bg-charcoal-700 transition-colors"
                        />
                      )}

                      {booking.bookingStatus === 'pending_review' && (
                        <div className="bg-blue-500/10 text-blue-400 text-xs font-medium text-center py-2.5 rounded-md border border-blue-500/20">
                          Awaiting Review
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            ))}
          </div>
        )}

      </section>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string, color: string }> = {
    'pending_review': { label: 'Under Review', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    'awaiting_payment': { label: 'Awaiting Payment', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    'confirmed': { label: 'Confirmed', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    'completed': { label: 'Completed', color: 'bg-charcoal-700 text-cream-400 border-white/10' },
    'cancelled': { label: 'Cancelled', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    'rejected': { label: 'Rejected', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
  }
  
  const current = config[status] || { label: status, color: 'bg-charcoal-700 text-cream-400' }
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${current.color}`}>
      {current.label}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={handleCopy} className="ml-2 text-cream-400 hover:text-gold-400 transition-colors" title="Copy ID">
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}

function BookingTimeline({ status }: { status: string }) {
  const steps = [
    { id: 'pending_review', label: 'Pending' },
    { id: 'awaiting_payment', label: 'Approved' },
    { id: 'confirmed', label: 'Confirmed' }
  ]
  
  let currentStepIndex = 0;
  if (status === 'awaiting_payment') currentStepIndex = 1;
  if (status === 'confirmed' || status === 'completed') currentStepIndex = 2;

  if (status === 'rejected') {
    return (
      <div className="flex items-center text-red-400 gap-2 mb-6">
        <XCircle className="w-5 h-5" />
        <span className="text-sm font-medium">Booking Rejected</span>
      </div>
    )
  }

  return (
    <div className="flex items-center w-full max-w-sm mb-6 mt-4">
      {steps.map((step, index) => {
        const isCompleted = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center relative">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 
                ${isCompleted ? 'bg-gold-400 border-gold-400 text-black' : 'bg-charcoal-800 border-white/20 text-cream-400/50'}`}>
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
              </div>
              <span className={`absolute top-8 text-[10px] uppercase tracking-widest whitespace-nowrap font-medium
                ${isCurrent ? 'text-gold-400' : isCompleted ? 'text-cream-200' : 'text-cream-400/50'}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${index < currentStepIndex ? 'bg-gold-400' : 'bg-white/10'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function BookingStatusMessage({ booking }: { booking: any }) {
  if (booking.bookingStatus === 'rejected') {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-md mt-6">
        <p className="text-red-400 text-sm font-medium mb-1">Booking Declined</p>
        <p className="text-cream-400 text-xs">
          {booking.rejectionReason 
            ? `Reason: ${booking.rejectionReason}` 
            : "Unfortunately, we cannot accommodate your request for this date. Please try selecting another date."}
        </p>
        <Button to="/book" variant="outline" size="sm" className="mt-3">Try Another Date</Button>
      </div>
    )
  }
  if (booking.bookingStatus === 'pending_review') {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-md mt-8 flex gap-3 items-start">
        <Clock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-400 text-sm font-medium mb-1">Under Review</p>
          <p className="text-cream-400 text-xs">Our team is reviewing your request. You will receive an email shortly with approval and pricing details.</p>
        </div>
      </div>
    )
  }
  if (booking.bookingStatus === 'awaiting_payment') {
    return (
      <div className="bg-gold-400/10 border border-gold-400/20 p-4 rounded-md mt-8 flex gap-3 items-start">
        <CheckCircle2 className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-gold-400 text-sm font-medium mb-1">Booking Approved!</p>
          <p className="text-cream-400 text-xs">Please pay the due amount within 24 hours to secure your date.</p>
        </div>
      </div>
    )
  }
  if (booking.bookingStatus === 'confirmed') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-md mt-8 flex gap-3 items-start">
        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-green-400 text-sm font-medium mb-1">Booking Confirmed</p>
          <p className="text-cream-400 text-xs">Your event is confirmed. You can pay any remaining balance in the payment details section.</p>
        </div>
      </div>
    )
  }
  return null;
}
