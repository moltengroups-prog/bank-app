/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg:     '#0f172a',
          hover:  '#1e293b',
          border: '#1e293b',
          text:   '#94a3b8',
          active: '#ffffff',
        },
        admin: {
          primary:   '#1d4ed8',
          secondary: '#3b82f6',
          surface:   '#f8fafc',
          card:      '#ffffff',
          border:    '#e2e8f0',
          muted:     '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
