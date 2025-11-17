import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Node modules chunk
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            // Radix UI components (split by usage frequency)
            if (id.includes('@radix-ui')) {
              // Most used UI components
              if (id.includes('dialog') || id.includes('dropdown-menu') || id.includes('select') || 
                  id.includes('tabs') || id.includes('toast') || id.includes('popover')) {
                return 'radix-core'
              }
              // Less frequently used
              return 'radix-other'
            }
            // Chart library
            if (id.includes('recharts')) {
              return 'chart-vendor'
            }
            // Animation library
            if (id.includes('framer-motion')) {
              return 'animation-vendor'
            }
            // PDF generation
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor'
            }
            // Socket
            if (id.includes('socket.io-client')) {
              return 'socket-vendor'
            }
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor'
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor'
            }
            // Other vendor libraries
            return 'vendor'
          }
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 600,
    // Disable source maps for production (smaller build)
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@api': path.resolve(__dirname, './src/api'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@context': path.resolve(__dirname, './src/context'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@types': path.resolve(__dirname, './src/types')
    }
  }
})
