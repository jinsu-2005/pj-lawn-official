/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Charcoal backgrounds
        charcoal: {
          900: '#0a0a0a',
          800: '#111111',
          700: '#1a1a1a',
          600: '#242424',
          500: '#2e2e2e',
        },
        // Warm gold accents
        gold: {
          300: '#f0d878',
          400: '#e8c96d',
          500: '#c9a84c',
          600: '#b8922e',
          700: '#9a7520',
        },
        // Cream / off-white text
        cream: {
          50: '#fefdf9',
          100: '#faf6ec',
          200: '#f5f0e8',
          300: '#ede5d0',
          400: '#d9cdb5',
        },
        // Tropical green accent (sparingly)
        lawn: {
          900: '#0f1f08',
          800: '#1a3310',
          700: '#2d5016',
          600: '#3d6b1e',
          500: '#4e8626',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg':  ['3rem',    { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-md':  ['2.25rem', { lineHeight: '1.2',  letterSpacing: '-0.01em' }],
        'display-sm':  ['1.875rem',{ lineHeight: '1.25' }],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #c9a84c 0%, #e8c96d 50%, #c9a84c 100%)',
        'dark-gradient': 'linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.7) 60%, rgba(10,10,10,0.95) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}
