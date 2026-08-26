import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Sparkles, Heart, Utensils, Users } from 'lucide-react'

// Static images for visual sections
const intimateImg = '/gallery/1.png'
const layoutImg = '/gallery/2.png'
const buffetImg = '/gallery/4.png'

const eventCategories = [
  {
    title: 'Outdoor Dining & Gatherings',
    icon: Utensils,
    desc: 'An open-air location perfect for outdoor dining, dinner functions, and buffet gatherings. Bring people together in a relaxed outdoor setting.',
    features: ['Outdoor dining', 'Family gatherings', 'Dinner functions', 'Lunch & Buffet events', 'Social get-togethers']
  },
  {
    title: 'Birthdays & Celebrations',
    icon: Sparkles,
    desc: 'Celebrate birthday parties, anniversary celebrations, and personal milestones. A flexible space for family celebrations and private get-togethers.',
    features: ['Birthday parties', 'Anniversary celebrations', 'Family celebrations', 'Personal milestones', 'Private celebrations']
  },
  {
    title: 'Functions & Special Occasions',
    icon: Users,
    desc: 'Host private functions, family functions, and social gatherings. A welcoming outdoor environment for special celebrations and intimate gatherings.',
    features: ['Private functions', 'Family functions', 'Social gatherings', 'Engagement functions', 'Other intimate gatherings']
  },
  {
    title: 'Mini Weddings & Receptions',
    icon: Heart,
    desc: 'A beautiful open-air setting for intimate weddings and small-scale wedding receptions. Ideal for small, meaningful celebrations.',
    features: ['Mini weddings', 'Intimate weddings', 'Small-scale wedding functions', 'Small wedding receptions', 'Engagement gatherings']
  }
]

const occasionsChips = [
  'Birthday Parties', 'Anniversaries', 'Mini Weddings', 'Intimate Wedding Receptions',
  'Engagement Functions', 'Family Gatherings', 'Private Dinners', 'Buffet Events',
  'Get-Togethers', 'Social Gatherings', 'Special Celebrations'
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
}

export default function Events() {
  return (
    <div className="pt-32 pb-24 min-h-screen">
      
      {/* Page Header */}
      <section className="container mx-auto px-4 mb-20 text-center max-w-3xl">
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-gold-400 uppercase text-xs tracking-widest font-medium mb-4"
        >
          Open-Air Dining • Celebrations • Gatherings • Functions
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-display-lg font-serif text-cream-50 mb-6"
        >
          Events & Celebrations at PJ Lawn
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-cream-400 text-lg leading-relaxed"
        >
          PJ Lawn is an open-air venue designed for dining, celebrations, gatherings, and a variety of special occasions. From birthdays and anniversaries to family functions, dinner gatherings, private celebrations, and intimate mini weddings, PJ Lawn provides a relaxed outdoor setting for bringing people together.
        </motion.p>
      </section>

      {/* 3 Core Experience Categories */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {eventCategories.map((cat, idx) => {
            const Icon = cat.icon
            return (
              <motion.div
                key={cat.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: idx * 0.15 }}
                className="bg-charcoal-800/90 border border-white/5 hover:border-gold-500/30 p-8 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-xl group hover:-translate-y-1"
              >
                <div>
                  <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-6 text-gold-400 group-hover:scale-110 transition-transform">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-xl font-serif text-cream-100 mb-3 group-hover:text-gold-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-cream-400 text-sm leading-relaxed mb-6">
                    {cat.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-2">
                  {cat.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-cream-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0"></span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Feature Images Showcase */}
      <section className="container mx-auto px-4 mb-24 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="relative aspect-video md:aspect-[4/3] rounded-xl overflow-hidden border border-white/10 shadow-xl"
          >
            <img 
              src={layoutImg}
              alt="PJ Lawn Venue Layout" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </motion.div>
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.15 }}
            className="relative aspect-video md:aspect-[4/3] rounded-xl overflow-hidden border border-white/10 shadow-xl"
          >
            <img 
              src={intimateImg}
              alt="Intimate Family Gathering" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </motion.div>
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.3 }}
            className="relative aspect-video md:aspect-[4/3] rounded-xl overflow-hidden border border-white/10 shadow-xl"
          >
            <img 
              src={buffetImg}
              alt="Lawn Dining and Events" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </motion.div>
        </div>
      </section>

      {/* Occasions Chips Cloud */}
      <section className="container mx-auto px-4 mb-24 text-center max-w-4xl">
        <h3 className="text-xl font-serif text-cream-100 mb-6">Popular Events Hosted at PJ Lawn</h3>
        <div className="flex flex-wrap justify-center gap-2.5">
          {occasionsChips.map((occ, idx) => (
            <span
              key={idx}
              className="px-4 py-2 rounded-full bg-charcoal-800 border border-white/10 text-cream-200 text-xs font-medium hover:border-gold-500/40 hover:text-gold-300 transition-colors"
            >
              {occ}
            </span>
          ))}
        </div>
      </section>

      {/* Welcoming Universal CTA */}
      <section className="container mx-auto px-4 text-center max-w-3xl">
        <div className="bg-charcoal-800/90 border border-gold-500/20 p-10 sm:p-14 rounded-3xl shadow-2xl space-y-6">
          <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center mx-auto text-gold-400">
            <Users size={24} />
          </div>
          <h2 className="text-display-sm font-serif text-cream-100">Host Your Event at PJ Lawn</h2>
          <p className="text-cream-400 text-base leading-relaxed max-w-xl mx-auto">
            A beautiful, flexible open-air space for dining, gathering and celebrating, with the added ability to host intimate mini weddings and small receptions.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
            <Button to="/book" size="lg" className="shadow-lg shadow-gold-500/20 text-sm sm:text-base w-full sm:w-auto text-center px-4">
              Check Availability & Book
            </Button>
            <Button to="/location" variant="outline" size="lg" className="text-sm sm:text-base w-full sm:w-auto text-center px-4">
              View Venue Location
            </Button>
          </div>
        </div>
      </section>

    </div>
  )
}
