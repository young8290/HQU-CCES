import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const routeEntries = {
  main: resolve(__dirname, 'index.html'),
  login: resolve(__dirname, 'login/index.html'),
  dashboard: resolve(__dirname, 'dashboard/index.html'),
  scores: resolve(__dirname, 'scores/index.html'),
  students: resolve(__dirname, 'students/index.html'),
  import: resolve(__dirname, 'import/index.html'),
  export: resolve(__dirname, 'export/index.html'),
  accounts: resolve(__dirname, 'accounts/index.html'),
  settings: resolve(__dirname, 'settings/index.html'),
  notFound: resolve(__dirname, '404.html'),
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: ['zongce.youngspace.top'],
    proxy: {
      '/api': 'http://localhost:4000',
      '/ws': {
        target: 'ws://localhost:4000',
        ws: true,
      },
    },
  },
  preview: {
    host: true,
    port: 3000,
  },
  build: {
    rollupOptions: {
      input: routeEntries,
    },
  },
});
