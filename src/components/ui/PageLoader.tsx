export default function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center" aria-label="Loading page content">
      <div className="relative flex items-center justify-center w-16 h-16 mb-4">
        {/* Ambient Gold Glow Backing */}
        <div className="absolute inset-0 rounded-full bg-gold-400/20 blur-xl animate-pulse" />
        
        {/* Rotating Subtle Gold Ring */}
        <div className="w-12 h-12 rounded-full border-2 border-gold-400/20 border-t-gold-400 animate-spin" />
        
        {/* Center Diamond Star Icon */}
        <div className="absolute text-gold-400">
          <svg className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>
      </div>
      
      <p className="text-xs uppercase tracking-widest text-gold-400 font-semibold mb-1">
        PJ Lawn
      </p>
      <p className="text-xs text-cream-400/70 tracking-wide font-sans">
        Loading celebration experience...
      </p>
    </div>
  )
}
