import { motion } from 'framer-motion'
import { CarFront, Toilet, Droplets, Lightbulb, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const amenitiesImg = '/gallery/6.webp'

const amenitiesList = [
  {
    icon: Zap,
    title: 'Free Electricity',
    desc: 'Uninterrupted power supply and electricity included at zero extra cost for all your lighting, sound, and event needs.',
  },
  {
    icon: CarFront,
    title: 'Free Parking',
    desc: 'Ample on-site parking space available for you and your guests, ensuring a hassle-free arrival and departure.',
  },
  {
    icon: Toilet,
    title: 'Restroom Facilities',
    desc: 'Clean, well-maintained, and easily accessible restrooms available for all guests throughout your event.',
  },
  {
    icon: Droplets,
    title: 'Handwash Area',
    desc: 'Dedicated and hygienic handwashing stations, conveniently located near the dining areas.',
  },
  {
    icon: Lightbulb,
    title: 'Ambient Lighting',
    desc: 'Beautifully arranged evening lighting to create a magical atmosphere for your night-time celebrations.',
  },
  {
    icon: Users,
    title: 'Flexible Seating (50-300)',
    desc: 'A spacious open lawn that can comfortably accommodate intimate gatherings of 50 up to grand events of 300 guests.',
  },
]

const fadeUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
}

export default function Amenities() {
  return (
    <div className="pt-32 pb-24 min-h-screen">
      
      {/* Page Header */}
      <section className="container mx-auto px-4 mb-16 text-center max-w-3xl">
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-gold-400 uppercase text-xs tracking-widest font-medium mb-4"
        >
          Facilities
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-display-lg font-serif text-cream-50"
        >
          Venue Amenities
        </motion.h1>
      </section>

      {/* Hero Image */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="relative aspect-[21/9] rounded-md overflow-hidden"
        >
          <img 
            src={amenitiesImg}
            alt="PJ Lawn Amenities" 
            className="w-full h-full object-cover"
          />
          <div className="image-scrim" />
        </motion.div>
      </section>

      {/* Amenities Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {amenitiesList.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: index * 0.1 }}
                className="bg-charcoal-800 border border-white/5 p-8 text-center rounded-md hover:bg-charcoal-800/80 transition-colors"
              >
                <Icon className="w-10 h-10 text-gold-400 mx-auto mb-6" strokeWidth={1.5} />
                <h3 className="text-xl font-serif text-cream-100 mb-4">{item.title}</h3>
                <p className="text-cream-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 text-center">
        <div className="border-t border-white/10 pt-16 max-w-2xl mx-auto">
          <h2 className="text-display-sm font-serif text-cream-100 mb-6">Ready to host your event?</h2>
          <p className="text-cream-400 mb-8">
            Experience our facilities firsthand. Book a venue visit or check availability for your preferred date.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button to="/book">Check Availability</Button>
            <Button variant="outline" to="/contact">Contact Us</Button>
          </div>
        </div>
      </section>

    </div>
  )
}
