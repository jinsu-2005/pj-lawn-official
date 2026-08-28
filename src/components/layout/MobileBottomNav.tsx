import { Link, useLocation } from 'react-router-dom'
import { Home, Image as ImageIcon, Calendar, Menu, X, Shield } from 'lucide-react'

// Basic fallback for cn since we might not have it reliably imported from @/lib/utils if the alias is tricky
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface MobileBottomNavProps {
  isAdmin?: boolean
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

export default function MobileBottomNav({
  isAdmin = false,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: MobileBottomNavProps) {
  const location = useLocation()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9990] bg-charcoal-950/90 backdrop-blur-md border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around px-2 py-2">
        
        {/* Home */}
        <Link 
          to="/" 
          onClick={() => setIsMobileMenuOpen(false)}
          className={cn(
            "flex flex-col items-center justify-center w-16 gap-1 p-1 transition-colors",
            location.pathname === '/' ? "text-gold-400" : "text-cream-400 hover:text-cream-200"
          )}
        >
          <Home size={22} className={cn("transition-transform", location.pathname === '/' && "scale-110")} />
          <span className="text-[10px] font-semibold tracking-wider uppercase">Home</span>
        </Link>

        {/* Gallery */}
        <Link 
          to="/gallery" 
          onClick={() => setIsMobileMenuOpen(false)}
          className={cn(
            "flex flex-col items-center justify-center w-16 gap-1 p-1 transition-colors",
            location.pathname === '/gallery' ? "text-gold-400" : "text-cream-400 hover:text-cream-200"
          )}
        >
          <ImageIcon size={22} className={cn("transition-transform", location.pathname === '/gallery' && "scale-110")} />
          <span className="text-[10px] font-semibold tracking-wider uppercase">Gallery</span>
        </Link>

        {/* Bookings / Admin Portal */}
        {isAdmin ? (
          <Link 
            to="/admin" 
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center w-16 gap-1 p-1 transition-colors relative",
              location.pathname === '/admin' ? "text-gold-400" : "text-cream-400 hover:text-cream-200"
            )}
          >
            <Shield size={22} className={cn("transition-transform", location.pathname === '/admin' && "scale-110 text-gold-400")} />
            <span className="text-[10px] font-bold tracking-wider uppercase text-gold-400">Admin</span>
          </Link>
        ) : (
          <Link 
            to="/dashboard" 
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center w-16 gap-1 p-1 transition-colors relative",
              location.pathname === '/dashboard' ? "text-gold-400" : "text-cream-400 hover:text-cream-200"
            )}
          >
            <Calendar size={22} className={cn("transition-transform", location.pathname === '/dashboard' && "scale-110")} />
            <span className="text-[10px] font-semibold tracking-wider uppercase">Bookings</span>
          </Link>
        )}

        {/* Menu (Hamburger) */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={cn(
            "flex flex-col items-center justify-center w-16 gap-1 p-1 transition-colors",
            isMobileMenuOpen ? "text-gold-400" : "text-cream-400 hover:text-cream-200"
          )}
        >
          {isMobileMenuOpen ? (
            <X size={24} className="transition-transform rotate-90" />
          ) : (
            <Menu size={24} className="transition-transform" />
          )}
          <span className="text-[10px] font-semibold tracking-wider uppercase">
            {isMobileMenuOpen ? 'Close' : 'Menu'}
          </span>
        </button>

      </div>
    </div>
  )
}
