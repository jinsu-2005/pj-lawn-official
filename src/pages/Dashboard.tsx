import { useState, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Calendar, LogOut, Copy, Check, CheckCircle2, Clock, XCircle, IndianRupee, Users, MessageCircle, MapPin, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { auth, db, googleProvider } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged, signOut, signInWithPopup } from 'firebase/auth'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { format, differenceInCalendarDays } from 'date-fns'
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
      
      // 3-state Promise resolution per Cashfree Web SDK specifications
      if (result.error) {
        // Modal was dismissed or closed without completing payment
        setNotification({ 
          type: 'info', 
          message: 'Payment was not completed. You can retry at any time.' 
        })
        return
      }
      
      if (result.redirect) {
        // Navigating via redirect (for external or in-app browsers)
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

  const handleWhatsAppConcierge = (booking: any) => {
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

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Guest'

  if (loading) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-charcoal-900">
        <section className="container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-20 rounded-2xl" style={{ background: '#161616' }} />
            <div className="h-64 rounded-2xl" style={{ background: '#161616' }} />
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
            <h1 className="text-2xl font-serif text-cream-100 mb-2">My Reservations</h1>
            <p className="text-cream-400 text-sm mb-6 leading-relaxed">
              Sign in with your Google account to access your event itinerary, payment status, and official receipts.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => signInWithPopup(auth, googleProvider)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gold-400 hover:bg-gold-300 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-lg shadow-gold-500/20"
              >
                Sign In with Google
              </button>
              <Link
                to="/book"
                className="inline-block py-2 text-xs uppercase tracking-wider text-cream-400 hover:text-gold-400 font-semibold transition-colors"
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
        
        {/* Streamlined Luxury Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/[0.08]"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
              <p className="text-[11px] font-semibold text-gold-400 uppercase tracking-widest">PJ Lawn &bull; Guest Portal</p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-cream-50 font-bold">
              Welcome, {displayName}
            </h1>
            <p className="text-xs text-cream-400 mt-0.5">{user?.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              to="/book"
              size="sm"
              className="font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md"
              style={{
                background: 'linear-gradient(135deg, #e8c96d, #c9a84c)',
                color: '#0a0a0a',
                border: '1px solid rgba(232,201,109,0.4)',
              } as React.CSSProperties}
            >
              + Reserve Another Date
            </Button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-2 text-cream-400 hover:text-red-400 text-xs transition-colors rounded-lg hover:bg-white/5"
              title="Sign Out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </motion.div>

        {/* Bookings Section */}
        {bookings.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Calendar className="w-12 h-12 text-gold-400/40 mx-auto mb-4" />
            <h3 className="text-lg font-serif text-cream-100 mb-2">No active reservations</h3>
            <p className="text-cream-400 text-sm max-w-md mx-auto mb-6">
              You haven't reserved a date with PJ Lawn yet. Plan your wedding, birthday, or private gathering with us.
            </p>
            <Button to="/book">Make a Reservation</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking, idx) => {
              const countdown = getCountdownBanner(booking.eventDate, booking.bookingStatus)
              const formattedDate = booking.eventDate ? format(new Date(`${booking.eventDate}T00:00:00`), 'EEEE, MMMM do, yyyy') : 'Date TBD'

              return (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={booking.id}
                  className="rounded-2xl overflow-hidden relative"
                  style={{
                    background: 'linear-gradient(135deg, #181818 0%, #131313 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}
                >
                  {/* Top Gold Accent Line */}
                  <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.8), transparent)' }} />

                  {/* Card Header & Countdown */}
                  <div className="p-5 sm:p-7 border-b border-white/[0.08]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      {countdown && (
                        <div
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold w-fit"
                          style={{ background: countdown.bg, border: `1px solid ${countdown.border}`, color: countdown.color }}
                        >
                          <Sparkles size={13} className="text-gold-400" />
                          <span>{countdown.text}</span>
                        </div>
                      )}
                      <StatusBadge status={booking.bookingStatus} />
                    </div>

                    <h2 className="text-xl sm:text-2xl font-serif text-cream-50 font-bold leading-tight mb-3">
                      {formattedDate}
                    </h2>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-cream-300">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                        <Users size={13} className="text-gold-400" />
                        <span className="text-cream-100 font-medium">{booking.eventType}</span> &bull; {booking.guestCount} Guests
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                        <MapPin size={13} className="text-gold-400" />
                        PJ Lawn, Nagercoil
                      </span>
                      <span className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] text-cream-400">
                        ID: {booking.id.slice(0, 10)}...
                        <CopyButton text={booking.id} />
                      </span>
                    </div>
                  </div>

                  {/* Timeline & Status Notice */}
                  <div className="px-5 sm:px-7 pt-5">
                    <BookingTimeline status={booking.bookingStatus} />
                    <BookingStatusMessage booking={booking} />
                  </div>

                  {/* Transparent Financial Summary & Actions */}
                  <div className="p-5 sm:p-7">
                    <div className="rounded-xl p-4 sm:p-5 mb-5" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                        <div className="flex items-center gap-1.5">
                          <IndianRupee size={15} className="text-gold-400" />
                          <span className="text-xs font-bold text-cream-200 uppercase tracking-wider">Payment Breakdown</span>
                        </div>
                        <span className="text-[11px] text-cream-400">
                          {booking.paymentStatus === 'fully_paid' ? 'Paid in Full' : booking.paymentStatus === 'advance_paid' ? 'Advance Paid' : 'Pending Payment'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                          <span className="text-xs text-cream-400 block mb-1">Total Venue Fee</span>
                          <span className="text-lg font-serif font-bold text-cream-100">
                            ₹{(booking.totalAmount || booking.estimatedAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                          <span className="text-xs text-cream-400 block mb-1">Advance Paid</span>
                          <span className="text-lg font-serif font-bold text-green-400">
                            ₹{(booking.amountPaid || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                          <span className="text-xs text-cream-400 block mb-1">Balance Due</span>
                          <span className="text-lg font-serif font-bold text-gold-400">
                            {booking.bookingStatus === 'awaiting_payment'
                              ? `₹${(booking.advanceAmount || 5000).toLocaleString()} (Advance)`
                              : `₹${Math.max(0, (booking.totalAmount || booking.estimatedAmount || 0) - (booking.amountPaid || 0)).toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {booking.bookingStatus === 'awaiting_payment' && (
                        <button
                          className="flex-1 font-black text-sm py-3.5 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                          style={{
                            background: 'linear-gradient(135deg, #e8c96d, #c9a84c)',
                            color: '#0a0a0a',
                            boxShadow: '0 4px 20px rgba(201,168,76,0.25)'
                          }}
                          onClick={() => handlePayment(booking, 'advance')}
                          disabled={payingBookingId === booking.id}
                        >
                          {payingBookingId === booking.id ? 'Processing...' : '⚡ Pay Advance Now (₹' + (booking.advanceAmount || 5000).toLocaleString() + ')'}
                        </button>
                      )}

                      {booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'advance_paid' && ((booking.totalAmount || 0) - (booking.amountPaid || 0) > 0) && (
                        <button
                          className="flex-1 font-black text-sm py-3.5 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                          style={{
                            background: 'linear-gradient(135deg, #e8c96d, #c9a84c)',
                            color: '#0a0a0a',
                            boxShadow: '0 4px 20px rgba(201,168,76,0.25)'
                          }}
                          onClick={() => handlePayment(booking, 'remaining')}
                          disabled={payingBookingId === booking.id}
                        >
                          {payingBookingId === booking.id ? 'Processing...' : '💳 Clear Remaining Balance Online'}
                        </button>
                      )}

                      {/* 1-Tap WhatsApp Concierge Trigger */}
                      <button
                        onClick={() => handleWhatsAppConcierge(booking)}
                        className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-semibold text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 transition-all"
                      >
                        <MessageCircle size={17} />
                        <span>Message Venue Concierge</span>
                      </button>

                      {/* Receipt Download */}
                      {['confirmed', 'completed'].includes(booking.bookingStatus) && (
                        <Suspense fallback={<div className="text-xs text-cream-400 py-2">Loading receipt...</div>}>
                          <DownloadReceiptButton
                            booking={booking}
                            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-medium text-cream-200 hover:text-cream-50 bg-charcoal-750 border border-white/[0.14] hover:bg-charcoal-700 transition-all"
                          />
                        </Suspense>
                      )}
                    </div>

                    <p className="text-[11px] text-cream-400/50 mt-4 text-center sm:text-left leading-relaxed">
                      * Remaining balance can be settled online or in person on the event day. Need to adjust timings or guest count? Message our concierge anytime.
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function getCountdownBanner(eventDateStr: string, status: string) {
  if (status === 'rejected' || status === 'cancelled') return null
  if (!eventDateStr) return null
  
  const eventDate = new Date(`${eventDateStr}T00:00:00`)
  const today = new Date()
  today.setHours(0,0,0,0)
  
  const daysDiff = differenceInCalendarDays(eventDate, today)
  
  if (daysDiff < 0) {
    return {
      text: 'Celebration Completed',
      bg: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
      color: '#9ca3af'
    }
  }
  if (daysDiff === 0) {
    return {
      text: '🎉 Today is the Big Day!',
      bg: 'rgba(201, 168, 76, 0.15)',
      border: 'rgba(201, 168, 76, 0.4)',
      color: '#e8c96d'
    }
  }
  if (daysDiff === 1) {
    return {
      text: '🌟 Celebration is Tomorrow!',
      bg: 'rgba(201, 168, 76, 0.15)',
      border: 'rgba(201, 168, 76, 0.4)',
      color: '#e8c96d'
    }
  }
  return {
    text: `${daysDiff} Days Until Your Celebration`,
    bg: 'rgba(201, 168, 76, 0.1)',
    border: 'rgba(201, 168, 76, 0.25)',
    color: '#e8c96d'
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string; border: string }> = {
    'pending_review': { label: 'Under Review', bg: 'rgba(234,179,8,0.1)',   color: '#fbbf24', border: 'rgba(234,179,8,0.3)'   },
    'awaiting_payment':{ label: 'Pay Advance', bg: 'rgba(201,168,76,0.15)', color: '#e8c96d', border: 'rgba(201,168,76,0.45)' },
    'confirmed':       { label: 'Confirmed ✓', bg: 'rgba(34,197,94,0.1)',  color: '#4ade80', border: 'rgba(34,197,94,0.3)'   },
    'completed':       { label: 'Completed',   bg: 'rgba(255,255,255,0.05)',color: '#9ca3af', border: 'rgba(255,255,255,0.12)'},
    'cancelled':       { label: 'Cancelled',   bg: 'rgba(239,68,68,0.09)',  color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
    'rejected':        { label: 'Declined',    bg: 'rgba(239,68,68,0.09)',  color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
  }
  const c = config[status] || { label: status, bg: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: 'rgba(255,255,255,0.12)' }
  return (
    <span
      className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
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
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

function BookingTimeline({ status }: { status: string }) {
  const steps = [
    { id: 'pending_review', label: '1. Request Received' },
    { id: 'awaiting_payment', label: '2. Approved by Venue' },
    { id: 'confirmed', label: '3. Booking Locked' },
  ]
  let currentStepIndex = 0
  if (status === 'awaiting_payment') currentStepIndex = 1
  if (status === 'confirmed' || status === 'completed') currentStepIndex = 2

  if (status === 'rejected' || status === 'cancelled') {
    return (
      <div className="flex items-center text-red-400 gap-2 mb-4">
        <XCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Reservation Closed</span>
      </div>
    )
  }

  return (
    <div className="flex items-center w-full mb-4">
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
                className="mt-1.5 text-[9px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap font-semibold"
                style={{ color: isCurrent ? '#e8c96d' : isCompleted ? '#ede5d0' : 'rgba(217,205,181,0.35)' }}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className="flex-1 h-px mx-2 mb-4"
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
      <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl mb-3">
        <p className="text-red-400 text-sm font-semibold mb-0.5">Date Unavailable</p>
        <p className="text-cream-400 text-xs leading-relaxed">{booking.rejectionReason || 'Unfortunately, this date is unavailable. Please choose another date or connect with our concierge.'}</p>
        <Button to="/book" variant="outline" size="sm" className="mt-2.5">Choose Another Date</Button>
      </div>
    )
  }
  if (booking.bookingStatus === 'pending_review') {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-xl flex gap-3 items-start mb-3">
        <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-400 text-sm font-semibold">Under Venue Review</p>
          <p className="text-cream-300 text-xs leading-relaxed">Our manager is reviewing your date and guest requirements. You will receive an update shortly.</p>
        </div>
      </div>
    )
  }
  if (booking.bookingStatus === 'awaiting_payment') {
    return (
      <div className="bg-gold-400/10 border border-gold-400/25 p-3.5 rounded-xl flex gap-3 items-start mb-3">
        <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-gold-400 text-sm font-semibold">Date Approved &bull; Advance Pending</p>
          <p className="text-cream-300 text-xs leading-relaxed">Your date is held! Please pay the ₹{(booking.advanceAmount || 5000).toLocaleString()} advance below to lock in the reservation.</p>
        </div>
      </div>
    )
  }
  if (booking.bookingStatus === 'confirmed') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 p-3.5 rounded-xl flex gap-3 items-start mb-3">
        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-green-400 text-sm font-semibold">Reservation Confirmed ✓</p>
          <p className="text-cream-300 text-xs leading-relaxed">Your venue slot is secured. Feel free to contact our venue concierge below for site visits or coordination.</p>
        </div>
      </div>
    )
  }
  return null
}
