import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Users, Clock, Info, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
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

  // Parse current date string to Date object for DayPicker
  const selectedDateObj = watchDate ? new Date(watchDate) : undefined;
  
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
                  
                  <div className="bg-charcoal-900 border border-white/5 rounded-2xl mb-8 flex flex-col items-center justify-center py-10 shadow-2xl">
                    <style>{`
                      .rdp {
                        --rdp-cell-size: 44px;
                        --rdp-accent-color: #D4AF37; /* gold-500 */
                        --rdp-background-color: rgba(212, 175, 55, 0.1);
                        color: #E2DFD2;
                        margin: 0;
                      }
                      /* Month name caption styling */
                      .rdp-caption_label {
                        font-family: Georgia, serif;
                        font-size: 1.25rem;
                        color: #FFF8DC !important; /* warm starlight */
                        font-weight: bold;
                        letter-spacing: 0.05em;
                      }
                      /* Navigation Buttons */
                      .rdp-nav_button {
                        color: #d4af37 !important;
                        background: rgba(255, 255, 255, 0.03) !important;
                        border: 1px solid rgba(212, 175, 55, 0.2) !important;
                        border-radius: 9999px !important;
                        width: 34px !important;
                        height: 34px !important;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                        cursor: pointer;
                      }
                      .rdp-nav_button:hover {
                        background: rgba(212, 175, 55, 0.15) !important;
                        border-color: #d4af37 !important;
                        color: #fff !important;
                      }
                      /* Weekday labels */
                      .rdp-head_cell {
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                        color: #d4af37;
                        padding-bottom: 12px;
                      }
                      /* Day Cells styling */
                      .rdp-day {
                        font-weight: 500;
                        border-radius: 9999px !important; /* Circular cells */
                        width: 42px;
                        height: 42px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        margin: 1px;
                        transition: all 0.2s;
                        position: relative;
                        border: 1px solid transparent;
                        color: #ede5d0;
                      }
                      /* Available Dates: soft green tint border and tiny under-dot */
                      .rdp-day:not([disabled]):not(.rdp-day_selected):not(.rdp-day_outside) {
                        background: rgba(255, 255, 255, 0.02);
                        border-color: rgba(34, 197, 94, 0.2);
                      }
                      .rdp-day:not([disabled]):not(.rdp-day_selected):not(.rdp-day_outside):hover {
                        background: rgba(34, 197, 94, 0.15) !important;
                        border-color: rgba(34, 197, 94, 0.6) !important;
                        color: #fff;
                        transform: scale(1.05);
                      }
                      /* Available under-dot */
                      .rdp-day:not([disabled]):not(.rdp-day_selected):not(.rdp-day_outside)::after {
                        content: '';
                        position: absolute;
                        bottom: 4px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 4px;
                        height: 4px;
                        border-radius: 50%;
                        background-color: #22c55e;
                      }
                      /* Selected Date - Solid gold-500 circle */
                      .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
                        color: #0c0c0c !important;
                        background-color: #D4AF37 !important;
                        border-color: #D4AF37 !important;
                        font-weight: 800 !important;
                        box-shadow: 0 4px 14px rgba(212, 175, 55, 0.4);
                        transform: scale(1.05);
                      }
                      .rdp-day_selected::after {
                        display: none !important; /* Hide dot on selected date */
                      }
                      /* Unavailable/Disabled Dates: opacity fade for cleanliness */
                      .rdp-day_disabled {
                        opacity: 0.18;
                        color: #777777 !important;
                        cursor: not-allowed;
                        background: transparent !important;
                        border: 1px solid transparent !important;
                        text-decoration: none !important;
                      }
                      .rdp-day_disabled::after {
                        display: none !important;
                      }
                      /* Outside month days */
                      .rdp-day_outside {
                        opacity: 0.25;
                      }
                    `}</style>
                    <DayPicker 
                      mode="single"
                      selected={selectedDateObj}
                      onSelect={handleDateSelect}
                      disabled={[{ before: new Date() }, ...unavailableDates]}
                      className="p-4"
                    />
                    
                    <div className="flex gap-6 mt-4 pt-6 border-t border-white/5 w-full max-w-[320px] justify-center text-xs text-cream-400">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gold-500"></div>
                        <span className="text-cream-200">Selected</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-cream-400/20"></div>
                        <span>Unavailable</span>
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
                  <h2 className="text-xl font-serif text-cream-100 mb-4">Confirm Your Booking Request</h2>
                  <p className="text-cream-400 mb-8 max-w-md mx-auto">
                    You are about to submit a booking request for {watchDate ? format(new Date(watchDate), 'MMMM do, yyyy') : ''}. 
                    {!currentUser && " You will be prompted to securely sign in with Google to confirm your identity."}
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Processing...' : currentUser ? 'Submit Booking Request' : 'Sign in & Submit Request'}
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
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-gold-400 hover:bg-gold-300 text-charcoal-950 text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-gold-500/10 active:scale-95 transition-all shrink-0"
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
                    <p className="text-cream-400 text-sm">4:00 PM – 11:00 PM</p>
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
