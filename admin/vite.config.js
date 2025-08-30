import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Help Vite resolve Firebase modules
      'firebase/functions': 'firebase/functions',
    }
  },
  optimizeDeps: {
    include: ['firebase/functions', 'firebase/app']
  }
})
