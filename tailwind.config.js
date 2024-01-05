module.exports = {
  content: [
    "./**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        "accent": "#8B4085",
        "beige": "#FAF6EF",
      }
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
}

