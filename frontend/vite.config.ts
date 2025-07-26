import { defineConfig } from 'vitest/config';
import react from "@vitejs/plugin-react-swc";
import reactDefault from "@vitejs/plugin-react";
import path from "path";

// Check if SWC is available
let plugin;
try {
  require('@swc/core');
  plugin = react;
} catch {
  // Fallback to default React plugin if SWC is not available
  plugin = reactDefault;
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [plugin()],
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
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          // Router
          'router': ['react-router-dom'],
          // UI Components
          'ui-core': [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu', 
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-toast',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip'
          ],
          // Utilities
          'utils': ['clsx', 'tailwind-merge', 'class-variance-authority', 'date-fns'],
          // Charts and Analytics
          'charts': ['recharts'],
          // Forms and Validation
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Icons and UI helpers
          'icons': ['lucide-react'],
          // Socket and real-time
          'realtime': ['socket.io-client'],
          // Animation
          'animation': ['framer-motion']
        }
      }
    },
    target: 'es2020',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    sourcemap: false
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './frontend/vitest.setup.ts',
  },
});
