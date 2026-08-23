import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

// Import all gallery images
import img1 from '@/assets/gallery/1.png?format=webp&w=1200&as=url'
import img2 from '@/assets/gallery/2.png?format=webp&w=1200&as=url'
import img3 from '@/assets/gallery/3.png?format=webp&w=1200&as=url'
import img4 from '@/assets/gallery/4.png?format=webp&w=1200&as=url'
import img5 from '@/assets/gallery/5.jpg?format=webp&w=1200&as=url'
import img6 from '@/assets/gallery/6.png?format=webp&w=1200&as=url'

const galleryItems = [
  { id: 1, src: img3, alt: 'PJ Lawn Venue at Night (Hero)', span: 'md:col-span-2 md:row-span-2' },
  { id: 2, src: img5, alt: 'PJ Lawn Entrance Sign', span: 'md:col-span-1 md:row-span-2' },
  { id: 3, src: img1, alt: 'Intimate Family Gathering', span: 'md:col-span-1 md:row-span-1' },
  { id: 4, src: img2, alt: 'PJ Lawn Venue Layout', span: 'md:col-span-1 md:row-span-1' },
  { id: 5, src: img4, alt: 'Buffet Area Setup', span: 'md:col-span-2 md:row-span-1' },
  { id: 6, src: img6, alt: 'Handwash Amenities', span: 'md:col-span-1 md:row-span-1' },
]

export default function Gallery() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, startIndex: selectedIndex })

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

      {/* Masonry-ish Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[250px] gap-4">
          {galleryItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-md overflow-hidden group cursor-pointer ${item.span}`}
              onClick={() => openLightbox(index)}
            >
              <img 
                src={typeof item.src === 'string' ? item.src : (item.src as unknown as string)} 
                alt={item.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="image-scrim opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 uppercase tracking-widest text-sm font-medium">
                  View
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
                        src={typeof item.src === 'string' ? item.src : (item.src as unknown as string)}
                        alt={item.alt}
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
