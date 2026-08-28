import { motion } from 'framer-motion'
import { MapPin, Phone, Navigation } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'

export default function Location() {
  const mapUrl = "https://maps.google.com/maps?q=PJ+Lawn+Paul+Vathiyar+Compound+Gandhi+Nagar+Nagercoil&output=embed&z=17"
  const directionsUrl = "https://maps.app.goo.gl/mcK4uRMVUW4g8uxRA"

  return (
    <div className="pt-32 pb-24 min-h-screen">
      
      {/* Page Header */}
      <section className="container mx-auto px-4 mb-16 text-center max-w-3xl">
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-gold-400 uppercase text-xs tracking-widest font-medium mb-4"
        >
          Directions
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-display-lg font-serif text-cream-50 mb-6"
        >
          How to Reach Us
        </motion.h1>
      </section>

      {/* Map and Details Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Details Card */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
            className="lg:col-span-4 bg-charcoal-800 border border-white/5 p-8 sm:p-10 rounded-md order-2 lg:order-1"
          >
            <h2 className="text-2xl font-serif text-cream-100 mb-8">Venue Details</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-sm uppercase tracking-widest text-gold-400 mb-3 flex items-center gap-2">
                  <MapPin size={16} /> Address
                </h3>
                <p className="text-cream-200 leading-relaxed font-medium">PJ Lawn</p>
                <p className="text-cream-400 text-sm leading-relaxed">
                  Paul Vathiyar Compound,<br/>
                  Gandhi Nagar, Kurusady,<br/>
                  Nagercoil, Tamil Nadu 629004
                </p>
                <a 
                  href={directionsUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gold-400 text-sm mt-3 hover:text-gold-300 transition-colors"
                >
                  <Navigation size={14} /> Get Directions
                </a>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-widest text-gold-400 mb-3 flex items-center gap-2">
                  <Phone size={16} /> Contact
                </h3>
                <p className="text-cream-400 text-sm mb-1">For bookings and inquiries:</p>
                <a href="tel:+919489724975" className="text-cream-200 text-lg hover:text-gold-400 transition-colors">
                  +91 94897 24975
                </a>
              </div>
              
              <div className="pt-6 border-t border-white/10">
                <a 
                  href="https://wa.me/919489724975?text=Hi%2C%20I'd%20like%20to%20know%20more%20about%20booking%20PJ%20Lawn" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-[#25D366]/20 transition-all active:scale-98"
                >
                  <WhatsAppIcon className="w-5 h-5 text-black" /> Message on WhatsApp
                </a>
              </div>
            </div>
          </motion.div>

          {/* Interactive Map */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-8 aspect-square md:aspect-video lg:aspect-auto lg:h-[600px] bg-charcoal-900 border border-white/10 rounded-2xl overflow-hidden order-1 lg:order-2 relative shadow-2xl"
          >
            <div className="absolute top-4 right-4 z-20">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-charcoal-900/90 hover:bg-gold-400 text-cream-100 hover:text-black border border-gold-500/40 text-xs font-bold px-4 py-2.5 rounded-xl backdrop-blur-md shadow-lg transition-all active:scale-95"
              >
                <Navigation size={14} className="text-gold-400 group-hover:text-black" />
                <span>Open in Maps</span>
              </a>
            </div>
            <iframe 
              src={mapUrl}
              width="100%" 
              height="100%" 
              style={{ border: 0, minHeight: '350px' }} 
              allowFullScreen
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="PJ Lawn Location Map"
              className="w-full h-full"
            ></iframe>
          </motion.div>

        </div>
      </section>

    </div>
  )
}
