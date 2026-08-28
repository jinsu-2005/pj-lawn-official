import { Link } from 'react-router-dom'
import { MapPin, Phone } from 'lucide-react'
import { WhatsAppIcon } from '../icons/WhatsAppIcon'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-charcoal-850 border-t border-white/5 pt-12 pb-36 md:pt-16 md:pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-10">
          
          {/* Brand & Intro — Desktop only */}
          <div className="hidden md:block">
            <div className="flex items-center gap-3 mb-4 select-none">
              <img 
                src="/logo.jpg" 
                alt="PJ Lawn Logo" 
                className="w-10 h-10 md:w-11 h-11 object-cover rounded-full border border-gold-500/30 shadow-md" 
              />
              <h3 className="text-2xl md:text-3xl font-serif font-black tracking-[0.2em] bg-gold-gradient bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] uppercase">
                PJ Lawn
              </h3>
            </div>
            <p className="text-cream-400 text-sm leading-relaxed max-w-xs">
              An elegant open-air outdoor event venue in Nagercoil. Perfect for weddings, birthdays, anniversaries, and family gatherings under the open sky.
            </p>
          </div>

          {/* Quick Links — 2-column grid on mobile for compact elegance */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-gold-400 font-bold mb-4">Quick Links</h4>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-sm">
              <Link to="/about" className="text-cream-300 hover:text-gold-400 transition-colors">About Us</Link>
              <Link to="/events" className="text-cream-300 hover:text-gold-400 transition-colors">Events</Link>
              <Link to="/gallery" className="text-cream-300 hover:text-gold-400 transition-colors">Gallery</Link>
              <Link to="/amenities" className="text-cream-300 hover:text-gold-400 transition-colors">Amenities</Link>
              <Link to="/location" className="text-cream-300 hover:text-gold-400 transition-colors">Location</Link>
              <Link to="/book" className="text-gold-400 hover:text-gold-300 font-bold transition-colors">Book Venue →</Link>
            </div>
          </div>

          {/* Address and Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-gold-400 font-bold mb-4">Venue & Contact</h4>
            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="text-gold-400 shrink-0 mt-0.5" size={16} />
                <p className="text-cream-300 leading-relaxed text-xs sm:text-sm">
                  Paul Vathiyar Compound, Gandhi Nagar,<br className="hidden sm:inline" /> Kurusady, Nagercoil, TN 629004
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-gold-400 shrink-0" size={16} />
                <a href="tel:+919489724975" className="text-cream-300 hover:text-gold-400 font-medium transition-colors text-sm">
                  +91 94897 24975
                </a>
              </div>
              <div className="pt-1">
                <a 
                  href="https://wa.me/919489724975?text=Hi%2C%20I'd%20like%20to%20know%20more%20about%20booking%20PJ%20Lawn" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] font-bold text-xs uppercase tracking-wider transition-all active:scale-98"
                >
                  <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal & Copyright */}
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-cream-400/60 gap-4 text-center md:text-left">
          <p>&copy; {currentYear} PJ Lawn. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-medium">
            <Link to="/terms" className="hover:text-gold-400 transition-colors">Terms & Conditions</Link>
            <span className="text-white/10 hidden sm:inline">•</span>
            <Link to="/privacy" className="hover:text-gold-400 transition-colors">Privacy Policy</Link>
            <span className="text-white/10 hidden sm:inline">•</span>
            <Link to="/refund-policy" className="hover:text-gold-400 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
