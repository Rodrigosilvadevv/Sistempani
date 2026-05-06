import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Verifique se essa linha existe

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // E essa aqui também
  ],
})