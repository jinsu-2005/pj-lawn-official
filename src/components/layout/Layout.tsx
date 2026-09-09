import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import SparklesCanvas from '../ui/SparklesCanvas'
import { ChatbotWidget } from '../ui/ChatbotWidget'
import { AuthProvider } from '@/context/AuthContext'
import ErrorBoundary from '../ui/ErrorBoundary'

export default function Layout() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-charcoal-900 relative">
        <SparklesCanvas />
        <Navbar />
        <main className="flex-1 relative">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        <Footer />
        <ChatbotWidget />
      </div>
    </AuthProvider>
  )
}
