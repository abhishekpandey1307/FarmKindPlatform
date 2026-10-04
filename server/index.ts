// =============================================================================
// FARMKIND — STANDALONE SECURE BACKEND SERVER
// Runs on Node.js. Can serve /api/* endpoints and static production files.
// =============================================================================

import http from 'http';
import fs from 'fs';
import path from 'path';
import { handleBackendApiRequest, loadEnvFile } from './mitraBackend.ts';

loadEnvFile();

const PORT = parseInt(process.env.PORT || '3001', 10);
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const server = http.createServer(async (req, res) => {
  // 1. Try handling as backend API endpoint
  const handled = await handleBackendApiRequest(req, res);
  if (handled) return;

  // 2. Serve static production files if available
  if (req.method === 'GET') {
    let reqPath = req.url?.split('?')[0] || '/';
    if (reqPath === '/') reqPath = '/index.html';

    const filePath = path.join(DIST_DIR, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA fallback
    const indexHtml = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(indexHtml).pipe(res);
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n🌾 FarmKind Secure Backend running on http://localhost:${PORT}`);
  console.log(`🔒 Secret Gemini Key loaded: ${Boolean(process.env.GEMINI_API_KEY)}`);
  console.log(`📡 Endpoints: /api/health | /api/mitra-voice\n`);
});
