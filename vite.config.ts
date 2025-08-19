import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // For authentication
      '/api/auth': {
        target: 'http://localhost:4000', // cxo-service
        changeOrigin: true,
      },
      // For patient data
      '/patients': {
        target: 'http://localhost:4002', // crud-service
        changeOrigin: true,
      },
      '/fhir': {
        target: 'https://hapi.fhir.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fhir/, '/baseR4'),
        secure: false,
      }
    },
  },
});