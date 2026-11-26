/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nacht: {
          950: '#060b1d',
          900: '#0a1230',
          800: '#111c45',
          700: '#1a2a5e',
          600: '#26397a',
        },
        gold: {
          200: '#fbeac0',
          300: '#f6d68a',
          400: '#ecc15c',
          500: '#d9a636',
          600: '#b3842a',
        },
        richtig: '#7fd1a0',
        falsch: '#ef8f86',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['"Source Sans 3"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
