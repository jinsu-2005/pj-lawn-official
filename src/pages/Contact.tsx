import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Phone } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { Button } from '@/components/ui/Button'

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission for now (Phase 2 will integrate EmailJS)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
      setTimeout(() => setIsSuccess(false), 5000)
    }, 1500)
  }

  return (
    <div className="pt-32 pb-24 min-h-screen">
      
      {/* Page Header */}
      <section className="container mx-auto px-4 mb-16 text-center max-w-3xl">
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-gold-400 uppercase text-xs tracking-widest font-medium mb-4"
        >
          Get in Touch
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-display-lg font-serif text-cream-50 mb-6"
        >
          Contact Us
        </motion.h1>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
          >
            <h2 className="text-display-sm font-serif text-cream-100 mb-6">We'd love to hear from you</h2>
            <p className="text-cream-400 text-lg mb-10 leading-relaxed max-w-md">
              Whether you have a question about availability, pricing, or want to schedule a venue tour, our team is ready to answer all your questions.
            </p>
            
            <div className="space-y-8 mb-12">
              <div className="flex items-start gap-4 p-6 bg-charcoal-800 rounded-md border border-white/5">
                <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center shrink-0">
                  <Phone className="text-gold-400" size={24} />
                </div>
                <div>
                  <h3 className="text-cream-100 font-medium mb-1">Call Us Directly</h3>
                  <p className="text-cream-400 text-sm mb-2">Available 9am to 8pm daily</p>
                  <a href="tel:+919489724975" className="text-gold-400 font-medium hover:text-gold-300 transition-colors">
                    +91 94897 24975
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-charcoal-800 rounded-md border border-white/5">
                <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="text-cream-100 font-medium mb-1">WhatsApp Chat</h3>
                  <p className="text-cream-400 text-sm mb-2">Quickest way to get a response</p>
                  <Button 
                    href="https://wa.me/919489724975?text=Hi%2C%20I'd%20like%20to%20know%20more%20about%20booking%20PJ%20Lawn" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    variant="outline"
                    className="text-[#25D366] border-[#25D366] hover:bg-[#25D366]/10 gap-2 h-9 px-4 text-xs mt-2"
                  >
                    Start a conversation
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-charcoal-800 border border-white/5 p-8 sm:p-10 rounded-md"
          >
            <h3 className="text-2xl font-serif text-cream-100 mb-6">Send a Message</h3>
            
            {isSuccess ? (
              <div className="bg-gold-500/10 border border-gold-500/30 text-gold-400 p-6 rounded-md text-center">
                <p className="font-medium text-lg mb-2">Thank you!</p>
                <p className="text-sm">Your message has been sent successfully. We will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xs uppercase tracking-widest text-cream-400 font-medium">Full Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      required
                      className="w-full bg-charcoal-900 border border-white/10 rounded-md px-4 py-3 text-cream-200 focus:outline-none focus:border-gold-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-xs uppercase tracking-widest text-cream-400 font-medium">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      required
                      className="w-full bg-charcoal-900 border border-white/10 rounded-md px-4 py-3 text-cream-200 focus:outline-none focus:border-gold-500 transition-colors"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs uppercase tracking-widest text-cream-400 font-medium">Email Address (Optional)</label>
                  <input 
                    type="email" 
                    id="email" 
                    className="w-full bg-charcoal-900 border border-white/10 rounded-md px-4 py-3 text-cream-200 focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="text-xs uppercase tracking-widest text-cream-400 font-medium">Message</label>
                  <textarea 
                    id="message" 
                    rows={4}
                    required
                    className="w-full bg-charcoal-900 border border-white/10 rounded-md px-4 py-3 text-cream-200 focus:outline-none focus:border-gold-500 transition-colors resize-none"
                    placeholder="Tell us about your event..."
                  ></textarea>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full h-14 text-base mt-2"
                >
                  {isSubmitting ? 'Sending...' : (
                    <span className="flex items-center gap-2">
                      Send Message <Send size={18} />
                    </span>
                  )}
                </Button>
              </form>
            )}
          </motion.div>

        </div>
      </section>
    </div>
  )
}
