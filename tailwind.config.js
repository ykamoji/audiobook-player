/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules",
    "!./node_modules/**/*",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        metal: ["Metal", "serif"],
        cabin: ["Cabin Condensed", "sans-serif"],
      },
      colors: {
        audible: {
          bg: "#111111",
          card: "#1F1F1F",
          orange: "#F7991C",
          gray: "#999999",
          separator: "#333333",
        },
      },
    },
  },
  plugins: [],
};
