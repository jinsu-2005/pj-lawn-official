import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Phone } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'

// Images
import entranceImg from '@/assets/gallery/5.jpg?format=webp&w=800&as=url'
import familyImg from '@/assets/gallery/1.png?format=webp&w=1200&as=url'

const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
}

export default function About() {
  return (
    <div className="pt-32 pb-24 min-h-screen">
      
      {/* Page Header */}
      <section className="container mx-auto px-4 mb-20 text-center">
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-gold-400 uppercase text-xs tracking-widest font-medium mb-4"
        >
          Our Story
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-display-lg font-serif text-cream-50"
        >
          About PJ Lawn
        </motion.h1>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="lg:col-span-5 order-2 lg:order-1"
          >
            <div className="relative aspect-[3/4] max-w-md mx-auto lg:mx-0 rounded-md overflow-hidden">
              <img 
                src={typeof entranceImg === 'string' ? entranceImg : (entranceImg as unknown as string)}
                alt="PJ Lawn Entrance Sign" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border border-white/10" />
            </div>
          </motion.div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="lg:col-span-7 order-1 lg:order-2"
          >
            <h2 className="text-display-md font-serif text-cream-100 mb-8 leading-snug">
              Nagercoil's Premier Open-Air Event Destination
            </h2>
            <div className="space-y-6 text-cream-400 text-lg leading-relaxed">
              <p>
                Welcome to PJ Lawn, an elegant outdoor event venue located in the heart of Nagercoil. Nestled in a lush, green setting, we provide the perfect open-air canvas for your most cherished celebrations.
              </p>
              <p>
                From daytime gatherings under the tropical sun to magical evening events illuminated by ambient fairy lights, our venue is designed to be versatile, welcoming, and memorable. Whether you're planning an intimate family function or a grand wedding reception, PJ Lawn offers a relaxed atmosphere that your guests will love.
              </p>
              <p>
                With flexible capacity ranging from 50 to 300 guests, essential amenities, and dedicated space for elaborate dining and buffet setups, we are committed to helping you host your celebration, your way.
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Full Width Image Break */}
      <section className="mb-32">
        <motion.div 
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1 }}
          className="relative h-[60vh] min-h-[400px]"
        >
          <img 
            src={typeof familyImg === 'string' ? familyImg : (familyImg as unknown as string)}
            alt="Family gathering at PJ Lawn" 
            className="w-full h-full object-cover object-center"
          />
          <div className="image-scrim" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <h2 className="text-display-md md:text-display-lg font-serif text-white text-center max-w-4xl drop-shadow-lg">
              Creating Memories with Family and Friends
            </h2>
          </div>
        </motion.div>
      </section>

      {/* Owner Contact */}
      <section className="container mx-auto px-4 max-w-4xl text-center">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="bg-charcoal-800 border border-white/5 p-12 rounded-md"
        >
          <h2 className="text-display-sm font-serif text-cream-100 mb-4">Let's Plan Your Event</h2>
          <p className="text-cream-400 mb-8 max-w-2xl mx-auto">
            Ready to secure your date or have questions about our venue capabilities? Our team is ready to assist you directly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
             <Button to="/book" size="lg">Book Your Date</Button>
             <div className="flex gap-4">
               <a href="tel:+919489724975" className="flex items-center justify-center w-14 h-14 rounded-full border border-gold-500 text-gold-400 hover:bg-gold-500/10 transition-colors" aria-label="Call Us">
                 <Phone size={24} />
               </a>
               <a href="https://wa.me/919489724975?text=Hi%2C%20I'd%20like%20to%20know%20more%20about%20booking%20PJ%20Lawn" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-14 h-14 rounded-full border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 transition-colors" aria-label="WhatsApp Us">
                 <WhatsAppIcon className="w-6 h-6" />
               </a>
             </div>
          </div>
        </motion.div>
      </section>

    </div>
  )
}
