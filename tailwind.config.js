/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sage:     { 50:'#f4f7f2',100:'#e6ede4',200:'#ccdbc7',300:'#a8c29f',400:'#7c9a6e',500:'#5e7e51',600:'#4a6540',700:'#3b5133',800:'#2f4129',900:'#243221' },
        turmeric: { 50:'#fdf8ee',100:'#fbeed5',200:'#f5d9a0',300:'#efbe63',400:'#d4a843',500:'#bd8b1e',600:'#9e6f19',700:'#80581a',800:'#6a4818',900:'#573b16' },
        coral:    { 50:'#fef5f3',100:'#fce8e4',200:'#fad3cc',300:'#f5b2a4',400:'#e8836a',500:'#d4614a',600:'#b24d38',700:'#944130',800:'#7a382b',900:'#642f25' },
      },
      fontFamily: { inter: ['Inter', 'sans-serif'] },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'slide-up': 'slideUp .4s ease both',
        'fade-in': 'fadeIn .3s ease both',
      },
      keyframes: {
        shimmer: { '0%':{'background-position':'-200% 0'},'100%':{'background-position':'200% 0'} },
        slideUp: { from:{opacity:'0',transform:'translateY(24px)'},to:{opacity:'1',transform:'translateY(0)'} },
        fadeIn:  { from:{opacity:'0'},to:{opacity:'1'} },
      },
    },
  },
  plugins: [],
}
