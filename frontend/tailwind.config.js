// File: tailwind.config.js
// Path: frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    "./src/styles/**/*.css"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Brand Colors (Purple Theme)
      colors: {
        // Primary Purple Gradient
        primary: {
          50: '#f3f1ff',
          100: '#ebe5ff',
          200: '#d9ceff',
          300: '#bea6ff',
          400: '#9f75ff',
          500: '#8b5cf6',  // Main brand color
          600: '#7c3aed',  // Darker purple
          700: '#6d28d9',
          800: '#5b21b6',  // Deep purple for sidebar
          900: '#4c1d95',
          950: '#2e1065'
        },

        // Secondary Accent Colors
        accent: {
          yellow: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f'
          },
          blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a'
          },
          pink: {
            50: '#fdf2f8',
            100: '#fce7f3',
            200: '#fbcfe8',
            300: '#f9a8d4',
            400: '#f472b6',
            500: '#ec4899',
            600: '#db2777',
            700: '#be185d',
            800: '#9d174d',
            900: '#831843'
          },
          green: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b'
          },
          teal: {
            50: '#f0fdfa',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a'
          }
        },

        // Neutral Colors
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712'
        },

        // Semantic Colors
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',

        // Background & Surface
        background: {
          primary: '#f3f4f6',    // Light gray background for main content
          secondary: '#ffffff',   // White background
          card: '#ffffff',        // White cards
          sidebar: '#1e1b4b',     // Deep purple sidebar
          modal: 'rgba(30, 27, 75, 0.8)'
        },

        // Text Colors
        text: {
          primary: '#1f2937',     // Dark text
          secondary: '#6b7280',   // Gray text
          inverse: '#ffffff',     // White text
          accent: '#8b5cf6'       // Purple accent text
        },

        // Border Colors
        border: {
          light: '#e5e7eb',
          medium: '#d1d5db',
          dark: '#374151',
          accent: '#8b5cf6'
        }
      },

      // Gradient Backgrounds
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-purple': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
        'gradient-blue': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        'gradient-card': 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #4c1d95 0%, #2e1065 100%)', // Deep purple gradient
        'gradient-hero': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #8b5cf6 100%)',

        // Course Card Gradients
        'gradient-yellow': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        'gradient-pink': 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        'gradient-teal': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        'gradient-orange': 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
      },

      // Box Shadows (3D effect)
      boxShadow: {
        'soft': '0 2px 15px 0 rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 25px 0 rgba(0, 0, 0, 0.08)',
        'large': '0 10px 40px 0 rgba(0, 0, 0, 0.12)',
        'card': '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 30px 0 rgba(139, 92, 246, 0.15)', // Purple glow on hover
        'purple': '0 4px 20px 0 rgba(139, 92, 246, 0.3)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.5)',

        // Inner shadows
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'inner-medium': 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.1)'
      },

      // Border Radius
      borderRadius: {
        'xl': '1rem',     // 16px
        '2xl': '1.5rem',  // 24px  
        '3xl': '2rem',    // 32px
        'card': '1.25rem',   // 20px for cards
        'button': '0.75rem' // 12px for buttons
      },

      // Spacing (8px grid system)
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
      },

      // Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        thai: ['Sarabun', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif']
      },

      // Animation & Transitions
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
        '600': '600ms'
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'gradient-shift': 'gradientShift 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite'
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        bounceSoft: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-8px)' },
          '60%': { transform: 'translateY(-4px)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },

      // Backdrop Blur
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),

    // Custom Plugin for Component Classes
    function ({ addComponents, theme }) {
      addComponents({
        // Card Components
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.card'),
          boxShadow: theme('boxShadow.card'),
          transition: 'all 0.3s ease',
          border: `1px solid ${theme('colors.gray.100')}`,
          '&:hover': {
            boxShadow: theme('boxShadow.card-hover'),
            transform: 'translateY(-2px)',
            borderColor: theme('colors.primary.100')
          }
        },

        // Button Components
        '.btn-primary': {
          background: theme('backgroundImage.gradient-purple'),
          color: theme('colors.white'),
          borderRadius: theme('borderRadius.button'),
          padding: '0.75rem 1.5rem',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          border: 'none',
          cursor: 'pointer',
          boxShadow: theme('boxShadow.purple'),
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.glow')
          },
          '&:active': {
            transform: 'translateY(0)'
          }
        },

        '.btn-secondary': {
          backgroundColor: theme('colors.white'),
          color: theme('colors.primary.600'),
          border: `2px solid ${theme('colors.primary.100')}`,
          borderRadius: theme('borderRadius.button'),
          padding: '0.75rem 1.5rem',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: theme('colors.primary.50'),
            borderColor: theme('colors.primary.200'),
            transform: 'translateY(-1px)'
          }
        },

        // Gradient Text
        '.text-gradient': {
          background: theme('backgroundImage.gradient-purple'),
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        },

        // Glass Effect
        '.glass': {
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        },

        '.glass-dark': {
          backgroundColor: 'rgba(30, 27, 75, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        },

        // Sidebar Styling
        '.sidebar': {
          background: theme('backgroundImage.gradient-sidebar'),
          color: theme('colors.white')
        },

        // Course Card Variants
        '.course-card-yellow': {
          background: theme('backgroundImage.gradient-yellow')
        },
        '.course-card-pink': {
          background: theme('backgroundImage.gradient-pink')
        },
        '.course-card-teal': {
          background: theme('backgroundImage.gradient-teal')
        },
        '.course-card-blue': {
          background: theme('backgroundImage.gradient-blue')
        }
      })
    }
  ]
}