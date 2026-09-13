import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    warmup: {
      clientFiles: ['./src/main.jsx', './src/App.jsx', './src/index.css'],
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [
      '@whiskeysockets/baileys',
      'pino',
      'nodemailer',
      'bcrypt',
      'bcryptjs',
      'pg',
      'jsonwebtoken',
      'multer',
      'groq-sdk',
      'qrcode-terminal',
      'dotenv',
    ],
  },
  build: {
    // Reduce chunk size for faster mobile loads
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunks: split vendor libs from app code
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
        },
      },
    },
    // Minification — esbuild is fastest
    minify: 'esbuild',
    // Enable CSS code splitting per-page
    cssCodeSplit: true,
    // Use modern targets for smaller output
    target: 'es2020',
  },
})