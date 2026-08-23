import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

// Reusing some gallery images to add life to the page
import intimateImg from '@/assets/gallery/1.png?format=webp&w=800&as=url'
import layoutImg from '@/assets/gallery/2.png?format=webp&w=800&as=url'

const occasionsList = [
  { name: 'Birthday Parties', desc: 'Celebrate another trip around the sun with joy, games, and great food.' },
  { name: 'Anniversary Celebrations', desc: 'Honor years of love and togetherness in a romantic outdoor setting.' },
  { name: 'Wedding Functions', desc: 'Pre-wedding rituals, haldi, mehendi, or sangeet under the open sky.' },
  { name: 'Wedding Receptions', desc: 'A grand and elegant open-air reception to welcome the newlyweds.' },
  { name: 'Engagement Functions', desc: 'Exchange rings surrounded by nature and ambient evening lighting.' },
  { name: 'Family Functions', desc: 'Bring the whole family together for reunions and special milestones.' },
  { name: 'Get-togethers', desc: 'Casual yet beautiful gatherings for friends, colleagues, or alumni.' },
  { name: 'Private Parties', desc: 'Exclusive space for your private celebrations with customized setups.' },
  { name: 'Celebrations', desc: 'Any moment worth celebrating deserves a beautiful venue like PJ Lawn.' },
  { name: 'Social Gatherings', desc: 'Perfect for networking, club events, and community meetups.' },
  { name: 'Dinner Functions', desc: 'Elegant evening sit-down dinners with beautiful table arrangements.' },
  { name: 'Lunch/Dining Events', desc: 'Bright and cheerful daytime dining under the gentle outdoor shade.' },
  { name: 'Buffet Events', desc: 'Ample space for lavish buffet spreads and smooth guest flow.' },
  { name: 'Community Gatherings', desc: 'Spacious enough to host local community and cultural events.' },
  { name: 'Small Functions', desc: 'Intimate setups designed specifically for smaller guest counts.' },
  { name: 'Special Occasions', desc: 'If it is special to you, it is special to us. We host all unique events.' },
]

const fadeUp: any = {
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
          Occasions
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
          From intimate family milestones to grand celebrations, PJ Lawn is the perfect canvas for your special day. Explore the types of events we regularly host.
        </motion.p>
      </section>

      {/* Feature Images Break */}
      <section className="container mx-auto px-4 mb-24">
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="relative aspect-video rounded-md overflow-hidden"
          >
            <img 
              src={typeof layoutImg === 'string' ? layoutImg : (layoutImg as unknown as string)}
              alt="PJ Lawn Venue Layout" 
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.2 }}
            className="relative aspect-video rounded-md overflow-hidden"
          >
            <img 
              src={typeof intimateImg === 'string' ? intimateImg : (intimateImg as unknown as string)}
              alt="Intimate Family Gathering" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Occasions Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {occasionsList.map((occasion, index) => (
            <motion.div
              key={occasion.name}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: index * 0.05 }}
              className="bg-charcoal-800 border border-white/5 p-6 rounded-md hover:border-gold-500/30 transition-colors group"
            >
              <h3 className="text-lg font-serif text-gold-400 mb-3 group-hover:text-gold-300 transition-colors">
                {occasion.name}
              </h3>
              <p className="text-cream-400 text-sm leading-relaxed">
                {occasion.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 text-center">
        <div className="border-t border-white/10 pt-16">
          <h2 className="text-display-sm font-serif text-cream-100 mb-6">Don't see your event listed?</h2>
          <p className="text-cream-400 mb-8 max-w-2xl mx-auto">
            We are highly flexible and can accommodate custom event requirements. Reach out to us to discuss your specific needs.
          </p>
          <Button to="/book" size="lg">Request a Custom Quote</Button>
        </div>
      </section>

    </div>
  )
}
