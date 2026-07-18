import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/openf1': {
        target: 'https://api.openf1.org/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openf1/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq) => {
            const key = process.env.VITE_OPENF1_API_KEY;
            if (key) _proxyReq.setHeader('Authorization', key);
          });
        },
      },
      '/api/jolpica': {
        target: 'https://api.jolpi.ca/ergast/f1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/jolpica/, ''),
      },
    },
  },
})
