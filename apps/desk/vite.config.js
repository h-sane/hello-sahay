import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server proxies /api to the FastAPI backend so the browser never needs CORS.
// Override with SAHAY_API_ORIGIN when the API runs elsewhere.
const api = process.env.SAHAY_API_ORIGIN || 'http://localhost:8001'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: api, ws: true, changeOrigin: true } } },
})
