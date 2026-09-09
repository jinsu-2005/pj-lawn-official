import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Users, Clock, Info, CheckCircle2, MessageCircle, ChevronLeft, ChevronRight, LogIn, AlertCircle, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { useAuth } from '@/context/AuthContext'
import { checkAndHoldDate, createBooking, getPricingTiers, PricingTier } from '@/lib/bookingService'
import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

const bookingSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  eventType: z.string().min(1, 'Event type is required'),
  timeSlot: z.string(),
  guestCount: z.number().min(10, 'Minimum 10 guests').max(300, 'Maximum 300 guests'),
  notes: z.string().optional()
})

type BookingFormData = z.infer<typeof bookingSchema>

export default function Booking() {
  const { user: currentUser, loginWithGoogle } = useAuth()
  const [step, setStep] = useState(1)
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'info' | 'error' } | null>(null)
  const [shakeCalendar, setShakeCalendar] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([])

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues, trigger } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestCount: 100,
      eventType: 'Birthday Party',
      timeSlot: '5:00 PM – 10:00 PM'
    },
    mode: 'onChange'
  })

  useEffect(() => {
    if (currentUser) {
      const values = getValues()
      if (!values.name && currentUser.displayName) setValue('name', currentUser.displayName)
      if (!values.email && currentUser.email) setValue('email', currentUser.email)
    }
  }, [currentUser, setValue, getValues])

  const watchDate = watch('date')
  const watchGuestCount = watch('guestCount')
  const watchName = watch('name')
  const watchPhone = watch('phone')
  const watchEventType = watch('eventType')

  // Tomorrow's date at 00:00:00 (booking starts after today)
  const tomorrow = new Date()
  tomorrow.setHours(0, 0, 0, 0)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Parse current date string to Date object for DayPicker
  const selectedDateObj = watchDate ? new Date(`${watchDate}T00:00:00`) : undefined;
  
  const showToast = (message: string, type: 'info' | 'error' = 'info') => {
    setToastNotification({ message, type })
  }

  // Toast auto-dismiss timer
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toastNotification])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Form expects string date
      setValue('date', format(date, 'yyyy-MM-dd'), { shouldValidate: true })
      setToastNotification(null)
    }
  }

  useEffect(() => {
    getPricingTiers().then(tiers => {
      setPricingTiers(tiers)
    }).catch(console.error)
  }, [])

  // Sync real-time unavailable dates from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "availability"), (snapshot) => {
      const dates: Date[] = []
      snapshot.forEach(doc => {
        // doc.id is yyyy-MM-dd format
        dates.push(new Date(`${doc.id}T00:00:00`))
      })
      setUnavailableDates(dates)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (pricingTiers.length > 0 && watchGuestCount) {
      const tier = pricingTiers.find(t => watchGuestCount >= t.minGuests && watchGuestCount <= t.maxGuests)
      if (tier) {
        setEstimatedPrice(tier.price)
      } else if (watchGuestCount > pricingTiers[pricingTiers.length - 1].maxGuests) {
        setEstimatedPrice(pricingTiers[pricingTiers.length - 1].price) // roughly
      } else {
        setEstimatedPrice(pricingTiers[0].price)
      }
    }
  }, [watchGuestCount, pricingTiers])

  const handleNextStep = async () => {
    setToastNotification(null)
    if (step === 1) {
      if (!watchDate) {
        showToast('Please select a date', 'info')
        setShakeCalendar(true)
        setTimeout(() => setShakeCalendar(false), 500)
        if (calendarRef.current) {
          calendarRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        return
      }
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (step === 2) {
      const isValid = await trigger(['name', 'phone', 'eventType', 'guestCount'])
      if (!isValid || !watchName || !watchPhone) {
        // Form field errors are cleanly displayed directly under each invalid input
        const firstErrorEl = document.querySelector('input[name="name"], input[name="phone"]') as HTMLElement | null
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
          firstErrorEl.focus()
        }
        return
      }
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const navigateToStep = (targetStep: number) => {
    setToastNotification(null)
    if (targetStep === 1) {
      setStep(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (targetStep === 2) {
      if (!watchDate) {
        showToast('Please select a date', 'info')
        setShakeCalendar(true)
        setTimeout(() => setShakeCalendar(false), 500)
        if (calendarRef.current) {
          calendarRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        return
      }
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (targetStep === 3) {
      if (!watchDate) {
        showToast('Please select a date', 'info')
        setShakeCalendar(true)
        setTimeout(() => setShakeCalendar(false), 500)
        if (calendarRef.current) {
          calendarRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        return
      }
      if (!watchName || !watchPhone) {
        setStep(2)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        trigger(['name', 'phone'])
        return
      }
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const onSubmit = async (data: BookingFormData) => {
    setToastNotification(null)
    setIsSubmitting(true)
    try {
      // 1. Authenticate User (Google Sign-In)
      let user = currentUser
      if (!user) {
        user = await loginWithGoogle()
        if (!user) {
          throw new Error("Authentication failed. Please sign in to submit.")
        }
      }

      // 2. Transaction to check and hold date
      const isHeld = await checkAndHoldDate(data.date, user.uid)
      if (!isHeld) {
        throw new Error("Date is no longer available. Please select another date.")
      }

      // 3. Create Booking Document
      const bookingData = {
        userId: user.uid,
        userName: data.name,
        userEmail: data.email || user.email || '',
        userPhone: data.phone,
        eventType: data.eventType,
        timeSlot: data.timeSlot || '5:00 PM – 10:00 PM',
        eventDate: data.date,
        guestCount: data.guestCount,
        notes: data.notes || '',
        estimatedAmount: estimatedPrice || 0
      }

      const bookingId = await createBooking(bookingData)

      // 4. Send Resend transactional email notifications (Customer + Admin)
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'booking_request',
            data: {
              bookingId,
              customerName: data.name,
              customerPhone: data.phone,
              customerEmail: data.email || user.email || '',
              eventDate: data.date,
              eventType: data.eventType,
              timeSlot: data.timeSlot || '5:00 PM – 10:00 PM',
              guestCount: data.guestCount,
              notes: data.notes || '',
              estimatedPrice: estimatedPrice || 15000
            }
          })
        })
      } catch (emailErr) {
        console.error("Resend booking email error:", emailErr)
      }

      setStep(4)
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Booking failed. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`min-h-screen bg-charcoal-900 md:bg-transparent relative overflow-hidden ${step === 4 ? 'pt-20 sm:pt-24 pb-8' : 'pt-32 pb-24'}`}>
      {/* Mobile-Only Ambient Sparkles: Just a few subtle delicate accents around the page */}
      <div className="md:hidden pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
        {/* Sparkle 1: Top Left */}
        <div 
          className="absolute top-24 left-4 text-gold-400/40 sparkle-twinkle" 
          style={{ animationDuration: '3s' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>

        {/* Sparkle 2: Top Right */}
        <div 
          className="absolute top-36 right-5 text-gold-300/35 sparkle-float" 
          style={{ animationDuration: '4.5s', animationDelay: '0.8s' }}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>

        {/* Sparkle 3: Mid Left */}
        <div 
          className="absolute top-[45%] left-3 text-gold-400/30 sparkle-twinkle" 
          style={{ animationDuration: '3.6s', animationDelay: '1.5s' }}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>

        {/* Sparkle 4: Mid Right */}
        <div 
          className="absolute top-[65%] right-4 text-gold-300/35 sparkle-float" 
          style={{ animationDuration: '5s', animationDelay: '0.5s' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>

        {/* Sparkle 5: Bottom Left */}
        <div 
          className="absolute bottom-28 left-6 text-gold-400/30 sparkle-twinkle" 
          style={{ animationDuration: '4.2s', animationDelay: '2s' }}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>
      </div>

      {/* Sleek Floating Toast Notification - Non-intrusive luxury pill */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9999] shadow-2xl rounded-full px-4 py-2 sm:px-5 sm:py-2.5 flex items-center gap-2 backdrop-blur-md max-w-[92vw] sm:max-w-md border whitespace-nowrap ${
              toastNotification.type === 'error'
                ? 'bg-charcoal-900/95 border-red-500/50 text-red-200'
                : 'bg-charcoal-900/95 border-gold-400/50 text-cream-100'
            }`}
            style={{
              boxShadow: toastNotification.type === 'error' 
                ? '0 10px 25px -5px rgba(239, 68, 68, 0.3), 0 0 15px rgba(0, 0, 0, 0.8)'
                : '0 10px 25px -5px rgba(212, 175, 55, 0.25), 0 0 15px rgba(0, 0, 0, 0.8)'
            }}
          >
            {toastNotification.type === 'error' ? (
              <AlertCircle size={15} className="text-red-400 shrink-0" />
            ) : (
              <Calendar size={15} className="text-gold-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium tracking-wide">
              {toastNotification.message}
            </span>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="p-0.5 text-cream-400 hover:text-cream-100 ml-1 rounded-full cursor-pointer"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {step < 4 && (
        <section className="container mx-auto px-4 mb-12 text-center max-w-3xl">
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-gold-400 uppercase text-xs tracking-widest font-medium mb-4"
          >
            Secure Your Date
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-display-md font-serif text-cream-50"
          >
            Book Your Event
          </motion.h1>
        </section>
      )}

      <section className={`container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl ${step === 4 ? 'mt-2 sm:mt-4' : ''}`}>
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          <div className={`lg:col-span-8 bg-charcoal-800 border border-white/5 rounded-md ${step === 4 ? 'p-5 sm:p-6 lg:p-7' : 'p-6 sm:p-10'}`}>
            
            {step < 4 && (
              <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-6">
                <button 
                  type="button"
                  onClick={() => navigateToStep(1)}
                  className={`flex items-center gap-2 text-left focus:outline-none transition-opacity ${step >= 1 ? 'text-gold-400' : 'text-cream-400/50'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step >= 1 ? 'bg-gold-500 text-charcoal-900' : 'bg-charcoal-700 text-cream-400/50'}`}>1</div>
                  <span className="text-sm font-medium hidden sm:inline">Select Date</span>
                </button>
                <div className="h-px bg-white/5 flex-1 mx-4" />
                <button 
                  type="button"
                  disabled={!watchDate}
                  onClick={() => navigateToStep(2)}
                  className={`flex items-center gap-2 text-left focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${step >= 2 ? 'text-gold-400' : 'text-cream-400/50'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step >= 2 ? 'bg-gold-500 text-charcoal-900' : 'bg-charcoal-700 text-cream-400/50'}`}>2</div>
                  <span className="text-sm font-medium hidden sm:inline">Event Details</span>
                </button>
                <div className="h-px bg-white/5 flex-1 mx-4" />
                <button 
                  type="button"
                  disabled={!watchDate || !watchName || !watchPhone}
                  onClick={() => navigateToStep(3)}
                  className={`flex items-center gap-2 text-left focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${step >= 3 ? 'text-gold-400' : 'text-cream-400/50'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step >= 3 ? 'bg-gold-500 text-charcoal-900' : 'bg-charcoal-700 text-cream-400/50'}`}>3</div>
                  <span className="text-sm font-medium hidden sm:inline">Review & Submit</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Date */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {!currentUser && (
                    <div className="mb-6 p-3.5 sm:p-4 bg-charcoal-850/90 border border-gold-500/25 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-cream-100">Already have an account?</p>
                        <p className="text-[11px] sm:text-xs text-cream-400 mt-0.5 leading-snug">Sign in to autofill details and track your booking.</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => loginWithGoogle()} 
                        className="shrink-0 px-4 py-2.5 sm:py-2 text-xs font-black tracking-wider rounded-xl whitespace-nowrap bg-gold-400 text-black hover:bg-gold-300 transition-all flex items-center gap-1.5 shadow-md shadow-gold-400/20 active:scale-95 cursor-pointer font-sans"
                      >
                        <LogIn size={14} className="text-black" />
                        <span className="text-black font-black">Sign In</span>
                      </button>
                    </div>
                  )}

                  <h2 className="text-xl font-serif text-cream-100 mb-6">When is your event?</h2>
                  
                  <motion.div 
                    ref={calendarRef}
                    animate={shakeCalendar ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    className={`bg-charcoal-900 border rounded-2xl mb-8 flex flex-col items-center justify-center p-3 sm:p-6 shadow-2xl overflow-hidden w-full max-w-md mx-auto transition-all duration-300 ${shakeCalendar ? 'border-red-500 ring-2 ring-red-500/50 shadow-red-950/50' : 'border-white/10'}`}
                  >
                    <style>{`
                      .rdp-root {
                        --rdp-accent-color: #D4AF37;
                        --rdp-accent-background-color: rgba(212, 175, 55, 0.15);
                        --rdp-day-height: 40px;
                        --rdp-day-width: 40px;
                        --rdp-day_button-height: 38px;
                        --rdp-day_button-width: 38px;
                        --rdp-day_button-border-radius: 9999px;
                        color: #ede5d0;
                        margin: 0 auto;
                        position: relative;
                        width: 100%;
                        max-width: 320px;
                      }
                      @media (min-width: 640px) {
                        .rdp-root {
                          --rdp-day-height: 44px;
                          --rdp-day-width: 44px;
                          --rdp-day_button-height: 42px;
                          --rdp-day_button-width: 42px;
                          max-width: 350px;
                        }
                      }

                      /* Caption & Header */
                      .rdp-month_caption, .rdp-caption {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: 0.25rem 0 1rem 0;
                        font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                        font-variant-numeric: lining-nums tabular-nums !important;
                        font-size: 1.15rem;
                        font-weight: 700;
                        letter-spacing: -0.01em;
                        color: #FFFFFF !important;
                        position: relative;
                      }

                      /* Nav Arrows */
                      .rdp-nav {
                        position: absolute;
                        top: 0.25rem;
                        left: 0;
                        right: 0;
                        display: flex;
                        justify-content: space-between;
                        pointer-events: none;
                        z-index: 10;
                      }
                      .rdp-button_next, .rdp-button_previous, .rdp-nav_button {
                        pointer-events: auto;
                        width: 32px;
                        height: 32px;
                        border-radius: 9999px;
                        background: rgba(255, 255, 255, 0.08) !important;
                        border: 1px solid rgba(212, 175, 55, 0.35) !important;
                        color: #D4AF37 !important;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.2s ease;
                      }
                      .rdp-button_next:hover, .rdp-button_previous:hover, .rdp-nav_button:hover {
                        background: #D4AF37 !important;
                        color: #000000 !important;
                      }

                      /* Table Grid */
                      .rdp-month_grid, .rdp-table {
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 2px 4px;
                        margin: 0 auto;
                      }
                      @media (min-width: 640px) {
                        .rdp-month_grid, .rdp-table {
                          border-spacing: 4px 6px;
                        }
                      }

                      .rdp-weekdays, .rdp-head_row {
                        display: table-row;
                      }
                      .rdp-weekday, .rdp-head_cell, th.rdp-weekday {
                        display: table-cell;
                        text-align: center;
                        color: #FFF0A0 !important;
                        font-size: 0.78rem;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.06em;
                        padding-bottom: 10px;
                        opacity: 1 !important;
                      }
                      .rdp-week, .rdp-row {
                        display: table-row;
                      }
                      .rdp-day, .rdp-cell {
                        display: table-cell;
                        text-align: center;
                        vertical-align: middle;
                        padding: 0;
                      }

                      /* Day Buttons base */
                      .rdp-day_button {
                        border-radius: 9999px !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        margin: 0 auto !important;
                        font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                        font-variant-numeric: lining-nums tabular-nums !important;
                        transition: all 0.15s ease-in-out !important;
                        cursor: pointer;
                      }

                      /* 1. AVAILABLE DATES: Bright Bold White + Rounded Transparent Green */
                      .rdp-day:not(.rdp-disabled):not(.rdp-outside):not(.rdp-selected) .rdp-day_button,
                      .rdp-day:not([disabled]):not(.rdp-selected):not(.rdp-outside) .rdp-day_button {
                        color: #FFFFFF !important;
                        font-weight: 800 !important;
                        background: rgba(34, 197, 94, 0.16) !important;
                        background-color: rgba(34, 197, 94, 0.16) !important;
                        border: 1.5px solid rgba(34, 197, 94, 0.55) !important;
                        box-shadow: 0 0 8px rgba(34, 197, 94, 0.12) !important;
                      }
                      .rdp-day:not(.rdp-disabled):not(.rdp-outside):not(.rdp-selected) .rdp-day_button:hover {
                        background: rgba(34, 197, 94, 0.35) !important;
                        background-color: rgba(34, 197, 94, 0.35) !important;
                        border-color: #22c55e !important;
                        transform: scale(1.08);
                      }

                      /* 2. SELECTED DATE: Rounded Solid Gold */
                      .rdp-day.rdp-selected .rdp-day_button,
                      .rdp-selected .rdp-day_button,
                      .rdp-day_button[aria-selected="true"],
                      .rdp-day[aria-selected="true"] .rdp-day_button,
                      .rdp-day_button.rdp-selected {
                        color: #000000 !important;
                        background: #D4AF37 !important;
                        background-color: #D4AF37 !important;
                        border: 2px solid #FFF8DC !important;
                        font-weight: 900 !important;
                        box-shadow: 0 0 18px rgba(212, 175, 55, 0.7) !important;
                        transform: scale(1.08) !important;
                      }

                      /* 3. UNAVAILABLE / DISABLED / PAST DATES: Grayscale with line-through */
                      .rdp-day.rdp-disabled .rdp-day_button,
                      .rdp-disabled .rdp-day_button,
                      .rdp-day_button:disabled,
                      .rdp-day_button[aria-disabled="true"],
                      .rdp-day[aria-disabled="true"] .rdp-day_button {
                        opacity: 0.3 !important;
                        color: #6b7280 !important;
                        cursor: not-allowed !important;
                        background: transparent !important;
                        background-color: transparent !important;
                        border: 1px solid transparent !important;
                        text-decoration: line-through !important;
                        box-shadow: none !important;
                        transform: none !important;
                      }

                      .rdp-outside {
                        opacity: 0.15 !important;
                      }
                    `}</style>
                    <DayPicker 
                      mode="single"
                      selected={selectedDateObj}
                      onSelect={handleDateSelect}
                      startMonth={new Date()}
                      disabled={[{ before: tomorrow }, ...unavailableDates]}
                      className="p-1 sm:p-3"
                    />
                    
                    <div className="flex flex-wrap gap-4 mt-3 pt-4 border-t border-white/10 w-full justify-center text-xs text-cream-300">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        </div>
                        <span className="font-semibold text-cream-100">Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-gold-400 border border-gold-300"></div>
                        <span className="font-semibold text-gold-300">Selected</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[9px] text-cream-400/50">✕</div>
                        <span className="text-cream-400/60 line-through">Unavailable</span>
                      </div>
                    </div>

                    {/* Hidden input to satisfy form validation */}
                    <input type="hidden" {...register('date')} />
                    {errors.date && <p className="text-red-400 text-sm mt-2">{errors.date.message}</p>}
                  </motion.div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
                    <a
                      href={`https://wa.me/919489724975?text=${encodeURIComponent(
                        watchDate 
                          ? `Hi PJ Lawn! I am checking date availability for ${format(new Date(watchDate), 'MMMM do, yyyy')}. Could you assist with booking details?`
                          : `Hi PJ Lawn! I am looking to book your lawn for an event and would like to check available dates.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto h-12 px-5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <MessageCircle size={15} /> Inquire via WhatsApp
                    </a>
                    <Button 
                      type="button" 
                      onClick={handleNextStep} 
                      className={`w-full sm:w-auto h-12 px-7 rounded-xl text-xs sm:text-sm font-black tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        !watchDate 
                          ? 'bg-charcoal-700 hover:bg-charcoal-600 text-cream-300 border border-white/10' 
                          : 'bg-gold-500 hover:bg-gold-400 text-charcoal-900 shadow-lg shadow-gold-500/20'
                      }`}
                    >
                      <span>Continue</span>
                      <ChevronRight size={16} />
                    </Button>
                  </div>

                  {/* Subtle guidance text beneath buttons */}
                  <p className="text-center text-xs text-cream-400/70 mt-3 flex items-center justify-center gap-1.5">
                    {watchDate ? (
                      <span className="text-gold-400 font-medium flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-gold-400" /> Selected: {format(new Date(watchDate), 'EEEE, MMMM do, yyyy')}
                      </span>
                    ) : (
                      <span>Tap an available date to continue</span>
                    )}
                  </p>
                </motion.div>
              )}

              {/* Step 2: Event Details */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-serif text-cream-100 mb-6">Tell us about your event</h2>
                  
                  <div className="space-y-6 mb-8">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-cream-400 font-medium">Full Name <span className="text-red-400">*</span></label>
                        <input 
                          type="text" 
                          {...register('name')} 
                          placeholder="Your full name"
                          className={`w-full bg-charcoal-900 border rounded-xl px-4 py-3 text-cream-200 transition-colors ${errors.name ? 'border-red-500 ring-1 ring-red-500/50' : 'border-white/10 focus:border-gold-400/50'}`} 
                        />
                        {errors.name && <p className="text-red-400 text-xs flex items-center gap-1 font-medium"><AlertCircle size={12} /> {errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-cream-400 font-medium">Phone Number <span className="text-red-400">*</span></label>
                        <input 
                          type="tel" 
                          {...register('phone')} 
                          placeholder="10-digit mobile number"
                          className={`w-full bg-charcoal-900 border rounded-xl px-4 py-3 text-cream-200 transition-colors ${errors.phone ? 'border-red-500 ring-1 ring-red-500/50' : 'border-white/10 focus:border-gold-400/50'}`} 
                        />
                        {errors.phone && <p className="text-red-400 text-xs flex items-center gap-1 font-medium"><AlertCircle size={12} /> {errors.phone.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-cream-400 font-medium">Email Address (Optional)</label>
                      <input type="email" {...register('email')} placeholder="you@example.com" className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-4 py-3 text-cream-200" />
                      {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
                    </div>
                    
                    <input type="hidden" {...register('timeSlot')} value="5:00 PM – 10:00 PM" />
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-cream-400 font-medium">Event Type</label>
                        <select {...register('eventType')} className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-4 py-3 text-cream-200 text-sm appearance-none focus:outline-none focus:border-gold-400/50">
                          <option value="Birthday Party">Birthday Party</option>
                          <option value="Anniversary">Anniversary</option>
                          <option value="Family Function">Family Function</option>
                          <option value="Wedding Reception">Wedding Reception</option>
                          <option value="Engagement Party">Engagement Party</option>
                          <option value="Baby Shower">Baby Shower</option>
                          <option value="Get-Together">Family/Friends Get-Together</option>
                          <option value="Dinner Function">Dinner Function</option>
                          <option value="Photo/Video Shoot">Photo / Video Shoot</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-cream-400 font-medium">Estimated Guests</label>
                        <input type="number" {...register('guestCount', { valueAsNumber: true })} className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-4 py-3 text-cream-200 text-sm focus:outline-none focus:border-gold-400/50" />
                        {errors.guestCount && <p className="text-red-400 text-xs">{errors.guestCount.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-cream-400 font-medium">Additional Notes (Optional)</label>
                      <textarea {...register('notes')} rows={3} placeholder="Any specific requirements or timings..." className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-4 py-3 text-cream-200 resize-none"></textarea>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => { setToastNotification(null); setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="h-12 px-5 rounded-xl text-xs sm:text-sm font-bold tracking-wider flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <ChevronLeft size={16} />
                      <span>Back</span>
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleNextStep}
                      className="flex-1 h-12 px-4 rounded-xl text-xs sm:text-sm font-black tracking-wider flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <span>Continue</span>
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review & Submit */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                  <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Info className="text-gold-400 w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-serif text-cream-100 mb-3">Confirm Booking Request</h2>
                  <p className="text-cream-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                    {watchDate ? `Selected date: ${format(new Date(watchDate), 'MMMM do, yyyy')}.` : ''} 
                    {currentUser 
                      ? ' Review your details and submit below.' 
                      : ' Sign in with Google to submit and secure your date.'}
                  </p>

                  <div className="flex flex-col-reverse sm:flex-row justify-center gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full sm:w-auto h-12 px-6 rounded-xl text-xs sm:text-sm font-bold tracking-wider flex items-center justify-center gap-1.5" 
                      onClick={() => { setToastNotification(null); setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      <ChevronLeft size={16} />
                      <span>Back</span>
                    </Button>
                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto h-12 px-8 rounded-xl text-xs sm:text-sm font-black tracking-wider flex items-center justify-center gap-2" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : currentUser ? 'Submit Booking Request' : 'Continue with Google to Book'}
                    </Button>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center">
                    <p className="text-xs text-cream-400 mb-2">Want to skip forms and discuss on WhatsApp directly?</p>
                    <a
                      href={`https://wa.me/919489724975?text=${encodeURIComponent(
                        `Hi PJ Lawn! I would like to inquire about booking for ${watchDate ? format(new Date(watchDate), 'MMMM do, yyyy') : 'an upcoming date'} for a ${watchEventType || 'function'} (5:00 PM – 10:00 PM, approx ${watchGuestCount || 100} guests). Name: ${watchName || 'Guest'}, Phone: ${watchPhone || ''}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1.5 font-bold transition-colors"
                    >
                      <MessageCircle size={14} /> Send Booking Inquiry via WhatsApp &rarr;
                    </a>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Success Confirmation */}
              {step === 4 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="flex flex-col text-left py-1"
                >
                  {/* 1. Header (Always first) */}
                  <div className="order-1 text-center mb-5 sm:mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-500/25 shadow-lg shadow-green-500/10">
                      <CheckCircle2 className="text-green-400 w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif text-cream-100 mb-1.5">Request Received!</h2>
                    <p className="text-cream-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                      Thank you, <span className="text-cream-100 font-semibold">{watchName}</span>. Your booking request for <span className="text-cream-100 font-semibold">{watchDate ? format(new Date(watchDate), 'MMMM do, yyyy') : ''}</span> has been submitted successfully.
                    </p>
                  </div>

                  {/* 2. Track Booking Button (order-2 on mobile, order-4 on desktop) */}
                  <div className="order-2 lg:order-4 text-center mb-4 lg:mb-0 lg:pt-1">
                    <Button 
                      to="/dashboard" 
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 shadow-xl shadow-gold-500/10 hover:shadow-gold-500/25"
                    >
                      <span>Track Booking</span>
                      <ArrowRight size={16} />
                    </Button>
                  </div>

                  {/* 3. Want Instant Review? (order-3 on mobile, order-3 on desktop) */}
                  <div className="order-3 lg:order-3 mb-4 p-4 sm:p-5 bg-gold-500/5 border border-gold-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-lg">
                    <div className="text-center sm:text-left">
                      <h4 className="text-gold-400 text-sm font-bold mb-0.5">Want Instant Review?</h4>
                      <p className="text-cream-300 text-xs">Call or message on WhatsApp to bypass the review wait and lock your date now.</p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-center">
                      <a 
                        href="tel:+919489724975" 
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold-400 hover:bg-gold-300 text-black !text-black text-xs font-black uppercase tracking-wider rounded-full shadow-md active:scale-95 transition-all"
                      >
                        📞 Call
                      </a>
                      <a 
                        href={`https://wa.me/919489724975?text=${encodeURIComponent(
                          `Hi PJ Lawn, I just submitted a booking request for ${watchDate ? format(new Date(watchDate), 'MMMM do, yyyy') : 'my event'} (${watchEventType}, 5:00 PM – 10:00 PM). Name: ${watchName}. Please review my request!`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-400 text-black !text-black text-xs font-black uppercase tracking-wider rounded-full shadow-md active:scale-95 transition-all"
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* 4. What happens next? (order-4 on mobile, order-2 on desktop) */}
                  <div className="order-4 lg:order-2 bg-charcoal-900/90 border border-white/5 rounded-xl p-4 sm:p-5 mb-4 shadow-inner">
                    <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gold-400 mb-3 border-b border-white/5 pb-2">
                      What happens next?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-start gap-3 md:flex-col md:gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">1</div>
                        <div>
                          <p className="text-cream-100 font-medium text-xs mb-0.5">Review & Approval</p>
                          <p className="text-cream-400 text-[11px] leading-relaxed">Our team verifies availability and sets pricing within 2 hours.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 md:flex-col md:gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="w-6 h-6 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-bold text-xs flex items-center justify-center shrink-0">2</div>
                        <div>
                          <p className="text-cream-100 font-medium text-xs mb-0.5">Pay Advance</p>
                          <p className="text-cream-400 text-[11px] leading-relaxed">Once approved, sign in to your dashboard to pay the advance.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 md:flex-col md:gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="w-6 h-6 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 font-bold text-xs flex items-center justify-center shrink-0">3</div>
                        <div>
                          <p className="text-cream-100 font-medium text-xs mb-0.5">Booking Confirmed</p>
                          <p className="text-cream-400 text-[11px] leading-relaxed">Your date is locked in! Balance is due 24h prior to event.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </form>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-charcoal-800 border border-white/5 rounded-md p-6">
              <h3 className="text-lg font-serif text-cream-100 mb-4">Booking Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <Calendar className="text-gold-400 shrink-0 w-5 h-5 mt-0.5" />
                  <div>
                    <p className="text-cream-200 text-sm font-medium">Date</p>
                    <p className="text-cream-400 text-sm font-sans tabular-nums">{watchDate ? format(new Date(watchDate), 'MMMM do, yyyy') : 'Not selected'}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Clock className="text-gold-400 shrink-0 w-5 h-5 mt-0.5" />
                  <div>
                    <p className="text-cream-200 text-sm font-medium">Timing</p>
                    <p className="text-cream-400 text-sm font-sans tabular-nums">5:00 PM – 10:00 PM</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Users className="text-gold-400 shrink-0 w-5 h-5 mt-0.5" />
                  <div>
                    <p className="text-cream-200 text-sm font-medium">Capacity</p>
                    <p className="text-cream-400 text-sm font-sans tabular-nums">{watchGuestCount || 0} Guests</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-cream-400 text-sm">Estimated Base Price</span>
                  <span className="text-cream-200 font-medium font-sans tabular-nums">
                    {estimatedPrice ? `₹${estimatedPrice.toLocaleString()}` : 'Calculating...'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-cream-400/70 mt-4 border-t border-white/5 pt-4">
                  <p>Final price will be confirmed after review based on custom requirements.</p>
                </div>
              </div>
            </div>

            <div className="bg-gold-500/5 border border-gold-500/20 rounded-md p-6">
              <h3 className="text-gold-400 text-sm font-medium uppercase tracking-widest mb-3">Important Info</h3>
              <ul className="text-cream-400 text-sm space-y-2 list-disc list-inside">
                <li>Booking is confirmed only upon payment of advance.</li>
                <li>Advance payment is non-refundable.</li>
                <li>Full payment must be cleared 24 hours prior to the event.</li>
                <li>Outside caterers are allowed.</li>
              </ul>
            </div>
          </div>
          
        </div>
      </section>
    </div>
  )
}
