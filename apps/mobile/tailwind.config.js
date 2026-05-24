/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'bench-green': '#2d6a4f',
        'bench-sage': '#74c69d',
        'bench-moss': '#1b4332',
        'bench-cream': '#f8f6f1',
        'bench-stone': '#e8e4dc',
        'bench-bark': '#7a6652',
        'bench-sky': '#90e0ef',
      },
      fontFamily: {
        inter: ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
