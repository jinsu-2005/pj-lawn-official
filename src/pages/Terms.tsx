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
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">1. Venue Overview & Scope of Service</h2>
            <p>
              PJ Lawn is an open-air outdoor event venue located at Paul Vathiyar Compound, Gandhi Nagar, Kurusady, Nagercoil 629004. 
            </p>
            <p className="mt-3">
              PJ Lawn provides the venue premises along with electricity, ambient lawn lighting, restroom facilities, and parking. <strong>We do not provide in-house decoration, catering, food, or dining arrangements.</strong> Customers are required to arrange their own outside decorators, caterers, and event planners.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">2. Operating Hours & Decoration Setup</h2>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Event Session Timing:</strong> Guest event hours are strictly from <strong>5:00 PM to 10:00 PM</strong> in the evening.</li>
              <li><strong>Morning Setup Access:</strong> Outside decorators, setup crews, and caterers are permitted access to the lawn <strong>from morning onwards</strong> on the booked event date to set up stages, lighting, floral arrangements, and dining tables.</li>
              <li><strong>Capacity:</strong> Our venue comfortably accommodates up to <strong>300 guests</strong>.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">3. Outside Catering & Decorators Policy</h2>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Customers have complete freedom to choose their preferred outside caterers, decorators, photographers, and entertainers.</li>
              <li>Customers are responsible for ensuring that external caterers maintain food hygiene and cleanliness in the preparation and dining areas.</li>
              <li>All temporary decor, materials, and catering waste must be cleared by the customer's vendors at the conclusion of the event.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">4. Payment & Booking Confirmation</h2>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>To confirm and secure a date on the calendar, payment of the required advance amount must be completed within 24 hours of booking request approval.</li>
              <li>The booking is officially confirmed once the advance payment is received.</li>
              <li>The remaining balance must be paid in full at least 24 hours prior to the scheduled event date.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">5. Conduct, Sound & Property Care</h2>
            <p>
              Customers and their guests are expected to maintain orderly conduct. Any physical damage to the lawn, structure, restrooms, or lighting fixtures caused during the event will be billed directly to the customer. Sound systems and loud music must strictly adhere to local municipal guidelines.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">6. Contact & Inquiries</h2>
            <p>
              For any questions, date adjustments, or clarifications regarding these terms, please contact PJ Lawn management at <a href="tel:+919489724975" className="text-gold-400 hover:underline font-semibold">+91 94897 24975</a> or via WhatsApp.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
