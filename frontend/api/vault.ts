import type { ExtendedRequest, ExtendedResponse } from './_lib/http.js';
import { getRequestPath, parseRequestBody, sendJson } from './_lib/http.js';
import {
  listSessions,
  getSession,
  saveSession,
  deleteSession,
  getDatabaseDriver,
  sanitizeDbError,
  type VaultSession,
  type VaultSessionSummary,
} from './_lib/db.js';

export type { VaultSession, VaultSessionSummary };

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
  const pathname = getRequestPath(req);

  // GET /api/vault/status or GET /api/vault (health & driver telemetry)
  if (req.method === 'GET' && (pathname === '/api/vault/status' || pathname === '/api/vault')) {
    sendJson(res, 200, {
      status: 'healthy',
      driver: getDatabaseDriver(),
    });
    return;
  }

  // GET /api/vault/sessions (list all session summaries)
  if (req.method === 'GET' && pathname === '/api/vault/sessions') {
    try {
      const list = await listSessions();
      sendJson(res, 200, list);
    } catch (err: unknown) {
      sendJson(res, 500, {
        detail: 'Failed to retrieve vault sessions',
        error: sanitizeDbError(err),
      });
    }
    return;
  }

  // GET /api/vault/sessions/:id (get single session detail)
  if (req.method === 'GET' && pathname.startsWith('/api/vault/sessions/')) {
    try {
      const id = decodeURIComponent(pathname.replace('/api/vault/sessions/', ''));
      if (!id) {
        sendJson(res, 400, { detail: 'Session ID is required' });
        return;
      }
      const session = await getSession(id);
      if (!session) {
        sendJson(res, 404, { detail: 'Session not found in vault' });
        return;
      }
      sendJson(res, 200, session);
    } catch (err: unknown) {
      sendJson(res, 500, {
        detail: 'Failed to retrieve session from vault',
        error: sanitizeDbError(err),
      });
    }
    return;
  }

  // POST /api/vault/sessions (create or update study session)
  if (req.method === 'POST' && pathname === '/api/vault/sessions') {
    try {
      const body = await parseRequestBody(req);
      const session = await saveSession({
        id: body?.id,
        title: body?.title,
        has_dut: typeof body?.has_dut === 'boolean' ? body.has_dut : undefined,
        dut_image: body?.dut_image,
        messages: Array.isArray(body?.messages) ? body.messages : [],
      });
      sendJson(res, 200, session);
    } catch (err: unknown) {
      sendJson(res, 500, {
        detail: 'Failed to save session to vault',
        error: sanitizeDbError(err),
      });
    }
    return;
  }

  // DELETE /api/vault/sessions/:id (delete study session)
  if (req.method === 'DELETE' && pathname.startsWith('/api/vault/sessions/')) {
    try {
      const id = decodeURIComponent(pathname.replace('/api/vault/sessions/', ''));
      if (!id) {
        sendJson(res, 400, { detail: 'Session ID is required' });
        return;
      }
      await deleteSession(id);
      sendJson(res, 200, { status: 'deleted', id });
    } catch (err: unknown) {
      sendJson(res, 500, {
        detail: 'Failed to delete session from vault',
        error: sanitizeDbError(err),
      });
    }
    return;
  }

  sendJson(res, 404, { detail: 'Vault endpoint not found' });
}
