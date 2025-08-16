/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "rgb(var(--bg) / <alpha-value>)",
          card: "rgb(var(--card) / <alpha-value>)",
          text: "rgb(var(--text) / <alpha-value>)",
          accent: "rgb(var(--accent) / <alpha-value>)",
        }
      },
      boxShadow: {
        glow: "0 0 24px rgba(0,0,0,0.25), 0 0 16px var(--tw-shadow-color)",
      }
    },
  },
  plugins: [],
}
