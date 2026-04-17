import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    cors: true,
    port: 5173,
  },
  // Ensure /public is served as static assets at root
  publicDir: 'public',
});
