import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 rounded-2xl bg-charcoal-850 border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gold-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gold-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="w-14 h-14 rounded-full bg-gold-400/10 border border-gold-400/25 text-gold-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gold-400/10">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <span className="text-[11px] font-bold text-gold-400 uppercase tracking-widest block mb-1">
              Notice
            </span>
            <h2 className="text-xl sm:text-2xl font-serif text-cream-50 font-bold mb-3">
              Something Went Unexpectedly Wrong
            </h2>
            <p className="text-xs sm:text-sm text-cream-400 mb-6 leading-relaxed font-sans">
              An unexpected glitch occurred while rendering this page. Refreshing usually fixes this instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gold-400 hover:bg-gold-300 text-black font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-gold-400/15"
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-charcoal-750 hover:bg-charcoal-700 text-cream-200 border border-white/10 font-bold text-xs uppercase tracking-wider transition-all"
              >
                <Home size={14} />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
