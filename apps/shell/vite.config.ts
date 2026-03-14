import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://3.75.246.92',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://3.75.246.92',
        ws: true,
      },
    },
  },
});
