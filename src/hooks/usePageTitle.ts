import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, string> = {
  '/': 'PJ Lawn — Open-Air Event Venue in Nagercoil, Tamil Nadu',
  '/about': 'Our Story & Venue | PJ Lawn',
  '/events': 'Weddings & Celebrations | PJ Lawn',
  '/gallery': 'Photo Gallery & Moments | PJ Lawn',
  '/amenities': 'Amenities & Facilities | PJ Lawn',
  '/location': 'Location & Directions | PJ Lawn',
  '/contact': 'Contact & Inquiries | PJ Lawn',
  '/book': 'Book Your Event | PJ Lawn',
  '/dashboard': 'My Reservations | PJ Lawn',
  '/admin': 'Management Dashboard | PJ Lawn',
  '/terms': 'Terms & Conditions | PJ Lawn',
  '/privacy': 'Privacy Policy | PJ Lawn',
  '/refund-policy': 'Refund & Cancellation Policy | PJ Lawn'
}

export function usePageTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const title = PAGE_TITLES[pathname] || 'Page Not Found | PJ Lawn'
    document.title = title
  }, [pathname])
}
