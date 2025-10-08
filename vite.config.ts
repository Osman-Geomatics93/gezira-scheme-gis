import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // GitHub Pages base path (use repo name)
  // For custom domain or root deployment, set to '/'
  base: process.env.VITE_BASE_PATH || '/',

  assetsInclude: ['**/*.geojson'],

  json: {
    stringify: true
  },

  // Build optimization for production
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'map-vendor': ['leaflet', 'react-leaflet', 'maplibre-gl', 'ol'],
          'geo-vendor': ['@turf/turf', '@tmcw/togeojson', 'geotiff', 'shapefile']
        }
      }
    }
  },

  // Preview server config
  preview: {
    port: 4173,
    strictPort: true
  }
})
