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
import { signInWithPopup } from 'firebase/auth'
import { checkAndHoldDate, createBooking, getPricingTiers, PricingTier } from '@/lib/bookingService'
import emailjs from '@emailjs/browser'

const bookingSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  eventType: z.string().min(1, 'Event type is required'),
  guestCount: z.number().min(50, 'Minimum 50 guests').max(500, 'Maximum 500 guests'),
  notes: z.string().optional()
})

type BookingFormData = z.infer<typeof bookingSchema>

export default function Booking() {
  const [step, setStep] = useState(1)
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestCount: 100,
      eventType: 'Wedding Reception'
    },
    mode: 'onChange'
  })

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

      // 4. Send EmailJS notification
      if (import.meta.env.VITE_EMAILJS_SERVICE_ID && import.meta.env.VITE_EMAILJS_TEMPLATE_ID && import.meta.env.VITE_EMAILJS_PUBLIC_KEY) {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            booking_id: bookingId,
            customer_name: data.name,
            customer_phone: data.phone,
            event_date: data.date,
            event_type: data.eventType,
            guest_count: data.guestCount
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        ).catch(err => console.error("EmailJS error:", err)) // Don't fail booking if email fails
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
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-gold-400' : 'text-cream-400/50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step >= 1 ? 'bg-gold-500 text-charcoal-900' : 'bg-charcoal-700 text-cream-400/50'}`}>1</div>
                  <span className="text-sm font-medium hidden sm:inline">Select Date</span>
                </div>
                <div className="h-px bg-white/5 flex-1 mx-4" />
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-gold-400' : 'text-cream-400/50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step >= 2 ? 'bg-gold-500 text-charcoal-900' : 'bg-charcoal-700 text-cream-400/50'}`}>2</div>
                  <span className="text-sm font-medium hidden sm:inline">Event Details</span>
                </div>
                <div className="h-px bg-white/5 flex-1 mx-4" />
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-gold-400' : 'text-cream-400/50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step >= 3 ? 'bg-gold-500 text-charcoal-900' : 'bg-charcoal-700 text-cream-400/50'}`}>3</div>
                  <span className="text-sm font-medium hidden sm:inline">Review & Submit</span>
                </div>
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
                  <h2 className="text-xl font-serif text-cream-100 mb-6">When is your event?</h2>
                  
                  <div className="bg-charcoal-900 border border-white/10 rounded-md mb-8 flex flex-col items-center justify-center py-8">
                    <style>{`
                      .rdp {
                        --rdp-cell-size: 40px;
                        --rdp-accent-color: #D4AF37; /* gold-500 */
                        --rdp-background-color: rgba(212, 175, 55, 0.1);
                        --rdp-accent-color-dark: #F3E5AB; /* cream-100 */
                        --rdp-background-color-dark: rgba(212, 175, 55, 0.2);
                        --rdp-outline: 2px solid var(--rdp-accent-color);
                        --rdp-outline-selected: 2px solid var(--rdp-accent-color);
                        color: #E2DFD2;
                        margin: 0;
                      }
                      .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
                        color: #1A1A1A;
                        background-color: #D4AF37;
                      }
                      .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                        background-color: rgba(255, 255, 255, 0.1);
                      }
                      .rdp-day_disabled {
                        opacity: 0.25;
                      }
                    `}</style>
                    <DayPicker 
                      mode="single"
                      selected={selectedDateObj}
                      onSelect={handleDateSelect}
                      disabled={[{ before: new Date() }]}
                      className="p-4"
                    />
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
                          <option value="Wedding Reception">Wedding Reception</option>
                          <option value="Birthday Party">Birthday Party</option>
                          <option value="Corporate Event">Corporate Event</option>
                          <option value="Engagement Party">Engagement Party</option>
                          <option value="Anniversary">Anniversary</option>
                          <option value="Baby Shower">Baby Shower</option>
                          <option value="Photo/Video Shoot">Photo / Video Shoot</option>
                          <option value="Get-Together">Family/Friends Get-Together</option>
                          <option value="Workshop">Workshop / Seminar</option>
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
                    You will be prompted to securely sign in with Google to confirm your identity.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Processing...' : 'Sign in & Submit Request'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Success */}
              {step === 4 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="text-green-400 w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-serif text-cream-100 mb-4">Request Received!</h2>
                  <p className="text-cream-400 mb-8 max-w-md mx-auto">
                    Thank you, {watchName}. Your booking request for {watchDate ? format(new Date(watchDate), 'MMMM do, yyyy') : ''} has been submitted successfully. Our team will review the details and contact you shortly to confirm the reservation and collect the advance.
                  </p>
                  <Button to="/dashboard">Go to Dashboard</Button>
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
