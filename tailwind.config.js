/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Inter Variable"', 'system-ui', 'sans-serif'] },
      boxShadow: { glass: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 8px 30px -12px rgb(15 23 42 / 0.25)' },
    },
  },
  plugins: [],
};
