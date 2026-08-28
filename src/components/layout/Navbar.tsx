import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Shield, LogOut as LogOutIcon } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { auth, googleProvider, db } from '@/lib/firebase'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import MobileBottomNav from './MobileBottomNav'
import MobileMenuSheet from './MobileMenuSheet'

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
  const [isAdmin, setIsAdmin] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

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
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileMenuOpen])


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
            <Link 
              to="/" 
              className="flex items-center gap-2.5 sm:gap-3 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:border-gold-500/40 hover:bg-black/70 transition-all select-none group flex-shrink-0 shadow-sm"
            >
              <img
                src="/logo.jpg"
                alt="PJ Lawn Logo"
                className="w-8 h-8 md:w-10 md:h-10 object-cover rounded-full border border-gold-500/30 shadow-md transition-transform duration-500 group-hover:rotate-[360deg] group-hover:scale-105"
              />
              <span className="text-lg md:text-2xl font-serif font-black tracking-[0.18em] bg-gold-gradient bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(248,223,140,0.45)] group-hover:brightness-125 transition-all duration-300 uppercase pr-1">
                PJ Lawn
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-2.5 flex-1 justify-center">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 border backdrop-blur-md',
                      isActive
                        ? 'bg-black/50 text-gold-400 border-gold-500/60 shadow-[0_0_12px_rgba(212,175,55,0.15)] font-bold scale-105'
                        : 'bg-black/50 text-cream-200 border-white/10 hover:border-gold-500/40 hover:text-gold-300 hover:bg-black/70 hover:scale-105'
                    )}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </nav>

            {/* Desktop Right */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-gold-400 border border-gold-500/30 hover:border-gold-400 bg-white/5 hover:bg-gold-400/10 rounded-md transition-all flex items-center gap-2">
                      <Shield size={14} /> Admin
                    </Link>
                  )}
                  <Link to="/dashboard" className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-cream-200 border border-white/10 hover:border-gold-400 hover:text-gold-400 bg-white/5 hover:bg-gold-400/5 rounded-md transition-all flex items-center gap-2">
                    <LayoutDashboard size={14} /> My Bookings
                  </Link>
                  <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center rounded-md bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-cream-400 hover:text-red-400 transition-all group" title="Sign Out">
                    <LogOutIcon size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                </>
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

             <div className="md:hidden flex items-center gap-2">
               <Link to="/book" className="px-4 py-2 bg-gold-400 hover:bg-gold-300 text-black text-xs font-black transition-all uppercase tracking-wider rounded-full shadow-md active:scale-95">
                 Book Now
               </Link>
             </div>

          </div>
        </div>
      </header>

      {/* Mobile Bottom Sheet Menu */}
      <MobileMenuSheet
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        isAdmin={isAdmin}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
      />

      <MobileBottomNav 
        isAdmin={isAdmin}
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />
    </>
  )
}
