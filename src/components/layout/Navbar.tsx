import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ChevronDown, LayoutDashboard, Shield, LogOut as LogOutIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { auth, googleProvider, db } from '@/lib/firebase'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          const docRef = doc(db, 'admins', currentUser.uid)
          const docSnap = await getDoc(docRef)
          
          let isInvited = false
          if (currentUser.email) {
            const inviteRef = doc(db, 'admin_invites', currentUser.email.toLowerCase().trim())
            const inviteSnap = await getDoc(inviteRef)
            if (inviteSnap.exists()) {
              isInvited = true
            }
          }

          const isSuperAdmin = currentUser.email && [
            'jinsu.j2005@gmail.com',
            'jinsukapgreen@gmail.com'
          ].includes(currentUser.email.toLowerCase().trim())

          setIsAdmin(!!docSnap.exists() || isInvited || !!isSuperAdmin)
        } catch (e) {
          console.error("Navbar admin check failed", e)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
    })
    return () => unsubscribe()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const avatarLetter = (user?.displayName || user?.email || 'U')[0].toUpperCase()

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
    setIsDropdownOpen(false)
  }, [location.pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled || isMobileMenuOpen
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
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
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
              /* Compact avatar dropdown — keeps navbar clean for admins */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-charcoal-800 border border-gold-500/30 hover:border-gold-500/60 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-gold-500/20 border border-gold-500/50 flex items-center justify-center text-gold-400 text-xs font-bold">
                    {avatarLetter}
                  </div>
                  <ChevronDown size={14} className={cn('text-cream-400 transition-transform duration-200', isDropdownOpen ? 'rotate-180' : '')} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-charcoal-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-xs text-cream-400 truncate">{user.email}</p>
                      </div>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gold-400 hover:bg-white/5 transition-colors font-medium"
                        >
                          <Shield size={15} /> Admin Panel
                        </Link>
                      )}

                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-cream-200 hover:bg-white/5 transition-colors"
                      >
                        <LayoutDashboard size={15} /> My Dashboard
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5"
                      >
                        <LogOutIcon size={15} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 w-full h-full bg-charcoal-950 z-40 flex flex-col pt-20 pb-8 px-6 overflow-y-auto"
          >
            {/* Nav Links with dividers */}
            <nav className="flex flex-col divide-y divide-white/5">
              {navLinks.map((link, idx) => {
                const isActive = location.pathname === link.path
                return (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.25 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between py-4 text-xl font-serif transition-all',
                        isActive ? 'text-gold-400 font-bold' : 'text-cream-200'
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
                <>
                  {isAdmin && (
                    <motion.div
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: navLinks.length * 0.04, duration: 0.25 }}
                    >
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between py-4 text-xl font-serif text-gold-400 font-bold transition-all"
                      >
                        <span>Admin Panel</span>
                        <Shield size={16} className="text-gold-400/60" />
                      </Link>
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (navLinks.length + (isAdmin ? 1 : 0)) * 0.04, duration: 0.25 }}
                  >
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between py-4 text-xl font-serif transition-all',
                        location.pathname === '/dashboard' ? 'text-gold-400 font-bold' : 'text-cream-200'
                      )}
                    >
                      <span>My Dashboard</span>
                    </Link>
                  </motion.div>
                </>
              )}
            </nav>

            {/* Bottom CTA */}
            <div className="mt-auto pt-6 space-y-3">
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
