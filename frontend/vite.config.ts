import { defineConfig } from 'vitest/config';
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-router-dom": path.resolve(__dirname, "./node_modules/react-router-dom"),
      "debounce": path.resolve(__dirname, "./node_modules/debounce"),
    },
  },
  optimizeDeps: {
    include: ['debounce'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority']
        }
      }
    },
    target: 'es2020',
    minify: 'esbuild'
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './frontend/vitest.setup.ts',
  },
});
