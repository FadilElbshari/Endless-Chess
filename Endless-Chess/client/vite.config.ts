import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: (req: any) => {
          const host = req.headers.host?.split(':')[0];
          const protocol = req.headers.referer?.startsWith('https') ? 'https' : 'http';
          return `${protocol}://${host}:3001`;
        },
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
