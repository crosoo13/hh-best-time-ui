// vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  // 👇 ВОТ ЭТА СТРОКА. Замените 'hh-best-time-ui' на имя вашего репозитория, если оно другое.
  base: '/hh-best-time-ui/', 
  
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})