// import { defineConfig } from 'vite';
// import { fileURLToPath, URL } from 'node:url';

// export default defineConfig({
//   server: {
//     port: 5174,
//     proxy: {
//       '/api': {
//         target: 'http://localhost:3001',
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
//   resolve: {
//     alias: {
//       '@': fileURLToPath(new URL('./src', import.meta.url)),
//     },
//   },
// });

import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, URL } from 'node:url';

// HTTPS certs are only needed for local dev; skip if files are missing (e.g., in Docker build)
const keyPath = path.resolve('../certs/server.key');
const certPath = path.resolve('../certs/server.crt');
const httpsConfig = fs.existsSync(keyPath) && fs.existsSync(certPath)
  ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }
  : undefined;

export default defineConfig({
  server: {
    https: httpsConfig,
    port: Number(process.env.PORT) || 3000,
    proxy: {
      '/api': {
        target: 'https://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Proxy avatar static files to backend Fastify
      '/avatars': {
        target: 'https://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});