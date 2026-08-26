import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, startIndex: selectedIndex })

  useEffect(() => {
    const q = query(collection(db, "gallery")) 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: any[] = []
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }))
      items.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
      setGalleryItems(items)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching gallery:", error)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  // Sync embla to selectedIndex when opened
  useEffect(() => {
    if (emblaApi && lightboxOpen) {
      emblaApi.scrollTo(selectedIndex, true)
    }
  }, [emblaApi, lightboxOpen, selectedIndex])

  // Handle keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') scrollPrev()
      if (e.key === 'ArrowRight') scrollNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, scrollPrev, scrollNext])

  return (
    <div className="pt-32 pb-24 min-h-screen">
      
      {/* Page Header */}
      <section className="container mx-auto px-4 mb-16 text-center max-w-3xl">
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-gold-400 uppercase text-xs tracking-widest font-medium mb-4"
        >
          Visuals
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-display-lg font-serif text-cream-50"
        >
          Photo Gallery
        </motion.h1>
      </section>

      {/* Masonry Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-charcoal-800 animate-pulse rounded-md w-full" style={{ height: `${Math.floor(Math.random() * 200) + 200}px` }}></div>
            ))}
          </div>
        ) : galleryItems.length === 0 ? (
          <div className="text-center py-24 text-cream-400">
            <p>The gallery is currently empty.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
            {galleryItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="relative rounded-md overflow-hidden group cursor-pointer inline-block w-full"
                onClick={() => openLightbox(index)}
              >
                <img 
                  src={item.url} 
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="image-scrim opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center absolute inset-0">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 uppercase tracking-widest text-sm font-medium">
                    View
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-charcoal-900/95 backdrop-blur-md flex items-center justify-center"
          >
            {/* Close Button */}
            <button 
              onClick={closeLightbox}
              className="absolute top-6 right-6 text-cream-200 hover:text-gold-400 transition-colors z-[110]"
              aria-label="Close lightbox"
            >
              <X size={32} />
            </button>

            {/* Carousel Container */}
            <div className="relative w-full max-w-6xl mx-auto px-12">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex touch-pan-y">
                  {galleryItems.map((item) => (
                    <div key={item.id} className="flex-[0_0_100%] min-w-0 flex items-center justify-center h-[80vh]">
                      <img 
                        src={item.url}
                        alt={item.alt}
                        loading="lazy"
                        decoding="async"
                        className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-md"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button 
                onClick={scrollPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-cream-200 hover:text-gold-400 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft size={48} strokeWidth={1} />
              </button>
              <button 
                onClick={scrollNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-cream-200 hover:text-gold-400 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight size={48} strokeWidth={1} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
