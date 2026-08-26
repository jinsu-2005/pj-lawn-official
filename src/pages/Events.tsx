import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Sparkles, Heart, Utensils, Users } from 'lucide-react'

// Images for visual sections
import intimateImg from '@/assets/gallery/1.png?format=webp&w=800&as=url'
import layoutImg from '@/assets/gallery/2.png?format=webp&w=800&as=url'
import buffetImg from '@/assets/gallery/4.png?format=webp&w=800&as=url'

const eventCategories = [
  {
    title: 'Weddings & Receptions',
    icon: Heart,
    desc: 'Exchange vows and celebrate milestones surrounded by nature and warm ambient lighting. Perfect for engagements, haldi, mehendi, and grand evening receptions.',
    features: ['Illuminated evening setups', 'Open-air mandap & stage area', 'Dedicated photography zones', 'Comfortable guest seating']
  },
  {
    title: 'Birthdays & Family Celebrations',
    icon: Sparkles,
    desc: 'Celebrate another trip around the sun, anniversaries, family reunions, and milestones with your loved ones in an exclusive private lawn environment.',
    features: ['Safe & open space for kids', 'Ample free parking', 'Customizable decoration setups', 'Audio & music friendly']
  },
  {
    title: 'Outdoor Dining & Buffet Gatherings',
    icon: Utensils,
    desc: 'Host delightful sit-down dinners, festive buffet lunches, and social gatherings with smooth guest flow and dedicated catering zones.',
    features: ['Spacious buffet & serving layout', 'Hygienic hand-wash facilities', 'Daytime shade & evening breeze', 'Outside catering allowed']
  }
]

const occasionsChips = [
  'Birthday Parties', 'Anniversaries', 'Wedding Receptions', 'Engagement Functions',
  'Family Reunions', 'Private Dinners', 'Buffet Events', 'Social Meetups',
  'Cultural Gatherings', 'Corporate Dinners', 'Get-Togethers', 'Special Milestones'
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
          Occasions & Celebrations
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-display-lg font-serif text-cream-50 mb-6"
        >
          Events We Host
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-cream-400 text-lg leading-relaxed"
        >
          From intimate family gatherings to grand celebrations, our spacious open-air lawn provides the perfect natural backdrop for every special occasion.
        </motion.p>
      </section>

      {/* 3 Core Experience Categories */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              src={typeof layoutImg === 'string' ? layoutImg : (layoutImg as unknown as string)}
              alt="PJ Lawn Venue Layout" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </motion.div>
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.15 }}
            className="relative aspect-video md:aspect-[4/3] rounded-xl overflow-hidden border border-white/10 shadow-xl"
          >
            <img 
              src={typeof intimateImg === 'string' ? intimateImg : (intimateImg as unknown as string)}
              alt="Intimate Family Gathering" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </motion.div>
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.3 }}
            className="relative aspect-video md:aspect-[4/3] rounded-xl overflow-hidden border border-white/10 shadow-xl"
          >
            <img 
              src={typeof buffetImg === 'string' ? buffetImg : (buffetImg as unknown as string)}
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
          <h2 className="text-display-sm font-serif text-cream-100">Host Any Celebration at PJ Lawn</h2>
          <p className="text-cream-400 text-base leading-relaxed max-w-xl mx-auto">
            Whatever your special occasion, our open-air lawn is fully equipped and ready for your guests. Check date availability and reserve online in minutes.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
            <Button to="/book" size="lg" className="shadow-lg shadow-gold-500/20">
              Check Availability & Book
            </Button>
            <Button to="/location" variant="outline" size="lg">
              View Venue Location
            </Button>
          </div>
        </div>
      </section>

    </div>
  )
}
