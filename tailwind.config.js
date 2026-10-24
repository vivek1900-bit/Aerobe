// AEROBE design tokens — 07_UIUX_DESIGN_SYSTEM.md §5. Tailwind 3.4 (NOT v4).
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#050B14',
        panel: '#0A121C',
        panel2: '#101B28',
        line: '#1B2A3A',
        text: '#E8EEF3',
        muted: '#7F92A3',
        signal: '#2F8CFF',
        broth: '#F2A93B',
        ok: '#3BD99F',
        warn: '#FFB547',
        danger: '#FF5A4F',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '3px',
        sm: '2px',
        md: '4px',
      },
      letterSpacing: {
        label: '0.08em',
      },
    },
  },
  plugins: [],
};
