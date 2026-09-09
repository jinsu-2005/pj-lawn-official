import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  LogOut, 
  Copy, 
  Check, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  IndianRupee, 
  Users, 
  MessageCircle, 
  MapPin, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft, 
  X,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { format, differenceInCalendarDays } from 'date-fns'
import { load } from '@cashfreepayments/cashfree-js'

const DownloadReceiptButton = lazy(() => import('@/components/ReceiptPDF').then(m => ({ default: m.DownloadReceiptButton })))

// Cashfree JS SDK Singleton Loader (ensures initialization once per session)
let cashfreePromise: Promise<any> | null = null
let currentMode: string | null = null

function getCashfreeInstance(mode: 'sandbox' | 'production' = 'sandbox') {
  if (!cashfreePromise || currentMode !== mode) {
    currentMode = mode
    cashfreePromise = load({ mode })
  }
  return cashfreePromise
}

export default function Dashboard() {
  const { user, loading: authLoading, logout, loginWithGoogle } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [viewMode, setViewMode] = useState<'upcoming' | 'past'>('upcoming')
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)

  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (!user) {
      setBookings([])
      if (!authLoading) setLoading(false)
      return
    }

    setLoading(true)
    const q = query(collection(db, "bookings"), where("userId", "==", user.uid))
    const unsubscribeBookings = onSnapshot(q, (snapshot) => {
      const bks: any[] = []
      snapshot.forEach((doc) => bks.push({ id: doc.id, ...doc.data() }))
      setBookings(bks)
      setLoading(false)
    }, (err) => {
      console.error("Error listening to bookings:", err)
      setLoading(false)
    })

    return () => {
      unsubscribeBookings()
    }
  }, [user?.uid, authLoading])

  const handleSignOut = async () => {
    try {
      await logout()
      navigate('/')
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  // Toast timer
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Verify payment if order_id is in URL
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
          searchParams.delete('order_id')
          setSearchParams(searchParams)
        })
        .catch(err => {
          console.error('Error verifying payment:', err)
          setNotification({ type: 'error', message: 'Failed to verify payment status.' })
          searchParams.delete('order_id')
          setSearchParams(searchParams)
        })
      }
    }
  }, [searchParams, setSearchParams])

  // Segregate Bookings into Upcoming vs Past based on event date
  const { upcomingBookings, pastBookings } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const upcoming: any[] = []
    const past: any[] = []

    bookings.forEach((booking) => {
      let isPastDate = false
      if (booking.eventDate) {
        try {
          const eventDate = new Date(`${booking.eventDate}T00:00:00`)
          if (differenceInCalendarDays(eventDate, today) < 0) {
            isPastDate = true
          }
        } catch {
          isPastDate = false
        }
      }

      // Past bookings: date has passed or explicitly completed/cancelled/rejected
      if (isPastDate || ['completed', 'cancelled', 'rejected'].includes(booking.bookingStatus)) {
        past.push(booking)
      } else {
        upcoming.push(booking)
      }
    })

    // Sort upcoming: soonest first
    upcoming.sort((a, b) => {
      const dateA = a.eventDate ? new Date(`${a.eventDate}T00:00:00`).getTime() : Infinity
      const dateB = b.eventDate ? new Date(`${b.eventDate}T00:00:00`).getTime() : Infinity
      return dateA - dateB
    })

    // Sort past: most recent first
    past.sort((a, b) => {
      const dateA = a.eventDate ? new Date(`${a.eventDate}T00:00:00`).getTime() : 0
      const dateB = b.eventDate ? new Date(`${b.eventDate}T00:00:00`).getTime() : 0
      return dateB - dateA
    })

    return { upcomingBookings: upcoming, pastBookings: past }
  }, [bookings])

  // Keep selectedBooking in sync with real-time updates
  useEffect(() => {
    if (selectedBooking) {
      const updated = bookings.find(b => b.id === selectedBooking.id)
      if (updated) setSelectedBooking(updated)
    }
  }, [bookings])

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
          customerName: booking.userName || user?.displayName || 'Valued Guest',
          customerEmail: booking.userEmail || user?.email || '',
          customerPhone: booking.userPhone || '9876543210',
          paymentType,
        })
      })

      if (!res.ok) {
        let errorData
        try {
          errorData = await res.json()
        } catch {
          throw new Error('Failed to initiate payment session. Please try again.')
        }
        throw new Error(errorData.error || 'Failed to create payment order')
      }

      const data = await res.json()
      const mode = (data.environment === 'production') ? 'production' : 'sandbox'
      const cashfree = await getCashfreeInstance(mode)
      if (!cashfree) throw new Error('Could not load Cashfree Payments SDK. Please check your network connection.')
      
      const result = await cashfree.checkout({ 
        paymentSessionId: data.payment_session_id, 
        redirectTarget: '_modal' 
      })
      
      if (result.error) {
        setNotification({ 
          type: 'info', 
          message: 'Payment was not completed. You can retry at any time.' 
        })
        return
      }
      
      if (result.redirect) {
        return
      }

      if (result.paymentDetails) {
        setNotification({ type: 'info', message: 'Authorizing payment with bank...' })
        const verifyRes = await fetch('/.netlify/functions/verify-cashfree-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.order_id, bookingId: booking.id })
        })
        
        if (!verifyRes.ok) {
          throw new Error('Verification pending. Please refresh your dashboard in a moment.')
        }
        
        const verifyData = await verifyRes.json()
        if (verifyData.status === 'PAID') {
          setNotification({ 
            type: 'success', 
            message: 'Payment verified successfully! Your booking and event date are confirmed.' 
          })
        } else {
          setNotification({ 
            type: 'info', 
            message: `Payment status: ${verifyData.status || 'Processing'}. Please wait a moment.` 
          })
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setNotification({ type: 'error', message: err.message || 'Payment could not be completed. Please try again.' })
    } finally {
      setPayingBookingId(null)
    }
  }

  const handleWhatsAppSupport = (booking: any) => {
    const phone = "919489724975"
    const formattedDate = booking.eventDate ? format(new Date(`${booking.eventDate}T00:00:00`), 'dd MMM yyyy') : 'TBD'
    const message = `Hello PJ Lawn Management! I am reaching out regarding my booking.\n\n` +
      `• Booking ID: ${booking.id}\n` +
      `• Name: ${booking.userName || user?.displayName || 'Customer'}\n` +
      `• Event: ${booking.eventType} on ${formattedDate}\n` +
      `• Status: ${booking.bookingStatus}\n\n` +
      `Could you please assist me with my event preparations?`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const displayName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Guest'

  if (loading) {
    return (
      <div className="pt-24 pb-20 min-h-screen bg-charcoal-900">
        <section className="container mx-auto px-4 max-w-lg">
          <div className="animate-pulse space-y-4">
            <div className="h-12 rounded-xl bg-charcoal-800" />
            <div className="h-44 rounded-2xl bg-charcoal-800" />
          </div>
        </section>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="pt-24 pb-20 min-h-screen bg-charcoal-900 flex items-center justify-center relative">
        <section className="container mx-auto px-4 max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl text-center shadow-2xl relative overflow-hidden bg-charcoal-850 border border-white/10"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-gold-400/10 border border-gold-400/20">
              <Calendar className="text-gold-400 w-6 h-6" />
            </div>
            <h1 className="text-xl font-serif text-cream-100 mb-1.5 font-bold">My Reservations</h1>
            <p className="text-cream-400 text-xs mb-5 leading-relaxed">
              Sign in to view your celebration itinerary, payment status, and official receipts.
            </p>
            <div className="space-y-2.5">
              <button
                onClick={() => loginWithGoogle()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gold-400 hover:bg-gold-300 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md shadow-gold-500/10"
              >
                Sign In with Google
              </button>
              <Link
                to="/book"
                className="inline-block py-1.5 text-[11px] uppercase tracking-wider text-cream-400 hover:text-gold-400 font-semibold transition-colors"
              >
                Or Reserve a New Date →
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    )
  }

  return (
    <div className="pt-20 pb-36 sm:pb-28 min-h-screen bg-charcoal-900 relative">
      {/* Toast Notification */}
      {notification && (
        <div
          className="fixed top-16 left-4 right-4 sm:left-auto sm:right-4 z-50 sm:max-w-sm shadow-2xl p-3.5 flex items-start gap-3 rounded-xl bg-charcoal-850 border border-white/10"
          style={{
            borderLeft: `3px solid ${ notification.type === 'success' ? '#4ade80' : notification.type === 'error' ? '#f87171' : '#e8c96d' }`
          }}
        >
          <div className="flex-1 text-xs">
            <h4 className="font-semibold text-cream-100 uppercase tracking-wider text-[11px]">
              {notification.type === 'success' ? '✓ Success' : notification.type === 'error' ? '✕ Error' : 'ℹ Notice'}
            </h4>
            <p className="text-cream-300 mt-0.5">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(null)} 
            className="text-cream-400 hover:text-cream-100 w-5 h-5 flex items-center justify-center text-sm"
          >
            &times;
          </button>
        </div>
      )}

      <section className="container mx-auto px-4 max-w-lg">
        
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between pb-3.5 mb-5 border-b border-white/[0.07]"
        >
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              <p className="text-[10px] font-bold text-gold-400 uppercase tracking-widest">PJ Lawn &bull; Guest</p>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif text-cream-50 font-bold tracking-tight">
              Welcome, {displayName}
            </h1>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-cream-400 hover:text-red-400 text-xs transition-colors rounded-lg hover:bg-white/5 border border-white/5"
            title="Sign Out"
          >
            <LogOut size={13} />
            <span className="text-[11px] font-medium">Sign Out</span>
          </button>
        </motion.div>

        {/* View Mode: Past Bookings Archive */}
        {viewMode === 'past' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setViewMode('upcoming')}
                className="inline-flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 font-semibold py-1 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back to Upcoming</span>
              </button>
              <span className="text-[11px] text-cream-400 uppercase tracking-wider font-semibold font-sans tabular-nums">
                Past Celebrations ({pastBookings.length})
              </span>
            </div>

            {pastBookings.length === 0 ? (
              <div className="rounded-xl p-8 text-center bg-charcoal-850 border border-white/[0.08]">
                <Clock className="w-8 h-8 text-cream-400/40 mx-auto mb-2" />
                <p className="text-cream-300 text-xs">No past celebrations on record.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastBookings.map((booking: any) => {
                  const formattedDate = booking.eventDate 
                    ? format(new Date(`${booking.eventDate}T00:00:00`), 'dd MMM yyyy') 
                    : 'Date TBD'
                  return (
                    <div
                      key={booking.id}
                      className="p-4 rounded-xl bg-charcoal-850 border border-white/[0.08] flex items-center justify-between gap-3 transition-colors hover:border-white/15"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-cream-100 truncate">
                            {booking.eventType || 'Event'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-cream-400 border border-white/10 uppercase font-semibold">
                            {booking.bookingStatus === 'completed' ? 'Completed' : booking.bookingStatus === 'cancelled' ? 'Cancelled' : 'Concluded'}
                          </span>
                        </div>
                        <p className="text-xs text-cream-400 font-sans tabular-nums">
                          {formattedDate} &bull; {booking.guestCount || 0} Guests
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gold-400 border border-white/10 shrink-0 transition-all"
                      >
                        View
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* View Mode: Active Upcoming Reservations */
          <div className="space-y-4">
            {upcomingBookings.length === 0 ? (
              /* Empty State when no upcoming reservations */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-7 text-center bg-charcoal-850 border border-white/[0.08]"
              >
                <div className="w-12 h-12 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-gold-400" />
                </div>
                <h3 className="text-lg font-serif text-cream-100 font-bold mb-1">No Upcoming Reservations</h3>
                <p className="text-cream-400 text-xs max-w-xs mx-auto mb-5 leading-relaxed">
                  Reserve our manicured lawn & luxury banquet spaces for your upcoming wedding or private gathering.
                </p>
                <Button 
                  to="/book" 
                  className="w-full py-3 bg-gold-400 hover:bg-gold-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-md"
                >
                  Reserve a Date
                </Button>
              </motion.div>
            ) : (
              /* Upcoming Bookings Cards */
              upcomingBookings.map((booking: any, idx: number) => {
                const countdown = getCountdownBadge(booking.eventDate, booking.bookingStatus)
                const formattedDate = booking.eventDate 
                  ? format(new Date(`${booking.eventDate}T00:00:00`), 'EEEE, MMMM do, yyyy') 
                  : 'Date TBD'

                const paymentSummary = getPaymentSummary(booking)

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-2xl overflow-hidden bg-charcoal-850 border border-white/[0.1] shadow-xl relative"
                  >
                    {/* Subtle Gold Accent Line */}
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />

                    <div className="p-4 sm:p-5">
                      {/* Top Bar: Countdown & Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {countdown ? (
                          <span 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-semibold tabular-nums"
                            style={{ background: countdown.bg, border: `1px solid ${countdown.border}`, color: countdown.color }}
                          >
                            <Sparkles size={12} className="text-gold-400 shrink-0" />
                            <span>{countdown.text}</span>
                          </span>
                        ) : <div />}
                        <StatusBadge status={booking.bookingStatus} />
                      </div>

                      {/* Prominent Date (Clean standard modern font for numbers/dates) */}
                      <h2 className="text-lg sm:text-xl font-sans text-cream-50 font-bold tracking-tight leading-tight mb-2 tabular-nums">
                        {formattedDate}
                      </h2>

                      {/* Event Metadata (Single Clean Row) */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-cream-300 mb-3.5">
                        <span className="flex items-center gap-1 text-cream-200">
                          <Users size={13} className="text-gold-400 shrink-0" />
                          <span className="font-medium text-cream-100">{booking.eventType}</span> &bull; <span className="font-sans tabular-nums">{booking.guestCount}</span> Guests
                        </span>
                        <span className="text-cream-500">&bull;</span>
                        <span className="flex items-center gap-1 text-cream-400">
                          <MapPin size={13} className="text-gold-400 shrink-0" />
                          <span>PJ Lawn</span>
                        </span>
                      </div>

                      {/* Concise Payment Summary (Readable Tabular Numerals) */}
                      <div className="py-2 px-3 rounded-lg bg-black/40 border border-white/[0.05] flex items-center justify-between text-xs mb-4">
                        <span className="text-cream-400 text-[11px] font-medium">Payment</span>
                        <span className={`font-sans font-semibold tabular-nums tracking-normal text-xs ${paymentSummary.color}`}>
                          {paymentSummary.label}
                        </span>
                      </div>

                      {/* Primary Single Action: View Booking */}
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #e8c96d, #c9a84c)',
                          color: '#0a0a0a',
                          boxShadow: '0 4px 16px rgba(201,168,76,0.18)'
                        }}
                      >
                        <span>View Booking Details</span>
                        <ChevronRight size={14} className="stroke-[2.5]" />
                      </button>
                    </div>
                  </motion.div>
                )
              })
            )}

            {/* Secondary Action: Reserve Another Date */}
            <div className="pt-1">
              <Button
                to="/book"
                variant="outline"
                className="w-full py-2.5 rounded-xl border border-gold-400/30 hover:border-gold-400 hover:bg-gold-400/10 text-gold-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Reserve Another Date</span>
              </Button>
            </div>

            {/* Small Past Bookings Entry / Link */}
            {pastBookings.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setViewMode('past')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 border border-white/[0.06] transition-all group"
                >
                  <div className="flex items-center gap-2 text-xs text-cream-300">
                    <Clock size={14} className="text-cream-400 group-hover:text-gold-400 transition-colors" />
                    <span className="font-sans tabular-nums">Past Celebrations ({pastBookings.length})</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gold-400 font-medium">
                    <span>View Archive</span>
                    <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Booking Details Sheet / Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <BookingDetailsSheet
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onPay={handlePayment}
            onWhatsApp={handleWhatsAppSupport}
            payingBookingId={payingBookingId}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact Countdown Badge for the main card (Readable Tabular Numerals)
function getCountdownBadge(eventDateStr: string, status: string) {
  if (['rejected', 'cancelled'].includes(status)) return null
  if (!eventDateStr) return null
  
  const eventDate = new Date(`${eventDateStr}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const daysDiff = differenceInCalendarDays(eventDate, today)
  
  if (daysDiff < 0) {
    return {
      text: 'Concluded',
      bg: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
      color: '#9ca3af'
    }
  }
  if (daysDiff === 0) {
    return {
      text: 'Today!',
      bg: 'rgba(201, 168, 76, 0.2)',
      border: 'rgba(201, 168, 76, 0.4)',
      color: '#e8c96d'
    }
  }
  if (daysDiff === 1) {
    return {
      text: 'Tomorrow',
      bg: 'rgba(201, 168, 76, 0.15)',
      border: 'rgba(201, 168, 76, 0.35)',
      color: '#e8c96d'
    }
  }
  return {
    text: `In ${daysDiff} Days`,
    bg: 'rgba(201, 168, 76, 0.1)',
    border: 'rgba(201, 168, 76, 0.25)',
    color: '#e8c96d'
  }
}

// Concise Payment Summary Generator (using readable standard font for numbers)
function getPaymentSummary(booking: any) {
  const total = booking.totalAmount || booking.estimatedAmount || 0
  const paid = booking.amountPaid || 0
  const advance = booking.advanceAmount || 5000
  const due = Math.max(0, total - paid)

  if (booking.bookingStatus === 'awaiting_payment') {
    return {
      label: `₹${advance.toLocaleString()} Advance Due`,
      color: 'text-gold-400'
    }
  }
  if (booking.paymentStatus === 'fully_paid' || (due === 0 && paid > 0)) {
    return {
      label: `₹${paid.toLocaleString()} Paid · Fully Settled`,
      color: 'text-emerald-400'
    }
  }
  if (paid > 0) {
    return {
      label: `₹${paid.toLocaleString()} Paid · ₹${due.toLocaleString()} Due`,
      color: 'text-gold-400'
    }
  }
  if (booking.bookingStatus === 'pending_review') {
    return {
      label: `₹${total.toLocaleString()} Estimated`,
      color: 'text-cream-300'
    }
  }
  return {
    label: `₹${due.toLocaleString()} Due`,
    color: 'text-cream-300'
  }
}

// Clean Status Badge
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string; border: string }> = {
    'pending_review': { label: 'Under Review', bg: 'rgba(234,179,8,0.1)',   color: '#fbbf24', border: 'rgba(234,179,8,0.3)'   },
    'awaiting_payment':{ label: 'Advance Due', bg: 'rgba(201,168,76,0.15)', color: '#e8c96d', border: 'rgba(201,168,76,0.45)' },
    'confirmed':       { label: 'Confirmed ✓', bg: 'rgba(34,197,94,0.1)',  color: '#4ade80', border: 'rgba(34,197,94,0.3)'   },
    'completed':       { label: 'Completed',   bg: 'rgba(255,255,255,0.05)',color: '#9ca3af', border: 'rgba(255,255,255,0.12)'},
    'cancelled':       { label: 'Cancelled',   bg: 'rgba(239,68,68,0.09)',  color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
    'rejected':        { label: 'Declined',    bg: 'rgba(239,68,68,0.09)',  color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
  }
  const c = config[status] || { label: status, bg: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: 'rgba(255,255,255,0.12)' }
  return (
    <span
      className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
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
    <button onClick={handleCopy} className="text-cream-400 hover:text-gold-400 transition-colors p-1" title="Copy ID">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

// Compact 3-Step Progress Timeline
function BookingTimeline({ status }: { status: string }) {
  const steps = [
    { id: 'pending_review', label: 'Received' },
    { id: 'awaiting_payment', label: 'Approved' },
    { id: 'confirmed', label: 'Confirmed' },
  ]
  let currentStepIndex = 0
  if (status === 'awaiting_payment') currentStepIndex = 1
  if (status === 'confirmed' || status === 'completed') currentStepIndex = 2

  if (status === 'rejected' || status === 'cancelled') {
    return (
      <div className="flex items-center text-red-400 gap-2 mb-3 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 text-xs">
        <XCircle className="w-4 h-4 shrink-0" />
        <span className="font-semibold">Reservation Closed / Cancelled</span>
      </div>
    )
  }

  return (
    <div className="flex items-center w-full mb-4 px-1">
      {steps.map((step, index) => {
        const isCompleted = index <= currentStepIndex
        const isCurrent = index === currentStepIndex
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center z-10 text-[10px] font-sans font-bold"
                style={{
                  background: isCompleted ? 'linear-gradient(135deg, #e8c96d, #c9a84c)' : '#222222',
                  border: isCompleted ? '1px solid rgba(201,168,76,0.6)' : '1px solid rgba(255,255,255,0.15)',
                  color: isCompleted ? '#0a0a0a' : 'rgba(217,205,181,0.35)'
                }}
              >
                {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <span>{index + 1}</span>}
              </div>
              <span
                className="mt-1 text-[9px] uppercase tracking-wider font-semibold whitespace-nowrap"
                style={{ color: isCurrent ? '#e8c96d' : isCompleted ? '#ede5d0' : 'rgba(217,205,181,0.35)' }}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className="flex-1 h-px mx-2 mb-3"
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
      <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-4 text-xs">
        <p className="text-red-400 font-semibold mb-0.5">Date Unavailable</p>
        <p className="text-cream-300 leading-relaxed">{booking.rejectionReason || 'Unfortunately, this slot is unavailable. Please select another date or message our manager.'}</p>
        <Button to="/book" variant="outline" size="sm" className="mt-2 text-xs py-1.5">Choose Another Date</Button>
      </div>
    )
  }
  if (booking.bookingStatus === 'pending_review') {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex gap-2.5 items-start mb-4 text-xs">
        <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-400 font-semibold">Under Venue Review</p>
          <p className="text-cream-300 leading-relaxed mt-0.5">Our manager is reviewing your guest count and date requirements. You will be notified once approved.</p>
        </div>
      </div>
    )
  }
  if (booking.bookingStatus === 'awaiting_payment') {
    return (
      <div className="bg-gold-400/10 border border-gold-400/25 p-3 rounded-xl flex gap-2.5 items-start mb-4 text-xs">
        <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-gold-400 font-semibold">Date Approved &bull; Advance Required</p>
          <p className="text-cream-300 leading-relaxed mt-0.5 font-sans">
            Your date is temporarily reserved! Pay the advance below to confirm your slot.
          </p>
        </div>
      </div>
    )
  }
  if (booking.bookingStatus === 'confirmed') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl flex gap-2.5 items-start mb-4 text-xs">
        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-green-400 font-semibold">Reservation Confirmed ✓</p>
          <p className="text-cream-300 leading-relaxed mt-0.5">Your venue slot is confirmed. You can coordinate event preparations directly with our manager.</p>
        </div>
      </div>
    )
  }
  return null
}

// Dedicated Booking Details Sheet (Opens when user taps "View Booking Details")
interface BookingDetailsSheetProps {
  booking: any
  onClose: () => void
  onPay: (booking: any, type: 'advance' | 'full' | 'remaining') => void
  onWhatsApp: (booking: any) => void
  payingBookingId: string | null
}

function BookingDetailsSheet({
  booking,
  onClose,
  onPay,
  onWhatsApp,
  payingBookingId
}: BookingDetailsSheetProps) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  const formattedDate = booking.eventDate 
    ? format(new Date(`${booking.eventDate}T00:00:00`), 'EEEE, MMMM do, yyyy') 
    : 'Date TBD'

  const totalAmount = booking.totalAmount || booking.estimatedAmount || 0
  const amountPaid = booking.amountPaid || 0
  const advanceAmount = booking.advanceAmount || 5000
  const balanceDue = Math.max(0, totalAmount - amountPaid)

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      data-modal-open="true" 
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal / Sheet Container */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg max-h-[90vh] bg-charcoal-850 border border-white/15 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-20 pb-4 sm:pb-0"
      >
        {/* Grab Handle for Mobile */}
        <div className="pt-2.5 pb-1 sm:hidden flex justify-center cursor-grab" onClick={onClose}>
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Sheet Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest block">
              Reservation Details
            </span>
            <h3 className="text-base font-sans text-cream-50 font-bold">
              {booking.eventType} &bull; <span className="tabular-nums">{booking.guestCount}</span> Guests
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-cream-400 hover:text-cream-100 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sheet Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Booking Date & ID */}
          <div className="p-3.5 rounded-xl bg-charcoal-900 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-cream-400 font-medium">Event Date</p>
              <p className="text-sm font-semibold text-cream-100 font-sans tabular-nums">{formattedDate}</p>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-cream-400 bg-white/5 px-2.5 py-1 rounded-lg w-fit">
              <span>ID: {booking.id.slice(0, 8)}...</span>
              <CopyButton text={booking.id} />
            </div>
          </div>

          {/* Progress Timeline & Status Notice */}
          <div className="pt-1">
            <BookingTimeline status={booking.bookingStatus} />
            <BookingStatusMessage booking={booking} />
          </div>

          {/* Detailed Financial Breakdown with Readable Tabular Numerals */}
          <div className="p-4 rounded-xl bg-charcoal-900 border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-bold text-cream-200 uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee size={13} className="text-gold-400" />
                <span>Financial Summary</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-cream-400">
                {booking.paymentStatus === 'fully_paid' ? 'Paid in Full' : booking.paymentStatus === 'advance_paid' ? 'Advance Paid' : 'Pending'}
              </span>
            </div>

            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between text-cream-400">
                <span>Total Venue Fee</span>
                <span className="font-semibold text-cream-100 tabular-nums">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-cream-400">
                <span>Advance Paid</span>
                <span className="font-semibold text-emerald-400 tabular-nums">
                  ₹{amountPaid.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-white/5 text-cream-200 font-bold">
                <span>Balance Due</span>
                <span className="text-gold-400 font-semibold tabular-nums text-sm">
                  {booking.bookingStatus === 'awaiting_payment'
                    ? `₹${advanceAmount.toLocaleString()} (Advance)`
                    : `₹${balanceDue.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>

          {/* Direct Payment Action */}
          {booking.bookingStatus === 'awaiting_payment' && (
            <button
              onClick={() => onPay(booking, 'advance')}
              disabled={payingBookingId === booking.id}
              className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #e8c96d, #c9a84c)',
                color: '#0a0a0a',
                boxShadow: '0 4px 20px rgba(201,168,76,0.25)'
              }}
            >
              <span className="font-sans tabular-nums">{payingBookingId === booking.id ? 'Processing Payment...' : `⚡ Pay Advance (₹${advanceAmount.toLocaleString()})`}</span>
            </button>
          )}

          {booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'advance_paid' && balanceDue > 0 && (
            <button
              onClick={() => onPay(booking, 'remaining')}
              disabled={payingBookingId === booking.id}
              className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #e8c96d, #c9a84c)',
                color: '#0a0a0a',
                boxShadow: '0 4px 20px rgba(201,168,76,0.25)'
              }}
            >
              <span className="font-sans tabular-nums">{payingBookingId === booking.id ? 'Processing...' : `💳 Clear Remaining Balance (₹${balanceDue.toLocaleString()})`}</span>
            </button>
          )}

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* WhatsApp Venue Manager */}
            <button
              onClick={() => onWhatsApp(booking)}
              className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-semibold text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/25 transition-all"
            >
              <MessageCircle size={15} />
              <span>Message Venue Manager</span>
            </button>

            {/* Receipt Download (for confirmed or completed bookings) */}
            {['confirmed', 'completed'].includes(booking.bookingStatus) && (
              <Suspense fallback={<div className="text-xs text-cream-400 text-center py-2">Loading receipt...</div>}>
                <DownloadReceiptButton
                  booking={booking}
                  className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-medium text-cream-200 hover:text-cream-50 bg-charcoal-750 border border-white/[0.12] hover:bg-charcoal-700 transition-all"
                />
              </Suspense>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  )
}
