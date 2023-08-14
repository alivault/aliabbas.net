/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-circle': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        link: 'hsl(var(--link))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      typography: {
        DEFAULT: {
          css: {
            a: { color: 'hsl(var(--link))', textDecoration: 'none' },
            'a:hover': { textDecoration: 'underline' },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            code: {
              backgroundColor: 'hsl(var(--foreground) / 15%)',
              padding: '0.125rem 0.25rem 0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
            },
            'pre > code': { display: 'grid' },
            pre: { padding: '1rem 0 1rem 0 !important' },
            '[data-line]': { padding: '0 1rem 0 1rem' },
            '[data-highlighted-line]': {
              backgroundColor: 'hsl(0 0% 100% / 10%)',
              borderLeftColor: 'hsl(var(--primary))',
              borderLeftWidth: '2px',
            },
            '.contains-task-list': {
              paddingLeft: '0.5rem !important',
            },
            '.task-list-item': {
              listStyleType: 'none',
              paddingLeft: '0 !important',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            },
            '.task-list-item > input[type="checkbox"]': {
              margin: '0 !important',
              width: '1rem !important',
              height: '1rem !important',
            },
          },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}
