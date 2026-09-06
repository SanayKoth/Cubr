import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // cubing.js ships its own workers; Vite's dep optimizer breaks their paths.
  optimizeDeps: {
    exclude: ['cubing'],
  },
})
