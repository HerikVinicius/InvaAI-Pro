/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background:        'var(--color-background)',
        surface:           'var(--color-surface)',
        'surface-hover':   'var(--color-surface-hover)',
        'surface-elevated':'var(--color-surface-elevated)',
        border:            'var(--color-border)',
        'border-subtle':   'var(--color-border-subtle)',
        accent: {
          DEFAULT: '#10b981',
          hover:   '#059669',
          dim:     '#047857',
          glow:    '#4edea3',
        },
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
        },
        status: {
          critical:    '#ffb4ab',
          'critical-bg': 'rgba(255,180,171,0.1)',
          warning:     '#fbbf24',
          'warning-bg':'rgba(251,191,36,0.1)',
          healthy:     '#10b981',
          'healthy-bg':'rgba(16,185,129,0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'monospace'],
      },
      fontSize: {
        'caps': ['11px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
    },
  },
  plugins: [],
}
