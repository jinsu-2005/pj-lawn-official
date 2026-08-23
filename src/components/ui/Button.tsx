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
      primary: 'bg-gold-500 text-charcoal-900 hover:bg-gold-400',
      secondary: 'bg-charcoal-800 text-cream-200 hover:bg-charcoal-700',
      outline: 'border border-gold-500 text-gold-400 hover:bg-gold-500/10',
      ghost: 'hover:bg-white/5 hover:text-cream-200 text-cream-400',
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
