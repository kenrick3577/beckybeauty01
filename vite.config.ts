import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    strictPort: false, // Allow fallback to next available port
    host: true, // Listen on all network interfaces
    open: true, // Auto-open browser
    watch: {
      usePolling: true // Better file watching
    }
  },
  preview: {
    port: 5173,
    strictPort: false,
    host: true
  }
});