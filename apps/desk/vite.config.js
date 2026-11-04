import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server proxies /api to the FastAPI backend so the browser never needs CORS.
// Override with SAHAY_API_ORIGIN in .env when pointing to another backend.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../../', '')
  const api = process.env.SAHAY_API_ORIGIN || env.SAHAY_API_ORIGIN || 'http://localhost:8001'

  return {
    plugins: [react()],
    server: { port: 5173, proxy: { '/api': { target: api, ws: true, changeOrigin: true, secure: false } } },
  }
})

