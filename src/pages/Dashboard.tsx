import { useState, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Calendar, LogOut, Copy, Check, CheckCircle2, Clock, XCircle, CalendarDays, IndianRupee, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
const DownloadReceiptButton = lazy(() => import('@/components/ReceiptPDF').then(m => ({ default: m.DownloadReceiptButton })))
import { load } from '@cashfreepayments/cashfree-js'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let unsubscribeBookings: (() => void) | null = null
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        const q = query(collection(db, "bookings"), where("userId", "==", currentUser.uid))
        unsubscribeBookings = onSnapshot(q, (snapshot) => {
          const bks: any[] = []
          snapshot.forEach((doc) => bks.push({ id: doc.id, ...doc.data() }))
          bks.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
          setBookings(bks)
          setLoading(false)
        }, (err) => {
          console.error("Error listening to bookings:", err)
          setLoading(false)
        })
      } else {
        setUser(null)
        setBookings([])
        setLoading(false)
        navigate('/book')
      }
    })
    return () => {
      unsubscribeAuth()
      if (unsubscribeBookings) unsubscribeBookings()
    }
  }, [navigate])

  const handleSignOut = () => {
    signOut(auth).then(() => navigate('/'))
  }

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handlePayment = async (booking: any, paymentType: 'advance' | 'full' | 'remaining') => {
    setPayingBookingId(booking.id)
    try {
      const response = await fetch('/.netlify/functions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: paymentType === 'advance' ? (booking.advanceAmount || 5000) :
                  paymentType === 'remaining' ? Math.max(0, (booking.totalAmount || booking.estimatedAmount || 0) - (booking.amountPaid || 0)) :
                  (booking.totalAmount || booking.estimatedAmount || 0),
          customerName: user?.displayName || 'Customer',
          customerEmail: user?.email || '',
          customerPhone: booking.contactNumber || '9999999999',
          paymentType,
        })
      })
      if (!response.ok) throw new Error('Failed to create order')
      const data = await response.json()
      const cashfree = await load({ mode: 'production' })
      cashfree.checkout({ paymentSessionId: data.payment_session_id, redirectTarget: '_self' })
    } catch (err: any) {
      console.error('Payment error:', err)
      setNotification({ type: 'error', message: err.message || 'Payment failed. Please try again.' })
    } finally {
      setPayingBookingId(null)
    }
  }

  const photoURL = user?.photoURL || null
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Guest'
  const avatarLetter = (displayName)[0].toUpperCase()

  const confirmedCount = bookings.filter(b => b.bookingStatus === 'confirmed').length
  const pendingCount = bookings.filter(b => b.bookingStatus === 'pending_review').length
  const upcomingCount = bookings.filter(b => ['confirmed', 'awaiting_payment'].includes(b.bookingStatus)).length

  if (loading) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-charcoal-900">
        <section className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-charcoal-800 rounded-2xl" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-20 bg-charcoal-800 rounded-xl" />
              <div className="h-20 bg-charcoal-800 rounded-xl" />
              <div className="h-20 bg-charcoal-800 rounded-xl" />
            </div>
            <div className="h-48 bg-charcoal-800 rounded-2xl" />
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-24 min-h-screen bg-charcoal-900 relative">
      {/* Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-charcoal-800 border-l-4 border-gold-500 shadow-2xl p-4 flex items-start gap-3 rounded-r-md">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-cream-100 uppercase tracking-wider">
              {notification.type === 'success' ? 'Success' : notification.type === 'error' ? 'Error' : 'Info'}
            </h4>
            <p className="text-sm text-cream-400 mt-1">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-cream-400 hover:text-cream-200 text-lg">&times;</button>
        </div>
      )}

      <section className="container mx-auto px-4 max-w-4xl">

        {/* Profile Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-charcoal-800 to-charcoal-900 border border-white/8 rounded-2xl p-5 sm:p-7 mb-5 flex items-center gap-4 sm:gap-6"
        >
          {/* Gold accent line */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />

          {/* Avatar */}
          <div className="flex-shrink-0">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-3 border-gold-500/50 shadow-xl shadow-gold-500/10"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gold-500/10 border-2 border-gold-500/40 flex items-center justify-center text-gold-400 text-2xl sm:text-3xl font-bold shadow-xl">
                {avatarLetter}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gold-400 uppercase tracking-widest mb-0.5">Welcome back</p>
            <h1 className="text-xl sm:text-2xl font-serif text-cream-100 font-bold truncate">{displayName}</h1>
            <p className="text-cream-400 text-xs sm:text-sm truncate">{user?.email}</p>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="flex-shrink-0 flex flex-col items-center gap-1 text-cream-400 hover:text-red-400 transition-colors p-2"
          >
            <LogOut size={18} />
            <span className="text-[10px] uppercase tracking-wider hidden sm:block">Sign Out</span>
          </button>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total', value: bookings.length, icon: <CalendarDays size={18} />, color: 'text-cream-300' },
            { label: 'Upcoming', value: upcomingCount, icon: <Clock size={18} />, color: 'text-blue-400' },
            { label: 'Confirmed', value: confirmedCount, icon: <CheckCircle2 size={18} />, color: 'text-green-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="bg-charcoal-800 border border-white/5 rounded-xl p-3 sm:p-4 text-center"
            >
              <div className={`${stat.color} flex justify-center mb-1.5`}>{stat.icon}</div>
              <div className={`text-xl sm:text-2xl font-bold font-serif ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-cream-400 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* New Booking CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6">
          <Button to="/book" className="w-full sm:w-auto bg-gold-400 hover:bg-gold-300 text-black font-black text-sm uppercase tracking-widest py-3 px-8 rounded-xl shadow-lg shadow-gold-500/20">
            + New Booking
          </Button>
        </motion.div>

        {/* Bookings */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-serif text-cream-100">Your Bookings</h2>
          {pendingCount > 0 && (
            <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1">
              {pendingCount} pending review
            </span>
          )}
        </div>

        {bookings.length === 0 ? (
          <div className="bg-charcoal-800 border border-white/5 rounded-2xl p-10 text-center">
            <Calendar className="w-12 h-12 text-cream-400/20 mx-auto mb-4" />
            <p className="text-cream-200 mb-1 font-serif">No bookings yet</p>
            <p className="text-cream-400 text-sm mb-5">Start by making a reservation for your event.</p>
            <Button to="/book">Make a Reservation</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                key={booking.id}
                className="bg-charcoal-800 border border-white/5 rounded-2xl overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-start justify-between p-4 sm:p-5 border-b border-white/5">
                  <div>
                    <div className="text-[10px] text-gold-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                      <Users size={11} /> {booking.eventType}
                    </div>
                    <h3 className="text-base sm:text-lg font-serif text-cream-100 leading-tight">
                      {booking.eventDate ? format(new Date(booking.eventDate), 'EEE, MMM do yyyy') : 'Date TBD'}
                    </h3>
                    <p className="text-xs text-cream-400 mt-0.5">{booking.guestCount} guests</p>
                  </div>
                  <StatusBadge status={booking.bookingStatus} />
                </div>

                {/* Timeline */}
                <div className="px-4 sm:px-5 pt-4">
                  <BookingTimeline status={booking.bookingStatus} />
                </div>

                {/* Status message */}
                <div className="px-4 sm:px-5">
                  <BookingStatusMessage booking={booking} />
                </div>

                {/* Payment + Actions */}
                <div className="p-4 sm:p-5 mt-2">
                  {/* Payment summary */}
                  <div className="bg-charcoal-900/60 rounded-xl border border-white/5 p-3 sm:p-4 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <IndianRupee size={13} className="text-gold-400" />
                      <span className="text-xs font-semibold text-cream-300 uppercase tracking-wider">Payment</span>
                    </div>
                    <div className="flex justify-between text-xs text-cream-400 mb-1">
                      <span>Total</span>
                      <span className="text-cream-200">₹{(booking.totalAmount || booking.estimatedAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-cream-400 mb-2">
                      <span>Paid</span>
                      <span className="text-green-400">₹{(booking.amountPaid || 0).toLocaleString()}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-charcoal-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gold-400 h-1.5 rounded-full transition-all duration-1000 shadow-[0_0_6px_rgba(212,175,55,0.6)]"
                        style={{ width: `${Math.min(100, ((booking.amountPaid || 0) / (booking.totalAmount || booking.estimatedAmount || 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[11px] text-cream-400">Due</span>
                      <span className="text-sm font-bold text-gold-400">
                        {booking.bookingStatus === 'awaiting_payment'
                          ? `₹${(booking.advanceAmount || 5000).toLocaleString()}`
                          : `₹${Math.max(0, (booking.totalAmount || booking.estimatedAmount || 0) - (booking.amountPaid || 0)).toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  {/* Booking ID */}
                  <div className="flex items-center gap-2 bg-charcoal-900/40 rounded-lg px-3 py-2 border border-white/5 mb-3">
                    <span className="text-[10px] text-cream-400 uppercase tracking-wider">ID</span>
                    <span className="text-xs font-mono text-cream-300 flex-1 truncate">{booking.id}</span>
                    <CopyButton text={booking.id} />
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2">
                    {booking.bookingStatus === 'awaiting_payment' && (
                      <Button
                        className="w-full bg-gold-400 hover:bg-gold-300 text-black font-black text-sm py-3 rounded-xl shadow-lg shadow-gold-500/20"
                        onClick={() => handlePayment(booking, 'advance')}
                        disabled={payingBookingId === booking.id}
                      >
                        {payingBookingId === booking.id ? 'Processing...' : '⚡ Pay Advance Now'}
                      </Button>
                    )}
                    {booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'advance_paid' && ((booking.totalAmount || 0) - (booking.amountPaid || 0) > 0) && (
                      <Button
                        className="w-full bg-gold-400 hover:bg-gold-300 text-black font-black text-sm py-3 rounded-xl shadow-lg shadow-gold-500/20"
                        onClick={() => handlePayment(booking, 'remaining')}
                        disabled={payingBookingId === booking.id}
                      >
                        {payingBookingId === booking.id ? 'Processing...' : '💳 Pay Remaining Balance'}
                      </Button>
                    )}
                    {['confirmed', 'completed'].includes(booking.bookingStatus) && (
                      <Suspense fallback={<div className="text-center text-xs text-cream-400 py-2">Loading...</div>}>
                        <DownloadReceiptButton
                          booking={booking}
                          className="w-full flex items-center justify-center gap-2 bg-charcoal-700 border border-white/10 text-cream-200 hover:text-white px-4 py-3 rounded-xl text-sm hover:bg-charcoal-600 transition-colors"
                        />
                      </Suspense>
                    )}
                  </div>

                  <div className="text-[10px] text-cream-400/40 mt-3 leading-relaxed">
                    * Cancellations made 7+ days before event receive full advance refund. Within 7 days is non-refundable.
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
    'pending_review': { label: 'Under Review', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    'awaiting_payment': { label: 'Pay Now', color: 'bg-gold-500/15 text-gold-400 border-gold-500/30' },
    'confirmed': { label: 'Confirmed', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    'completed': { label: 'Completed', color: 'bg-charcoal-700 text-cream-400 border-white/10' },
    'cancelled': { label: 'Cancelled', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    'rejected': { label: 'Rejected', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  }
  const current = config[status] || { label: status, color: 'bg-charcoal-700 text-cream-400' }
  return (
    <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${current.color}`}>
      {current.label}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} className="text-cream-400 hover:text-gold-400 transition-colors" title="Copy ID">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function BookingTimeline({ status }: { status: string }) {
  const steps = [
    { id: 'pending_review', label: 'Pending' },
    { id: 'awaiting_payment', label: 'Approved' },
    { id: 'confirmed', label: 'Confirmed' },
  ]
  let currentStepIndex = 0
  if (status === 'awaiting_payment') currentStepIndex = 1
  if (status === 'confirmed' || status === 'completed') currentStepIndex = 2

  if (status === 'rejected') {
    return (
      <div className="flex items-center text-red-400 gap-2 mb-4">
        <XCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Booking Rejected</span>
      </div>
    )
  }

  return (
    <div className="flex items-center w-full mb-5">
      {steps.map((step, index) => {
        const isCompleted = index <= currentStepIndex
        const isCurrent = index === currentStepIndex
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 z-10 
                ${isCompleted ? 'bg-gold-400 border-gold-400 text-black' : 'bg-charcoal-700 border-white/20 text-cream-400/50'}`}>
                {isCompleted ? <Check className="w-3 h-3" /> : <div className="w-1 h-1 rounded-full bg-current" />}
              </div>
              <span className={`mt-1.5 text-[9px] uppercase tracking-wider whitespace-nowrap font-medium
                ${isCurrent ? 'text-gold-400' : isCompleted ? 'text-cream-300' : 'text-cream-400/40'}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1.5 mb-4 ${index < currentStepIndex ? 'bg-gold-400' : 'bg-white/10'}`} />
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
      <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-1">
        <p className="text-red-400 text-sm font-medium mb-0.5">Booking Declined</p>
        <p className="text-cream-400 text-xs">{booking.rejectionReason || 'Unfortunately, this date is unavailable. Please try another date.'}</p>
        <Button to="/book" variant="outline" size="sm" className="mt-2">Try Another Date</Button>
      </div>
    )
  }
  if (booking.bookingStatus === 'pending_review') {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex gap-2.5 items-start mb-1">
        <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-400 text-sm font-medium">Under Review</p>
          <p className="text-cream-400 text-xs">Our team is reviewing your request. You'll receive an email soon.</p>
        </div>
      </div>
    )
  }
  if (booking.bookingStatus === 'awaiting_payment') {
    return (
      <div className="bg-gold-400/10 border border-gold-400/20 p-3 rounded-xl flex gap-2.5 items-start mb-1">
        <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-gold-400 text-sm font-medium">Booking Approved!</p>
          <p className="text-cream-400 text-xs">Pay the advance within 24 hours to secure your date.</p>
        </div>
      </div>
    )
  }
  if (booking.bookingStatus === 'confirmed') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl flex gap-2.5 items-start mb-1">
        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-green-400 text-sm font-medium">Booking Confirmed ✓</p>
          <p className="text-cream-400 text-xs">Your event is locked in. See you there!</p>
        </div>
      </div>
    )
  }
  return null
}
