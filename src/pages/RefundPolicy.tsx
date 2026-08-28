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
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">1. Booking Advance Policy</h2>
            <p>
              To secure and exclusively block a date on the PJ Lawn calendar, customers are required to pay a booking advance upon request approval. 
            </p>
            <p className="mt-3">
              Because blocking a date prevents other prospective clients from reserving the venue, <strong>the booking advance is strictly non-refundable</strong> once paid, except under management-initiated cancellations (Section 4).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">2. Date Rescheduling Option</h2>
            <p>
              We understand that family plans can change. If you need to postpone or change your event date:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 pl-4">
              <li>Customers may request to reschedule their booked date up to <strong>15 days prior</strong> to the original event date, subject to slot availability on the calendar.</li>
              <li>Your paid advance will be transferred in full to the newly chosen available date.</li>
              <li>Rescheduling requests within 15 days of the event date are subject to management review.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">3. Cancellation Timelines</h2>
            <p>
              If a customer chooses to cancel a confirmed booking:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 pl-4">
              <li>
                <strong>Cancellations made 7 or more days prior to event:</strong> The remaining balance is waived. If the full amount was already paid in advance, the remaining balance portion will be refunded (advance deposit remains non-refundable).
              </li>
              <li>
                <strong>Cancellations made less than 7 days prior to event:</strong> The booking is non-refundable as the venue slot cannot be reallocated on short notice.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">4. Force Majeure & Management Cancellation</h2>
            <p>
              In the rare event that PJ Lawn management is unable to provide the venue due to unforeseen emergencies, extreme weather, government orders, or structural force majeure, a <strong>100% full refund</strong> (including the entire advance deposit) will be returned immediately to the customer.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">5. Refund Method & Processing Time</h2>
            <p>
              All eligible refunds are processed electronically through our authorized payment gateway (Cashfree Payments). Approved refunds will be credited directly back to the customer's original payment source (UPI / NetBanking / Debit Card) within <strong>5 to 7 business days</strong>.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">6. Help & Support</h2>
            <p>
              For cancellation or rescheduling assistance, please contact us directly via WhatsApp or phone at <a href="tel:+919489724975" className="text-gold-400 hover:underline font-semibold">+91 94897 24975</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
