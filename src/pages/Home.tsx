import { useState, useEffect } from 'react'
import { motion, type Variants } from 'framer-motion'
import { 
  MapPin, 
  Phone, 
  Toilet, 
  CarFront, 
  Droplets, 
  Zap, 
  Lightbulb, 
  Users, 
  Utensils, 
  Sparkles, 
  Heart, 
  Clock,
  ArrowRight
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { Button } from '@/components/ui/Button'
import { getPricingTiers } from '@/lib/bookingService'

// Venue Photography Assets
const heroImg = '/gallery/3.webp'
const aboutImg = '/gallery/2.webp'
const buffetImg = '/gallery/4.webp'
const intimateImg = '/gallery/1.webp'
const entranceImg = '/gallery/5.webp'

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] as any } }
}

const imageScale: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] as any } }
}

const eventCards = [
  {
    title: 'Outdoor Dining & Gatherings',
    icon: Utensils,
    tag: 'Dinner & Buffet Functions'
  },
  {
    title: 'Birthdays & Milestones',
    icon: Sparkles,
    tag: 'Celebrations & Parties'
  },
  {
    title: 'Mini Weddings & Receptions',
    icon: Heart,
    tag: 'Intimate Ceremonies'
  },
  {
    title: 'Family & Social Functions',
    icon: Users,
    tag: 'Get-Togethers'
  }
]

const amenitiesList = [
  { icon: Zap, title: 'Free Electricity' },
  { icon: CarFront, title: 'Free On-Site Parking' },
  { icon: Toilet, title: 'Clean Restrooms' },
  { icon: Droplets, title: 'Handwash Area' },
  { icon: Lightbulb, title: 'Ambient Night Lights' },
  { icon: Users, title: '50 – 300 Capacity' }
]

const galleryShowcase = [
  { src: heroImg, title: 'Illuminated Night Lawn' },
  { src: buffetImg, title: 'Buffet & Dining Area' },
  { src: intimateImg, title: 'Open-Air Lawn' },
  { src: entranceImg, title: 'Venue Entrance' }
]

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
    <div className="w-full overflow-hidden pb-12 md:pb-0">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[92dvh] sm:min-h-[100dvh] flex items-center justify-center overflow-hidden pt-20 pb-12">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            alt="PJ Lawn Venue at Night" 
            className="w-full h-full object-cover object-center"
            fetchPriority="high"
          />
          <div className="image-scrim" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-xl">
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 sm:mb-6"
          >
            <p className="text-gold-400 uppercase text-xs sm:text-sm font-bold tracking-[0.22em] max-w-xs mx-auto leading-relaxed">
              Nagercoil's Premier Open-Air<br />Venue
            </p>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-4xl sm:text-6xl md:text-7xl text-cream-50 font-serif leading-[1.15] mb-8 sm:mb-10 text-shadow-hero drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]"
          >
            Celebrate Under the <br /> Open Sky
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-3.5 max-w-xs sm:max-w-sm mx-auto w-full"
          >
            <Button 
              to="/book" 
              size="lg" 
              className="w-full py-4 text-sm font-black tracking-widest uppercase rounded-2xl bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 text-black shadow-[0_8px_24px_rgba(201,168,76,0.35)] hover:brightness-110 hover:scale-105 active:scale-98 transition-all duration-300 border-none"
            >
              Book Now
            </Button>
            <Button 
              to="/gallery" 
              variant="outline" 
              size="lg" 
              className="w-full py-4 text-sm font-black tracking-widest uppercase rounded-2xl bg-black/40 backdrop-blur-md border border-gold-400/60 text-gold-300 shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:bg-gold-400 hover:text-black hover:scale-105 active:scale-98 transition-all duration-300"
            >
              View Gallery
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 2. VENUE HIGHLIGHT STRIP */}
      <section className="bg-charcoal-950 border-y border-white/5 py-3.5 px-4 overflow-x-auto">
        <div className="container mx-auto flex items-center justify-start md:justify-center gap-5 md:gap-8 text-xs sm:text-sm text-cream-300 font-medium whitespace-nowrap min-w-max md:min-w-0">
          <span className="flex items-center gap-1.5 text-gold-400">
            <Sparkles size={13} /> Open Lawn
          </span>
          <span className="text-white/15">•</span>
          <span className="flex items-center gap-1.5 text-cream-200">
            <Users size={13} className="text-gold-400" /> 50 – 300 Guests
          </span>
          <span className="text-white/15">•</span>
          <span className="flex items-center gap-1.5 text-cream-200">
            <Zap size={13} className="text-gold-400" /> Free Electricity
          </span>
          <span className="text-white/15">•</span>
          <span className="flex items-center gap-1.5 text-cream-200">
            <CarFront size={13} className="text-gold-400" /> Free Parking
          </span>
          <span className="text-white/15">•</span>
          <span className="flex items-center gap-1.5 text-cream-200">
            <MapPin size={13} className="text-gold-400" /> Kurusady, Nagercoil
          </span>
        </div>
      </section>

      {/* 3. ABOUT SECTION (CLEAN & MINIMAL) */}
      <section className="py-16 sm:py-24 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-14 items-center">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-60px" }}
            variants={imageScale}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group"
          >
            <img 
              src={aboutImg}
              alt="PJ Lawn Venue Setting" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />
          </motion.div>

          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl lg:text-4xl font-serif text-cream-100 mb-4 leading-snug">
              A Beautiful Space for Every Celebration
            </motion.h2>
            <motion.p variants={fadeUp} className="text-cream-400 text-sm sm:text-base leading-relaxed mb-6">
              PJ Lawn offers a relaxed, elegant outdoor setting designed to make your special moments memorable. Surrounded by tropical greenery and ambient lighting, our open-air venue is the perfect canvas for your events—from intimate family gatherings to grand wedding functions.
            </motion.p>
            
            <motion.div variants={fadeUp}>
              <Button 
                to="/about" 
                variant="outline"
                size="sm"
                className="group inline-flex items-center gap-2 hover:scale-105 transition-all text-xs font-bold"
              >
                <span>Discover Our Story</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 4. EVENTS SECTION (CLEAN GRID) */}
      <section className="py-16 sm:py-20 bg-charcoal-850 border-y border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-gold-400 uppercase text-xs tracking-widest font-semibold mb-1.5">
                Events & Occasions
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-cream-100">
                Crafted for Every Celebration
              </h2>
            </div>
            <Button 
              to="/events" 
              variant="outline"
              size="sm"
              className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold"
            >
              <span>All Events</span>
              <ArrowRight size={13} />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {eventCards.map((event) => {
              const Icon = event.icon
              return (
                <div 
                  key={event.title}
                  className="bg-charcoal-900/90 border border-white/5 hover:border-gold-500/30 p-5 rounded-xl transition-all duration-300 shadow-md group hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mb-3.5 group-hover:scale-110 transition-transform">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-base font-serif text-cream-100 mb-1 group-hover:text-gold-300 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-cream-400 text-xs font-medium">
                    {event.tag}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5. AMENITIES SECTION (COMPACT BADGE GRID) */}
      <section className="py-16 sm:py-20 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-gold-400 uppercase text-xs tracking-widest font-semibold mb-1.5">
              Facilities
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-cream-100">
              Venue Amenities
            </h2>
          </div>
          <Button 
            to="/amenities" 
            variant="outline"
            size="sm"
            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold"
          >
            <span>All Amenities</span>
            <ArrowRight size={13} />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {amenitiesList.map((item) => {
            const Icon = item.icon
            return (
              <div 
                key={item.title}
                className="bg-charcoal-800/80 hover:bg-charcoal-800 border border-white/5 hover:border-gold-500/30 p-4 rounded-xl text-center transition-all duration-300 shadow-sm group hover:-translate-y-1"
              >
                <div className="w-9 h-9 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mx-auto mb-2.5 group-hover:scale-110 transition-transform">
                  <Icon size={18} />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-cream-200 group-hover:text-gold-300 transition-colors">
                  {item.title}
                </h3>
              </div>
            )
          })}
        </div>
      </section>

      {/* 6. CURATED GALLERY PREVIEW */}
      <section className="py-16 sm:py-20 bg-charcoal-850 border-y border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-gold-400 uppercase text-xs tracking-widest font-semibold mb-1.5">
                Photo Gallery
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-cream-100">
                Venue Moments
              </h2>
            </div>
            <Button 
              to="/gallery" 
              variant="outline"
              size="sm"
              className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold"
            >
              <span>Full Gallery</span>
              <ArrowRight size={13} />
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {galleryShowcase.map((photo) => (
              <div 
                key={photo.title}
                className="relative aspect-square rounded-xl overflow-hidden border border-white/10 shadow-md group"
              >
                <img 
                  src={photo.src} 
                  alt={photo.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <p className="text-cream-100 text-xs sm:text-sm font-medium truncate">{photo.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PRICING & DATE CHECK */}
      <section className="py-16 sm:py-20 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-cream-100 mb-3">
            Your Celebration, Your Way
          </h2>
          <p className="text-cream-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Whether you're planning a cozy get-together of 50 guests or a grand reception of 300, our flexible space adapts to your needs.
          </p>
        </div>

        <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-charcoal-800/90 border border-gold-500/30 shadow-2xl relative">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gold-400/10 text-gold-400 border border-gold-400/25 text-[11px] font-semibold uppercase tracking-wider mb-4">
            <Clock size={13} />
            <span>Evening Session (5:00 PM – 10:00 PM)</span>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-serif text-cream-100 mb-1">Venue Package Starts From</h3>
          <p className="text-3xl sm:text-4xl font-serif text-gold-300 font-bold mb-4">
            {startingPrice ? `₹${startingPrice.toLocaleString('en-IN')}` : '₹15,000'}
          </p>

          <Button 
            to="/book" 
            size="md"
            className="shadow-lg hover:scale-105 transition-transform text-xs font-black"
          >
            Check Availability
          </Button>
        </div>
      </section>

      {/* 8. LOCATION & CONTACT (CLEAN & DIRECT) */}
      <section className="py-16 sm:py-20 bg-charcoal-900 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-stretch bg-charcoal-800/90 rounded-2xl overflow-hidden border border-white/10 p-6 sm:p-8">
            
            {/* Left: Contact Info */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-gold-400 uppercase text-xs tracking-widest font-semibold mb-1.5">
                  Location & Contact
                </p>
                <h2 className="text-2xl sm:text-3xl font-serif text-cream-100 mb-5">
                  Visit PJ Lawn
                </h2>
                
                <div className="space-y-4 mb-6 text-xs sm:text-sm">
                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-gold-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-cream-200 font-medium">Paul Vathiyar Compound</p>
                      <p className="text-cream-400 text-xs">Gandhi Nagar, Kurusady, Nagercoil 629004</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gold-400 shrink-0" />
                    <a href="tel:+919489724975" className="text-cream-100 hover:text-gold-400 font-bold transition-colors">
                      +91 94897 24975
                    </a>
                  </div>

                  {/* WhatsApp */}
                  <div className="pt-0.5">
                    <a 
                      href="https://wa.me/919489724975?text=Hi%2C%20I'd%20like%20to%20know%20more%20about%20booking%20PJ%20Lawn" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] font-bold text-xs transition-all"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>WhatsApp Chat</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-white/10">
                <Button 
                  to="/location" 
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto text-xs font-bold"
                >
                  Directions & Map
                </Button>
                <Button 
                  to="/contact" 
                  size="sm"
                  className="w-full sm:w-auto text-xs font-black"
                >
                  Contact Us
                </Button>
              </div>
            </div>
            
            {/* Right: Map Embed */}
            <div className="min-h-[220px] sm:min-h-[280px] bg-charcoal-900 relative rounded-xl overflow-hidden border border-white/10">
              <div className="absolute top-2.5 right-2.5 z-20">
                <a
                  href="https://maps.app.goo.gl/mcK4uRMVUW4g8uxRA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-charcoal-900/90 hover:bg-gold-400 text-cream-100 hover:text-black border border-gold-500/40 text-[11px] font-bold px-2.5 py-1 rounded backdrop-blur-md shadow transition-all"
                >
                  <span>Open in Maps ↗</span>
                </a>
              </div>
              <iframe 
                src="https://maps.google.com/maps?q=PJ+Lawn+Paul+Vathiyar+Compound+Gandhi+Nagar+Nagercoil&t=k&output=embed&z=17" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="PJ Lawn Location Map"
                className="w-full h-full min-h-[220px]"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
