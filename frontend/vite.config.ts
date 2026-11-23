import { defineConfig, type Plugin, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import healthHandler from './api/health.js';
import chatHandler from './api/chat.js';
import analyzeHandler from './api/analyze.js';
import modelsHandler from './api/models.js';
import vaultHandler from './api/vault.js';
import learnHandler from './api/learn.js';
import authHandler from './api/auth.js';
import voiceHandler from './api/voice.js';
import type { ExtendedRequest, ExtendedResponse } from './api/_lib/http.js';
import path from 'node:path';

// Load environment variables from both frontend/ and root/ for dev server API routes
// This runs at config time so process.env is populated before middleware handlers execute
const rootDir = path.resolve(process.cwd(), '..');
const frontendEnv = loadEnv('', process.cwd(), '');
const rootEnv = loadEnv('', rootDir, '');

// Merge root env into process.env first, then frontend env (frontend takes precedence)
for (const [key, value] of Object.entries(rootEnv)) {
  if (!(key in process.env)) {
    process.env[key] = value;
  }
}
for (const [key, value] of Object.entries(frontendEnv)) {
  if (!(key in process.env)) {
    process.env[key] = value;
  }
}

function arcApiPlugin(): Plugin {
  return {
    name: 'arc-api-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api')) {
          return next();
        }

        const urlPath = req.url.split('?')[0] || '';

        const extReq = req as ExtendedRequest;
        const extRes = res as ExtendedResponse;

        if (!extRes.status) {
          extRes.status = (code: number) => {
            extRes.statusCode = code;
            return extRes;
          };
        }
        if (!extRes.json) {
          extRes.json = (data: unknown) => {
            extRes.setHeader('Content-Type', 'application/json');
            extRes.end(JSON.stringify(data));
            return extRes;
          };
        }

        try {
          if (urlPath === '/api/health') {
            await healthHandler(extReq, extRes);
            return;
          }
          if (urlPath === '/api/chat' || urlPath === '/api/chat/stream') {
            await chatHandler(extReq, extRes);
            return;
          }
          if (urlPath === '/api/analyze') {
            await analyzeHandler(extReq, extRes);
            return;
          }
          if (urlPath === '/api/models') {
            await modelsHandler(extReq, extRes);
            return;
          }
          if (urlPath.startsWith('/api/vault')) {
            await vaultHandler(extReq, extRes);
            return;
          }
          if (urlPath.startsWith('/api/learn')) {
            await learnHandler(extReq, extRes);
            return;
          }
          if (urlPath.startsWith('/api/auth')) {
            await authHandler(extReq, extRes);
            return;
          }
          if (urlPath === '/api/tts' || urlPath === '/api/stt' || urlPath === '/api/voices' || urlPath === '/api/voice') {
            await voiceHandler(extReq, extRes);
            return;
          }

          next();
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'API Route Middleware Error';
          extRes.statusCode = 500;
          extRes.setHeader('Content-Type', 'application/json');
          extRes.end(JSON.stringify({ status: 'error', error: errMsg }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), arcApiPlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
