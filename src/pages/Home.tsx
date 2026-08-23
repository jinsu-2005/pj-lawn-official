import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Toilet, CarFront, Droplets } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getPricingTiers } from '@/lib/bookingService'

// Import images with imagetools query (they'll be optimized at build)
import heroImg from '@/assets/gallery/3.png?format=webp&w=1920&as=url'
import aboutImg from '@/assets/gallery/2.png?format=webp&w=800&as=url'
import buffetImg from '@/assets/gallery/4.png?format=webp&w=1920&as=url'
import amenitiesImg from '@/assets/gallery/6.png?format=webp&w=1920&as=url'

const occasions = [
  'Birthday Parties', 'Anniversary Celebrations', 'Wedding Functions', 
  'Wedding Receptions', 'Engagement Functions', 'Family Functions', 
  'Get-togethers', 'Private Parties', 'Celebrations', 'Social Gatherings', 
  'Dinner Functions', 'Lunch/Dining Events', 'Buffet Events', 
  'Community Gatherings', 'Small Functions', 'Special Occasions'
]

const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
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
            src={typeof heroImg === 'string' ? heroImg : (heroImg as unknown as string)} 
            alt="PJ Lawn Venue at Night" 
            className="w-full h-full object-cover object-center"
          />
          <div className="image-scrim" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center mt-20">
          <motion.p 
            initial={{ opacity: 0, letterSpacing: "0em" }}
            animate={{ opacity: 1, letterSpacing: "0.2em" }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-gold-400 uppercase text-sm font-medium mb-6"
          >
            Nagercoil's Premier Open-Air Venue
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-display-md md:text-display-lg lg:text-display-xl text-cream-50 font-serif max-w-4xl mx-auto leading-tight mb-8"
          >
            Celebrate Under the <br className="hidden md:block"/> Open Sky
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button to="/book" size="lg">Book Now</Button>
            <Button to="/gallery" variant="outline" size="lg">View Gallery</Button>
          </motion.div>
        </div>
      </section>

      {/* 2. Occasions Strip (Infinite scroll animation) */}
      <section className="py-12 border-b border-white/5 bg-charcoal-900 overflow-hidden flex whitespace-nowrap">
        <div className="animate-shimmer flex gap-4 pr-4 w-[200%]">
          {[...occasions, ...occasions].map((occasion, i) => (
            <span key={i} className="px-6 py-2 rounded-full border border-white/10 text-cream-400 text-sm tracking-wide">
              {occasion}
            </span>
          ))}
        </div>
      </section>

      {/* 3. About Preview */}
      <section className="py-24 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="relative aspect-[4/3] rounded-md overflow-hidden"
          >
            <img 
              src={typeof aboutImg === 'string' ? aboutImg : (aboutImg as unknown as string)}
              alt="PJ Lawn Seating and Brand Wall" 
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
          >
            <h2 className="text-gold-400 uppercase text-xs tracking-widest font-medium mb-4">The Venue</h2>
            <h3 className="text-display-sm font-serif text-cream-100 mb-6 leading-snug">
              A Beautiful Space for Every Celebration
            </h3>
            <p className="text-cream-400 leading-relaxed mb-8">
              PJ Lawn offers a relaxed, elegant outdoor setting designed to make your special moments memorable. Surrounded by tropical greenery and ambient lighting, our open-air venue is the perfect canvas for your events—from intimate family gatherings to grand wedding functions.
            </p>
            <Button to="/about" variant="ghost" className="px-0 uppercase tracking-widest text-gold-400 hover:text-gold-300 hover:bg-transparent">
              Discover Our Story &rarr;
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 4. Buffet/Dining Moment */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
         <div className="absolute inset-0 z-0">
          <img 
            src={typeof buffetImg === 'string' ? buffetImg : (buffetImg as unknown as string)}
            alt="PJ Lawn Buffet Area" 
            className="w-full h-full object-cover object-center"
          />
          <div className="image-scrim" />
        </div>
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="relative z-10 text-center px-4 max-w-2xl mx-auto"
        >
          <h2 className="text-display-sm md:text-display-md font-serif text-white mb-4">Exquisite Dining Arrangements</h2>
          <p className="text-cream-200 text-lg">Perfectly suited for evening buffet events and grand dinner functions under the stars.</p>
        </motion.div>
      </section>

      {/* 5. Pricing Teaser */}
      <section className="py-24 bg-charcoal-800 text-center px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-3xl mx-auto">
          <h2 className="text-display-sm font-serif text-cream-100 mb-4">Your Celebration, Your Way</h2>
          <p className="text-cream-400 mb-10 text-lg leading-relaxed">
            Whether you're planning a cozy get-together of 50 guests or a grand reception of 300, our flexible space adapts to your needs.
          </p>
          <div className="inline-block border border-gold-500/30 p-8 rounded-md bg-charcoal-900">
            <p className="text-sm uppercase tracking-widest text-gold-400 mb-2">Venue Packages Starting From</p>
            <p className="text-display-md font-serif text-cream-50 mb-6">
              {startingPrice ? `₹${startingPrice.toLocaleString()}` : '...'}
            </p>
            <Button to="/book">Check Availability</Button>
          </div>
        </motion.div>
      </section>

      {/* 6. Amenities */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={typeof amenitiesImg === 'string' ? amenitiesImg : (amenitiesImg as unknown as string)}
            alt="PJ Lawn Handwash Amenities" 
            className="w-full h-full object-cover object-center"
          />
          <div className="image-scrim" />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
             <h2 className="text-display-sm font-serif text-cream-100">Venue Facilities</h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-charcoal-900/60 backdrop-blur border border-white/5 p-8 text-center rounded-md">
              <CarFront className="w-12 h-12 text-gold-400 mx-auto mb-6" />
              <h3 className="text-lg font-serif text-cream-100 mb-2">Free Parking Lot</h3>
              <p className="text-cream-400 text-sm">Ample space for your guests' vehicles.</p>
            </motion.div>
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="bg-charcoal-900/60 backdrop-blur border border-white/5 p-8 text-center rounded-md">
              <Toilet className="w-12 h-12 text-gold-400 mx-auto mb-6" />
              <h3 className="text-lg font-serif text-cream-100 mb-2">Restroom Available</h3>
              <p className="text-cream-400 text-sm">Clean and accessible facilities.</p>
            </motion.div>
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-charcoal-900/60 backdrop-blur border border-white/5 p-8 text-center rounded-md">
              <Droplets className="w-12 h-12 text-gold-400 mx-auto mb-6" />
              <h3 className="text-lg font-serif text-cream-100 mb-2">Hygienic Handwash</h3>
              <p className="text-cream-400 text-sm">Well-maintained dedicated washing area.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. Location & CTA */}
      <section className="py-24 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center bg-charcoal-800 rounded-md overflow-hidden border border-white/5">
          <div className="p-8 lg:p-16">
            <h2 className="text-display-sm font-serif text-cream-100 mb-8">Find Us</h2>
            
            <div className="space-y-6 mb-10">
              <div className="flex items-start space-x-4">
                <MapPin className="text-gold-400 shrink-0 mt-1" />
                <div>
                  <p className="text-cream-200 font-medium mb-1">PJ Lawn</p>
                  <p className="text-cream-400 text-sm leading-relaxed">Paul Vathiyar Compound, Gandhi Nagar,<br/> Kurusady, Nagercoil, Tamil Nadu 629004</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Phone className="text-gold-400 shrink-0" />
                <a href="tel:+919489724975" className="text-cream-200 hover:text-gold-400 transition-colors">+91 94897 24975</a>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button to="/book">Book Your Date</Button>
              <Button variant="outline" to="/location">View Map</Button>
            </div>
          </div>
          
          <div className="h-full min-h-[400px] bg-charcoal-900">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3949.4215286282823!2d77.41261!3d8.17810!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b04f1a2c2b6f123%3A0x1234567890abcdef!2sGandhi%20Nagar%2C%20Kurusady%2C%20Nagercoil%2C%20Tamil%20Nadu%20629004!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="PJ Lawn Location Map"
              className="w-full h-full grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  )
}
