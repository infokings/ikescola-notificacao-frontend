import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Em desenvolvimento (npm run dev), a API do Spring Boot roda em localhost:3110.
const API = process.env.IKF_API_DEV || 'http://localhost:3110'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // Só para dev atrás de um túnel (cloudflared/ngrok etc.), cujo Host muda a cada sessão.
    // Não afeta 'npm run build' (bloco build abaixo).
    allowedHosts: true,
    proxy: {
      '/api': API,
      '/manifest.webmanifest': API,
      '/.well-known': API,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
  },
})
