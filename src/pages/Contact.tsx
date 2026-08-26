import { motion } from 'framer-motion'
import { Phone, MapPin, Calendar, Clock } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { Button } from '@/components/ui/Button'

export default function Contact() {
  return (
    <div className="pt-32 pb-24 min-h-screen">
      
      {/* Page Header */}
      <section className="container mx-auto px-4 mb-16 text-center max-w-3xl">
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-gold-400 uppercase text-xs tracking-widest font-medium mb-4"
        >
          Direct Connect
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-display-lg font-serif text-cream-50 mb-6"
        >
          Contact PJ Lawn
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-cream-400 text-lg leading-relaxed"
        >
          We are here to assist with venue visits, dates availability, pricing, and all your event requirements. Connect with us directly through any channel below.
        </motion.p>
      </section>

      {/* Direct Connect Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* WhatsApp Direct Chat Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="bg-charcoal-800/90 border border-white/5 hover:border-[#25D366]/40 p-8 rounded-2xl shadow-xl flex flex-col justify-between transition-all group"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/20 flex items-center justify-center mb-6 text-[#25D366] group-hover:scale-105 transition-transform">
                <WhatsAppIcon className="w-7 h-7" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#25D366]/10 text-[#25D366] text-[11px] font-semibold uppercase tracking-wider mb-2">
                Fastest Response
              </div>
              <h3 className="text-xl font-serif text-cream-100 mb-2">WhatsApp Chat</h3>
              <p className="text-cream-400 text-sm leading-relaxed mb-6">
                Chat directly with our venue coordinator for instant replies on pricing, photos, and date availability.
              </p>
            </div>
            <a 
              href="https://wa.me/919489724975?text=Hi%2C%20I'd%20like%20to%20know%20more%20about%20booking%20PJ%20Lawn%20for%20my%20event." 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-charcoal-950 font-bold text-sm transition-all shadow-lg shadow-[#25D366]/20 active:scale-95"
            >
              <WhatsAppIcon className="w-5 h-5" /> Chat on WhatsApp
            </a>
          </motion.div>

          {/* Direct Phone Call Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-charcoal-800/90 border border-white/5 hover:border-gold-500/40 p-8 rounded-2xl shadow-xl flex flex-col justify-between transition-all group"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gold-500/15 border border-gold-500/20 flex items-center justify-center mb-6 text-gold-400 group-hover:scale-105 transition-transform">
                <Phone size={26} />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-gold-500/10 text-gold-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
                9:00 AM – 8:00 PM Daily
              </div>
              <h3 className="text-xl font-serif text-cream-100 mb-2">Phone Call</h3>
              <p className="text-cream-400 text-sm leading-relaxed mb-6">
                Speak directly with the venue management to discuss custom requirements, guest count, and bookings.
              </p>
            </div>
            <a 
              href="tel:+919489724975" 
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gold-400 hover:bg-gold-300 text-charcoal-950 font-bold text-sm transition-all shadow-lg shadow-gold-500/20 active:scale-95"
            >
              <Phone size={18} /> Call +91 94897 24975
            </a>
          </motion.div>

          {/* Online Booking Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-charcoal-800/90 border border-white/5 hover:border-gold-500/40 p-8 rounded-2xl shadow-xl flex flex-col justify-between transition-all group"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-gold-400 group-hover:scale-105 transition-transform">
                <Calendar size={26} />
              </div>
              <h3 className="text-xl font-serif text-cream-100 mb-2">Online Date Reservation</h3>
              <p className="text-cream-400 text-sm leading-relaxed mb-6">
                Select your preferred event date and session (Morning, Evening, or Full Day) and submit an instant reservation request.
              </p>
            </div>
            <Button to="/book" size="lg" className="w-full">
              Reserve Online Now
            </Button>
          </motion.div>

          {/* Venue Location Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-charcoal-800/90 border border-white/5 hover:border-gold-500/40 p-8 rounded-2xl shadow-xl flex flex-col justify-between transition-all group"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-gold-400 group-hover:scale-105 transition-transform">
                <MapPin size={26} />
              </div>
              <h3 className="text-xl font-serif text-cream-100 mb-2">Visit PJ Lawn</h3>
              <p className="text-cream-400 text-sm leading-relaxed mb-6">
                Paul Vathiyar Compound, Gandhi Nagar, Kurusady, Nagercoil, Tamil Nadu 629004.
              </p>
            </div>
            <Button to="/location" variant="outline" size="lg" className="w-full">
              View Map & Directions
            </Button>
          </motion.div>

        </div>

        {/* Operating Hours Note */}
        <div className="p-6 bg-charcoal-800/60 border border-white/5 rounded-2xl text-center flex flex-col sm:flex-row items-center justify-center gap-4 text-cream-300 text-sm">
          <div className="flex items-center gap-2 text-gold-400 font-medium">
            <Clock size={18} /> Venue Operating Hours:
          </div>
          <div>Evening Sessions (4:00 PM – 11:00 PM)</div>
        </div>
      </section>

    </div>
  )
}
