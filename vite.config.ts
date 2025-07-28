import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
      'react': path.resolve(__dirname, './node_modules/react'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
  optimizeDeps: {
    exclude: ['@/components/TopNavigation'],
  },
}); 