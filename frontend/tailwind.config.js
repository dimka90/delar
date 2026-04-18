/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'custom-gradient': 'linear-gradient(118.17deg, #4E7836 2.08%, #90DE64 100.89%)',
        'custom-svg': "url('/src/assets/background.png')",
      },
      colors:{
        green: {
          200:  "#4E7836", 
          300: "#3BA300",
        }
      },
      boxShadow: {
        'custom': '0 4px 4px 0 rgba(0, 0, 0, 0.25)', // Matches #00000040 opacity
      },
    },
  },
  variants: {},
  plugins: [],
}