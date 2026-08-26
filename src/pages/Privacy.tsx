import { motion } from 'framer-motion'

export default function Privacy() {
  return (
    <div className="pt-32 pb-24 min-h-screen">
      <section className="container mx-auto px-4 mb-16 text-center max-w-3xl">
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-gold-400 uppercase text-xs tracking-widest font-medium mb-4"
        >
          Data Protection
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-display-lg font-serif text-cream-50 mb-6"
        >
          Privacy Policy
        </motion.h1>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-charcoal-800 border border-white/5 p-8 sm:p-10 rounded-2xl text-cream-300 space-y-8 leading-relaxed text-sm sm:text-base">
          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">1. Information We Collect</h2>
            <p>
              When you submit a booking request or log in to our dashboard, we collect personal information that you provide to us, including:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 pl-4">
              <li>Name and contact details (email and phone number).</li>
              <li>Google account details (name, email, and profile photo) when authenticating via Google Sign-In.</li>
              <li>Booking details (event date, occasion type, estimated guests, and event notes).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">2. How We Use Your Information</h2>
            <p>
              We use the collected information to:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 pl-4">
              <li>Process your booking requests and verify date availability.</li>
              <li>Communicate updates regarding your request, approval, and billing.</li>
              <li>Initialize secure payments via our verified third-party payment partner, Cashfree.</li>
              <li>Allow you to access your personal dashboard and download PDF booking receipts.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">3. Data Sharing & Security</h2>
            <p>
              Your data is stored securely using Firebase Authentication, Firestore databases, and Firebase Storage. We do not sell, rent, or trade your personal information. We share data only with:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 pl-4">
              <li><strong>Cashfree Payments</strong>: Essential billing data is sent to process secure transactions.</li>
              <li><strong>Resend Email Service</strong>: Names and transaction details are used to trigger transactional email alerts.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">4. Your Rights</h2>
            <p>
              You have the right to access the personal information we hold about you. You can review your bookings at any time via your customer dashboard. If you wish to delete your account or wipe your contact history, please get in touch with us via our contact form.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif text-cream-100 mb-4 border-b border-white/5 pb-2">5. Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our services or legal regulations. All updates will be published on this page.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
