import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Lenis from 'lenis'

// Layout
import Layout from './components/layout/Layout'

// Public Pages
import Home from './pages/Home'
import About from './pages/About'
import Events from './pages/Events'
import Gallery from './pages/Gallery'
import Amenities from './pages/Amenities'
import Location from './pages/Location'
import Contact from './pages/Contact'
import Booking from './pages/Booking'

import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

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

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <BrowserRouter>
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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
