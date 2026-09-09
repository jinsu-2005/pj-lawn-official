import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Calendar, Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="pt-32 pb-24 min-h-[85vh] flex items-center justify-center relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 max-w-2xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* 404 Badge */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gold-400/10 text-gold-400 border border-gold-400/25 text-xs font-bold uppercase tracking-widest mb-4">
            <Compass size={13} />
            <span>Error 404</span>
          </span>

          {/* Big Stylized Number (Using standard font figures) */}
          <h1 className="text-7xl sm:text-9xl font-sans font-black tracking-tighter bg-gold-gradient bg-clip-text text-transparent mb-2 drop-shadow-[0_4px_24px_rgba(201,168,76,0.3)] tabular-nums">
            404
          </h1>

          <h2 className="text-2xl sm:text-3xl font-serif text-cream-50 font-bold mb-3">
            Page Not Found
          </h2>

          <p className="text-cream-400 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed font-sans">
            The page you are looking for might have been moved, renamed, or does not exist. Let's get you back to celebrating.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
            <Button
              to="/"
              size="md"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 shadow-xl shadow-gold-400/20"
            >
              <Home size={16} />
              <span>Return to Home</span>
            </Button>
            <Button
              to="/book"
              variant="outline"
              size="md"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2"
            >
              <Calendar size={16} />
              <span>Reserve a Date</span>
            </Button>
          </div>

          {/* Quick Helpful Links */}
          <div className="pt-8 border-t border-white/5">
            <p className="text-xs uppercase tracking-wider text-cream-400 font-semibold mb-3">
              Explore PJ Lawn
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-cream-300">
              <Link to="/gallery" className="hover:text-gold-400 transition-colors">
                Photo Gallery &rarr;
              </Link>
              <Link to="/events" className="hover:text-gold-400 transition-colors">
                Events & Parties &rarr;
              </Link>
              <Link to="/amenities" className="hover:text-gold-400 transition-colors">
                Amenities &rarr;
              </Link>
              <Link to="/contact" className="hover:text-gold-400 transition-colors">
                Contact & Location &rarr;
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
