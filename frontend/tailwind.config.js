/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#ec5b13",             // Đã chuyển sang màu Cam
        "background-light": "#f8f6f6",
        "background-dark": "#221610",     // Đã chuyển sang tông tối ấm
        "accent-blue": "#3b82f6",         // Thêm màu xanh lam mới
        "accent-yellow": "#eab308",
      },
      fontFamily: {
        "display": ["Public Sans", "sans-serif"]
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}