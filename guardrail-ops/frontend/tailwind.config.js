/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        guard: {
          navy: "#0B1E39",
          blue: "#1E3A8A",
          slate: "#334155",
          accent: "#2DD4BF",
          alert: "#DC2626",
        },
      },
    },
  },
  plugins: [],
};
