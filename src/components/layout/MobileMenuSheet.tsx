import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Shield, 
  Sparkles, 
  MapPin, 
  PartyPopper, 
  Info, 
  Phone, 
  LogOut,
  User
} from 'lucide-react'

interface MobileMenuSheetProps {
  isOpen: boolean
  onClose: () => void
  user: any
  isAdmin: boolean
  handleLogin: () => void
  handleLogout: () => void
}

export default function MobileMenuSheet({
  isOpen,
  onClose,
  user,
  isAdmin,
  handleLogin,
  handleLogout
}: MobileMenuSheetProps) {
  const location = useLocation()

  const navItems = [
    { name: 'About', path: '/about', icon: Info },
    { name: 'Amenities', path: '/amenities', icon: Sparkles },
    { name: 'Events', path: '/events', icon: PartyPopper },
    { name: 'Location', path: '/location', icon: MapPin },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[9997]"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="md:hidden fixed bottom-0 left-0 right-0 max-h-[85vh] bg-charcoal-950 border-t border-white/10 rounded-t-3xl shadow-2xl z-[9998] flex flex-col overflow-hidden"
          >
            {/* Grab Handle */}
            <div className="pt-3 pb-1 flex justify-center cursor-grab" onClick={onClose}>
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-white/5">
              <span className="text-xs font-bold tracking-widest text-cream-400 uppercase">
                Menu
              </span>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-cream-300 hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3.5 overflow-y-auto">
              
              {/* 2x2 Clean Navigation Grid */}
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-gold-500/15 border-gold-500/40 text-gold-400 font-bold'
                          : 'bg-charcoal-900 border-white/5 text-cream-200 hover:border-gold-500/30'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-gold-400' : 'text-cream-400'} />
                      <span className="text-xs font-semibold">{item.name}</span>
                    </Link>
                  )
                })}
              </div>


              {/* Quick Contact & Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="https://wa.me/919489724975"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] font-bold text-xs"
                >
                  WhatsApp
                </a>
                <a
                  href="tel:+919489724975"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-charcoal-900 border border-white/10 text-cream-200 font-semibold text-xs"
                >
                  <Phone size={13} className="text-gold-400" />
                  Call Us
                </a>
              </div>

              {/* Primary Action Buttons */}
              {isAdmin ? (
                <div className="space-y-2">
                  <Link
                    to="/admin"
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-98"
                  >
                    <Shield size={14} className="text-black" />
                    <span>Open Admin Portal</span>
                  </Link>
                  <Link
                    to="/book"
                    onClick={onClose}
                    className="w-full flex items-center justify-center py-2.5 bg-charcoal-900 hover:bg-charcoal-850 border border-white/10 text-cream-200 hover:text-gold-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-98"
                  >
                    + Reserve a Date (Book)
                  </Link>
                </div>
              ) : (
                <Link
                  to="/book"
                  onClick={onClose}
                  className="w-full flex items-center justify-center py-3 bg-gold-400 hover:bg-gold-300 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-98"
                >
                  Book Venue Now
                </Link>
              )}

              {/* User Session Bar */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      {isAdmin ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-gold-400 text-black text-[10px] font-black uppercase tracking-wider">
                          Admin
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                      )}
                      <span className="text-[11px] text-cream-400 truncate max-w-[140px]">
                        {user.displayName || user.email?.split('@')[0]}
                      </span>
                    </div>
                    <button
                      onClick={() => { handleLogout(); onClose(); }}
                      className="flex items-center gap-1 text-[11px] text-red-400 font-semibold px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={11} /> Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { handleLogin(); onClose(); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 border border-white/10 text-cream-200 hover:text-gold-400 font-bold text-xs uppercase tracking-wider transition-all active:scale-98 shadow-sm"
                  >
                    <User size={13} className="text-gold-400" />
                    <span>User Login</span>
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
