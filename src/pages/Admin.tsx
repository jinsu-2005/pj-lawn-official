import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Image as ImageIcon, IndianRupee, Inbox, LogOut, BarChart3, Bot, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAdminGuard } from '@/hooks/useAdminGuard'
import { db, auth, storage } from '@/lib/firebase'
import { collection, query, onSnapshot, doc, updateDoc, getDoc, setDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { signOut } from 'firebase/auth'
import { format } from 'date-fns'

export default function Admin() {
  const { isAdmin, loading, user } = useAdminGuard()
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'calendar' | 'pricing' | 'gallery' | 'chatbot' | 'admins'>('overview')
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

  if (loading) return (
    <div className="pt-32 min-h-screen bg-charcoal-900 flex justify-center">
      <div className="w-full max-w-6xl px-4 animate-pulse">
        <div className="h-10 bg-charcoal-800 rounded w-1/4 mb-8"></div>
        <div className="flex gap-4 border-b border-white/5 mb-8">
          <div className="h-8 bg-charcoal-800 rounded w-24"></div>
          <div className="h-8 bg-charcoal-800 rounded w-24"></div>
          <div className="h-8 bg-charcoal-800 rounded w-24"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-charcoal-800 rounded-md"></div>)}
        </div>
      </div>
    </div>
  )
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
          <NavButton icon={<BarChart3 size={18}/>} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <NavButton icon={<Inbox size={18}/>} label={`Queue (${pendingBookings.length})`} active={activeTab === 'queue'} onClick={() => setActiveTab('queue')} />
          <NavButton icon={<Calendar size={18}/>} label="Calendar & Active" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
          <NavButton icon={<IndianRupee size={18}/>} label="Pricing Config" active={activeTab === 'pricing'} onClick={() => setActiveTab('pricing')} />
          <NavButton icon={<ImageIcon size={18}/>} label="Gallery Manager" active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} />
          <NavButton icon={<Bot size={18}/>} label="Chatbot AI" active={activeTab === 'chatbot'} onClick={() => setActiveTab('chatbot')} />
          <NavButton icon={<Users size={18}/>} label="Admin Settings" active={activeTab === 'admins'} onClick={() => setActiveTab('admins')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <button onClick={handleSignOut} className="flex items-center gap-3 text-cream-400 hover:text-red-400 text-sm transition-colors w-full p-2">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-10">
        
        {activeTab === 'overview' && (
          <OverviewView bookings={bookings} />
        )}

        {activeTab === 'queue' && (
          <QueueView pendingBookings={pendingBookings} setNotification={setNotification} />
        )}

        {activeTab === 'calendar' && (
          <ActiveBookingsView bookings={activeBookings} setNotification={setNotification} />
        )}

        {activeTab === 'pricing' && (
          <PricingManager setNotification={setNotification} />
        )}

        {activeTab === 'gallery' && (
          <GalleryManager setNotification={setNotification} />
        )}

        {activeTab === 'chatbot' && (
          <ChatbotManager setNotification={setNotification} />
        )}

        {activeTab === 'admins' && (
          <AdminManagerView setNotification={setNotification} currentUserEmail={user?.email || ''} />
        )}
        
      </div>
    </div>
  )
}

function GalleryManager({ setNotification }: { setNotification: (n: any) => void }) {
  const [images, setImages] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "gallery"), (snapshot) => {
      const imgs: any[] = []
      snapshot.forEach(doc => imgs.push({ id: doc.id, ...doc.data() }))
      // Sort by createdAt
      imgs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
      setImages(imgs)
    })
    return () => unsubscribe()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setNotification({ type: 'error', message: 'Please select an image file.' })
      return
    }

    setUploading(true)
    try {
      const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      
      await addDoc(collection(db, "gallery"), {
        url,
        fileName: file.name,
        createdAt: new Date(),
        alt: file.name.split('.')[0]
      })
      
      setNotification({ type: 'success', message: 'Image uploaded successfully.' })
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      console.error(err)
      setNotification({ type: 'error', message: 'Failed to upload image: ' + err.message })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (image: any) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return
    try {
      // Delete from Storage
      const storageRef = ref(storage, `gallery/${image.fileName}`)
      try {
        await deleteObject(storageRef)
      } catch (e) {
        console.warn("Storage object not found, deleting from Firestore anyway.", e)
      }
      // Delete from Firestore
      await deleteDoc(doc(db, "gallery", image.id))
      setNotification({ type: 'success', message: 'Image deleted.' })
    } catch (err: any) {
      console.error(err)
      setNotification({ type: 'error', message: 'Failed to delete image: ' + err.message })
    }
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif text-cream-100">Gallery Manager</h2>
        <div>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleUpload}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(img => (
          <div key={img.id} className="relative group bg-charcoal-800 rounded-md overflow-hidden border border-white/5 aspect-square">
            <img src={img.url} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button variant="outline" size="sm" onClick={() => handleDelete(img)} className="text-red-400 hover:bg-red-500 hover:text-white border-red-500/50">
                Delete
              </Button>
            </div>
          </div>
        ))}
        {images.length === 0 && !uploading && (
          <div className="col-span-full py-12 text-center text-cream-400 bg-charcoal-800 border border-white/5 rounded-md">
            No images in the gallery. Upload one to get started.
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ChatbotManager({ setNotification }: { setNotification: (n: any) => void }) {
  const [prompt, setPrompt] = useState('')
  const [businessData, setBusinessData] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'chatbot')
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          setPrompt(snap.data().systemPrompt || '')
          setBusinessData(snap.data().businessData || '')
        } else {
          // Fallback to default if not seeded yet
          setPrompt(`You are the official AI assistant for PJ Lawn, a premium open-air event venue located in Nagercoil, Tamil Nadu.\nYour tone should be polite, welcoming, professional, and helpful. You answer questions concisely. If the user asks about booking, guide them to use the "Book Venue" page on the website.\nDo not make up any facts or pricing that are not explicitly provided in the business context.`)
          setBusinessData(`- Name: PJ Lawn\n- Location: Nagercoil, Kanyakumari District, Tamil Nadu, India.\n- Type: Premium Open-Air Event Venue\n- Best suited for: Weddings, Receptions, Corporate Events, Birthday Parties, and Family Gatherings.\n- Capacity: Hosts up to 1000+ guests.\n- Amenities: Spacious lawn, ample parking, premium lighting, dedicated dining area, modern restroom facilities.\n- Contact: Users can reach out via the Contact Form on the website or email directly.\n- Pricing: Pricing is dynamic based on the season and event size. Advise users to submit a booking inquiry for an exact quote.`)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'chatbot'), {
        systemPrompt: prompt,
        businessData: businessData,
        updatedAt: new Date()
      }, { merge: true })
      setNotification({ type: 'success', message: 'Chatbot settings saved successfully.' })
    } catch (err: any) {
      console.error(err)
      setNotification({ type: 'error', message: 'Failed to save settings: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-cream-400">Loading settings...</div>

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-charcoal-800/80 p-6 rounded-2xl border border-white/5 backdrop-blur">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-pulse"></span>
            <h2 className="text-2xl font-serif text-cream-100">Chatbot AI Configuration</h2>
          </div>
          <p className="text-sm text-cream-400">Configure real-time prompt guidelines, venue facts, and contact responses for the AI assistant.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="shadow-lg shadow-gold-500/10">
          {saving ? 'Saving Changes...' : 'Save Settings'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* System Prompt Box */}
        <div className="bg-charcoal-800/90 p-6 rounded-2xl border border-white/10 shadow-xl space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-semibold text-gold-400">System Prompt (AI Personality & Rules)</label>
              <p className="text-xs text-cream-400 mt-0.5">Defines the tone, language boundaries, and strict behavioral instructions.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-cream-300 font-mono">
              {prompt.length} chars
            </span>
          </div>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-44 bg-charcoal-900 border border-white/15 rounded-xl p-4 text-cream-100 font-mono text-xs sm:text-sm leading-relaxed focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 focus:outline-none custom-scrollbar transition-all"
            placeholder="You are the official AI assistant for PJ Lawn..."
          />
        </div>

        {/* Business Context Box */}
        <div className="bg-charcoal-800/90 p-6 rounded-2xl border border-white/10 shadow-xl space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-semibold text-gold-400">Business Data (Context, FAQs & Facts)</label>
              <p className="text-xs text-cream-400 mt-0.5">Comprehensive facts referenced by the AI (pricing estimates, timings, location, WhatsApp, policies).</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-cream-300 font-mono">
              {businessData.length} chars
            </span>
          </div>
          <textarea 
            value={businessData}
            onChange={(e) => setBusinessData(e.target.value)}
            className="w-full h-80 bg-charcoal-900 border border-white/15 rounded-xl p-4 text-cream-100 font-mono text-xs sm:text-sm leading-relaxed focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 focus:outline-none custom-scrollbar transition-all"
            placeholder="VENUE FACTS:&#10;- Location: Nagercoil&#10;- Phone: 9489724975&#10;- WhatsApp: +91 9489724975..."
          />
        </div>
      </div>
    </motion.div>
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
  const [rejectingBooking, setRejectingBooking] = useState<any | null>(null)
  const [customTotal, setCustomTotal] = useState<string>('')
  const [customAdvance, setCustomAdvance] = useState<string>('5000')
  const [rejectionReason, setRejectionReason] = useState<string>('')

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

      // Send Resend approval email to customer
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
        } catch (emailErr) {
          console.error("Failed to send approval email via Resend:", emailErr)
        }
      }
      
      setNotification({ type: 'success', message: 'Booking approved! Customer notified by email.' })
      setApprovingBooking(null)
    } catch(e) {
      console.error(e)
      setNotification({ type: 'error', message: 'Failed to approve booking' })
    }
  }

  const startRejection = (booking: any) => {
    setRejectingBooking(booking)
    setRejectionReason('')
  }

  const submitRejection = async () => {
    if (!rejectingBooking) return
    try {
      await updateDoc(doc(db, "bookings", rejectingBooking.id), {
        bookingStatus: 'rejected',
        rejectionReason: rejectionReason,
        updatedAt: new Date()
      })
      setNotification({ type: 'success', message: 'Booking rejected.' })
      setRejectingBooking(null)
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
                  <Button variant="outline" className="flex-1 md:flex-none border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => startRejection(b)}>Reject</Button>
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
              <div className="flex gap-4 mt-8">
                <Button variant="outline" className="w-full" onClick={() => setApprovingBooking(null)}>Cancel</Button>
                <Button className="w-full" onClick={handleApprove}>Confirm Approval</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-charcoal-800 border border-white/10 p-8 rounded-lg max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-xl font-serif text-cream-100 mb-4">Reject Booking</h3>
            <p className="text-sm text-cream-400 mb-6">
              Please provide a reason for rejecting the booking on <strong>{rejectingBooking.eventDate ? format(new Date(rejectingBooking.eventDate), 'MMMM do, yyyy') : 'TBD'}</strong>. This will be shown to the customer.
            </p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-400 mb-2">Rejection Reason</label>
                <textarea 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Venue is under maintenance on this date."
                  className="w-full bg-charcoal-900 border border-white/10 rounded-md px-4 py-3 text-cream-200 focus:outline-none focus:border-red-500 h-24 resize-none"
                />
              </div>
              <div className="flex gap-4 mt-8">
                <Button variant="outline" className="w-full" onClick={() => setRejectingBooking(null)}>Cancel</Button>
                <Button className="w-full bg-red-600 hover:bg-red-500 text-white border-none" onClick={submitRejection}>Confirm Rejection</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function ActiveBookingsView({ bookings, setNotification }: { bookings: any[], setNotification: (n: any) => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmMarkPaidId, setConfirmMarkPaidId] = useState<string | null>(null)
  const [dateToBlock, setDateToBlock] = useState('')

  const handleBlockDate = async () => {
    if (!dateToBlock) return
    try {
      await setDoc(doc(db, "availability", dateToBlock), { status: 'blocked', reason: 'manual' })
      setNotification({ type: 'success', message: `Date ${dateToBlock} blocked successfully.` })
      setDateToBlock('')
    } catch(e) {
      setNotification({ type: 'error', message: 'Failed to block date.' })
    }
  }

  const handleUnblockDate = async () => {
    if (!dateToBlock) return
    try {
      await deleteDoc(doc(db, "availability", dateToBlock))
      setNotification({ type: 'success', message: `Date ${dateToBlock} unblocked successfully.` })
      setDateToBlock('')
    } catch(e) {
      setNotification({ type: 'error', message: 'Failed to unblock date.' })
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === bookings.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(bookings.map(b => b.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleBulkExportCSV = () => {
    if (selectedIds.length === 0) return;
    
    const selectedBookings = bookings.filter(b => selectedIds.includes(b.id));
    const headers = ["Booking ID", "Date", "Customer Name", "Phone", "Event Type", "Guests", "Status", "Total Amount", "Paid Amount"];
    
    const rows = selectedBookings.map(b => [
      b.id,
      b.eventDate ? format(new Date(b.eventDate), 'yyyy-MM-dd') : 'TBD',
      `"${b.userName || ''}"`,
      b.userPhone || '',
      b.eventType || '',
      b.guestCount || 0,
      b.bookingStatus || '',
      b.totalAmount || b.estimatedAmount || 0,
      b.amountPaid || 0
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bookings_export_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotification({ type: 'success', message: 'CSV exported successfully.' })
  }

  const handleMarkPaid = async (bookingId: string) => {
    setConfirmMarkPaidId(null)
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

      {/* Manual Date Blocking */}
      <div className="bg-charcoal-800 border border-white/5 p-4 rounded-md mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shadow-lg">
        <div>
          <h3 className="text-lg font-serif text-cream-100">Manage Availability</h3>
          <p className="text-xs text-cream-400">Manually block or unblock specific dates.</p>
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <input 
            type="date" 
            value={dateToBlock}
            onChange={e => setDateToBlock(e.target.value)}
            className="flex-1 sm:w-auto bg-charcoal-900 border border-white/10 rounded-md px-3 py-1.5 text-cream-200 text-sm focus:outline-none focus:border-gold-500" 
          />
          <Button size="sm" onClick={handleBlockDate} className="bg-red-500 hover:bg-red-400 text-white border-none shrink-0">Block</Button>
          <Button size="sm" variant="outline" onClick={handleUnblockDate} className="shrink-0">Unblock</Button>
        </div>
      </div>

      {confirmMarkPaidId && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-charcoal-800 border border-white/10 rounded-md p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-serif text-cream-100 mb-2">Confirm Payment</h3>
            <p className="text-sm text-cream-400 mb-6">
              Are you sure you want to mark the advance as paid for this booking? This will officially confirm their event.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmMarkPaidId(null)}>Cancel</Button>
              <Button onClick={() => handleMarkPaid(confirmMarkPaidId)}>Confirm Paid</Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Layout (< 768px) */}
      <div className="md:hidden space-y-4">
        {bookings.map(b => (
          <div key={b.id} className="bg-charcoal-800 border border-white/5 p-4 rounded-md shadow-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-medium text-cream-200">{b.eventDate ? format(new Date(b.eventDate), 'MMM dd, yyyy') : 'TBD'}</p>
                <p className="text-xs text-cream-400 mt-1">{b.userName} &bull; {b.userPhone}</p>
              </div>
              <span className={`px-2 py-1 rounded-sm text-[10px] uppercase tracking-wider whitespace-nowrap ${
                b.bookingStatus === 'awaiting_payment' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                b.bookingStatus === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                'bg-white/10 text-cream-200 border border-white/20'
              }`}>
                {b.bookingStatus.replace('_', ' ')}
              </span>
            </div>
            
            <div className="text-xs text-cream-400 mb-4 bg-charcoal-900/50 p-3 rounded border border-white/5 space-y-2">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Event</span>
                <span className="text-cream-200">{b.eventType} ({b.guestCount} Guests)</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Total: ₹{(b.totalAmount || b.estimatedAmount || 0).toLocaleString()}</span>
                <span className="text-gold-400">Paid: ₹{(b.amountPaid || 0).toLocaleString()}</span>
              </div>
            </div>
            
            {b.bookingStatus === 'awaiting_payment' && (
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setConfirmMarkPaidId(b.id)}>
                Mark Advance as Paid
              </Button>
            )}
          </div>
        ))}
        {bookings.length === 0 && (
          <div className="bg-charcoal-800 p-8 rounded-md text-center border border-white/5 text-cream-400">
            No active bookings.
          </div>
        )}
      </div>

      {/* Desktop Layout (>= 768px) */}
      <div className="hidden md:block">
        {selectedIds.length > 0 && (
          <div className="bg-charcoal-800 border border-white/5 p-4 rounded-md mb-4 flex justify-between items-center">
            <span className="text-sm text-cream-200">{selectedIds.length} selected</span>
            <Button size="sm" variant="outline" onClick={handleBulkExportCSV}>Export to CSV</Button>
          </div>
        )}
        <div className="bg-charcoal-800 border border-white/5 rounded-md overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-charcoal-900/50 text-cream-400 uppercase text-xs">
              <tr>
                <th className="p-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={bookings.length > 0 && selectedIds.length === bookings.length}
                    onChange={toggleSelectAll}
                    className="accent-gold-400 cursor-pointer"
                  />
                </th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Event</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.map(b => (
                <tr key={b.id} className="text-cream-200 hover:bg-charcoal-700/30 transition-colors">
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(b.id)}
                      onChange={() => toggleSelect(b.id)}
                      className="accent-gold-400 cursor-pointer"
                    />
                  </td>
                  <td className="p-4">{b.eventDate ? format(new Date(b.eventDate), 'MMM dd, yyyy') : ''}</td>
                <td className="p-4">
                  <div className="font-medium">{b.userName}</div>
                  <div className="text-xs text-cream-400">{b.userPhone}</div>
                </td>
                <td className="p-4">{b.eventType} ({b.guestCount})</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-sm text-[10px] uppercase tracking-wider border ${
                    b.bookingStatus === 'awaiting_payment' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                    b.bookingStatus === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    'bg-white/10 text-cream-200 border-white/20'
                  }`}>
                    {b.bookingStatus.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {b.bookingStatus === 'awaiting_payment' && (
                    <Button variant="outline" size="sm" onClick={() => setConfirmMarkPaidId(b.id)}>Mark Adv Paid</Button>
                  )}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-cream-400">No active bookings.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </motion.div>
  )
}

function PricingManager({ setNotification }: { setNotification: (n: any) => void }) {
  const [tiers, setTiers] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  
  useEffect(() => {
    getDoc(doc(db, "settings", "pricing")).then(d => {
      if(d.exists()) setTiers(d.data().venueTiers || [])
    })
  }, [])

  const handleAddTier = () => {
    setTiers([...tiers, { minGuests: 0, maxGuests: 0, price: 0 }])
  }

  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, field: string, value: string) => {
    const newTiers = [...tiers]
    newTiers[index][field] = parseInt(value) || 0
    setTiers(newTiers)
  }

  const handleSave = async () => {
    // Validation
    for (const t of tiers) {
      if (t.minGuests >= t.maxGuests) {
        setNotification({ type: 'error', message: 'Min guests must be less than Max guests.' })
        return
      }
      if (t.price <= 0) {
        setNotification({ type: 'error', message: 'Price must be greater than 0.' })
        return
      }
    }
    // Check overlap (simple validation)
    const sorted = [...tiers].sort((a, b) => a.minGuests - b.minGuests)
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].maxGuests >= sorted[i+1].minGuests) {
        setNotification({ type: 'error', message: 'Tier ranges cannot overlap.' })
        return
      }
    }

    setIsSaving(true)
    try {
      await setDoc(doc(db, "settings", "pricing"), { venueTiers: tiers }, { merge: true })
      setNotification({ type: 'success', message: 'Pricing tiers saved successfully.' })
    } catch (e) {
      console.error(e)
      setNotification({ type: 'error', message: 'Failed to save pricing tiers.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
      <h2 className="text-2xl font-serif text-cream-100 mb-6">Pricing Configuration</h2>
      <div className="bg-charcoal-800 border border-white/5 p-6 rounded-md">
        <p className="text-cream-400 mb-6 text-sm">These tiers determine the auto-calculated estimated price shown to customers when booking.</p>
        
        <div className="space-y-4">
          {tiers.map((t, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-4 items-end md:items-center bg-charcoal-900 p-4 rounded-sm border border-white/5">
              <div className="w-full md:w-1/3">
                <label className="block text-xs uppercase tracking-wider text-cream-400 mb-2">Min Guests</label>
                <input 
                  type="number" 
                  value={t.minGuests}
                  onChange={(e) => handleChange(i, 'minGuests', e.target.value)}
                  className="w-full bg-charcoal-800 border border-white/10 rounded-md px-3 py-2 text-cream-200 focus:outline-none focus:border-gold-500"
                />
              </div>
              <div className="w-full md:w-1/3">
                <label className="block text-xs uppercase tracking-wider text-cream-400 mb-2">Max Guests</label>
                <input 
                  type="number" 
                  value={t.maxGuests}
                  onChange={(e) => handleChange(i, 'maxGuests', e.target.value)}
                  className="w-full bg-charcoal-800 border border-white/10 rounded-md px-3 py-2 text-cream-200 focus:outline-none focus:border-gold-500"
                />
              </div>
              <div className="w-full md:w-1/3">
                <label className="block text-xs uppercase tracking-wider text-cream-400 mb-2">Price (₹)</label>
                <input 
                  type="number" 
                  value={t.price}
                  onChange={(e) => handleChange(i, 'price', e.target.value)}
                  className="w-full bg-charcoal-800 border border-white/10 rounded-md px-3 py-2 text-cream-200 focus:outline-none focus:border-gold-500"
                />
              </div>
              <button 
                onClick={() => handleRemoveTier(i)}
                className="text-red-400 hover:text-red-300 md:ml-2 mt-4 md:mt-0 p-2 w-full md:w-auto border border-red-500/20 rounded-md md:border-none md:p-0 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
          {tiers.length === 0 && (
            <p className="text-cream-400 text-sm">No tiers configured.</p>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
          <Button variant="outline" onClick={handleAddTier}>Add Tier</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </motion.div>
  )
}

function OverviewView({ bookings }: { bookings: any[] }) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthBookings = bookings.filter(b => {
    if (!b.eventDate) return false;
    const d = new Date(b.eventDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const revenue = thisMonthBookings.reduce((sum, b) => {
    if (b.bookingStatus === 'confirmed' || b.bookingStatus === 'completed') {
      return sum + (b.totalAmount || b.estimatedAmount || 0);
    }
    return sum;
  }, 0);

  const pendingCount = bookings.filter(b => b.bookingStatus === 'pending_review').length;
  
  const awaitingPaymentCount = bookings.filter(b => b.bookingStatus === 'awaiting_payment').length;

  const upcomingCount = bookings.filter(b => {
    if (!b.eventDate) return false;
    const d = new Date(b.eventDate);
    return d >= new Date(new Date().setHours(0,0,0,0)) && (b.bookingStatus === 'confirmed' || b.bookingStatus === 'awaiting_payment');
  }).length;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
      <h2 className="text-2xl font-serif text-cream-100 mb-6">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-charcoal-800 border border-white/5 p-6 rounded-md shadow-lg">
          <p className="text-sm text-cream-400 uppercase tracking-wider mb-2">Monthly Revenue</p>
          <p className="text-3xl font-serif text-gold-400">₹{revenue.toLocaleString()}</p>
          <p className="text-xs text-cream-400/50 mt-2">Confirmed bookings for this month</p>
        </div>

        <div className="bg-charcoal-800 border border-white/5 p-6 rounded-md shadow-lg">
          <p className="text-sm text-cream-400 uppercase tracking-wider mb-2">Pending Approvals</p>
          <p className="text-3xl font-serif text-blue-400">{pendingCount}</p>
          <p className="text-xs text-cream-400/50 mt-2">Awaiting owner review</p>
        </div>

        <div className="bg-charcoal-800 border border-white/5 p-6 rounded-md shadow-lg">
          <p className="text-sm text-cream-400 uppercase tracking-wider mb-2">Awaiting Payment</p>
          <p className="text-3xl font-serif text-yellow-500">{awaitingPaymentCount}</p>
          <p className="text-xs text-cream-400/50 mt-2">Approved but not paid</p>
        </div>

        <div className="bg-charcoal-800 border border-white/5 p-6 rounded-md shadow-lg">
          <p className="text-sm text-cream-400 uppercase tracking-wider mb-2">Upcoming Events</p>
          <p className="text-3xl font-serif text-green-400">{upcomingCount}</p>
          <p className="text-xs text-cream-400/50 mt-2">Approved & confirmed future events</p>
        </div>
      </div>
    </motion.div>
  )
}

function AdminManagerView({ setNotification, currentUserEmail }: { setNotification: (n: any) => void; currentUserEmail: string }) {
  const [invites, setInvites] = useState<any[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "admin_invites"), (snapshot) => {
      const list: any[] = []
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }))
      list.sort((a, b) => (b.invitedAt?.toMillis() || 0) - (a.invitedAt?.toMillis() || 0))
      setInvites(list)
    })
    return () => unsubscribe()
  }, [])

  const handleAddInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    const emailToInvite = newEmail.toLowerCase().trim()
    if (!emailToInvite) return
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailToInvite)) {
      setNotification({ type: 'error', message: 'Please enter a valid email address.' })
      return
    }

    setSubmitting(true)
    try {
      await setDoc(doc(db, "admin_invites", emailToInvite), {
        email: emailToInvite,
        invitedAt: new Date(),
        invitedBy: currentUserEmail
      })
      setNotification({ type: 'success', message: `${emailToInvite} is now registered as an Admin!` })
      setNewEmail('')
    } catch (err: any) {
      console.error(err)
      setNotification({ type: 'error', message: 'Failed to add admin: ' + err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteInvite = async (email: string) => {
    if (email === currentUserEmail) {
      setNotification({ type: 'error', message: 'You cannot revoke your own admin permissions.' })
      return
    }
    if (!window.confirm(`Are you sure you want to revoke admin permissions for ${email}?`)) return

    try {
      await deleteDoc(doc(db, "admin_invites", email))
      setNotification({ type: 'success', message: `Revoked admin privileges for ${email}.` })
    } catch (err: any) {
      console.error(err)
      setNotification({ type: 'error', message: 'Failed to revoke privileges: ' + err.message })
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif text-cream-50 mb-2">Admin Settings</h2>
        <p className="text-cream-400 text-sm">Add or revoke administrator access for team members. Admins have access to the dashboard and bookings queue.</p>
      </div>

      <div className="bg-charcoal-800 border border-white/5 p-6 rounded-md max-w-xl">
        <h3 className="text-lg font-serif text-cream-100 mb-4">Invite New Administrator</h3>
        <form onSubmit={handleAddInvite} className="flex gap-4">
          <input
            type="email"
            placeholder="Enter Gmail address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 bg-charcoal-900 border border-white/10 rounded-md px-4 py-3 text-cream-200 focus:outline-none focus:border-gold-500/50 text-sm"
            required
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Grant Access'}
          </Button>
        </form>
      </div>

      <div className="bg-charcoal-800 border border-white/5 rounded-md overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-serif text-cream-100">Active Administrators</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gold-400 uppercase tracking-widest bg-charcoal-900/50">
                <th className="p-6 font-medium">Email Address</th>
                <th className="p-6 font-medium">Invited By</th>
                <th className="p-6 font-medium">Invited On</th>
                <th className="p-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-cream-200">
              {/* Fallback Display for Super Admins */}
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-6 font-medium text-cream-50 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  jinsu.j2005@gmail.com
                </td>
                <td className="p-6 text-cream-400">System Setup</td>
                <td className="p-6 text-cream-400">Owner Account</td>
                <td className="p-6 text-right">
                  <span className="text-gold-500 text-xs uppercase tracking-wider font-semibold px-2 py-1">Owner (Root)</span>
                </td>
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="p-6 font-medium text-cream-50 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  jinsukapgreen@gmail.com
                </td>
                <td className="p-6 text-cream-400">System Setup</td>
                <td className="p-6 text-cream-400">Owner Account</td>
                <td className="p-6 text-right">
                  <span className="text-gold-500 text-xs uppercase tracking-wider font-semibold px-2 py-1">Owner (Root)</span>
                </td>
              </tr>

              {/* Dynamic Database Invites */}
              {invites
                .filter(inv => inv.email !== 'jinsu.j2005@gmail.com' && inv.email !== 'jinsukapgreen@gmail.com')
                .map((invite) => (
                  <tr key={invite.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-6 font-medium text-cream-50 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      {invite.email}
                    </td>
                    <td className="p-6 text-cream-400">{invite.invitedBy || 'System Setup'}</td>
                    <td className="p-6 text-cream-400">
                      {invite.invitedAt ? format(invite.invitedAt.toDate(), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => handleDeleteInvite(invite.email)}
                        className="text-red-400 hover:text-red-300 font-medium text-xs uppercase tracking-wider p-2 rounded hover:bg-red-500/10 transition-colors"
                      >
                        Revoke Access
                      </button>
                    </td>
                  </tr>
                ))}
              {invites.filter(inv => inv.email !== 'jinsu.j2005@gmail.com' && inv.email !== 'jinsukapgreen@gmail.com').length === 0 && invites.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-cream-400">
                    No custom administrators found in registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
