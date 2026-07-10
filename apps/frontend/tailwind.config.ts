import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e7f3ff',
          100: '#dbebff',
          200: '#bcd9ff',
          300: '#8cbaff',
          400: '#5c9bff',
          500: '#1877f2', // Facebook Blue
          600: '#166fe5', // Darker Blue
          700: '#1565c0',
          800: '#0e4a9e',
          900: '#0a326b',
          950: '#051b3b',
        },
        accent: {
          50: '#f2faf1',
          100: '#e2f4df',
          200: '#c5eaba',
          300: '#9edb8f',
          400: '#71c65d',
          500: '#42b72a', // Facebook Green
          600: '#36a420', // Darker Green
          700: '#2b841a',
          800: '#226814',
          900: '#1c5510',
          950: '#0d2a07',
        },
        dark: {
          bg: '#18191a', // Facebook Dark BG
          card: '#242526', // Facebook Dark Card
          border: '#3e4042', // Facebook Dark Border
          input: '#3a3b3c', // Facebook Dark Input
          text: '#e4e6eb',
          muted: '#b0b3b8',
        },
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'dark-glass-gradient': 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
      },
      boxShadow: {
        'glass': '0 1px 2px rgba(0, 0, 0, 0.2)',
        'glass-sm': '0 1px 2px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        'glass': '12px',
      },
    },
  },
  plugins: [],
};

export default config;
