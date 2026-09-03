/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sahayata: {
          navy: '#1E3A5F',
          navyHover: '#162C46',
          navyLight: '#EFF6FF',
          amber: '#F59E0B',
          amberHover: '#D97706',
          amberLight: '#FFFBEB',
          emerald: '#10B981',
          rose: '#EF4444',
          slate: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
