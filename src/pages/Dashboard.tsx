import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { DownloadReceiptButton } from '@/components/ReceiptPDF'
import { load } from '@cashfreepayments/cashfree-js'

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

  const handlePayment = async (booking: any) => {
    setPayingBookingId(booking.id)
    try {
      // 1. Create order on backend
      const res = await fetch('/.netlify/functions/create-cashfree-order', {
        method: 'POST',
        body: JSON.stringify({ bookingId: booking.id })
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
        alert("Payment was not completed. Please try again.");
      } else if (result.paymentDetails) {
        // 3. Verify on backend
        const verifyRes = await fetch('/.netlify/functions/verify-cashfree-payment', {
          method: 'POST',
          body: JSON.stringify({ orderId: data.order_id, bookingId: booking.id })
        });
        const verifyData = await verifyRes.json();
        
        if (verifyData.status === 'PAID') {
          alert('Payment successful! Your booking is confirmed.');
          await fetchBookings(user.uid);
        } else {
          alert(`Payment status is ${verifyData.status}. Please check later or contact support.`);
        }
      }
    } catch (e: any) {
      console.error(e);
      alert('Error initiating payment: ' + e.message);
    } finally {
      setPayingBookingId(null);
    }
  }

  if (loading) {
    return <div className="pt-32 min-h-screen container mx-auto px-4 flex justify-center text-cream-400">Loading...</div>
  }

  return (
    <div className="pt-32 pb-24 min-h-screen bg-charcoal-900">
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
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs text-gold-400 uppercase tracking-widest mb-1">{booking.eventType}</div>
                        <h3 className="text-xl font-serif text-cream-100">
                          {booking.eventDate ? format(new Date(booking.eventDate), 'EEEE, MMMM do, yyyy') : 'Date TBD'}
                        </h3>
                      </div>
                      <StatusBadge status={booking.bookingStatus} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-cream-400 block mb-1">Guest Count</span>
                        <span className="text-cream-200 font-medium">{booking.guestCount} Guests</span>
                      </div>
                      <div>
                        <span className="text-cream-400 block mb-1">Booking ID</span>
                        <span className="text-cream-200 font-medium font-mono text-xs">{booking.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:w-64 bg-charcoal-900 border border-white/5 p-4 rounded-md">
                    <div className="mb-4 pb-4 border-b border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-cream-400 text-xs uppercase tracking-wider">Total</span>
                        <span className="text-cream-100 font-medium">₹{(booking.totalAmount || booking.estimatedAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-cream-400 text-xs uppercase tracking-wider">Paid</span>
                        <span className="text-gold-400 font-medium">₹{(booking.amountPaid || booking.advanceAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {['confirmed', 'completed'].includes(booking.bookingStatus) && (
                      <div className="mt-4">
                        <DownloadReceiptButton 
                          booking={booking} 
                          className="w-full flex items-center justify-center gap-2 bg-gold-500 text-charcoal-900 px-4 py-2 rounded-sm text-sm font-medium hover:bg-gold-400 transition-colors"
                        />
                      </div>
                    )}

                    {booking.bookingStatus === 'awaiting_payment' && (
                      <div className="mt-4">
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white" 
                          onClick={() => handlePayment(booking)}
                          disabled={payingBookingId === booking.id}
                        >
                          {payingBookingId === booking.id ? 'Processing...' : `Pay Advance (₹${booking.advanceAmount.toLocaleString()})`}
                        </Button>
                      </div>
                    )}

                    {booking.bookingStatus === 'pending_review' && (
                      <p className="text-xs text-cream-400 text-center">Awaiting owner review.</p>
                    )}
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
