/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { 400: "#38bdf8", 500: "#0ea5e9" },
        surface: { 900: "#0f172a", 950: "#030712" },
      },
    },
  },
  plugins: [],
};
