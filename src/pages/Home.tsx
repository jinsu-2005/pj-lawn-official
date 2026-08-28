import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Toilet, CarFront, Droplets } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getPricingTiers } from '@/lib/bookingService'

// Import images with imagetools query (they'll be optimized at build)
// Static paths for optimized public assets
const heroImg = '/gallery/3.webp'
const aboutImg = '/gallery/2.webp'
const buffetImg = '/gallery/4.webp'
const amenitiesImg = '/gallery/6.webp'

import { Variants } from 'framer-motion'


const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] as any } }
}

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] as any } }
}

const fadeRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] as any } }
}

const imageScale: Variants = {
  hidden: { opacity: 0, scale: 0.95, filter: 'blur(5px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 1.2, ease: [0.25, 1, 0.5, 1] as any } }
}

export default function Home() {
  const [startingPrice, setStartingPrice] = useState<number | null>(15000)

  useEffect(() => {
    getPricingTiers().then(tiers => {
      if (tiers.length > 0) {
        setStartingPrice(tiers[0].price)
      }
    }).catch(console.error)
  }, [])

  return (
    <div className="w-full">
      {/* 1. Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            alt="PJ Lawn Venue at Night" 
            className="w-full h-full object-cover object-center"
          />
          <div className="image-scrim" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center mt-20">
          <motion.p 
            initial={{ opacity: 0, letterSpacing: "0em", y: -10 }}
            animate={{ opacity: 1, letterSpacing: "0.2em", y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="text-gold-400 uppercase text-sm font-semibold mb-6 tracking-[0.2em] text-shadow-subtle drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
          >
            Nagercoil's Premier Open-Air Venue
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="text-display-md md:text-display-lg lg:text-display-xl text-cream-50 font-serif max-w-4xl mx-auto leading-tight mb-8 text-shadow-hero drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]"
          >
            Celebrate Under the <br className="hidden md:block"/> Open Sky
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button to="/book" size="lg" className="hover:scale-105 transition-transform duration-300">Book Now</Button>
            <Button to="/gallery" variant="outline" size="lg" className="hover:scale-105 transition-transform duration-300">View Gallery</Button>
          </motion.div>
        </div>
      </section>



      {/* 3. About Preview */}
      <section className="py-24 md:py-32 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={imageScale}
            className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-2xl shadow-black/50"
          >
            <img 
              src={aboutImg}
              alt="PJ Lawn Seating and Brand Wall" 
              className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
            />
            <div className="absolute inset-0 border border-white/10 rounded-xl pointer-events-none" />
          </motion.div>
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} className="text-gold-400 uppercase text-xs tracking-widest font-medium mb-4">The Venue</motion.h2>
            <motion.h3 variants={fadeUp} className="text-display-sm font-serif text-cream-100 mb-6 leading-snug">
              A Beautiful Space for Every Celebration
            </motion.h3>
            <motion.p variants={fadeUp} className="text-cream-400 leading-relaxed mb-8">
              PJ Lawn offers a relaxed, elegant outdoor setting designed to make your special moments memorable. Surrounded by tropical greenery and ambient lighting, our open-air venue is the perfect canvas for your events—from intimate family gatherings to grand wedding functions.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Button to="/about" variant="ghost" className="px-0 uppercase tracking-widest text-gold-400 hover:text-gold-300 hover:bg-transparent group">
                Discover Our Story <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">&rarr;</span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 4. Buffet/Dining Moment */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden group">
         <div className="absolute inset-0 z-0">
          <img 
            src={buffetImg}
            alt="PJ Lawn Buffet Area" 
            className="w-full h-full object-cover object-center transition-transform duration-[10s] ease-linear group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/80 via-charcoal-900/40 to-transparent" />
        </div>
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="relative z-10 text-center px-4 max-w-2xl mx-auto"
        >
          <motion.h2 variants={fadeUp} className="text-display-sm md:text-display-md font-serif text-white mb-4 text-shadow-hero drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">Exquisite Dining</motion.h2>
          <motion.p variants={fadeUp} className="text-cream-100 text-lg font-medium text-shadow-subtle drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">Perfectly suited for evening buffet events and grand dinner functions under the stars.</motion.p>
        </motion.div>
      </section>

      {/* 5. Pricing Teaser */}
      <section className="py-24 md:py-32 bg-charcoal-800/60 backdrop-blur-sm border-y border-white/5 text-center px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="max-w-3xl mx-auto">
          <motion.h2 variants={fadeUp} className="text-display-sm font-serif text-cream-100 mb-4">Your Celebration, Your Way</motion.h2>
          <motion.p variants={fadeUp} className="text-cream-400 mb-10 text-lg leading-relaxed">
            Whether you're planning a cozy get-together of 50 guests or a grand reception of 300, our flexible space adapts to your needs.
          </motion.p>
          <motion.div variants={fadeUp} className="inline-block border border-gold-500/30 p-8 rounded-2xl bg-charcoal-900/80 backdrop-blur-md shadow-2xl shadow-black/40 hover:border-gold-500/60 transition-colors duration-500">
            <p className="text-sm uppercase tracking-widest text-gold-400 mb-2">Venue Packages Starting From</p>
            <p className="text-display-md font-serif text-cream-50 mb-6">
              {startingPrice ? `₹${startingPrice.toLocaleString()}` : '...'}
            </p>
            <Button to="/book" className="hover:scale-105 transition-transform duration-300">Check Availability</Button>
          </motion.div>
        </motion.div>
      </section>

      {/* 6. Amenities */}
      <section className="relative py-32 overflow-hidden group">
        <div className="absolute inset-0 z-0">
          <img 
            src={amenitiesImg}
            alt="PJ Lawn Handwash Amenities" 
            className="w-full h-full object-cover object-center transition-transform duration-[15s] ease-linear group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-charcoal-900/80" />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="text-center mb-16">
             <motion.h2 variants={fadeUp} className="text-display-sm font-serif text-cream-100">Venue Facilities</motion.h2>
          </motion.div>
          
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} className="bg-charcoal-900/40 hover:bg-charcoal-900/80 backdrop-blur border border-white/10 hover:border-gold-500/30 p-8 text-center rounded-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CarFront className="w-12 h-12 text-gold-400 mx-auto mb-6" />
              <h3 className="text-lg font-serif text-cream-100 mb-2">Free Parking Lot</h3>
              <p className="text-cream-400 text-sm">Ample space for your guests' vehicles.</p>
            </motion.div>
            
            <motion.div variants={fadeUp} className="bg-charcoal-900/40 hover:bg-charcoal-900/80 backdrop-blur border border-white/10 hover:border-gold-500/30 p-8 text-center rounded-2xl transition-all duration-300 transform hover:-translate-y-2">
              <Toilet className="w-12 h-12 text-gold-400 mx-auto mb-6" />
              <h3 className="text-lg font-serif text-cream-100 mb-2">Restroom Available</h3>
              <p className="text-cream-400 text-sm">Clean and accessible facilities.</p>
            </motion.div>
            
            <motion.div variants={fadeUp} className="bg-charcoal-900/40 hover:bg-charcoal-900/80 backdrop-blur border border-white/10 hover:border-gold-500/30 p-8 text-center rounded-2xl transition-all duration-300 transform hover:-translate-y-2">
              <Droplets className="w-12 h-12 text-gold-400 mx-auto mb-6" />
              <h3 className="text-lg font-serif text-cream-100 mb-2">Hygienic Handwash</h3>
              <p className="text-cream-400 text-sm">Well-maintained dedicated washing area.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 7. Location & CTA */}
      <section className="py-24 container mx-auto px-4">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="grid lg:grid-cols-2 gap-0 lg:gap-12 items-stretch bg-charcoal-800 rounded-3xl overflow-hidden border border-white/5 shadow-2xl shadow-black/50"
        >
          <motion.div variants={fadeRight} className="p-8 lg:p-16 flex flex-col justify-center">
            <h2 className="text-display-sm font-serif text-cream-100 mb-8">Find Us</h2>
            
            <div className="space-y-6 mb-10">
              <div className="flex items-start space-x-4 group">
                <div className="w-10 h-10 rounded-full bg-charcoal-900 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-gold-500/50 group-hover:bg-gold-500/10 transition-colors">
                  <MapPin className="text-gold-400 w-5 h-5" />
                </div>
                <div>
                  <p className="text-cream-200 font-medium mb-1">PJ Lawn</p>
                  <p className="text-cream-400 text-sm leading-relaxed">Paul Vathiyar Compound, Gandhi Nagar,<br/> Kurusady, Nagercoil, Tamil Nadu 629004</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 group">
                <div className="w-10 h-10 rounded-full bg-charcoal-900 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-gold-500/50 group-hover:bg-gold-500/10 transition-colors">
                  <Phone className="text-gold-400 w-5 h-5" />
                </div>
                <a href="tel:+919489724975" className="text-cream-200 hover:text-gold-400 transition-colors">+91 94897 24975</a>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button to="/book" className="hover:scale-105 transition-transform duration-300">Book Your Date</Button>
              <Button variant="outline" to="/location" className="hover:scale-105 transition-transform duration-300">View Map</Button>
            </div>
          </motion.div>
          
          <motion.div variants={fadeLeft} className="h-[380px] lg:h-auto bg-charcoal-900 relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <div className="absolute top-4 right-4 z-20">
              <a
                href="https://maps.app.goo.gl/mcK4uRMVUW4g8uxRA"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-charcoal-900/90 hover:bg-gold-400 text-cream-100 hover:text-black border border-gold-500/40 text-xs font-bold px-3.5 py-2 rounded-xl backdrop-blur-md shadow-lg transition-all active:scale-95"
              >
                <span>Open in Maps ↗</span>
              </a>
            </div>
            <iframe 
              src="https://maps.google.com/maps?q=PJ+Lawn+Paul+Vathiyar+Compound+Gandhi+Nagar+Nagercoil&output=embed&z=17" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="PJ Lawn Location Map"
              className="w-full h-full"
            ></iframe>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}
