import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/  +  https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // En tests no usamos credenciales reales: la app corre en modo solo-local
    // y no hace llamadas de red (determinista).
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
    },
  },
})
