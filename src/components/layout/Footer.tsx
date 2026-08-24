import { Link } from 'react-router-dom'
import { MapPin, Phone } from 'lucide-react'
import { WhatsAppIcon } from '../icons/WhatsAppIcon'
import { Button } from '../ui/Button'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-charcoal-800 border-t border-white/5 pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12">
          {/* Brand & Intro */}
          <div>
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

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-serif text-cream-200 mb-4">Explore</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-cream-400 hover:text-gold-400 text-sm transition-colors">About Us</Link></li>
              <li><Link to="/events" className="text-cream-400 hover:text-gold-400 text-sm transition-colors">Occasions</Link></li>
              <li><Link to="/gallery" className="text-cream-400 hover:text-gold-400 text-sm transition-colors">Gallery</Link></li>
              <li><Link to="/amenities" className="text-cream-400 hover:text-gold-400 text-sm transition-colors">Amenities</Link></li>
              <li><Link to="/book" className="text-gold-400 hover:text-gold-300 text-sm font-medium transition-colors">Book Now</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-serif text-cream-200 mb-4">Visit Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin className="text-gold-400 shrink-0 mt-0.5" size={18} />
                <span className="text-cream-400 text-sm leading-relaxed">
                  Paul Vathiyar Compound,<br />
                  Gandhi Nagar, Kurusady,<br />
                  Nagercoil, Tamil Nadu 629004
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="text-gold-400 shrink-0" size={18} />
                <a href="tel:+919489724975" className="text-cream-400 hover:text-gold-400 text-sm transition-colors">
                  +91 94897 24975
                </a>
              </li>
              <li className="flex items-center space-x-3 pt-2">
                <Button 
                  href="https://wa.me/919489724975?text=Hi%2C%20I'd%20like%20to%20know%20more%20about%20booking%20PJ%20Lawn" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  variant="outline"
                  className="w-full sm:w-auto text-[#25D366] border-[#25D366] hover:bg-[#25D366]/10 gap-2"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  WhatsApp Us
                </Button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-cream-400/60">
          <p>&copy; {currentYear} PJ Lawn. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            {/* Optional Links for later */}
            <span className="cursor-not-allowed">Terms & Conditions</span>
            <span className="cursor-not-allowed">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
