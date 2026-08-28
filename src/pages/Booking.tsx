import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Users, Clock, Info, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { auth, googleProvider } from '@/lib/firebase'
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth'
import { checkAndHoldDate, createBooking, getPricingTiers, PricingTier } from '@/lib/bookingService'
import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

const bookingSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  eventType: z.string().min(1, 'Event type is required'),
  guestCount: z.number().min(50, 'Minimum 50 guests').max(300, 'Maximum 300 guests'),
  notes: z.string().optional()
})

type BookingFormData = z.infer<typeof bookingSchema>

export default function Booking() {
  const [step, setStep] = useState(1)
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([])

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestCount: 100,
      eventType: 'Birthday Party'
    },
    mode: 'onChange'
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      if (user) {
        // Pre-fill if missing
        const values = getValues()
        if (!values.name && user.displayName) setValue('name', user.displayName)
        if (!values.email && user.email) setValue('email', user.email)
      }
    })
    return () => unsubscribe()
  }, [setValue, getValues])



  const watchDate = watch('date')
  const watchGuestCount = watch('guestCount')
  const watchName = watch('name')
  const watchPhone = watch('phone')

  // Tomorrow's date at 00:00:00 (booking starts after today)
  const tomorrow = new Date()
  tomorrow.setHours(0, 0, 0, 0)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Parse current date string to Date object for DayPicker
  const selectedDateObj = watchDate ? new Date(`${watchDate}T00:00:00`) : undefined;
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Form expects string date
      setValue('date', format(date, 'yyyy-MM-dd'), { shouldValidate: true })
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
    setError(null)
    if (step === 1) {
      if (!watchDate) {
        setError('Please select a date.')
        return
      }
      // Check date availability (client-side mock hold for now, real hold will be at submit or via auth)
      setStep(2)
    } else if (step === 2) {
      if (!watchName || !watchPhone) {
        setError('Please fill in required contact details.')
        return
      }
      setStep(3)
    }
  }

  const navigateToStep = (targetStep: number) => {
    setError(null)
    if (targetStep === 1) {
      setStep(1)
    } else if (targetStep === 2) {
      if (!watchDate) {
        setError('Please select a date first.')
        return
      }
      setStep(2)
    } else if (targetStep === 3) {
      if (!watchDate) {
        setError('Please select a date first.')
        return
      }
      if (!watchName || !watchPhone) {
        setError('Please fill in contact details first.')
        return
      }
      setStep(3)
    }
  }

  const onSubmit = async (data: BookingFormData) => {
    setError(null)
    setIsSubmitting(true)
    try {
      // 1. Authenticate User (Google Sign-In)
      let user = auth.currentUser
      if (!user) {
        const result = await signInWithPopup(auth, googleProvider)
        user = result.user
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
      setError(err.message || 'An error occurred during booking. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-32 pb-24 min-h-screen bg-charcoal-900">
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

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="grid lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 bg-charcoal-800 border border-white/5 rounded-md p-6 sm:p-10">
            
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

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Date */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {!currentUser && (
                    <div className="mb-6 p-4 bg-charcoal-800 border border-gold-500/20 rounded-md flex items-center justify-between shadow-lg">
                      <div>
                        <p className="text-sm font-medium text-cream-100">Already have an account?</p>
                        <p className="text-xs text-cream-400 mt-1">Sign in to autofill details and track your booking.</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => signInWithPopup(auth, googleProvider)} className="border-gold-500/50 text-gold-400 hover:bg-gold-500/10 hover:text-gold-300">
                        Sign In
                      </Button>
                    </div>
                  )}

                  <h2 className="text-xl font-serif text-cream-100 mb-6">When is your event?</h2>
                  
                  <div className="bg-charcoal-900 border border-white/10 rounded-2xl mb-8 flex flex-col items-center justify-center p-3 sm:p-6 shadow-2xl overflow-hidden w-full max-w-md mx-auto">
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
                        font-family: Georgia, serif;
                        font-size: 1.2rem;
                        font-weight: 700;
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
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" onClick={handleNextStep}>Continue to Details</Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Event Details */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-serif text-cream-100 mb-6">Tell us about your event</h2>
                  
                  <div className="space-y-6 mb-8">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-cream-400 font-medium">Full Name</label>
                        <input type="text" {...register('name')} className="w-full bg-charcoal-900 border border-white/10 rounded-md px-4 py-3 text-cream-200" />
                        {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-cream-400 font-medium">Phone Number</label>
                        <input type="tel" {...register('phone')} className="w-full bg-charcoal-900 border border-white/10 rounded-md px-4 py-3 text-cream-200" />
                        {errors.phone && <p className="text-red-400 text-xs">{errors.phone.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-cream-400 font-medium">Email Address (Optional)</label>
                      <input type="email" {...register('email')} className="w-full bg-charcoal-900 border border-white/10 rounded-md px-4 py-3 text-cream-200" />
                      {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-cream-400 font-medium">Event Type</label>
                        <select {...register('eventType')} className="w-full bg-charcoal-900 border border-white/10 rounded-md px-4 py-3 text-cream-200 appearance-none">
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
                        <input type="number" {...register('guestCount', { valueAsNumber: true })} className="w-full bg-charcoal-900 border border-white/10 rounded-md px-4 py-3 text-cream-200" />
                        {errors.guestCount && <p className="text-red-400 text-xs">{errors.guestCount.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-cream-400 font-medium">Additional Notes (Optional)</label>
                      <textarea {...register('notes')} rows={3} className="w-full bg-charcoal-900 border border-white/10 rounded-md px-4 py-3 text-cream-200 resize-none"></textarea>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button type="button" onClick={handleNextStep}>Review Booking</Button>
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
                  <div className="flex flex-col-reverse sm:flex-row justify-center gap-4">
                    <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setStep(2)}>Back</Button>
                    <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : currentUser ? 'Submit Booking Request' : 'Continue with Google to Book'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Success */}
              {step === 4 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-left py-2">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="text-green-400 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-serif text-cream-100 mb-4">Request Received!</h2>
                    <p className="text-cream-400 max-w-md mx-auto">
                      Thank you, {watchName}. Your booking request for {watchDate ? format(new Date(watchDate), 'MMMM do, yyyy') : ''} has been submitted successfully.
                    </p>
                  </div>
                  
                  <div className="bg-charcoal-900 border border-white/5 rounded-md p-6 mb-8 shadow-inner">
                    <h3 className="text-lg font-serif text-gold-400 mb-6 border-b border-white/5 pb-2">What happens next?</h3>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-400 font-bold text-sm">1</div>
                        <div>
                          <p className="text-cream-200 font-medium mb-1">Review & Approval (Within 2 hours)</p>
                          <p className="text-cream-400 text-sm">Our team will review your request, confirm availability, and set the final pricing based on your guest count and requirements.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20 text-yellow-500 font-bold text-sm">2</div>
                        <div>
                          <p className="text-cream-200 font-medium mb-1">Pay Advance (Within 24 hours)</p>
                          <p className="text-cream-400 text-sm">Once approved, you'll receive an email notification. Log in to your dashboard to pay the advance to secure your date.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20 text-green-400 font-bold text-sm">3</div>
                        <div>
                          <p className="text-cream-200 font-medium mb-1">Booking Confirmed</p>
                          <p className="text-cream-400 text-sm">Your event date is locked in! The remaining balance is due exactly 24 hours prior to your event.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 mb-8 p-6 bg-gold-500/5 border border-gold-500/20 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
                    <div>
                      <h4 className="text-gold-400 font-serif text-lg font-bold mb-1">Want Instant Review?</h4>
                      <p className="text-cream-300 text-sm">Call us immediately to bypass the 2-hour review wait and lock in your date right away.</p>
                    </div>
                    <a 
                      href="tel:+919489724975" 
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-gold-400 hover:bg-gold-300 text-black !text-black text-sm font-black uppercase tracking-wider rounded-full shadow-lg shadow-gold-500/10 active:scale-95 transition-all shrink-0"
                    >
                      📞 Call +91 94897 24975
                    </a>
                  </div>

                  <div className="text-center">
                    <Button to="/dashboard" className="w-full sm:w-auto">Go to Dashboard to Track Status</Button>
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
                    <p className="text-cream-400 text-sm">{watchDate ? format(new Date(watchDate), 'MMMM do, yyyy') : 'Not selected'}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Clock className="text-gold-400 shrink-0 w-5 h-5 mt-0.5" />
                  <div>
                    <p className="text-cream-200 text-sm font-medium">Time</p>
                    <p className="text-cream-400 text-sm">5:00 PM – 10:00 PM</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Users className="text-gold-400 shrink-0 w-5 h-5 mt-0.5" />
                  <div>
                    <p className="text-cream-200 text-sm font-medium">Capacity</p>
                    <p className="text-cream-400 text-sm">{watchGuestCount || 0} Guests</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-cream-400 text-sm">Estimated Base Price</span>
                  <span className="text-cream-200 font-medium">
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
