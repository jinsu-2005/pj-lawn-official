import { motion } from 'framer-motion'

export default function RefundPolicy() {
  return (
    <div className="pt-32 pb-24 min-h-screen">
      <section className="container mx-auto px-4 mb-16 text-center max-w-3xl">
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-gold-400 uppercase text-xs tracking-widest font-medium mb-4"
        >
          Cancellation Guidelines
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-display-lg font-serif text-cream-50 mb-6"
        >
          Refund & Cancellation Policy
        </motion.h1>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-charcoal-800 border border-white/5 p-8 sm:p-10 rounded-2xl text-cream-300 space-y-8 leading-relaxed text-sm sm:text-base">
          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">1. Booking Advance Non-Refundability</h2>
            <p>
              To secure and block a date on the PJ Lawn public calendar, customers are required to pay a non-refundable booking advance (specified during your booking approval). 
            </p>
            <p className="mt-3">
              Because blocking a date prevents other prospective clients from booking the venue, <strong>the booking advance is strictly non-refundable and non-transferable</strong> except as outlined in Section 2.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">2. Cancellation Policy</h2>
            <p>
              If you need to cancel your booking, the following timeline dictates your refund eligibility:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 pl-4">
              <li>
                <strong>Cancellations made 7 or more days prior</strong> to the scheduled event date: The remaining balance is not due, and if already paid, it will be refunded. However, the advance deposit remains non-refundable.
              </li>
              <li>
                <strong>Cancellations made less than 7 days prior</strong> to the scheduled event date: The full booking fee (advance + remaining balance) is non-refundable, and any outstanding balance remains due.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">3. Force Majeure & Management Cancellation</h2>
            <p>
              In the highly unlikely event that PJ Lawn management must cancel your booking due to unforeseen circumstances (e.g., severe natural disaster, structural damage, government orders, or force majeure), a **100% full refund** (including the advance deposit) will be processed back to the customer's original payment method within 5–7 working days.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">4. Refund Processing Time</h2>
            <p>
              Eligible refunds are processed automatically through our payment gateway partner, Cashfree. Approved refund amounts will reflect in the customer's bank account or original payment instrument within **5 to 7 business days** in accordance with standard bank processing timelines.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
