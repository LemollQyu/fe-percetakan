/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        "barlow-bold": ["Barlow Bold", "sans-serif"],
        "barlow-tipis": ["Barlow Tipis", "sans-serif"],
        "monterat-italic": ["Monterat Italic", "sans-serif"],
        "monterat-tipis": ["Monterat Tipis", "sans-serif"],
      },
      screens: {
        mobile: { max: "430px" },
      },
    },
  },
  plugins: [],
};
