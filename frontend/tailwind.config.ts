import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#faf6f0',
        espresso: { 50: '#f7f1ea', 100: '#eadccb', 200: '#d6b997', 500: '#8a5a37', 600: '#6f4527', 700: '#573520', 900: '#2b1a10' },
      },
      fontFamily: { sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
