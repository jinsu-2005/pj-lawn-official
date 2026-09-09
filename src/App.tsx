import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import Lenis from 'lenis'

// Layout & UI
import Layout from './components/layout/Layout'
import PageLoader from './components/ui/PageLoader'
import { usePageTitle } from './hooks/usePageTitle'

// Eager Primary Landing Page (Instant First Contentful Paint)
import Home from './pages/Home'

// Route-Level Code Splitting for Sub-Pages (Dramatically Shrinks Main Bundle)
const About = lazy(() => import('./pages/About'))
const Events = lazy(() => import('./pages/Events'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Amenities = lazy(() => import('./pages/Amenities'))
const Location = lazy(() => import('./pages/Location'))
const Contact = lazy(() => import('./pages/Contact'))
const Booking = lazy(() => import('./pages/Booking'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Admin = lazy(() => import('./pages/Admin'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'))
const NotFound = lazy(() => import('./pages/NotFound'))

declare global {
  interface Window {
    appLenis?: Lenis;
  }
}

function NavigationHandler() {
  const { pathname } = useLocation()
  usePageTitle()

  useEffect(() => {
    if (window.appLenis) {
      window.appLenis.scrollTo(0, { immediate: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname])

  return null
}

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    window.appLenis = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
      window.appLenis = undefined
    }
  }, [])

  return (
    <BrowserRouter>
      <NavigationHandler />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="events" element={<Events />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="amenities" element={<Amenities />} />
            <Route path="location" element={<Location />} />
            <Route path="contact" element={<Contact />} />
            <Route path="book" element={<Booking />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admin" element={<Admin />} />
            <Route path="terms" element={<Terms />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="refund-policy" element={<RefundPolicy />} />
            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
