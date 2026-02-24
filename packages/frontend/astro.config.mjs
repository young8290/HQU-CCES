import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['zongce.youngspace.top'],
      proxy: {
        '/api': 'http://localhost:4000',
        '/ws': {
          target: 'ws://localhost:4000',
          ws: true,
        },
      },
    },
  },
});
