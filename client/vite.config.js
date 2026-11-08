import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:5050', changeOrigin: true },
      '/uploads': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:5050', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react';
            // GSAP is used only by the lazy V0.1 prototype; keep it out of the shared vendor chunk.
            if (id.includes('/gsap/')) return 'gsap';
            return 'vendor';
          }
        },
      },
    },
  },
});
