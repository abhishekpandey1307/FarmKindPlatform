import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import { handleBackendApiRequest } from './server/mitraBackend.ts'

// Vite dev server backend middleware plugin
function backendApiPlugin(): Plugin {
  return {
    name: 'farmkind-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          const handled = await handleBackendApiRequest(req, res);
          if (handled) return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), backendApiPlugin()],
  test: {
    environment: 'node',
    globals: true,
  },
})
