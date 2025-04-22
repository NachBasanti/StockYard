import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/

export default defineConfig({
  plugins: [react(),    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      external: ['xlsx'] // ✅ Tell Rollup to ignore bundling xlsx
    }
  },
  optimizeDeps: {
    exclude: ['xlsx'] // ✅ Skip trying to pre-bundle xlsx
  }
  
})
