import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, existsSync } from 'fs';

// Plugin to copy PDF worker file to public folder
const copyPdfWorker = () => {
  return {
    name: 'copy-pdf-worker',
    buildStart() {
      const workerSource = path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
      const workerDest = path.resolve(__dirname, 'public/pdf.worker.min.mjs');
      
      if (existsSync(workerSource)) {
        try {
          copyFileSync(workerSource, workerDest);
          console.log('[VITE] Copied PDF worker file to public folder');
        } catch (error) {
          console.warn('[VITE] Failed to copy PDF worker file:', error);
        }
      } else {
        console.warn('[VITE] PDF worker source file not found at:', workerSource);
      }
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyPdfWorker()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdfjs': ['pdfjs-dist'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
});
