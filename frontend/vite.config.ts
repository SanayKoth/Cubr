import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

function cubingSearchChunk(id: string): string | undefined {
  // These must stay as their own hashed files. Forcing them into cubing-search
  // inlines the worker entry, and cubing then 404s looking for the original name.
  if (
    id.includes('search-worker-entry') ||
    id.includes('/inside-VUJSPBRA') ||
    id.includes('search-dynamic-') ||
    id.includes('puzzles-dynamic-') ||
    id.includes('/twips-') ||
    id.includes('twisty-dynamic-')
  ) {
    return
  }
  if (id.includes('/node_modules/cubing/dist/lib/cubing/twisty')) {
    return 'cubing-twisty'
  }
  if (
    id.includes('/node_modules/cubing/') ||
    id.includes('/node_modules/random-uint-below/') ||
    id.includes('/node_modules/@cubing/')
  ) {
    return 'cubing-search'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // cubing.js ships its own workers; Vite's dep optimizer breaks their paths.
  optimizeDeps: {
    exclude: ['cubing'],
  },
  /*
    Without this, Rollup puts cubing modules shared by the app and the scramble
    worker into the main index chunk. The worker then imports the React bundle,
    dies, and the timer stays on "generating…". Keep search off the twisty
    chunk so the first scramble does not download the 3D player.
  */
  build: {
    // The scramble worker imports cubing-search. Vite's modulepreload helper
    // then calls document inside that worker and the worker dies.
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks: cubingSearchChunk,
      },
    },
  },
})
