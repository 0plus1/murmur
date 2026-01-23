import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      buffer: 'buffer/',
    },
  },
  define: {
    global: 'window',
  },
  optimizeDeps: {
    include: ['buffer'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
