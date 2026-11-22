import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mustard: {
          50: '#fdf8ec',
          100: '#faeec9',
          200: '#f4da8f',
          300: '#edc158',
          400: '#e6a832',
          500: '#d4911f',
          600: '#b57318',
          700: '#8f5717',
          800: '#754619',
          900: '#623c19',
        },
        charcoal: {
          50: '#f5f5f4',
          100: '#e7e5e3',
          200: '#cbc6c1',
          300: '#a39c93',
          400: '#78716a',
          500: '#57524c',
          600: '#413d38',
          700: '#2f2c28',
          800: '#211f1c',
          900: '#161513',
        },
        cream: '#faf6ee',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      container: {
        center: true,
        padding: '1rem',
        screens: { '2xl': '1280px' },
      },
    },
  },
  plugins: [],
};

export default config;
