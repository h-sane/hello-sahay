import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

// The dev server proxies /api to the FastAPI backend so the browser never needs CORS.
// /voice goes to the voice service (WebSocket). Override with SAHAY_API_ORIGIN / SAHAY_VOICE_ORIGIN.
const api = process.env.SAHAY_API_ORIGIN || 'http://localhost:8001';
const voice = process.env.SAHAY_VOICE_ORIGIN || 'http://localhost:8002';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    proxy: {
      '/api': {target: api, changeOrigin: true},
      '/voice': {target: voice, ws: true, changeOrigin: true, rewrite: (p) => p.replace(/^\/voice/, '')},
    },
  },
});
