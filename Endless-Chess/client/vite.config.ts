import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv';

const env_file = "../.env";
dotenv.config({path: env_file});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.REACT_APP_PORTC),
    proxy: {
      '/api': {
        target: `${process.env.REACT_APP_URL}:${process.env.REACT_APP_PORTS}/api`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    allowedHosts: [
      "onlinechess.xyz",
      "localhost",
    ]
  },

    resolve: {
    alias: {
      '@styles': '/src/assets/styles',
      '@components': '/src/assets/components',
      '@images': '/src/assets/images',
      '@engine': '/src/assets/engine',
    }
  }
})
