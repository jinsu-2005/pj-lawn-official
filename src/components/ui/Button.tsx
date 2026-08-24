import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  asChild?: boolean
  to?: string
  href?: string
  target?: string
  rel?: string
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', to, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider rounded-md'
    
    const variants = {
      primary: 'bg-gold-500 text-charcoal-950 font-bold hover:bg-gold-400 shadow-xl shadow-black/60 hover:shadow-gold-500/25 border border-gold-400/50 transition-all duration-300',
      secondary: 'bg-charcoal-900/90 text-cream-100 backdrop-blur-md border border-white/15 hover:bg-charcoal-800 shadow-lg shadow-black/50 transition-all duration-300',
      outline: 'border-2 border-gold-400 bg-charcoal-950/80 text-gold-300 backdrop-blur-md hover:bg-gold-500/25 hover:text-gold-100 hover:border-gold-300 shadow-xl shadow-black/70 font-semibold transition-all duration-300 [text-shadow:_0_1px_4px_rgba(0,0,0,0.9)]',
      ghost: 'hover:bg-white/10 hover:text-cream-100 text-cream-300 font-medium transition-colors',
    }
    
    const sizes = {
      sm: 'h-9 px-4 text-xs',
      md: 'h-11 px-8 text-sm',
      lg: 'h-14 px-10 text-base',
    }

    const classes = cn(baseStyles, variants[variant], sizes[size], className)

    if (to) {
      return (
        <Link to={to} className={classes}>
          {props.children}
        </Link>
      )
    }

    if (props.href) {
      return (
        <a href={props.href} className={classes} target={props.target} rel={props.rel}>
          {props.children}
        </a>
      )
    }

    return (
      <button ref={ref} className={classes} {...props} />
    )
  }
)

Button.displayName = 'Button'

export { Button, cn }
