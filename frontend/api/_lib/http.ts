import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ExtendedRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, string | string[]>;
  method?: string;
  url?: string;
}

export interface ExtendedResponse extends ServerResponse {
  status?: (code: number) => ExtendedResponse;
  json?: (data: unknown) => ExtendedResponse;
}

/**
 * Resolves the logical URL pathname across Vite dev server and Vercel serverless rewrites.
 */
export function getRequestPath(req: ExtendedRequest): string {
  // Check headers commonly set by reverse proxies / Vercel
  const xMatchedPath = req.headers?.['x-matched-path'];
  if (typeof xMatchedPath === 'string' && xMatchedPath) {
    return xMatchedPath.split('?')[0] || '';
  }
  const xForwardedUrl = req.headers?.['x-forwarded-url'];
  if (typeof xForwardedUrl === 'string' && xForwardedUrl) {
    return xForwardedUrl.split('?')[0] || '';
  }

  const rawUrl = req.url || '';
  const pathname = rawUrl.split('?')[0] || '';

  // Handle Vercel rewrite query parameter (e.g. /api/vault/:match* -> destination /api/vault)
  if (req.query?.match) {
    const matchVal = Array.isArray(req.query.match)
      ? req.query.match.join('/')
      : String(req.query.match);
    const base = pathname.replace(/\/+$/, '');
    return `${base}/${matchVal.replace(/^\/+/, '')}`;
  }

  if (rawUrl.includes('?')) {
    try {
      const searchParams = new URL(rawUrl, 'http://localhost').searchParams;
      const match = searchParams.get('match');
      if (match) {
        const base = pathname.replace(/\/+$/, '');
        return `${base}/${match.replace(/^\/+/, '')}`;
      }
    } catch {
      // ignore URL parsing error
    }
  }

  return pathname;
}

export async function parseRequestBody(req: ExtendedRequest): Promise<Record<string, any>> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return { rawBody: req.body };
      }
    }
    if (typeof req.body === 'object') {
      return req.body as Record<string, any>;
    }
    return {};
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: Buffer | string) => {
      raw += chunk.toString();
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({ rawBody: raw });
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

export function sendJson(res: ExtendedResponse, statusCode: number, data: unknown): void {
  if (typeof res.status === 'function') {
    res.status(statusCode);
  } else {
    res.statusCode = statusCode;
  }
  if (typeof res.json === 'function') {
    res.json(data);
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}
