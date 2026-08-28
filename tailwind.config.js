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
          850: '#111111',
          800: '#161616',
          750: '#1c1c1c',
          700: '#222222',
          650: '#282828',
          600: '#2e2e2e',
          500: '#383838',
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
        'gold-gradient': 'linear-gradient(135deg, #FFF6D6 0%, #F8DF8C 45%, #E6C25B 75%, #FFF0AA 100%)',
        'dark-gradient': 'linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.7) 60%, rgba(10,10,10,0.95) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
        'sparkle-twinkle': 'sparkleTwinkle 3s ease-in-out infinite',
        'sparkle-float': 'sparkleFloat 4s ease-in-out infinite',
        'chat-pulse': 'chatPulse 2.5s ease-in-out infinite',
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
        sparkleTwinkle: {
          '0%, 100%': { opacity: '0.15', transform: 'scale(0.8) rotate(0deg)' },
          '50%': { opacity: '0.45', transform: 'scale(1.1) rotate(15deg)' },
        },
        sparkleFloat: {
          '0%, 100%': { opacity: '0.12', transform: 'translateY(0px) rotate(0deg)' },
          '50%': { opacity: '0.35', transform: 'translateY(-3px) rotate(20deg)' },
        },
        chatPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 168, 76, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(201, 168, 76, 0)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      screens: {
        'xs': '375px',
      },
      borderRadius: {
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '2.5rem',
        '3xl': '3rem',
      },
    },
  },
  plugins: [],
}
