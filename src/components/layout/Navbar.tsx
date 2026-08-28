import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ChevronDown, LayoutDashboard, Shield, LogOut as LogOutIcon, Calendar } from 'lucide-react'
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
  { name: 'My Bookings', path: '/dashboard' },
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
            if (inviteSnap.exists()) isInvited = true
          }
          const isSuperAdmin = currentUser.email && [
            'jinsu.j2005@gmail.com',
            'jinsukapgreen@gmail.com'
          ].includes(currentUser.email.toLowerCase().trim())
          setIsAdmin(!!docSnap.exists() || isInvited || !!isSuperAdmin)
        } catch {
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/dashboard')
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/'))
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsDropdownOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileMenuOpen])

  const avatarLetter = (user?.displayName || user?.email || 'U')[0].toUpperCase()
  const photoURL = user?.photoURL || null
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Guest'

  return (
    <>
      {/* Header */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-[9999] transition-all duration-300',
          isScrolled || isMobileMenuOpen
            ? 'bg-charcoal-950/98 backdrop-blur-md border-b border-white/5 py-3 md:py-2.5'
            : 'bg-transparent md:bg-charcoal-950/90 md:backdrop-blur-md md:border-b md:border-white/5 py-5 md:py-3'
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 select-none group flex-shrink-0">
              <img
                src="/logo.jpg"
                alt="PJ Lawn Logo"
                className="w-9 h-9 md:w-11 md:h-11 object-cover rounded-full border border-gold-500/30 shadow-md transition-transform duration-500 group-hover:rotate-[360deg] group-hover:scale-105"
              />
              <span className="text-xl md:text-3xl font-serif font-black tracking-[0.2em] bg-gold-gradient bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:brightness-110 transition-all duration-300 uppercase">
                PJ Lawn
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 flex-1 justify-center">
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
            </nav>

            {/* Desktop Right */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-charcoal-800 border border-gold-500/30 hover:border-gold-500/60 transition-all"
                  >
                    {photoURL ? (
                      <img src={photoURL} alt={displayName} className="w-7 h-7 rounded-full object-cover border border-gold-500/40" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gold-500/20 border border-gold-500/50 flex items-center justify-center text-gold-400 text-xs font-bold">
                        {avatarLetter}
                      </div>
                    )}
                    <span className="text-xs text-cream-300 max-w-[80px] truncate hidden lg:block">{displayName}</span>
                    <ChevronDown size={13} className={cn('text-cream-400 transition-transform duration-200', isDropdownOpen ? 'rotate-180' : '')} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-charcoal-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="px-4 py-3.5 border-b border-white/5 flex items-center gap-3">
                          {photoURL ? (
                            <img src={photoURL} alt={displayName} className="w-9 h-9 rounded-full object-cover border border-gold-500/30" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold">
                              {avatarLetter}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm text-cream-100 font-medium truncate">{displayName}</p>
                            <p className="text-xs text-cream-400 truncate">{user.email}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-sm text-gold-400 hover:bg-white/5 transition-colors font-medium">
                            <Shield size={15} /> Admin Panel
                          </Link>
                        )}
                        <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm text-cream-200 hover:bg-white/5 transition-colors">
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
                  className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-cream-200 border border-white/10 hover:border-gold-400 hover:text-gold-400 bg-white/5 hover:bg-gold-400/5 rounded-md transition-all"
                >
                  Login
                </button>
              )}
              <Link to="/book" className="px-5 py-2.5 bg-gold-400 hover:bg-gold-300 text-black text-sm font-black transition-all uppercase tracking-widest rounded-md shadow-md hover:shadow-gold-400/25">
                Book Now
              </Link>
            </div>

            {/* Mobile Right: Avatar (taps to dashboard) + Menu button */}
            <div className="md:hidden flex items-center gap-2">
              {user ? (
                <Link to="/dashboard" className="relative flex-shrink-0" title="My Dashboard">
                  {photoURL ? (
                    <img src={photoURL} alt={displayName} className="w-8 h-8 rounded-full object-cover border-2 border-gold-500/60 shadow-md" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gold-500/20 border-2 border-gold-500/50 flex items-center justify-center text-gold-400 text-sm font-bold shadow-md">
                      {avatarLetter}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-charcoal-900" />
                </Link>
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-3 py-1.5 text-xs font-semibold text-gold-400 border border-gold-500/40 rounded-full hover:bg-gold-500/10 transition-all"
                >
                  Login
                </button>
              )}
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-charcoal-800/90 border border-gold-500/30 text-gold-400 hover:border-gold-500/60 transition-all active:scale-95"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {isMobileMenuOpen ? 'Close' : 'Menu'}
                </span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/75 z-[9997]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="md:hidden fixed top-0 right-0 bottom-0 w-[85vw] max-w-[340px] bg-charcoal-950 z-[9998] flex flex-col shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                  <img src="/logo.jpg" alt="PJ Lawn" className="w-7 h-7 rounded-full border border-gold-500/30" />
                  <span className="text-base font-serif font-black tracking-widest bg-gold-gradient bg-clip-text text-transparent uppercase">PJ Lawn</span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-cream-300 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* User card inside drawer */}
              {user && (
                <div className="flex items-center gap-3 px-5 py-3.5 bg-charcoal-900/60 border-b border-white/5">
                  {photoURL ? (
                    <img src={photoURL} alt={displayName} className="w-10 h-10 rounded-full object-cover border-2 border-gold-500/40" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gold-500/20 border-2 border-gold-500/40 flex items-center justify-center text-gold-400 text-base font-bold">
                      {avatarLetter}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-cream-100 truncate">{displayName}</p>
                    <p className="text-[11px] text-cream-400 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-3 py-2">
                <div className="divide-y divide-white/5">
                  {navLinks.map((link, idx) => {
                    const isActive = location.pathname === link.path
                    return (
                      <motion.div
                        key={link.path}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.2 }}
                      >
                        <Link
                          to={link.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center justify-between py-3.5 px-3 text-[15px] font-medium rounded-lg transition-all',
                            isActive ? 'text-gold-400' : 'text-cream-200 hover:text-gold-300'
                          )}
                        >
                          <span>{link.name}</span>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_6px_rgba(212,175,55,0.8)]" />}
                        </Link>
                      </motion.div>
                    )
                  })}

                  {user && (
                    <>
                      {isAdmin && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: navLinks.length * 0.04 }}>
                          <Link
                            to="/admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-2 py-3.5 px-3 text-[15px] font-semibold text-gold-400 hover:text-gold-300 transition-all"
                          >
                            <Shield size={14} /> Admin Panel
                          </Link>
                        </motion.div>
                      )}
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (navLinks.length + (isAdmin ? 1 : 0)) * 0.04 }}>
                        <Link
                          to="/dashboard"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-2 py-3.5 px-3 text-[15px] font-medium transition-all',
                            location.pathname === '/dashboard' ? 'text-gold-400' : 'text-cream-200 hover:text-gold-300'
                          )}
                        >
                          <Calendar size={14} /> My Bookings
                        </Link>
                      </motion.div>
                    </>
                  )}
                </div>
              </nav>

              {/* Bottom actions */}
              <div className="px-4 pb-6 pt-3 border-t border-white/5 space-y-2.5">
                <Link
                  to="/book"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center py-3.5 bg-gold-400 hover:bg-gold-300 text-charcoal-950 font-black text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-gold-500/20 transition-all"
                >
                  Book Venue Now
                </Link>
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href="https://wa.me/919489724975"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] font-semibold text-xs transition-all hover:bg-[#25D366]/25"
                  >
                    WhatsApp Us
                  </a>
                  {user ? (
                    <button
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false) }}
                      className="flex items-center justify-center py-2.5 rounded-xl bg-charcoal-800 border border-white/10 text-red-400 font-semibold text-xs transition-all hover:bg-red-500/10"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <button
                      onClick={() => { handleLogin(); setIsMobileMenuOpen(false) }}
                      className="flex items-center justify-center py-2.5 rounded-xl bg-charcoal-800 border border-white/10 text-cream-200 hover:text-gold-300 font-semibold text-xs transition-all"
                    >
                      Customer Login
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
