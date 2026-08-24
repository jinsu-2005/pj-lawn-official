import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Image as ImageIcon, IndianRupee, Inbox, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAdminGuard } from '@/hooks/useAdminGuard'
import { db, auth } from '@/lib/firebase'
import { collection, query, onSnapshot, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { format } from 'date-fns'

export default function Admin() {
  const { isAdmin, loading, user } = useAdminGuard()
  const [activeTab, setActiveTab] = useState<'queue' | 'calendar' | 'pricing'>('queue')
  const [bookings, setBookings] = useState<any[]>([])
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  
  // Real-time listener for all bookings
  useEffect(() => {
    if (!isAdmin) return
    const q = query(collection(db, "bookings")) // Add orderBy when index is built
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bks: any[] = []
      snapshot.forEach(doc => bks.push({ id: doc.id, ...doc.data() }))
      // Sort in memory for now
      bks.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis())
      setBookings(bks)
    })
    return () => unsubscribe()
  }, [isAdmin])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleSignOut = () => {
    signOut(auth)
  }

  if (loading) return <div className="pt-32 min-h-screen container mx-auto text-center text-cream-400">Verifying admin access...</div>
  if (!isAdmin) return null // Guard will redirect

  const pendingBookings = bookings.filter(b => b.bookingStatus === 'pending_review')
  const activeBookings = bookings.filter(b => ['awaiting_payment', 'confirmed', 'completed'].includes(b.bookingStatus))

  return (
    <div className="pt-24 pb-24 min-h-screen bg-charcoal-900 flex flex-col md:flex-row relative">
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

      {/* Sidebar Nav */}
      <div className="w-full md:w-64 bg-charcoal-800 border-r border-white/5 p-6 flex flex-col min-h-[calc(100vh-6rem)]">
        <div className="mb-10">
          <h2 className="text-xl font-serif text-cream-100">Admin Panel</h2>
          <p className="text-xs text-cream-400 mt-1">{user?.email}</p>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavButton icon={<Inbox size={18}/>} label={`Queue (${pendingBookings.length})`} active={activeTab === 'queue'} onClick={() => setActiveTab('queue')} />
          <NavButton icon={<Calendar size={18}/>} label="Calendar & Active" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
          <NavButton icon={<IndianRupee size={18}/>} label="Pricing Config" active={activeTab === 'pricing'} onClick={() => setActiveTab('pricing')} />
          <NavButton icon={<ImageIcon size={18}/>} label="Gallery Manager" active={false} onClick={() => setNotification({ type: 'info', message: 'Gallery Manager coming soon.' })} />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <button onClick={handleSignOut} className="flex items-center gap-3 text-cream-400 hover:text-red-400 text-sm transition-colors w-full p-2">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-10">
        
        {activeTab === 'queue' && (
          <QueueView pendingBookings={pendingBookings} setNotification={setNotification} />
        )}

        {activeTab === 'calendar' && (
          <ActiveBookingsView bookings={activeBookings} setNotification={setNotification} />
        )}

        {activeTab === 'pricing' && (
          <PricingManager setNotification={setNotification} />
        )}
        
      </div>
    </div>
  )
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-colors ${
        active ? 'bg-gold-500/10 text-gold-400' : 'text-cream-400 hover:bg-white/5 hover:text-cream-200'
      }`}
    >
      {icon} {label}
    </button>
  )
}

// ==========================================
// SUBVIEWS
// ==========================================

function QueueView({ pendingBookings, setNotification }: { pendingBookings: any[], setNotification: (n: any) => void }) {
  const [approvingBooking, setApprovingBooking] = useState<any | null>(null)
  const [customTotal, setCustomTotal] = useState<string>('')
  const [customAdvance, setCustomAdvance] = useState<string>('5000')

  const handleApprove = async () => {
    if (!approvingBooking) return
    const total = parseFloat(customTotal) || approvingBooking.estimatedAmount || 150000
    const advance = parseFloat(customAdvance) || 5000

    try {
      await updateDoc(doc(db, "bookings", approvingBooking.id), {
        bookingStatus: 'awaiting_payment',
        totalAmount: total,
        advanceAmount: advance,
        amountPaid: 0,
        updatedAt: new Date()
      })
      
      await setDoc(doc(db, "availability", approvingBooking.eventDate), {
        status: 'held',
        bookingId: approvingBooking.id
      }, { merge: true })
      
      setNotification({ type: 'success', message: 'Booking approved! Customer can now pay.' })
      setApprovingBooking(null)
    } catch(e) {
      console.error(e)
      setNotification({ type: 'error', message: 'Failed to approve booking' })
    }
  }

  const handleReject = async (bookingId: string) => {
    if(!window.confirm('Are you sure you want to reject this booking?')) return
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        bookingStatus: 'rejected',
        updatedAt: new Date()
      })
      setNotification({ type: 'success', message: 'Booking rejected.' })
    } catch(e) {
      console.error(e)
      setNotification({ type: 'error', message: 'Failed to reject booking' })
    }
  }

  const startApproval = (booking: any) => {
    setApprovingBooking(booking)
    setCustomTotal(String(booking.estimatedAmount || 150000))
    setCustomAdvance('5000')
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="relative">
      <h2 className="text-2xl font-serif text-cream-100 mb-6">Pending Review</h2>
      {pendingBookings.length === 0 ? (
        <p className="text-cream-400 bg-charcoal-800 p-8 rounded-md border border-white/5 text-center">No pending bookings at the moment.</p>
      ) : (
        <div className="space-y-4">
          {pendingBookings.map(b => (
            <div key={b.id} className="bg-charcoal-800 border border-white/5 p-6 rounded-md flex flex-col md:flex-row justify-between gap-6">
              <div>
                <div className="text-xs text-gold-400 uppercase mb-1">{b.eventType} &bull; {b.guestCount} Guests</div>
                <h3 className="text-lg font-serif text-cream-100 mb-2">{b.eventDate ? format(new Date(b.eventDate), 'MMMM do, yyyy') : 'TBD'}</h3>
                <div className="text-sm text-cream-400 space-y-1">
                  <p>Name: <span className="text-cream-200">{b.userName}</span></p>
                  <p>Phone: <span className="text-cream-200">{b.userPhone}</span></p>
                  {b.notes && <p>Notes: <span className="italic">"{b.notes}"</span></p>}
                </div>
              </div>
              <div className="flex flex-col items-end justify-between border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                <div className="text-right mb-4">
                  <p className="text-xs text-cream-400 uppercase">System Est.</p>
                  <p className="text-xl text-cream-100 font-medium">₹{b.estimatedAmount?.toLocaleString()}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button variant="outline" className="flex-1 md:flex-none border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => handleReject(b.id)}>Reject</Button>
                  <Button className="flex-1 md:flex-none" onClick={() => startApproval(b)}>Approve & Set Price</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Price Configuration Modal */}
      {approvingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-charcoal-800 border border-white/10 p-8 rounded-lg max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-xl font-serif text-cream-100 mb-4">Approve Booking</h3>
            <p className="text-sm text-cream-400 mb-6">
              Confirm or adjust the pricing for the event on <strong>{approvingBooking.eventDate ? format(new Date(approvingBooking.eventDate), 'MMMM do, yyyy') : 'TBD'}</strong>.
            </p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-400 mb-2">Total Amount (₹)</label>
                <input 
                  type="number" 
                  value={customTotal}
                  onChange={(e) => setCustomTotal(e.target.value)}
                  className="w-full bg-charcoal-900 border border-white/10 rounded-md px-4 py-3 text-cream-200 focus:outline-none focus:border-gold-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-400 mb-2">Advance Amount (₹)</label>
                <input 
                  type="number" 
                  value={customAdvance}
                  onChange={(e) => setCustomAdvance(e.target.value)}
                  className="w-full bg-charcoal-900 border border-white/10 rounded-md px-4 py-3 text-cream-200 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setApprovingBooking(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleApprove}>Confirm & Approve</Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function ActiveBookingsView({ bookings, setNotification }: { bookings: any[], setNotification: (n: any) => void }) {
  
  const handleMarkPaid = async (bookingId: string) => {
    if(!window.confirm('Mark advance as paid?')) return
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        bookingStatus: 'confirmed',
        paymentStatus: 'advance_paid',
        amountPaid: 5000 // Set default advance paid amount
      })
      setNotification({ type: 'success', message: 'Marked advance as paid.' })
    } catch(e) {
      console.error(e)
      setNotification({ type: 'error', message: 'Failed to update payment status.' })
    }
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
      <h2 className="text-2xl font-serif text-cream-100 mb-6">Active Bookings</h2>
      <div className="bg-charcoal-800 border border-white/5 rounded-md overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-charcoal-900/50 text-cream-400 uppercase text-xs">
            <tr>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Event</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {bookings.map(b => (
              <tr key={b.id} className="text-cream-200">
                <td className="p-4">{b.eventDate ? format(new Date(b.eventDate), 'MMM dd, yyyy') : ''}</td>
                <td className="p-4">
                  <div className="font-medium">{b.userName}</div>
                  <div className="text-xs text-cream-400">{b.userPhone}</div>
                </td>
                <td className="p-4">{b.eventType} ({b.guestCount})</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-sm text-[10px] uppercase tracking-wider ${
                    b.bookingStatus === 'awaiting_payment' ? 'bg-yellow-500/10 text-yellow-500' :
                    b.bookingStatus === 'confirmed' ? 'bg-green-500/10 text-green-400' :
                    'bg-white/10 text-cream-200'
                  }`}>
                    {b.bookingStatus.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {b.bookingStatus === 'awaiting_payment' && (
                    <Button variant="outline" size="sm" onClick={() => handleMarkPaid(b.id)}>Mark Adv Paid</Button>
                  )}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-cream-400">No active bookings.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

function PricingManager({ setNotification }: { setNotification: (n: any) => void }) {
  const [tiers, setTiers] = useState<any[]>([])
  
  useEffect(() => {
    getDoc(doc(db, "settings", "pricing")).then(d => {
      if(d.exists()) setTiers(d.data().venueTiers || [])
    })
  }, [])

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
      <h2 className="text-2xl font-serif text-cream-100 mb-6">Pricing Configuration</h2>
      <div className="bg-charcoal-800 border border-white/5 p-6 rounded-md">
        <p className="text-cream-400 mb-6 text-sm">These tiers determine the auto-calculated estimated price shown to customers when booking.</p>
        
        <div className="space-y-3">
          {tiers.map((t, i) => (
            <div key={i} className="flex justify-between items-center bg-charcoal-900 p-4 rounded-sm border border-white/5">
              <div className="text-cream-200 font-medium">{t.minGuests} - {t.maxGuests} Guests</div>
              <div className="text-gold-400">₹{t.price.toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
          <Button variant="outline" onClick={() => setNotification({ type: 'info', message: 'Tiers are read-only in this demo.' })}>Add Tier</Button>
          <Button onClick={() => setNotification({ type: 'info', message: 'Pricing tiers saved (simulated).' })}>Save Changes</Button>
        </div>
      </div>
    </motion.div>
  )
}
