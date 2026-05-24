/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        orange: '#FF5A1F',
        orange2: '#FF8C42',
        dark: '#080808',
        card: '#131313',
        card2: '#1A1A1A',
        border: '#222222',
      }
    },
  },
  plugins: [],
}