import type { ExtendedRequest, ExtendedResponse } from './_lib/http.js';
import { getRequestPath, parseRequestBody, sendJson } from './_lib/http.js';

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
  const pathname = getRequestPath(req);

  // GET /api/auth/me
  if (req.method === 'GET' && pathname === '/api/auth/me') {
    sendJson(res, 200, {
      id: 'arc-scholar-1',
      username: 'ARC Operator',
      created_at: new Date().toISOString(),
    });
    return;
  }

  // POST /api/auth/login or /api/auth/register
  if (req.method === 'POST' && (pathname === '/api/auth/login' || pathname === '/api/auth/register')) {
    const body = await parseRequestBody(req);
    const username = body?.username || 'ARC Operator';
    sendJson(res, 200, {
      access_token: 'arc_mock_session_token_' + Date.now(),
      token_type: 'bearer',
      user: {
        id: 'arc-scholar-1',
        username,
        created_at: new Date().toISOString(),
      },
    });
    return;
  }

  sendJson(res, 404, { detail: 'Auth endpoint not found' });
}
