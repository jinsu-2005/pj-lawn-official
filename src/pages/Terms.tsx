import { motion } from 'framer-motion'

export default function Terms() {
  return (
    <div className="pt-32 pb-24 min-h-screen">
      <section className="container mx-auto px-4 mb-16 text-center max-w-3xl">
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-gold-400 uppercase text-xs tracking-widest font-medium mb-4"
        >
          Legal Agreement
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-display-lg font-serif text-cream-50 mb-6"
        >
          Terms and Conditions
        </motion.h1>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-charcoal-800 border border-white/5 p-8 sm:p-10 rounded-2xl text-cream-300 space-y-8 leading-relaxed text-sm sm:text-base">
          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">1. Introduction</h2>
            <p>
              Welcome to PJ Lawn. By accessing our venue, making a booking request, or utilizing our services, you agree to comply with and be bound by the following terms and conditions. Please read them carefully before finalizing your booking.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">2. Venue & Booking Policy</h2>
            <p>
              PJ Lawn is an open-air event venue located at Paul Vathiyar Compound, Gandhi Nagar, Kurusady, Nagercoil 629004. 
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 pl-4">
              <li>Our standard maximum venue capacity is capped at <strong>300 guests</strong>.</li>
              <li>Booking hours are strictly for evening sessions from <strong>4:00 PM to 11:00 PM</strong> unless explicitly agreed upon in writing by the management.</li>
              <li>Outside catering is allowed. Customers are fully responsible for coordinating and ensuring the quality and hygiene of their chosen caterers.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">3. Payment & Security Deposit</h2>
            <p>
              To confirm and lock in any date, a payment of the advance amount (specified during booking approval) is required within 24 hours of approval.
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 pl-4">
              <li>The booking request is only completed and confirmed once the advance is paid.</li>
              <li>The remaining balance must be paid in full at least 24 hours prior to the start of the event.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">4. Conduct and Damage Policy</h2>
            <p>
              Customers and their guests are expected to conduct themselves in a responsible manner. Any damage to the lawn, structure, restrooms, or lighting fixtures caused during the event will be billed directly to the customer. Loud music and sound systems must adhere to local municipal guidelines and regulations.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">5. Liability</h2>
            <p>
              PJ Lawn management is not responsible for any personal items lost, stolen, or damaged during the course of the event. Customers are advised to secure their valuables.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">6. Changes to Terms</h2>
            <p>
              PJ Lawn reserves the right to modify these terms and conditions at any time. Any changes will be posted on this page and will apply to all subsequent booking requests.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
