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
    const baseStyles = 'inline-flex items-center justify-center font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-widest rounded-md'
    
    const variants = {
      primary: 'bg-gold-400 text-black font-black hover:bg-gold-300 shadow-xl shadow-black/60 hover:shadow-gold-400/30 border border-gold-300/60 transition-all duration-300',
      secondary: 'bg-charcoal-900/90 text-cream-100 backdrop-blur-md border border-white/15 hover:bg-charcoal-800 shadow-lg shadow-black/50 transition-all duration-300 font-bold',
      outline: 'border-2 border-gold-400 bg-charcoal-950/80 text-gold-300 backdrop-blur-md hover:bg-gold-400 hover:text-black hover:border-gold-300 shadow-xl shadow-black/70 font-extrabold transition-all duration-300 [text-shadow:_0_1px_4px_rgba(0,0,0,0.9)]',
      ghost: 'hover:bg-white/10 hover:text-cream-100 text-cream-300 font-bold transition-colors',
    }
    
    const sizes = {
      sm: 'min-h-[2.5rem] px-5 py-2 text-sm font-extrabold',
      md: 'min-h-[3rem] px-8 py-2.5 text-base font-black',
      lg: 'min-h-[3.5rem] px-10 py-3 text-lg font-black tracking-[0.1em]',
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
