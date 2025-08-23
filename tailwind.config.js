/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'roboto': ['var(--font-roboto)', 'Roboto', 'sans-serif'],
        'roboto-mono': ['var(--font-roboto-mono)', 'Roboto Mono', 'monospace'],
      },
      colors: {
        // Paleta personalizada do GitHub CMS
        'navy': {
          DEFAULT: '#0B2240',
          light: '#1A3A5C',
          dark: '#041829',
        },
        'blue-medium': {
          DEFAULT: '#4C6693',
          light: '#5A7AAF',
          dark: '#3D5278',
        },
        'turquoise': {
          DEFAULT: '#9EDAD6',
          light: '#B3F0E6',
          dark: '#7DD4C5',
        },
        'mint-light': {
          DEFAULT: '#D2E9E2',
          light: '#E0F2ED',
          dark: '#C4E0D7',
        },
        'peach-light': {
          DEFAULT: '#F6B7A7',
          light: '#F8C6B7',
          dark: '#F4A896',
        },
        
        // Status colors baseados na paleta
        'success': '#9EDAD6',
        'warning': '#F6B7A7', 
        'info': '#4C6693',
        'primary': '#0B2240',
        'secondary': '#4C6693',
        'accent': '#9EDAD6',
      },
      
      // Componentes personalizados
      backgroundColor: {
        'sidebar': '#0B2240',
        'sidebar-hover': '#1A3A5C',
        'card': '#D2E9E2',
        'table-header': '#D2E9E2',
      },
      
      textColor: {
        'primary': '#0B2240',
        'secondary': '#4C6693', 
        'accent': '#9EDAD6',
        'light': '#D2E9E2',
      },
      
      borderColor: {
        'primary': '#9EDAD6',
        'secondary': '#D2E9E2',
      },
      
      // Animações suaves
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
};