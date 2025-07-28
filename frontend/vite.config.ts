import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { compression } from 'vite-plugin-compression2'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  const isDevelopment = mode === 'development'

  return {
    plugins: [
      react(),
      
      // PWA support
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'WorkflowGuard',
          short_name: 'WorkflowGuard',
          description: 'HubSpot Workflow Version Control and Management',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.workflowguard\.pro\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      }),

      // Compression for production
      isProduction && compression({
        algorithm: 'gzip',
        exclude: [/\.(br)$ /, /\.(gz)$/],
        threshold: 10240,
        compressionOptions: {
          level: 9
        }
      }),

      // Bundle analyzer for production
      isProduction && visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true
      })
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@services': path.resolve(__dirname, './src/services'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/lib'),
        '@types': path.resolve(__dirname, './src/types')
      }
    },

    // Build configuration
    build: {
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: isDevelopment,
      minify: isProduction ? 'terser' : false,
      
      // Terser configuration for production
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
        },
        mangle: {
          safari10: true
        }
      } : undefined,

      // Rollup configuration
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html')
        },
        output: {
          // Code splitting
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom'],
            'router-vendor': ['react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
            'query-vendor': ['@tanstack/react-query'],
            'socket-vendor': ['socket.io-client'],
            'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge'],
            
            // Feature chunks
            'workflow-features': [
              './src/pages/WorkflowHistory.tsx',
              './src/pages/WorkflowHistoryDetail.tsx',
              './src/pages/CompareVersions.tsx'
            ],
            'analytics-features': [
              './src/pages/AnalyticsDashboard.tsx',
              './src/pages/OverageDashboard.tsx',
              './src/pages/RealtimeDashboard.tsx'
            ],
            'settings-features': [
              './src/pages/Settings.tsx',
              './src/components/settings/AddWebhookModal.tsx',
              './src/components/settings/ApiAccessTab.tsx',
              './src/components/settings/AuditLogTab.tsx',
              './src/components/settings/BillingTab.tsx',
              './src/components/settings/NotificationsTab.tsx',
              './src/components/settings/PlanBillingTab.tsx',
              './src/components/settings/ProfileTab.tsx',
              './src/components/settings/SsoConfiguration.tsx',
              './src/components/settings/UserPermissionsTab.tsx',
              './src/components/settings/WebhooksConfiguration.tsx'
            ]
          },
          
          // Asset naming
          chunkFileNames: isProduction 
            ? 'assets/js/[name]-[hash].js'
            : 'assets/js/[name].js',
          entryFileNames: isProduction 
            ? 'assets/js/[name]-[hash].js'
            : 'assets/js/[name].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            if (/\.(css)$/.test(assetInfo.name)) {
              return isProduction 
                ? 'assets/css/[name]-[hash].[ext]'
                : 'assets/css/[name].[ext]'
            }
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
              return isProduction 
                ? 'assets/images/[name]-[hash].[ext]'
                : 'assets/images/[name].[ext]'
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
              return isProduction 
                ? 'assets/fonts/[name]-[hash].[ext]'
                : 'assets/fonts/[name].[ext]'
            }
            return isProduction 
              ? 'assets/[name]-[hash].[ext]'
              : 'assets/[name].[ext]'
          }
        }
      },

      // Chunk size warnings
      chunkSizeWarningLimit: 1000
    },

    // Development server configuration
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      open: false,
      
      // Proxy configuration for development
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        },
        '/socket.io': {
          target: process.env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    },

    // Preview configuration
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
      open: false
    },

    // CSS configuration
    css: {
      devSourcemap: isDevelopment,
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      }
    },

    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'socket.io-client',
        'date-fns',
        'clsx',
        'tailwind-merge',
        'lucide-react'
      ],
      exclude: [
        'workbox-window'
      ]
    },

    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __IS_DEVELOPMENT__: JSON.stringify(isDevelopment),
      __IS_PRODUCTION__: JSON.stringify(isProduction)
    },

    // Performance optimizations
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
      pure: isProduction ? ['console.log', 'console.info', 'console.debug', 'console.warn'] : []
    }
  }
})
