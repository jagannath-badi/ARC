import type { ExtendedRequest, ExtendedResponse } from './_lib/http.js';
import { getRequestPath, parseRequestBody, sendJson } from './_lib/http.js';

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
  const pathname = getRequestPath(req);

  // GET /api/learn/stats
  if (req.method === 'GET' && pathname === '/api/learn/stats') {
    sendJson(res, 200, {
      total_documents: 18,
      total_chunks: 1420,
      branches: {
        'STEM & Computing': 650,
        'Life & Health Sciences': 420,
        'Humanities & Arts': 380,
        'Social Sciences & Law': 340,
        'Business & Economics': 290,
        'Mathematics & Logic': 210,
      },
      source_types: {
        notes: 520,
        textbooks: 480,
        research_papers: 410,
        diagrams: 310,
      },
      database_size_bytes: 5242880,
    });
    return;
  }

  // POST /api/learn/ingest
  if (req.method === 'POST' && pathname === '/api/learn/ingest') {
    sendJson(res, 200, {
      message: 'Knowledge document indexed into ARC Knowledge Vault.',
      title: 'Academic Study Document',
      chunks_indexed: 12,
    });
    return;
  }

  // POST /api/learn/feedback
  if (req.method === 'POST' && pathname === '/api/learn/feedback') {
    const body = await parseRequestBody(req);
    sendJson(res, 200, {
      message: 'Knowledge feedback indexed.',
      title: body?.title || 'User Contribution',
      chunks_indexed: 1,
    });
    return;
  }

  sendJson(res, 404, { detail: 'Knowledge route not found' });
}
