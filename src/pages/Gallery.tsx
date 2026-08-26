import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'

// Curated default venue photos with webp optimization
import img1 from '@/assets/gallery/1.png?format=webp&w=1200&as=url'
import img2 from '@/assets/gallery/2.png?format=webp&w=1200&as=url'
import img3 from '@/assets/gallery/3.png?format=webp&w=1200&as=url'
import img4 from '@/assets/gallery/4.png?format=webp&w=1200&as=url'
import img5 from '@/assets/gallery/5.jpg?format=webp&w=1200&as=url'
import img6 from '@/assets/gallery/6.png?format=webp&w=1200&as=url'

interface GalleryItem {
  id: string | number
  src: string
  alt: string
  category?: string
  isDynamic?: boolean
}

const defaultGalleryItems: GalleryItem[] = [
  { id: 'def-3', src: typeof img3 === 'string' ? img3 : (img3 as unknown as string), alt: 'PJ Lawn Venue at Night', category: 'Venue Ambience' },
  { id: 'def-1', src: typeof img1 === 'string' ? img1 : (img1 as unknown as string), alt: 'Stage & Lawn Entrance Setup', category: 'Stage & Lawn' },
  { id: 'def-4', src: typeof img4 === 'string' ? img4 : (img4 as unknown as string), alt: 'Exquisite Buffet Dining Area', category: 'Dining & Buffet' },
  { id: 'def-2', src: typeof img2 === 'string' ? img2 : (img2 as unknown as string), alt: 'Seating Arrangement & Brand Wall', category: 'Venue Ambience' },
  { id: 'def-5', src: typeof img5 === 'string' ? img5 : (img5 as unknown as string), alt: 'Evening Event Illumination', category: 'Stage & Lawn' },
  { id: 'def-6', src: typeof img6 === 'string' ? img6 : (img6 as unknown as string), alt: 'Hygienic Handwash & Facilities', category: 'Facilities' },
]

const categories = ['All', 'Venue Ambience', 'Stage & Lawn', 'Dining & Buffet', 'Facilities']

export default function Gallery() {
  const [firestoreItems, setFirestoreItems] = useState<GalleryItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, startIndex: selectedIndex })

  // Listen to Firestore for any newly uploaded photos from Admin
  useEffect(() => {
    try {
      const q = query(collection(db, "gallery")) 
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items: GalleryItem[] = []
        snapshot.forEach(doc => {
          const data = doc.data()
          if (data.url) {
            items.push({
              id: doc.id,
              src: data.url,
              alt: data.alt || data.fileName || 'PJ Lawn Event Photo',
              category: data.category || 'Venue Ambience',
              isDynamic: true
            })
          }
        })
        setFirestoreItems(items)
      }, (error) => {
        console.warn("Firestore gallery sync note:", error.message)
      })
      return () => unsubscribe()
    } catch (err) {
      console.warn("Firestore connection note:", err)
    }
  }, [])

  // Combine dynamic Firestore uploads with default venue showcase photos
  const allGalleryItems = useMemo(() => {
    return [...firestoreItems, ...defaultGalleryItems]
  }, [firestoreItems])

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return allGalleryItems
    return allGalleryItems.filter(item => item.category === selectedCategory)
  }, [allGalleryItems, selectedCategory])

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
      <section className="container mx-auto px-4 mb-12 text-center max-w-3xl">
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs uppercase tracking-widest font-semibold mb-4"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Visual Showcase</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="text-display-md md:text-display-lg font-serif text-cream-50 mb-4"
        >
          Photo Gallery
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-cream-300 text-sm md:text-base max-w-xl mx-auto"
        >
          Explore the lush green lawns, magical open-air night ambiance, and luxury event setups at PJ Lawn.
        </motion.p>
      </section>

      {/* Category Filter Pills */}
      <section className="container mx-auto px-4 mb-10">
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-gold-500 text-charcoal-900 shadow-lg shadow-gold-500/20 font-bold'
                  : 'bg-charcoal-800 text-cream-300 hover:bg-charcoal-700 hover:text-gold-400 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Responsive Gallery Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer border border-white/5 bg-charcoal-800 shadow-lg"
              onClick={() => openLightbox(index)}
            >
              <img 
                src={item.src} 
                alt={item.alt}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* Hover overlay with title & scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <span className="text-gold-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  {item.category || 'PJ Lawn'}
                </span>
                <span className="text-cream-50 text-sm font-medium">
                  {item.alt}
                </span>
                <span className="text-white/60 text-xs mt-2 uppercase tracking-widest flex items-center gap-1 font-semibold">
                  Click to Expand &rarr;
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 z-[100] bg-charcoal-950/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            {/* Close Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation()
                closeLightbox()
              }}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full bg-charcoal-800/90 border border-white/10 text-cream-200 hover:text-gold-400 hover:border-gold-500/50 hover:bg-charcoal-700 transition-all z-[120] shadow-xl"
              aria-label="Close lightbox"
            >
              <X size={26} />
            </button>

            {/* Carousel Container */}
            <div 
              className="relative w-full max-w-6xl mx-auto px-2 md:px-12 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex touch-pan-y">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="flex-[0_0_100%] min-w-0 flex flex-col items-center justify-center h-[75vh] md:h-[80vh] px-2">
                      <img 
                        src={item.src}
                        alt={item.alt}
                        loading="lazy"
                        decoding="async"
                        className="max-w-full max-h-[85%] object-contain drop-shadow-2xl rounded-lg"
                      />
                      <p className="text-cream-200 text-sm mt-4 font-medium text-center bg-charcoal-900/60 px-4 py-1.5 rounded-full border border-white/5">
                        {item.alt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              {filteredItems.length > 1 && (
                <>
                  <button 
                    onClick={scrollPrev}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-charcoal-900/80 border border-white/10 text-cream-200 hover:text-gold-400 hover:bg-charcoal-800 transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button 
                    onClick={scrollNext}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-charcoal-900/80 border border-white/10 text-cream-200 hover:text-gold-400 hover:bg-charcoal-800 transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight size={32} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
