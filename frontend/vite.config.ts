import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The FastAPI backend runs on :8000 in local dev.
    proxy: { '/api': 'http://localhost:8000' },
  },
})
