import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import SparklesCanvas from '../ui/SparklesCanvas'
import { ChatbotWidget } from '../ui/ChatbotWidget'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-charcoal-900 relative">
      <SparklesCanvas />
      <Navbar />
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  )
}
