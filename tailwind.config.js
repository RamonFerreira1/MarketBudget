/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#10B981',
        'primary-light': '#D1FAE5',
        'primary-dark': '#059669',
        danger: '#F87171',
        warning: '#FBBF24',
        background: '#F4F6F5',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
      },
    },
  },
  plugins: [],
};
