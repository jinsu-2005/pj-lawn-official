import { useState, useEffect } from 'react'
import { 
  Calendar, IndianRupee, Inbox, LogOut, Bot, Phone, MessageCircle, 
  ChevronLeft, ChevronRight, 
  Settings, Shield, UserCheck, Trash2, Plus
} from 'lucide-react'
import { useAdminGuard } from '@/hooks/useAdminGuard'
import { db, auth } from '@/lib/firebase'
import { 
  collection, query, onSnapshot, doc, getDoc, setDoc, deleteDoc, writeBatch 
} from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay 
} from 'date-fns'

type TabType = 'bookings' | 'calendar' | 'pricing' | 'settings'

export default function Admin() {
  const { isAdmin, loading, user } = useAdminGuard()
  const [activeTab, setActiveTab] = useState<TabType>('bookings')
  const [bookings, setBookings] = useState<any[]>([])
  const [availabilityDocs, setAvailabilityDocs] = useState<Record<string, any>>({})
  const [invites, setInvites] = useState<any[]>([])
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isAddingBooking, setIsAddingBooking] = useState(false)
  const [addBookingDefaultDate, setAddBookingDefaultDate] = useState<string | undefined>(undefined)

  const handleOpenAddBooking = (dateStr?: string) => {
    setAddBookingDefaultDate(dateStr)
    setIsAddingBooking(true)
  }
  
  // Real-time listener for bookings
  useEffect(() => {
    if (!isAdmin) return
    const q = query(collection(db, "bookings"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bks: any[] = []
      snapshot.forEach(doc => bks.push({ id: doc.id, ...doc.data() }))
      bks.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
      setBookings(bks)
    }, (err) => {
      console.error("Error fetching bookings:", err)
      setNotification({ type: 'error', message: 'Permission error loading bookings.' })
    })
    return () => unsubscribe()
  }, [isAdmin])

  // Real-time listener for availability
  useEffect(() => {
    if (!isAdmin) return
    const unsubscribe = onSnapshot(collection(db, "availability"), (snapshot) => {
      const map: Record<string, any> = {}
      snapshot.forEach(doc => {
        map[doc.id] = { id: doc.id, ...doc.data() }
      })
      setAvailabilityDocs(map)
    })
    return () => unsubscribe()
  }, [isAdmin])

  // Real-time listener for admin invites
  useEffect(() => {
    if (!isAdmin) return
    const unsubscribe = onSnapshot(collection(db, "admin_invites"), (snapshot) => {
      const list: any[] = []
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }))
      setInvites(list)
    })
    return () => unsubscribe()
  }, [isAdmin])

  // Auto-clean stale availability holds for declined/cancelled bookings
  useEffect(() => {
    if (!isAdmin || bookings.length === 0 || Object.keys(availabilityDocs).length === 0) return
    Object.entries(availabilityDocs).forEach(async ([dateStr, avail]) => {
      if (avail.status === 'held') {
        const matchingBooking = bookings.find(b => (avail.bookingId && b.id === avail.bookingId) || b.eventDate === dateStr)
        if (matchingBooking && (matchingBooking.bookingStatus === 'rejected' || matchingBooking.bookingStatus === 'cancelled')) {
          try {
            await deleteDoc(doc(db, "availability", dateStr))
          } catch (e) {
            console.error("Cleanup error:", e)
          }
        }
      }
    })
  }, [isAdmin, bookings, availabilityDocs])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleSignOut = () => {
    signOut(auth)
  }

  if (loading) return (
    <div className="pt-28 min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="text-gold-400 font-mono text-sm tracking-wider animate-pulse">Loading Admin...</div>
    </div>
  )

  if (!isAdmin) return null

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const pendingCount = bookings.filter(b => b.bookingStatus === 'pending_review' && (!b.eventDate || b.eventDate >= todayStr)).length

  return (
    <div className="pt-0 md:pt-20 pb-20 min-h-screen bg-[#0d0d0d] text-cream-100">
      
      {/* Toast Notification */}
      {notification && (
        <div
          className="fixed top-4 right-4 z-50 max-w-sm w-full p-3.5 flex items-center justify-between rounded-xl shadow-2xl text-xs font-medium"
          style={{
            background: '#161616',
            border: `1px solid ${notification.type === 'success' ? '#4ade80' : '#f87171'}`,
            color: notification.type === 'success' ? '#4ade80' : '#f87171'
          }}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-3 text-cream-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE TOP DOCK (Sticky at top of screen) */}
      {/* ========================================================= */}
      <div className="md:hidden sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-white/10 px-2 py-2 shadow-md">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative ${
              activeTab === 'bookings'
                ? 'bg-gold-400/20 text-gold-400 font-bold'
                : 'text-cream-400 hover:text-cream-200'
            }`}
          >
            <div className="relative">
              <Inbox size={18} />
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wider mt-1">Bookings</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
              activeTab === 'calendar'
                ? 'bg-gold-400/20 text-gold-400 font-bold'
                : 'text-cream-400 hover:text-cream-200'
            }`}
          >
            <Calendar size={18} />
            <span className="text-[10px] uppercase tracking-wider mt-1">Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
              activeTab === 'pricing'
                ? 'bg-gold-400/20 text-gold-400 font-bold'
                : 'text-cream-400 hover:text-cream-200'
            }`}
          >
            <IndianRupee size={18} />
            <span className="text-[10px] uppercase tracking-wider mt-1">Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'bg-gold-400/20 text-gold-400 font-bold'
                : 'text-cream-400 hover:text-cream-200'
            }`}
          >
            <Settings size={18} />
            <span className="text-[10px] uppercase tracking-wider mt-1">Settings</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP HEADER & TOP NAVIGATION BAR */}
      {/* ========================================================= */}
      <div className="hidden md:block border-b border-white/10 bg-[#121212]">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Desktop Navigation Buttons */}
            <nav className="flex items-center gap-2.5">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                  activeTab === 'bookings'
                    ? 'bg-gold-400 text-black font-bold border border-gold-400 shadow-[0_2px_12px_rgba(212,175,55,0.25)]'
                    : 'bg-[#1a1a1a] hover:bg-[#242424] text-cream-200 hover:text-white border border-white/10 hover:border-white/20 font-semibold'
                }`}
              >
                <Inbox size={16} />
                <span>Bookings</span>
                {pendingCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'bookings' ? 'bg-black text-gold-400' : 'bg-amber-500 text-black'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                  activeTab === 'calendar'
                    ? 'bg-gold-400 text-black font-bold border border-gold-400 shadow-[0_2px_12px_rgba(212,175,55,0.25)]'
                    : 'bg-[#1a1a1a] hover:bg-[#242424] text-cream-200 hover:text-white border border-white/10 hover:border-white/20 font-semibold'
                }`}
              >
                <Calendar size={16} />
                <span>Calendar</span>
              </button>

              <button
                onClick={() => setActiveTab('pricing')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                  activeTab === 'pricing'
                    ? 'bg-gold-400 text-black font-bold border border-gold-400 shadow-[0_2px_12px_rgba(212,175,55,0.25)]'
                    : 'bg-[#1a1a1a] hover:bg-[#242424] text-cream-200 hover:text-white border border-white/10 hover:border-white/20 font-semibold'
                }`}
              >
                <IndianRupee size={16} />
                <span>Pricing</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                  activeTab === 'settings'
                    ? 'bg-gold-400 text-black font-bold border border-gold-400 shadow-[0_2px_12px_rgba(212,175,55,0.25)]'
                    : 'bg-[#1a1a1a] hover:bg-[#242424] text-cream-200 hover:text-white border border-white/10 hover:border-white/20 font-semibold'
                }`}
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
            </nav>

            {/* Desktop User Info & Sign Out Button */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-cream-400 truncate max-w-[220px]">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-cream-300 hover:text-red-400 bg-[#1a1a1a] hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-all font-semibold cursor-pointer"
              >
                <LogOut size={14} />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================= */}
      <main className="container mx-auto px-4 sm:px-6 max-w-7xl mt-4 sm:mt-6">
        
        {/* TAB 1: BOOKINGS */}
        {activeTab === 'bookings' && (
          <BookingsSection 
            bookings={bookings} 
            setNotification={setNotification} 
            onOpenAddBooking={() => handleOpenAddBooking()} 
          />
        )}

        {/* TAB 2: CALENDAR */}
        {activeTab === 'calendar' && (
          <CalendarSection 
            bookings={bookings} 
            availabilityDocs={availabilityDocs} 
            setNotification={setNotification} 
            onOpenAddBooking={handleOpenAddBooking} 
          />
        )}

        {/* TAB 3: PRICING */}
        {activeTab === 'pricing' && (
          <PricingSection setNotification={setNotification} />
        )}

        {/* TAB 4: SETTINGS (Chatbot AI + Admin Access) */}
        {activeTab === 'settings' && (
          <SettingsSection 
            invites={invites} 
            currentUserEmail={user?.email || ''} 
            setNotification={setNotification} 
          />
        )}

      </main>

      {/* Offline / Walk-in Booking Modal */}
      {isAddingBooking && (
        <AddBookingModal
          defaultDate={addBookingDefaultDate}
          onClose={() => {
            setIsAddingBooking(false)
            setAddBookingDefaultDate(undefined)
          }}
          setNotification={setNotification}
        />
      )}
    </div>
  )
}

// =========================================================================
// MODAL: ADD OFFLINE / WALK-IN BOOKING
// =========================================================================

function AddBookingModal({
  defaultDate,
  onClose,
  setNotification
}: {
  defaultDate?: string
  onClose: () => void
  setNotification: (n: any) => void
}) {
  const tomorrowStr = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')
  const [eventDate, setEventDate] = useState(defaultDate || tomorrowStr)
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [eventType, setEventType] = useState('Birthday Party')
  const timeSlot = '5:00 PM – 10:00 PM'
  const [guestCount, setGuestCount] = useState<number>(100)
  const [totalAmount, setTotalAmount] = useState<number>(15000)
  const [advancePaid, setAdvancePaid] = useState<number>(5000)
  const [paymentMode, setPaymentMode] = useState<string>('UPI (GPay / PhonePe)')
  const [paymentNote, setPaymentNote] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventDate) {
      setNotification({ type: 'error', message: 'Event date is required.' })
      return
    }
    if (!userName.trim() || !userPhone.trim()) {
      setNotification({ type: 'error', message: 'Customer name and phone number are required.' })
      return
    }

    setSubmitting(true)
    try {
      const adv = Number(advancePaid) || 0
      const tot = Number(totalAmount) || 15000
      const isConfirmed = adv > 0
      const isFull = adv >= tot

      const bookingsCol = collection(db, "bookings")
      const newDocRef = doc(bookingsCol)

      const batch = writeBatch(db)
      batch.set(newDocRef, {
        source: 'offline_admin',
        userName: userName.trim(),
        userPhone: userPhone.trim(),
        userEmail: userEmail.trim() || '',
        eventType,
        timeSlot,
        eventDate,
        guestCount: Number(guestCount) || 100,
        totalAmount: tot,
        estimatedAmount: tot,
        advanceAmount: adv,
        amountPaid: adv,
        paymentMode: adv > 0 ? paymentMode : null,
        paymentNote: adv > 0 ? paymentNote.trim() : '',
        paymentStatus: isFull ? 'full_paid' : adv > 0 ? 'advance_paid' : 'unpaid',
        bookingStatus: isConfirmed ? 'confirmed' : 'awaiting_payment',
        notes: notes.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      })

      batch.set(doc(db, "availability", eventDate), {
        status: isConfirmed ? 'confirmed' : 'held',
        bookingId: newDocRef.id
      }, { merge: true })

      await batch.commit()

      setNotification({
        type: 'success',
        message: `Booking for ${userName} on ${eventDate} created (${isConfirmed ? 'Confirmed' : 'Slot Held'}).`
      })
      onClose()
    } catch (err: any) {
      console.error("Error creating offline booking:", err)
      setNotification({ type: 'error', message: 'Failed to create booking: ' + err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="p-5 sm:p-6 rounded-2xl max-w-lg w-full bg-[#161616] border border-white/15 shadow-2xl my-8 font-sans max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Add Booking (Offline / Phone)</h3>
            <p className="text-xs text-cream-400">Record a direct walk-in or phone reservation</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-cream-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-cream-400 font-bold block mb-1">Event Date *</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-gold-400/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-cream-400 font-bold block mb-1">Timing (Fixed)</label>
              <div className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-xs text-gold-400 font-semibold flex items-center justify-between">
                <span>5:00 PM – 10:00 PM</span>
                <span className="text-[10px] text-cream-400/60 font-mono uppercase">Standard</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-cream-400 font-bold block mb-1">Customer Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Anand Kumar"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-gold-400/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-cream-400 font-bold block mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="e.g. 9840123456"
                value={userPhone}
                onChange={e => setUserPhone(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-gold-400/50"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-cream-400 font-bold block mb-1">Event Type</label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-cream-100 focus:outline-none focus:border-gold-400/50"
              >
                <option value="Birthday Party">Birthday Party</option>
                <option value="Anniversary">Anniversary</option>
                <option value="Family Function">Family Function</option>
                <option value="Wedding Reception">Wedding Reception</option>
                <option value="Engagement Party">Engagement Party</option>
                <option value="Baby Shower">Baby Shower</option>
                <option value="Get-Together">Get-Together</option>
                <option value="Dinner Function">Dinner Function</option>
                <option value="Photo/Video Shoot">Photo/Video Shoot</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-cream-400 font-bold block mb-1">Guest Count</label>
              <input
                type="number"
                value={guestCount}
                onChange={e => setGuestCount(parseInt(e.target.value) || 0)}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-gold-400/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-cream-400 font-bold block mb-1">Email (Optional)</label>
              <input
                type="email"
                placeholder="customer@gmail.com"
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-cream-100 focus:outline-none focus:border-gold-400/50"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d0d0d] border border-white/10 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gold-400 font-bold block mb-1">Total Agreed Fee (₹)</label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={e => setTotalAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#161616] border border-white/15 rounded-lg px-3 py-2 text-xs text-cream-50 font-bold focus:outline-none focus:border-gold-400"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">Advance Received (₹)</label>
                <input
                  type="number"
                  value={advancePaid}
                  onChange={e => setAdvancePaid(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#161616] border border-white/15 rounded-lg px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {advancePaid > 0 && (
              <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-cream-400 font-bold block mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                    className="w-full bg-[#161616] border border-white/15 rounded-lg px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-gold-400/50"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI (GPay / PhonePe)">UPI (GPay / PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-cream-400 font-bold block mb-1">Reference / Note</label>
                  <input
                    type="text"
                    placeholder="e.g. GPay ref 9840..."
                    value={paymentNote}
                    onChange={e => setPaymentNote(e.target.value)}
                    className="w-full bg-[#161616] border border-white/15 rounded-lg px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-gold-400/50"
                  />
                </div>
              </div>
            )}

            <div className="text-[11px] text-cream-400/70 pt-1">
              {advancePaid > 0 ? (
                <span className="text-emerald-400 font-medium">✓ Date will be marked Confirmed on Calendar immediately.</span>
              ) : (
                <span className="text-amber-400 font-medium">⏳ Advance is ₹0. Slot will be marked as Held (awaiting payment).</span>
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-cream-400 font-bold block mb-1">Special Notes / Requirements</label>
            <textarea
              rows={2}
              placeholder="e.g. Sound system setup, outside catering arrangements..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg p-2 text-xs text-cream-100 focus:outline-none focus:border-gold-400/50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-cream-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-gold-400 hover:bg-gold-300 text-black text-xs font-bold uppercase tracking-wider shadow-lg shadow-gold-500/10 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Creating...' : 'Save Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =========================================================================
// MODAL: RECORD PAYMENT (Advance / Balance / Full)
// =========================================================================

function RecordPaymentModal({
  booking,
  onClose,
  setNotification
}: {
  booking: any
  onClose: () => void
  setNotification: (n: any) => void
}) {
  const total = Number(booking.totalAmount || booking.estimatedAmount || 0)
  const currentPaid = Number(booking.amountPaid || 0)
  const pendingBalance = Math.max(0, total - currentPaid)
  const defaultPayAmount = booking.bookingStatus === 'awaiting_payment' 
    ? (Number(booking.advanceAmount) || 5000) 
    : pendingBalance

  const [amount, setAmount] = useState<number>(defaultPayAmount)
  const [paymentMode, setPaymentMode] = useState<string>(booking.paymentMode || 'UPI (GPay / PhonePe)')
  const [paymentNote, setPaymentNote] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payNow = Number(amount) || 0
    if (payNow <= 0) {
      setNotification({ type: 'error', message: 'Payment amount must be greater than 0.' })
      return
    }

    setSubmitting(true)
    try {
      const newPaid = currentPaid + payNow
      const isFullyPaid = newPaid >= total

      const batch = writeBatch(db)
      batch.update(doc(db, "bookings", booking.id), {
        amountPaid: newPaid,
        paymentMode,
        paymentNote: paymentNote.trim() || booking.paymentNote || '',
        paymentStatus: isFullyPaid ? 'full_paid' : 'advance_paid',
        bookingStatus: 'confirmed',
        updatedAt: new Date()
      })

      if (booking.eventDate) {
        batch.set(doc(db, "availability", booking.eventDate), {
          status: 'confirmed',
          bookingId: booking.id
        }, { merge: true })
      }

      await batch.commit()

      setNotification({
        type: 'success',
        message: `Recorded payment of ₹${payNow.toLocaleString()} via ${paymentMode}.`
      })
      onClose()
    } catch (err: any) {
      console.error("Error recording payment:", err)
      setNotification({ type: 'error', message: 'Failed to record payment: ' + err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="p-5 sm:p-6 rounded-2xl max-w-md w-full bg-[#161616] border border-white/15 shadow-2xl font-sans">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white">Record Payment</h3>
            <p className="text-xs text-cream-400">
              {booking.userName} &bull; {booking.eventDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-cream-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#0d0d0d] border border-white/10 text-center">
            <div>
              <span className="text-[10px] text-cream-400 block uppercase">Total</span>
              <strong className="text-xs text-white">₹{total.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-[10px] text-cream-400 block uppercase">Paid</span>
              <strong className="text-xs text-emerald-400">₹{currentPaid.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-[10px] text-cream-400 block uppercase">Balance</span>
              <strong className="text-xs text-amber-400">₹{pendingBalance.toLocaleString()}</strong>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-gold-400 font-bold block mb-1">
              Payment Amount Received (₹) *
            </label>
            <input
              type="number"
              required
              value={amount}
              onChange={e => setAmount(parseInt(e.target.value) || 0)}
              className="w-full bg-[#0d0d0d] border border-white/15 rounded-lg px-3 py-2 text-sm text-gold-400 font-bold focus:outline-none focus:border-gold-400"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-cream-400 font-bold block mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-white/15 rounded-lg px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-gold-400/50"
            >
              <option value="Cash">Cash</option>
              <option value="UPI (GPay / PhonePe)">UPI (GPay / PhonePe)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="Card">Credit / Debit Card</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-cream-400 font-bold block mb-1">
              Transaction Ref / Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Ref / Cash handed over to manager"
              value={paymentNote}
              onChange={e => setPaymentNote(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-white/15 rounded-lg px-3 py-2 text-xs text-cream-100 focus:outline-none focus:border-gold-400/50"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-cream-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/10 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =========================================================================
// SECTION 1: BOOKINGS (Concise, Clean, Mobile + Desktop Optimized)
// =========================================================================

function BookingsSection({ 
  bookings, 
  setNotification, 
  onOpenAddBooking 
}: { 
  bookings: any[], 
  setNotification: (n: any) => void,
  onOpenAddBooking: () => void 
}) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const [filter, setFilter] = useState<'upcoming' | 'pending' | 'held' | 'past' | 'all'>('upcoming')
  const [approvingBooking, setApprovingBooking] = useState<any | null>(null)
  const [rejectingBooking, setRejectingBooking] = useState<any | null>(null)
  const [recordingPaymentBooking, setRecordingPaymentBooking] = useState<any | null>(null)
  const [customTotal, setCustomTotal] = useState<string>('')
  const [customAdvance, setCustomAdvance] = useState<string>('5000')
  const [rejectionReason, setRejectionReason] = useState<string>('')

  // Upcoming confirmed bookings (today & future)
  const upcomingList = bookings.filter(b => b.eventDate && b.eventDate >= todayStr && b.bookingStatus === 'confirmed')
  upcomingList.sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''))

  // Held bookings (slots held awaiting advance payment)
  const heldList = bookings.filter(b => b.bookingStatus === 'awaiting_payment' && (!b.eventDate || b.eventDate >= todayStr))
  heldList.sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''))

  // Pending review that are today or future (or no date)
  const pendingList = bookings.filter(b => b.bookingStatus === 'pending_review' && (!b.eventDate || b.eventDate >= todayStr))
  pendingList.sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''))

  // Past bookings (event date passed or marked completed)
  const pastList = bookings.filter(b => (b.eventDate && b.eventDate < todayStr) || b.bookingStatus === 'completed')
  pastList.sort((a, b) => (b.eventDate || '').localeCompare(a.eventDate || ''))

  const displayedList = 
    filter === 'upcoming' ? upcomingList :
    filter === 'pending' ? pendingList :
    filter === 'held' ? heldList :
    filter === 'past' ? pastList : bookings

  const startApproval = (b: any) => {
    setApprovingBooking(b)
    setCustomTotal(String(b.totalAmount || b.estimatedAmount || 15000))
    setCustomAdvance(String(b.advanceAmount || 5000))
  }

  const confirmApproval = async () => {
    if (!approvingBooking) return
    const total = parseFloat(customTotal) || 15000
    const advance = parseFloat(customAdvance) || 5000

    try {
      const batch = writeBatch(db)
      batch.update(doc(db, "bookings", approvingBooking.id), {
        bookingStatus: 'awaiting_payment',
        totalAmount: total,
        advanceAmount: advance,
        amountPaid: 0,
        updatedAt: new Date()
      })

      if (approvingBooking.eventDate) {
        batch.set(doc(db, "availability", approvingBooking.eventDate), {
          status: 'held',
          bookingId: approvingBooking.id
        }, { merge: true })
      }

      await batch.commit()

      // Resend email notification
      if (approvingBooking.userEmail) {
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'booking_approved',
              data: {
                customerName: approvingBooking.userName,
                customerEmail: approvingBooking.userEmail,
                eventDate: approvingBooking.eventDate,
                eventType: approvingBooking.eventType,
                totalAmount: total,
                advanceAmount: advance
              }
            })
          })
        } catch {}
      }

      setNotification({ type: 'success', message: 'Booking approved. Slot held.' })
      setApprovingBooking(null)
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Failed to approve: ' + e.message })
    }
  }

  const confirmRejection = async () => {
    if (!rejectingBooking) return
    try {
      const batch = writeBatch(db)
      batch.update(doc(db, "bookings", rejectingBooking.id), {
        bookingStatus: 'rejected',
        rejectionReason: rejectionReason || 'Unavailable',
        updatedAt: new Date()
      })

      if (rejectingBooking.eventDate) {
        batch.delete(doc(db, "availability", rejectingBooking.eventDate))
      }

      await batch.commit()
      setNotification({ type: 'success', message: 'Booking declined.' })
      setRejectingBooking(null)
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Failed to decline: ' + e.message })
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs & Add Booking Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
              filter === 'upcoming'
                ? 'bg-emerald-500 text-black font-bold'
                : 'bg-[#181818] text-cream-300 hover:text-white'
            }`}
          >
            Upcoming ({upcomingList.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-[#181818] text-cream-300 hover:text-white'
            }`}
          >
            Pending ({pendingList.length})
          </button>
          <button
            onClick={() => setFilter('held')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
              filter === 'held'
                ? 'bg-gold-400 text-black font-bold'
                : 'bg-[#181818] text-cream-300 hover:text-white'
            }`}
          >
            Held ({heldList.length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
              filter === 'past'
                ? 'bg-white/20 text-cream-100 font-bold border border-white/30'
                : 'bg-[#181818] text-cream-400 hover:text-cream-200'
            }`}
          >
            Past ({pastList.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white text-black font-bold'
                : 'bg-[#181818] text-cream-300 hover:text-white'
            }`}
          >
            All ({bookings.length})
          </button>
        </div>

        <button
          onClick={onOpenAddBooking}
          className="px-3.5 py-1.5 rounded-lg bg-gold-400 hover:bg-gold-300 text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-gold-500/10 transition-all cursor-pointer"
        >
          <Plus size={14} className="stroke-[3]" /> Add Booking
        </button>
      </div>

      {/* Bookings List */}
      {displayedList.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#141414] border border-white/5 text-xs text-cream-400">
          No bookings in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {displayedList.map(b => {
            const isPast = b.eventDate && b.eventDate < todayStr
            const isToday = b.eventDate === todayStr
            const cleanPhone = (b.userPhone || '').replace(/\D/g, '')
            const dateDisplay = b.eventDate ? format(new Date(`${b.eventDate}T00:00:00`), 'dd MMM yyyy, EEEE') : 'Date TBD'
            const whatsAppUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
              `Hi ${b.userName || 'Customer'}, regarding your PJ Lawn booking on ${dateDisplay}...`
            )}`

            return (
              <div
                key={b.id}
                className={`p-4 sm:p-5 rounded-xl bg-[#141414] border transition-all flex flex-col justify-between gap-3 ${
                  isPast ? 'border-white/5 opacity-75' : isToday ? 'border-gold-400/40 shadow-lg shadow-gold-400/5' : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-sans font-bold text-white tracking-normal">{dateDisplay}</span>
                      {isPast && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-white/5 text-cream-400/70 border border-white/10">
                          Past Event
                        </span>
                      )}
                      {isToday && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-gold-400 text-black shadow-sm">
                          Today
                        </span>
                      )}
                    </div>
                    <StatusBadge status={b.bookingStatus} />
                  </div>
                  
                  <div className="text-xs text-cream-300 font-medium">
                    {b.userName || 'Guest'} &bull; {b.eventType || 'Event'} ({b.guestCount || 0} guests)
                  </div>
                  
                  {b.notes && (
                    <p className="text-[11px] text-cream-400 italic mt-1 line-clamp-2">"{b.notes}"</p>
                  )}
                </div>

                {/* Amount & Balance Row */}
                <div className="flex flex-col gap-1.5 py-2 px-3 rounded-lg bg-[#0d0d0d] border border-white/5 text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-cream-400">Total: <strong className="text-cream-100">₹{(b.totalAmount || b.estimatedAmount || 0).toLocaleString()}</strong></span>
                    <span className="text-cream-400">
                      Paid: <strong className="text-green-400">₹{(b.amountPaid || 0).toLocaleString()}</strong>
                      {b.paymentMode && <span className="text-[10px] text-cream-400/70 ml-1">({b.paymentMode})</span>}
                    </span>
                  </div>
                  {b.bookingStatus === 'confirmed' && (b.amountPaid || 0) < (b.totalAmount || b.estimatedAmount || 0) && (
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                      <span className="text-amber-400/90 font-medium">Balance Due:</span>
                      <span className="text-amber-400 font-bold">₹{((b.totalAmount || b.estimatedAmount || 0) - (b.amountPaid || 0)).toLocaleString()}</span>
                    </div>
                  )}
                  {b.bookingStatus === 'confirmed' && (b.amountPaid || 0) >= (b.totalAmount || b.estimatedAmount || 0) && (
                    <div className="flex items-center justify-end pt-1 border-t border-white/5 text-[10px] text-emerald-400 font-semibold">
                      ✓ Fully Settled
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    {cleanPhone && (
                      <>
                        <a
                          href={`tel:${cleanPhone}`}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cream-200 text-xs font-semibold flex items-center gap-1"
                        >
                          <Phone size={12} className="text-gold-400" /> Call
                        </a>
                        <a
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-1"
                        >
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isPast ? (
                      <span className="text-[11px] text-cream-400/50 italic px-2 py-1">Event concluded</span>
                    ) : (
                      <>
                        {b.bookingStatus === 'pending_review' && (
                          <>
                            <button
                              onClick={() => setRejectingBooking(b)}
                              className="px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 font-semibold cursor-pointer"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => startApproval(b)}
                              className="px-3 py-1.5 rounded-lg text-xs bg-gold-400 text-black font-bold hover:bg-gold-300 cursor-pointer"
                            >
                              Approve
                            </button>
                          </>
                        )}

                        {b.bookingStatus === 'awaiting_payment' && (
                          <>
                            <button
                              onClick={() => setRejectingBooking(b)}
                              className="px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => setRecordingPaymentBooking(b)}
                              className="px-3 py-1.5 rounded-lg text-xs bg-green-500 text-black font-bold hover:bg-green-400 cursor-pointer"
                            >
                              Record Advance
                            </button>
                          </>
                        )}

                        {b.bookingStatus === 'confirmed' && (b.amountPaid || 0) < (b.totalAmount || b.estimatedAmount || 0) && (
                          <button
                            onClick={() => setRecordingPaymentBooking(b)}
                            className="px-3 py-1.5 rounded-lg text-xs bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 font-bold cursor-pointer"
                          >
                            Record Balance
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Approve Modal */}
      {approvingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="p-5 rounded-2xl max-w-sm w-full bg-[#161616] border border-white/15 shadow-2xl">
            <h3 className="text-base font-sans font-bold text-cream-50 mb-1">Set Price & Approve</h3>
            <p className="text-xs font-sans text-cream-300 mb-4">
              {approvingBooking.userName} &bull; {approvingBooking.eventDate ? format(new Date(`${approvingBooking.eventDate}T00:00:00`), 'dd MMM yyyy, EEEE') : 'Date TBD'}
            </p>
            
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-cream-400 block mb-1">Total Fee (₹)</label>
                <input
                  type="number"
                  value={customTotal}
                  onChange={e => setCustomTotal(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-xs text-cream-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-cream-400 block mb-1">Advance (₹)</label>
                <input
                  type="number"
                  value={customAdvance}
                  onChange={e => setCustomAdvance(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-xs text-cream-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setApprovingBooking(null)} className="flex-1 py-2 text-xs text-cream-400 hover:text-white rounded-lg bg-white/5">Cancel</button>
              <button onClick={confirmApproval} className="flex-1 py-2 text-xs bg-gold-400 text-black font-bold rounded-lg hover:bg-gold-300">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="p-5 rounded-2xl max-w-sm w-full bg-[#161616] border border-white/15 shadow-2xl">
            <h3 className="text-base font-sans font-bold text-cream-50 mb-1">Decline Booking</h3>
            <p className="text-xs font-sans text-cream-300 mb-3">
              {rejectingBooking.userName} &bull; {rejectingBooking.eventDate ? format(new Date(`${rejectingBooking.eventDate}T00:00:00`), 'dd MMM yyyy, EEEE') : 'Date TBD'}
            </p>
            
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Reason for declining..."
              className="w-full h-20 bg-[#0d0d0d] border border-white/10 rounded-lg p-2 text-xs text-cream-100 focus:outline-none mb-4 resize-none"
            />

            <div className="flex gap-2">
              <button onClick={() => setRejectingBooking(null)} className="flex-1 py-2 text-xs text-cream-400 hover:text-white rounded-lg bg-white/5">Cancel</button>
              <button onClick={confirmRejection} className="flex-1 py-2 text-xs bg-red-600 text-white font-bold rounded-lg hover:bg-red-500">Decline</button>
            </div>
          </div>
        </div>
      )}
      {/* Record Payment Modal */}
      {recordingPaymentBooking && (
        <RecordPaymentModal
          booking={recordingPaymentBooking}
          onClose={() => setRecordingPaymentBooking(null)}
          setNotification={setNotification}
        />
      )}
    </div>
  )
}

// =========================================================================
// SECTION 2: CALENDAR (Clean Grid + Date Inspector + "Block Date")
// =========================================================================

function CalendarSection({
  bookings,
  availabilityDocs,
  setNotification,
  onOpenAddBooking
}: {
  bookings: any[]
  availabilityDocs: Record<string, any>
  setNotification: (n: any) => void
  onOpenAddBooking: (dateStr?: string) => void
}) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const isSelectedPast = selectedDateStr < todayStr
  const isSelectedToday = selectedDateStr === todayStr

  const selectedAvail = availabilityDocs[selectedDateStr]
  // Always find the booking by bookingId or eventDate so booking data is never hidden
  const selectedBooking = bookings.find(b => (selectedAvail?.bookingId && b.id === selectedAvail.bookingId) || b.eventDate === selectedDateStr)

  const isDeclined = selectedBooking?.bookingStatus === 'rejected' || selectedBooking?.bookingStatus === 'cancelled'
  const isConfirmed = (selectedBooking?.bookingStatus === 'confirmed' || selectedBooking?.bookingStatus === 'completed' || (selectedAvail?.status === 'confirmed' && !isDeclined))
  const isHeld = (selectedBooking?.bookingStatus === 'awaiting_payment' || (selectedAvail?.status === 'held' && !isDeclined)) && !isConfirmed
  const isBlocked = selectedAvail?.status === 'blocked' && !isConfirmed && !isHeld

  // Dynamic counts of CURRENT DATE & UPCOMING ALONE
  const confirmedUpcomingDates = new Set<string>()
  bookings.forEach(b => {
    if (b.eventDate && b.eventDate >= todayStr && (b.bookingStatus === 'confirmed' || b.bookingStatus === 'completed')) {
      confirmedUpcomingDates.add(b.eventDate)
    }
  })
  Object.values(availabilityDocs).forEach(d => {
    if (d.id >= todayStr && d.status === 'confirmed') {
      const match = bookings.find(b => b.eventDate === d.id || b.id === d.bookingId)
      if (!match || (match.bookingStatus !== 'rejected' && match.bookingStatus !== 'cancelled')) {
        confirmedUpcomingDates.add(d.id)
      }
    }
  })
  const upcomingConfirmedCount = confirmedUpcomingDates.size

  const heldUpcomingDates = new Set<string>()
  bookings.forEach(b => {
    if (b.eventDate && b.eventDate >= todayStr && b.bookingStatus === 'awaiting_payment') {
      heldUpcomingDates.add(b.eventDate)
    }
  })
  Object.values(availabilityDocs).forEach(d => {
    if (d.id >= todayStr && d.status === 'held') {
      const match = bookings.find(b => b.eventDate === d.id || b.id === d.bookingId)
      if (match?.bookingStatus === 'awaiting_payment') {
        heldUpcomingDates.add(d.id)
      }
    }
  })
  const upcomingHeldCount = heldUpcomingDates.size

  const blockedUpcomingDates = new Set<string>()
  Object.values(availabilityDocs).forEach(d => {
    if (d.id >= todayStr && d.status === 'blocked') {
      blockedUpcomingDates.add(d.id)
    }
  })
  const upcomingBlockedCount = blockedUpcomingDates.size

  const toggleBlock = async () => {
    if (isSelectedPast) {
      setNotification({ type: 'error', message: 'Past dates cannot be modified.' })
      return
    }
    try {
      if (isBlocked) {
        await deleteDoc(doc(db, "availability", selectedDateStr))
        setNotification({ type: 'success', message: `Unblocked ${selectedDateStr}.` })
      } else {
        await setDoc(doc(db, "availability", selectedDateStr), {
          status: 'blocked',
          updatedAt: new Date()
        })
        setNotification({ type: 'success', message: `Blocked ${selectedDateStr}.` })
      }
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Action failed: ' + e.message })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 p-4 sm:p-5 rounded-xl bg-[#141414] border border-white/10">
        
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-sans text-base sm:text-lg font-bold text-white tracking-normal">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#242424] border border-white/10 text-cream-300 hover:text-white transition-all cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#242424] border border-white/10 text-cream-300 hover:text-white transition-all cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Legend showing accurate current & upcoming counts alone */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-cream-300 mb-4 pb-3 border-b border-white/5 font-sans">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-cream-400 font-bold mr-1">
            Active:
          </span>

          <span className="flex items-center gap-1.5 bg-[#181818] px-2.5 py-1 rounded-lg border border-white/5">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-black text-[10px] font-black flex items-center justify-center shadow-sm">
              {upcomingConfirmedCount}
            </span>
            <span className="text-xs text-cream-200 font-medium">Confirmed</span>
          </span>

          <span className="flex items-center gap-1.5 bg-[#181818] px-2.5 py-1 rounded-lg border border-white/5">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-black text-[10px] font-black flex items-center justify-center shadow-sm">
              {upcomingHeldCount}
            </span>
            <span className="text-xs text-cream-200 font-medium">Held</span>
          </span>

          <span className="flex items-center gap-1.5 bg-[#181818] px-2.5 py-1 rounded-lg border border-white/5">
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
              {upcomingBlockedCount}
            </span>
            <span className="text-xs text-cream-200 font-medium">Blocked</span>
          </span>

          <span className="flex items-center gap-1.5 px-2 py-1 text-cream-400">
            <span className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-cream-400">&bull;</span>
            <span className="text-xs">Available</span>
          </span>
        </div>

        {/* Weekday headers: Sunday to Saturday (Standard Indian Format) */}
        <div className="grid grid-cols-7 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <span key={i} className={`text-[11px] sm:text-xs font-sans font-bold py-1 ${i === 0 ? 'text-amber-400' : 'text-cream-400/80'}`}>
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {days.map(d => {
            const dayStr = format(d, 'yyyy-MM-dd')
            const isSelected = isSameDay(d, selectedDate)
            const inMonth = isSameMonth(d, currentMonth)
            const isPast = dayStr < todayStr
            const isToday = dayStr === todayStr

            const avail = availabilityDocs[dayStr]
            const b = bookings.find(item => (avail?.bookingId && item.id === avail.bookingId) || item.eventDate === dayStr)
            const bDeclined = b?.bookingStatus === 'rejected' || b?.bookingStatus === 'cancelled'

            const dayConfirmed = (b?.bookingStatus === 'confirmed' || b?.bookingStatus === 'completed' || avail?.status === 'confirmed') && !bDeclined
            const dayHeld = (b?.bookingStatus === 'awaiting_payment' || (avail?.status === 'held' && !bDeclined)) && !dayConfirmed
            const dayBlocked = avail?.status === 'blocked' && !dayConfirmed && !dayHeld

            let circleStyle = 'text-cream-200 hover:bg-white/10 hover:text-white font-medium'

            if (isPast) {
              if (dayConfirmed) {
                circleStyle = 'bg-emerald-950/40 text-emerald-500/60 font-medium border border-emerald-800/30'
              } else if (dayBlocked) {
                circleStyle = 'bg-red-950/30 text-red-500/50 font-medium border border-red-900/30'
              } else {
                circleStyle = 'text-cream-400/30 hover:bg-white/5 font-normal'
              }
            } else {
              // Current & Upcoming dates:
              if (dayConfirmed) {
                circleStyle = 'bg-emerald-500 text-black font-extrabold shadow-sm shadow-emerald-500/30'
              } else if (dayHeld) {
                circleStyle = 'bg-amber-400 text-black font-extrabold shadow-sm shadow-amber-400/30'
              } else if (dayBlocked) {
                circleStyle = 'bg-red-500 text-white font-extrabold shadow-sm shadow-red-500/30'
              } else if (isToday) {
                circleStyle = 'text-gold-400 font-bold border border-gold-400/60 hover:bg-gold-400/10'
              }
            }

            return (
              <div
                key={d.toISOString()}
                className={`h-10 sm:h-12 w-full flex items-center justify-center ${
                  !inMonth ? 'opacity-20 pointer-events-none' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedDate(d)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full aspect-square flex items-center justify-center font-sans text-xs sm:text-sm font-bold transition-all cursor-pointer ${circleStyle} ${
                    isSelected ? 'ring-2 ring-gold-400 ring-offset-2 ring-offset-[#141414] scale-105 shadow-md shadow-gold-400/30' : ''
                  }`}
                >
                  {format(d, 'd')}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Day Inspector */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#141414] border border-white/10 flex flex-col justify-between gap-4 font-sans">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-gold-400 font-bold block">Date Details</span>
            {isSelectedPast && (
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-cream-400/60 border border-white/10 font-bold">
                Past
              </span>
            )}
            {isSelectedToday && (
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gold-400 text-black font-black">
                Today
              </span>
            )}
          </div>
          <h3 className="font-sans text-base sm:text-lg font-bold text-white mb-3">
            {format(selectedDate, 'dd MMMM yyyy, EEEE')}
          </h3>

          <div className="p-3 rounded-lg bg-[#0d0d0d] border border-white/5 mb-3 text-xs">
            <span className="text-cream-400 block text-[10px] uppercase mb-0.5">Status</span>
            {isConfirmed ? (
              <span className="text-emerald-400 font-bold">
                Confirmed Event {isSelectedPast && <span className="text-cream-400/60 text-[10px] font-normal ml-1">(Concluded)</span>}
              </span>
            ) : isHeld ? (
              <span className="text-amber-400 font-bold">
                Slot Held {isSelectedPast && <span className="text-cream-400/60 text-[10px] font-normal ml-1">(Expired)</span>}
              </span>
            ) : isBlocked ? (
              <span className="text-red-400 font-bold">
                Blocked {isSelectedPast && <span className="text-cream-400/60 text-[10px] font-normal ml-1">(Past)</span>}
              </span>
            ) : isDeclined ? (
              <span className="text-cream-300 font-medium">
                Available <span className="text-red-400 text-[10px] font-normal ml-1">(Previous booking declined)</span>
              </span>
            ) : (
              <span className="text-cream-300">{isSelectedPast ? 'Past Date' : 'Available'}</span>
            )}
          </div>

          {selectedBooking && (
            <div className="space-y-2 p-3 rounded-lg bg-[#0d0d0d] border border-white/5 text-xs text-cream-300 mb-3">
              <div className="flex items-center justify-between">
                <strong className="text-white">{selectedBooking.userName || 'Guest'}</strong>
                <StatusBadge status={selectedBooking.bookingStatus} />
              </div>
              <div>{selectedBooking.eventType || 'Event'} &bull; {selectedBooking.guestCount || 0} guests</div>
              {selectedBooking.userPhone && (
                <div className="text-cream-400 font-mono text-[11px]">{selectedBooking.userPhone}</div>
              )}
              <div className="text-gold-400 font-bold">₹{(selectedBooking.totalAmount || selectedBooking.estimatedAmount || 0).toLocaleString()}</div>
              {selectedBooking.rejectionReason && (
                <div className="text-red-400/90 text-[11px] italic">Decline reason: "{selectedBooking.rejectionReason}"</div>
              )}
            </div>
          )}
        </div>

        <div>
          {selectedAvail?.status === 'held' && (isDeclined || !selectedBooking) && (
            <button
              onClick={async () => {
                await deleteDoc(doc(db, "availability", selectedDateStr))
                setNotification({ type: 'success', message: `Released hold on ${selectedDateStr}.` })
              }}
              className="w-full py-2.5 mb-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              Release Stale Hold
            </button>
          )}

          {!isSelectedPast && !isConfirmed && (
            <button
              onClick={() => onOpenAddBooking(selectedDateStr)}
              className="w-full py-2.5 mb-2 rounded-lg bg-gold-400 hover:bg-gold-300 text-black text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-gold-500/10"
            >
              <Plus size={14} className="stroke-[3]" /> Book This Date
            </button>
          )}

          {isSelectedPast ? (
            <p className="text-[11px] text-cream-400/50 italic text-center py-2">Past dates cannot be modified.</p>
          ) : isConfirmed ? (
            <p className="text-[11px] text-cream-400 italic text-center py-2">Confirmed date cannot be blocked.</p>
          ) : (
            <button
              onClick={toggleBlock}
              className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isBlocked
                  ? 'bg-white text-black hover:bg-cream-200'
                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
              }`}
            >
              {isBlocked ? 'Unblock Date' : 'Block Date'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// =========================================================================
// SECTION 3: PRICING (Tier Management)
// =========================================================================

function PricingSection({ setNotification }: { setNotification: (n: any) => void }) {
  const [tiers, setTiers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getDoc(doc(db, "settings", "pricing")).then(d => {
      if (d.exists()) setTiers(d.data().venueTiers || [])
    })
  }, [])

  const addTier = () => setTiers([...tiers, { minGuests: 0, maxGuests: 0, price: 0 }])
  const removeTier = (i: number) => setTiers(tiers.filter((_, idx) => idx !== i))
  const updateTier = (i: number, field: string, val: string) => {
    const copy = [...tiers]
    copy[i][field] = parseInt(val) || 0
    setTiers(copy)
  }

  const savePricing = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, "settings", "pricing"), { venueTiers: tiers }, { merge: true })
      setNotification({ type: 'success', message: 'Pricing saved.' })
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Failed: ' + e.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-5 rounded-xl bg-[#141414] border border-white/10 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-sans text-base font-bold text-cream-50">Pricing Tiers</h3>
        <button
          onClick={addTier}
          className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-cream-200 font-medium flex items-center gap-1"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      <div className="space-y-2.5 mb-5">
        {tiers.map((t, idx) => (
          <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0d0d0d] border border-white/5">
            <div className="flex-1">
              <span className="text-[10px] text-cream-400 block mb-0.5">Min</span>
              <input
                type="number"
                value={t.minGuests}
                onChange={e => updateTier(idx, 'minGuests', e.target.value)}
                className="w-full bg-[#181818] border border-white/10 rounded px-2 py-1 text-xs text-cream-100"
              />
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-cream-400 block mb-0.5">Max</span>
              <input
                type="number"
                value={t.maxGuests}
                onChange={e => updateTier(idx, 'maxGuests', e.target.value)}
                className="w-full bg-[#181818] border border-white/10 rounded px-2 py-1 text-xs text-cream-100"
              />
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-cream-400 block mb-0.5">Price (₹)</span>
              <input
                type="number"
                value={t.price}
                onChange={e => updateTier(idx, 'price', e.target.value)}
                className="w-full bg-[#181818] border border-white/10 rounded px-2 py-1 text-xs text-gold-400 font-bold"
              />
            </div>
            <button
              onClick={() => removeTier(idx)}
              className="text-red-400 hover:text-red-300 p-1 text-xs self-end mb-1"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={savePricing}
        disabled={saving}
        className="w-full py-2.5 rounded-lg bg-gold-400 text-black font-bold text-xs uppercase tracking-wider hover:bg-gold-300 transition-all"
      >
        {saving ? 'Saving...' : 'Save Pricing'}
      </button>
    </div>
  )
}

// =========================================================================
// SECTION 4: SETTINGS (Chatbot AI + Admin Access)
// =========================================================================

function SettingsSection({
  invites,
  currentUserEmail,
  setNotification
}: {
  invites: any[]
  currentUserEmail: string
  setNotification: (n: any) => void
}) {
  const [subTab, setSubTab] = useState<'chatbot' | 'admins'>('chatbot')
  
  // Chatbot State
  const [prompt, setPrompt] = useState('')
  const [businessData, setBusinessData] = useState('')
  const [savingChatbot, setSavingChatbot] = useState(false)

  // Admin Invite State
  const [newEmail, setNewEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    getDoc(doc(db, "settings", "chatbot")).then(snap => {
      if (snap.exists()) {
        setPrompt(snap.data().systemPrompt || '')
        setBusinessData(snap.data().businessData || '')
      }
    })
  }, [])

  const saveChatbot = async () => {
    setSavingChatbot(true)
    try {
      await setDoc(doc(db, "settings", "chatbot"), {
        systemPrompt: prompt,
        businessData: businessData,
        updatedAt: new Date()
      }, { merge: true })
      setNotification({ type: 'success', message: 'Chatbot settings saved.' })
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Error: ' + e.message })
    } finally {
      setSavingChatbot(false)
    }
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = newEmail.toLowerCase().trim()
    if (!email || !email.includes('@')) return

    setInviting(true)
    try {
      await setDoc(doc(db, "admin_invites", email), {
        email,
        invitedBy: currentUserEmail,
        invitedAt: new Date()
      })
      setNotification({ type: 'success', message: `Added ${email} as admin.` })
      setNewEmail('')
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Failed to add admin: ' + e.message })
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveAdmin = async (email: string) => {
    if (email === currentUserEmail) {
      setNotification({ type: 'error', message: 'Cannot remove your own access.' })
      return
    }
    if (!confirm(`Remove admin access for ${email}?`)) return
    try {
      await deleteDoc(doc(db, "admin_invites", email))
      setNotification({ type: 'success', message: `Removed ${email}.` })
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Error: ' + e.message })
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Sub tabs: Chatbot AI vs Admin Access */}
      <div className="flex gap-2">
        <button
          onClick={() => setSubTab('chatbot')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
            subTab === 'chatbot'
              ? 'bg-gold-400 text-black font-bold'
              : 'bg-[#181818] text-cream-300 hover:text-white'
          }`}
        >
          <Bot size={14} /> Chatbot AI
        </button>
        <button
          onClick={() => setSubTab('admins')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
            subTab === 'admins'
              ? 'bg-gold-400 text-black font-bold'
              : 'bg-[#181818] text-cream-300 hover:text-white'
          }`}
        >
          <Shield size={14} /> Admin Access
        </button>
      </div>

      {subTab === 'chatbot' ? (
        <div className="p-5 rounded-xl bg-[#141414] border border-white/10 space-y-4">
          <div>
            <label className="text-xs font-bold text-cream-200 block mb-1">System Instructions</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full h-28 bg-[#0d0d0d] border border-white/10 rounded-lg p-2.5 text-xs text-cream-100 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-cream-200 block mb-1">Venue Facts & Info</label>
            <textarea
              value={businessData}
              onChange={e => setBusinessData(e.target.value)}
              className="w-full h-36 bg-[#0d0d0d] border border-white/10 rounded-lg p-2.5 text-xs text-cream-100 font-mono focus:outline-none"
            />
          </div>

          <button
            onClick={saveChatbot}
            disabled={savingChatbot}
            className="w-full py-2.5 rounded-lg bg-gold-400 text-black font-bold text-xs uppercase tracking-wider hover:bg-gold-300 transition-all"
          >
            {savingChatbot ? 'Saving...' : 'Save Chatbot'}
          </button>
        </div>
      ) : (
        <div className="p-5 rounded-xl bg-[#141414] border border-white/10 space-y-4">
          <form onSubmit={handleAddAdmin} className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Enter Google email..."
              className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-xs text-cream-100 focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={inviting}
              className="px-4 py-2 bg-gold-400 text-black text-xs font-bold rounded-lg hover:bg-gold-300"
            >
              {inviting ? 'Adding...' : 'Add Admin'}
            </button>
          </form>

          {/* Active Admins List */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] uppercase tracking-wider text-cream-400 block mb-1">Active Administrators</span>
            
            {/* Super admin defaults */}
            {['jinsu.j2005@gmail.com', 'jinsukapgreen@gmail.com'].map(email => (
              <div key={email} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0d0d0d] border border-white/5 text-xs">
                <span className="flex items-center gap-2 text-cream-100">
                  <UserCheck size={13} className="text-emerald-400" />
                  {email}
                </span>
                <span className="text-[10px] uppercase text-gold-400 font-bold">Owner</span>
              </div>
            ))}

            {/* Invited admins */}
            {invites
              .filter(inv => inv.email !== 'jinsu.j2005@gmail.com' && inv.email !== 'jinsukapgreen@gmail.com')
              .map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0d0d0d] border border-white/5 text-xs">
                  <span className="flex items-center gap-2 text-cream-200">
                    <UserCheck size={13} className="text-cream-400" />
                    {inv.email}
                  </span>
                  <button
                    onClick={() => handleRemoveAdmin(inv.email)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; bg: string }> = {
    'pending_review': { label: 'Pending', bg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
    'awaiting_payment': { label: 'Held', bg: 'bg-gold-400/20 text-gold-400 border border-gold-400/30' },
    'confirmed': { label: 'Confirmed', bg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
    'completed': { label: 'Done', bg: 'bg-white/10 text-cream-300 border border-white/15' },
    'rejected': { label: 'Declined', bg: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  }
  const c = configs[status] || { label: status, bg: 'bg-white/10 text-cream-300' }
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${c.bg}`}>
      {c.label}
    </span>
  )
}
