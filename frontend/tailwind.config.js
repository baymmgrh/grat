/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            h1: {
              color: '#111827',
              fontWeight: '800',
              fontSize: '2.25rem',
              marginTop: '0',
              marginBottom: '1rem',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '0.5rem',
            },
            h2: {
              color: '#1f2937',
              fontWeight: '700',
              fontSize: '1.5rem',
              marginTop: '2rem',
              marginBottom: '1rem',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '0.25rem',
            },
            h3: {
              color: '#374151',
              fontWeight: '600',
              fontSize: '1.25rem',
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
            },
            h4: {
              color: '#4b5563',
              fontWeight: '600',
              fontSize: '1.125rem',
            },
            p: {
              marginTop: '0.75rem',
              marginBottom: '0.75rem',
            },
            a: {
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: '500',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            strong: {
              color: '#111827',
              fontWeight: '600',
            },
            code: {
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: '500',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: '#1f2937',
              color: '#e5e7eb',
              borderRadius: '0.5rem',
              padding: '1rem',
              overflowX: 'auto',
              fontSize: '0.875rem',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: 'inherit',
              padding: '0',
            },
            blockquote: {
              borderLeftColor: '#3b82f6',
              borderLeftWidth: '4px',
              backgroundColor: '#eff6ff',
              padding: '1rem',
              borderRadius: '0 0.5rem 0.5rem 0',
              fontStyle: 'normal',
              color: '#1e40af',
            },
            'blockquote p:first-of-type::before': {
              content: '""',
            },
            'blockquote p:last-of-type::after': {
              content: '""',
            },
            ul: {
              listStyleType: 'disc',
              paddingLeft: '1.5rem',
            },
            ol: {
              listStyleType: 'decimal',
              paddingLeft: '1.5rem',
            },
            li: {
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
            },
            table: {
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '1rem',
              marginBottom: '1rem',
            },
            thead: {
              backgroundColor: '#f3f4f6',
              borderBottom: '2px solid #e5e7eb',
            },
            'thead th': {
              padding: '0.75rem 1rem',
              textAlign: 'left',
              fontWeight: '600',
              color: '#374151',
            },
            'tbody td': {
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #e5e7eb',
            },
            'tbody tr:hover': {
              backgroundColor: '#f9fafb',
            },
            hr: {
              borderColor: '#e5e7eb',
              marginTop: '2rem',
              marginBottom: '2rem',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
