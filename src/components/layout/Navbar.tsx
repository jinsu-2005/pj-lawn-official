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

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-cream-200 hover:text-gold-400 transition-colors p-3 -mr-3"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-charcoal-800 border-b border-white/10 overflow-hidden"
          >
            <nav className="flex flex-col px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'block text-lg py-2 transition-colors',
                    location.pathname === link.path ? 'text-gold-400' : 'text-cream-200'
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 mt-2 border-t border-white/10 space-y-4">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="block text-lg py-2 transition-colors text-cream-200 hover:text-gold-400"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left text-lg py-2 transition-colors text-red-400"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="block w-full text-left text-lg py-2 transition-colors text-cream-200 hover:text-gold-400"
                  >
                    Login
                  </button>
                )}
                <Link
                  to="/book"
                  className="block w-full text-center px-5 py-3 bg-gold-400 hover:bg-gold-300 text-black text-base font-bold uppercase tracking-wider mt-4 rounded-md shadow-md"
                >
                  Book Now
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
