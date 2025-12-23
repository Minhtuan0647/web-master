module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Custom breakpoints for better mobile experience
        'mobile': '320px',
        'mobile-lg': '425px',
        'tablet': '768px',
        'desktop': '1024px',
        'desktop-lg': '1440px',
      },
      colors: {
        primary: {
          DEFAULT: '#d4af37',
          50: '#faf8f0',
          100: '#f5f0e1',
          200: '#e8dcc3',
          300: '#d4af37',
          400: '#c19d2f',
          500: '#d4af37',
          600: '#b8941f',
          700: '#9a7a1a',
          800: '#7c6015',
          900: '#5e4610',
        },
        accent: {
          DEFAULT: '#d4af37',
          light: '#e8dcc3',
          dark: '#b8941f',
        },
        dark: {
          DEFAULT: '#222222',
          light: '#555555',
          lighter: '#888888',
        },
        text: {
          primary: '#ffffff',
          secondary: '#eeeeee',
          tertiary: '#cccccc',
          muted: '#888888',
          accent: '#d4af37',
        },
        bg: {
          primary: '#222222',
          secondary: '#555555',
          tertiary: '#888888',
          light: '#ffffff',
        },
        button: {
          DEFAULT: '#333333',
          hover: '#444444',
          accent: '#d4af37',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'serif': ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.8s ease-out',
        'slide-in-left': 'slideInLeft 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.6s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(50px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'large': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(212, 175, 55, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
