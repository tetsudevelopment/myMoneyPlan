/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Tokens de diseño de Mi Plan (ver CLAUDE.md §7 / prototipo)
      colors: {
        verde: {
          prof: '#0F2A24',
          medio: '#1D6E56',
          vivo: '#1D9E75',
          claro: '#E1F5EE',
        },
        crema: '#F7F5EF',
        carbon: '#1A1E1C',
        gris: {
          DEFAULT: '#6B7270',
          claro: '#9DA4A1',
        },
        linea: '#E4E6E2',
        rojo: {
          DEFAULT: '#E24B4A',
          bg: '#FCEBEB',
        },
        ambar: '#BA7517',
        azul: '#378ADD',
      },
      boxShadow: {
        suave: '0 1px 3px rgba(15,42,36,0.06), 0 1px 2px rgba(15,42,36,0.04)',
        'suave-lg': '0 4px 16px rgba(15,42,36,0.08)',
      },
      maxWidth: {
        app: '480px',
      },
      borderRadius: {
        card: '18px',
        hero: '22px',
      },
    },
  },
  plugins: [],
}
