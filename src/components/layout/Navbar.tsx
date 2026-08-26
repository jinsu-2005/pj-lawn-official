import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { auth, googleProvider } from '@/lib/firebase'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Events', path: '/events' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'Amenities', path: '/amenities' },
  { name: 'Location', path: '/location' },
  { name: 'Contact', path: '/contact' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/dashboard')
    } catch (err) {
      console.error("Login failed:", err)
    }
  }

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/')
    })
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-charcoal-900/95 md:bg-charcoal-900/80 backdrop-blur-md border-b border-white/5 py-3 md:py-2.5'
          : 'bg-transparent md:bg-charcoal-900/80 md:backdrop-blur-md md:border-b md:border-white/5 py-5 md:py-3'
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 select-none group">
            <img 
              src="/logo.jpg" 
              alt="PJ Lawn Logo" 
              className="w-10 h-10 md:w-11 h-11 object-cover rounded-full border border-gold-500/30 shadow-md transition-transform duration-500 group-hover:rotate-[360deg] group-hover:scale-105" 
            />
            <span className="text-2xl md:text-3xl font-serif font-black tracking-[0.2em] bg-gold-gradient bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:brightness-110 transition-all duration-300 uppercase">
              PJ Lawn
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'text-sm tracking-wide transition-colors hover:text-gold-400',
                  location.pathname === link.path ? 'text-gold-400 font-medium' : 'text-cream-200'
                )}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className={cn(
                    'text-sm tracking-wide transition-colors hover:text-gold-400',
                    location.pathname === '/dashboard' ? 'text-gold-400 font-medium' : 'text-cream-200'
                  )}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm tracking-wide text-cream-200 hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="text-sm tracking-wide text-cream-200 hover:text-gold-400 transition-colors"
              >
                Login
              </button>
            )}
            <Link
              to="/book"
              className="px-6 py-2.5 bg-gold-400 hover:bg-gold-300 text-black text-sm font-black transition-all uppercase tracking-widest rounded-md shadow-md hover:shadow-gold-400/25"
            >
              Book Now
            </Link>
          </nav>

          {/* Mobile Menu Interactive Button */}
          <button
            className="md:hidden flex items-center gap-2 px-3 py-1.5 rounded-full bg-charcoal-800/80 border border-gold-500/30 text-cream-100 hover:text-gold-300 hover:border-gold-500/60 transition-all shadow-md active:scale-95 z-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
              {isMobileMenuOpen ? 'Close' : 'Menu'}
            </span>
            <div className="w-5 h-5 flex items-center justify-center text-gold-400">
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Luxury Fullscreen Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="md:hidden fixed inset-0 top-0 left-0 right-0 bottom-0 min-h-screen w-full bg-charcoal-950/95 backdrop-blur-2xl z-40 flex flex-col justify-between pt-24 pb-8 px-6 overflow-y-auto"
          >
            {/* Nav Links */}
            <nav className="flex flex-col space-y-2 py-4">
              {navLinks.map((link, idx) => {
                const isActive = location.pathname === link.path
                return (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between text-2xl font-serif py-2.5 transition-all',
                        isActive
                          ? 'text-gold-400 font-bold pl-2 border-l-2 border-gold-400'
                          : 'text-cream-200 hover:text-gold-300 hover:pl-2'
                      )}
                    >
                      <span>{link.name}</span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-gold-400 shadow-[0_0_8px_rgba(212,175,55,0.8)]"></span>
                      )}
                    </Link>
                  </motion.div>
                )
              })}

              {user && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.04, duration: 0.3 }}
                >
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center justify-between text-2xl font-serif py-2.5 transition-all',
                      location.pathname === '/dashboard'
                        ? 'text-gold-400 font-bold pl-2 border-l-2 border-gold-400'
                        : 'text-cream-200 hover:text-gold-300 hover:pl-2'
                    )}
                  >
                    <span>Dashboard</span>
                  </Link>
                </motion.div>
              )}
            </nav>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              <Link
                to="/book"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center py-4 bg-gold-400 hover:bg-gold-300 text-charcoal-950 font-black text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-gold-500/20 active:scale-98 transition-all"
              >
                Book Venue Now
              </Link>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <a
                  href="https://wa.me/919489724975"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] font-semibold text-xs transition-all hover:bg-[#25D366]/25"
                >
                  WhatsApp Us
                </a>

                {user ? (
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center justify-center py-3 px-4 rounded-xl bg-charcoal-800 border border-white/10 text-red-400 font-semibold text-xs transition-all hover:bg-red-500/10"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleLogin()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center justify-center py-3 px-4 rounded-xl bg-charcoal-800 border border-white/10 text-cream-200 hover:text-gold-300 font-semibold text-xs transition-all hover:bg-charcoal-700"
                  >
                    Customer Login
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
