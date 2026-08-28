import { useState, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Calendar, LogOut, Copy, Check, CheckCircle2, Clock, XCircle, CalendarDays, IndianRupee, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { auth, db, googleProvider } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged, signOut, signInWithPopup } from 'firebase/auth'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
const DownloadReceiptButton = lazy(() => import('@/components/ReceiptPDF').then(m => ({ default: m.DownloadReceiptButton })))
import { load } from '@cashfreepayments/cashfree-js'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

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

  useEffect(() => {
    const orderId = searchParams.get('order_id')
    if (orderId) {
      const parts = orderId.split('_')
      const bookingId = parts[1]
      
      if (bookingId) {
        setNotification({ type: 'info', message: 'Verifying payment status...' })
        
        fetch('/.netlify/functions/verify-cashfree-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, bookingId })
        })
        .then(res => {
          if (!res.ok) throw new Error('Verification failed')
          return res.json()
        })
        .then(data => {
          if (data.status === 'PAID') {
            setNotification({ type: 'success', message: 'Payment verified successfully! Your booking is confirmed.' })
          } else {
            setNotification({ type: 'info', message: `Payment status: ${data.status}` })
          }
          // Clear query params
          searchParams.delete('order_id')
          setSearchParams(searchParams)
        })
        .catch(err => {
          console.error('Error verifying payment:', err)
          setNotification({ type: 'error', message: 'Failed to verify payment status.' })
          // Clear query params
          searchParams.delete('order_id')
          setSearchParams(searchParams)
        })
      }
    }
  }, [searchParams, setSearchParams])

  const handlePayment = async (booking: any, paymentType: 'advance' | 'full' | 'remaining') => {
    const amountToPay = paymentType === 'advance' 
      ? (booking.advanceAmount || 5000) 
      : paymentType === 'remaining' 
        ? Math.max(0, (booking.totalAmount || booking.estimatedAmount || 0) - (booking.amountPaid || 0))
        : (booking.totalAmount || booking.estimatedAmount || 0)

    setPayingBookingId(booking.id)

    try {
      const res = await fetch('/.netlify/functions/create-cashfree-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: amountToPay,
          customerName: booking.userName || user?.displayName || 'Customer',
          customerEmail: booking.userEmail || user?.email || '',
          customerPhone: booking.userPhone || '9999999999',
          paymentType,
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create payment order')
      }

      const data = await res.json()
      const cashfree = await load({ mode: data.environment || 'sandbox' })
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
            <div className="h-32 rounded-2xl" style={{ background: '#161616' }} />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-20 rounded-xl" style={{ background: '#161616' }} />
              <div className="h-20 rounded-xl" style={{ background: '#161616' }} />
              <div className="h-20 rounded-xl" style={{ background: '#161616' }} />
            </div>
            <div className="h-48 rounded-2xl" style={{ background: '#161616' }} />
          </div>
        </section>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-charcoal-900 flex items-center justify-center relative">
        <section className="container mx-auto px-4 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-8 rounded-2xl text-center shadow-2xl overflow-hidden"
            style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <Calendar className="text-gold-400 w-7 h-7" />
            </div>
            <h1 className="text-2xl font-serif text-cream-100 mb-2">My Bookings</h1>
            <p className="text-cream-400 text-sm mb-6 leading-relaxed">
              Sign in with Google to view your bookings, check dates, and download receipts.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => signInWithPopup(auth, googleProvider)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gold-400 hover:bg-gold-300 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-lg shadow-gold-500/20"
              >
                Continue with Google
              </button>
              <Link
                to="/book"
                className="inline-block py-2 text-xs uppercase tracking-wider text-cream-400 hover:text-gold-400 font-semibold transition-colors"
              >
                Or Book a New Date →
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-24 min-h-screen bg-charcoal-900 relative">
      {/* Toast */}
      {notification && (
        <div
          className="fixed top-20 right-4 z-50 max-w-sm w-full shadow-2xl p-4 flex items-start gap-3 rounded-xl"
          style={{
            background: '#161616',
            borderLeft: `3px solid ${ notification.type === 'success' ? '#4ade80' : notification.type === 'error' ? '#f87171' : '#e8c96d' }`,
            border: `1px solid ${ notification.type === 'success' ? 'rgba(74,222,128,0.2)' : notification.type === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(232,201,109,0.2)' }`,
            borderLeftWidth: '3px',
          }}
        >
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-cream-100 uppercase tracking-wider">
              {notification.type === 'success' ? '✓ Success' : notification.type === 'error' ? '✕ Error' : 'ℹ Info'}
            </h4>
            <p className="text-sm text-cream-300 mt-1">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-cream-400 hover:text-cream-100 w-6 h-6 flex items-center justify-center rounded transition-colors">&times;</button>
        </div>
      )}

      <section className="container mx-auto px-4 max-w-4xl">

        {/* Profile Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-5 sm:p-7 mb-5 flex items-center gap-4 sm:gap-6"
          style={{
            background: 'linear-gradient(135deg, #181818 0%, #141414 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}
        >
          {/* Gold accent line */}
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.7), transparent)' }} />

          {/* Mobile sparkles — decorative only */}
          <span className="sparkle sparkle-md sparkle-twinkle sm:hidden" style={{ top: '10px', right: '52px' }}>✦</span>
          <span className="sparkle sparkle-sm sparkle-float sparkle-delay-1 sm:hidden" style={{ top: '22px', right: '38px' }}>◆</span>
          <span className="sparkle sparkle-sm sparkle-slow sparkle-delay-2 sm:hidden" style={{ top: '8px', right: '70px' }}>✦</span>

          {/* Avatar */}
          <div className="flex-shrink-0 relative z-10">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
                style={{ border: '2px solid rgba(201,168,76,0.5)', boxShadow: '0 0 20px rgba(201,168,76,0.15)' }}
              />
            ) : (
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-gold-400 text-2xl sm:text-3xl font-bold"
                style={{ background: 'rgba(201,168,76,0.1)', border: '2px solid rgba(201,168,76,0.4)', boxShadow: '0 0 20px rgba(201,168,76,0.12)' }}
              >
                {avatarLetter}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 relative z-10">
            <p className="text-[10px] text-gold-400/80 uppercase tracking-widest mb-0.5">Welcome back</p>
            <h1 className="text-xl sm:text-2xl font-serif text-cream-50 font-bold truncate">{displayName}</h1>
            <p className="text-cream-400 text-xs sm:text-sm truncate mt-0.5">{user?.email}</p>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="relative z-10 flex-shrink-0 flex flex-col items-center gap-1 text-cream-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/8"
          >
            <LogOut size={18} />
            <span className="text-[10px] uppercase tracking-wider hidden sm:block">Sign Out</span>
          </button>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total', value: bookings.length, icon: <CalendarDays size={16} />, color: 'text-cream-300', accent: 'rgba(217,205,181,0.12)' },
            { label: 'Upcoming', value: upcomingCount, icon: <Clock size={16} />, color: 'text-blue-400', accent: 'rgba(96,165,250,0.12)' },
            { label: 'Confirmed', value: confirmedCount, icon: <CheckCircle2 size={16} />, color: 'text-green-400', accent: 'rgba(74,222,128,0.12)' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="rounded-xl p-3 sm:p-4 text-center relative overflow-hidden"
              style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              {/* Colored top accent */}
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: stat.accent.replace('0.12', '0.5') }} />
              <div className={`${stat.color} flex justify-center mb-1.5`}>{stat.icon}</div>
              <div className={`text-xl sm:text-2xl font-bold font-serif ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-cream-400/70 uppercase tracking-wider mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* New Booking CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6">
          <Button
            to="/book"
            className="w-full sm:w-auto font-black text-sm uppercase tracking-widest py-3 px-8 rounded-xl transition-all"
            style={{
              background: 'linear-gradient(135deg, #e8c96d, #c9a84c)',
              color: '#0a0a0a',
              border: '1px solid rgba(232,201,109,0.4)',
              boxShadow: '0 4px 20px rgba(201,168,76,0.25)'
            } as React.CSSProperties}
          >
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
                className="rounded-2xl overflow-hidden relative"
                style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {/* Mobile sparkle on event date */}
                <span className="sparkle sparkle-sm sparkle-twinkle sparkle-delay-2 sm:hidden" style={{ top: '14px', right: '90px' }}>✦</span>

                {/* Card header */}
                <div className="flex items-start justify-between p-4 sm:p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div>
                    <div className="text-[10px] text-gold-400/80 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                      <Users size={11} /> {booking.eventType}
                    </div>
                    <h3 className="text-base sm:text-lg font-serif text-cream-50 leading-tight">
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
                  {/* Payment summary — deeper nested surface */}
                  <div className="rounded-xl p-3 sm:p-4 mb-3" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <IndianRupee size={13} className="text-gold-400" />
                      <span className="text-xs font-semibold text-cream-300 uppercase tracking-wider">Payment Summary</span>
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-cream-400">Total</span>
                      <span className="text-cream-100 font-medium">₹{(booking.totalAmount || booking.estimatedAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs mb-2.5">
                      <span className="text-cream-400">Paid</span>
                      <span className="text-green-400 font-medium">₹{(booking.amountPaid || 0).toLocaleString()}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: '#2a2a2a' }}>
                      <div
                        className="progress-gold h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, ((booking.amountPaid || 0) / (booking.totalAmount || booking.estimatedAmount || 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[11px] text-cream-400/70">Due</span>
                      <span className="text-sm font-bold text-gold-400">
                        {booking.bookingStatus === 'awaiting_payment'
                          ? `₹${(booking.advanceAmount || 5000).toLocaleString()}`
                          : `₹${Math.max(0, (booking.totalAmount || booking.estimatedAmount || 0) - (booking.amountPaid || 0)).toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  {/* Booking ID */}
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-[10px] text-cream-400/60 uppercase tracking-wider">ID</span>
                    <span className="text-xs font-mono text-cream-400 flex-1 truncate">{booking.id}</span>
                    <CopyButton text={booking.id} />
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2">
                    {booking.bookingStatus === 'awaiting_payment' && (
                      <button
                        className="w-full font-black text-sm py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: 'linear-gradient(135deg, #e8c96d, #c9a84c)',
                          color: '#0a0a0a',
                          boxShadow: '0 4px 20px rgba(201,168,76,0.25)'
                        }}
                        onClick={() => handlePayment(booking, 'advance')}
                        disabled={payingBookingId === booking.id}
                      >
                        {payingBookingId === booking.id ? 'Processing...' : '⚡ Pay Advance Now'}
                      </button>
                    )}
                    {booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'advance_paid' && ((booking.totalAmount || 0) - (booking.amountPaid || 0) > 0) && (
                      <button
                        className="w-full font-black text-sm py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: 'linear-gradient(135deg, #e8c96d, #c9a84c)',
                          color: '#0a0a0a',
                          boxShadow: '0 4px 20px rgba(201,168,76,0.25)'
                        }}
                        onClick={() => handlePayment(booking, 'remaining')}
                        disabled={payingBookingId === booking.id}
                      >
                        {payingBookingId === booking.id ? 'Processing...' : '💳 Pay Remaining Balance'}
                      </button>
                    )}
                    {['confirmed', 'completed'].includes(booking.bookingStatus) && (
                      <Suspense fallback={<div className="text-center text-xs text-cream-400 py-2">Loading...</div>}>
                        <DownloadReceiptButton
                          booking={booking}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-cream-200 hover:text-cream-50 transition-all bg-charcoal-750 border border-white/[0.14] hover:bg-charcoal-700"
                        />
                      </Suspense>
                    )}
                  </div>

                  <div className="text-[10px] text-cream-400/35 mt-3 leading-relaxed">
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
  const config: Record<string, { label: string; bg: string; color: string; border: string }> = {
    'pending_review': { label: 'Under Review', bg: 'rgba(234,179,8,0.1)',   color: '#fbbf24', border: 'rgba(234,179,8,0.3)'   },
    'awaiting_payment':{ label: 'Pay Now',     bg: 'rgba(201,168,76,0.12)', color: '#e8c96d', border: 'rgba(201,168,76,0.38)' },
    'confirmed':       { label: 'Confirmed',   bg: 'rgba(34,197,94,0.09)',  color: '#4ade80', border: 'rgba(34,197,94,0.3)'   },
    'completed':       { label: 'Completed',   bg: 'rgba(255,255,255,0.05)',color: '#9ca3af', border: 'rgba(255,255,255,0.12)'},
    'cancelled':       { label: 'Cancelled',   bg: 'rgba(239,68,68,0.09)',  color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
    'rejected':        { label: 'Rejected',    bg: 'rgba(239,68,68,0.09)',  color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
  }
  const c = config[status] || { label: status, bg: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: 'rgba(255,255,255,0.12)' }
  return (
    <span
      className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {c.label}
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
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center z-10"
                style={{
                  background: isCompleted ? 'linear-gradient(135deg, #e8c96d, #c9a84c)' : '#222222',
                  border: isCompleted ? '1px solid rgba(201,168,76,0.6)' : '1px solid rgba(255,255,255,0.15)',
                  boxShadow: isCompleted ? '0 0 8px rgba(201,168,76,0.3)' : 'none',
                  color: isCompleted ? '#0a0a0a' : 'rgba(217,205,181,0.35)'
                }}
              >
                {isCompleted ? <Check className="w-2.5 h-2.5" /> : <div className="w-1 h-1 rounded-full bg-current" />}
              </div>
              <span
                className="mt-1.5 text-[9px] uppercase tracking-wider whitespace-nowrap font-medium"
                style={{ color: isCurrent ? '#e8c96d' : isCompleted ? '#ede5d0' : 'rgba(217,205,181,0.35)' }}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className="flex-1 h-px mx-1.5 mb-4"
                style={{
                  background: index < currentStepIndex
                    ? 'linear-gradient(90deg, #c9a84c, #e8c96d)'
                    : 'rgba(255,255,255,0.1)'
                }}
              />
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
