import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const api = process.env.SAHAY_API_ORIGIN || 'http://localhost:8001';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3001,
    host: '0.0.0.0',
    proxy: {
      '/api': { target: api, changeOrigin: true },
    },
  },
});

