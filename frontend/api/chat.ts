import type { ExtendedRequest, ExtendedResponse } from './_lib/http.js';
import { parseRequestBody, sendJson } from './_lib/http.js';
import { executeChat, type ArcResponseStyle, type ArcPrivacyMode } from './_lib/provider.js';

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, {
      status: 'error',
      error_type: 'METHOD_NOT_ALLOWED',
      answer: 'Method Not Allowed. Use POST for chat.',
    });
    return;
  }

  try {
    const body = await parseRequestBody(req);

    if (body?.rawBody !== undefined) {
      sendJson(res, 400, {
        status: 'error',
        error_type: 'MALFORMED_JSON_PAYLOAD',
        answer: 'Malformed JSON payload: Request body contains invalid JSON syntax.',
        fallback_used: false,
        attempts: 0,
      });
      return;
    }

    const message = body?.message;

    if (!message || typeof message !== 'string' || !message.trim()) {
      sendJson(res, 400, {
        status: 'error',
        error_type: 'VALIDATION_ERROR',
        answer: 'Validation Error: "message" field is required and cannot be empty.',
        fallback_used: false,
        attempts: 0,
      });
      return;
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const vaultContext = typeof body.vault_context === 'string' ? body.vault_context : undefined;
    const model = body?.model || body?.model_id;
    const provider = body?.provider;
    const style = (body?.style || body?.response_style) as ArcResponseStyle | undefined;
    const privacyMode = (body?.privacy_mode || body?.privacyMode) as ArcPrivacyMode | undefined;
    const isStream =
      body.stream === true ||
      req.headers?.accept?.includes('text/event-stream') ||
      req.url?.includes('/stream');

    if (isStream) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      res.write(`event: step\ndata: ${JSON.stringify({ step: 'Analyzing query & conceptual boundaries...' })}\n\n`);

      try {
        const result = await executeChat({
          message,
          history,
          context: vaultContext,
          model,
          provider,
          style,
          privacyMode,
          stream: true,
          onStep: (step) => {
            res.write(`event: step\ndata: ${JSON.stringify({ step })}\n\n`);
          },
          onChunk: (chunk) => {
            res.write(`event: chunk\ndata: ${JSON.stringify({ chunk })}\n\n`);
          },
        });

        res.write(`event: done\ndata: ${JSON.stringify(result)}\n\n`);
        res.end();
      } catch (streamErr: unknown) {
        const errMsg = streamErr instanceof Error ? streamErr.message : 'Streaming execution failed.';
        res.write(`event: error\ndata: ${JSON.stringify({ message: errMsg, error_type: 'STREAM_FAILED' })}\n\n`);
        res.end();
      }
    } else {
      const result = await executeChat({
        message,
        history,
        context: vaultContext,
        model,
        provider,
        style,
        privacyMode,
        stream: false,
      });
      sendJson(res, 200, result);
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    sendJson(res, 500, {
      status: 'error',
      error_type: 'SERVER_ERROR',
      answer: `ARC Intelligence Gateway Error: ${errMsg}`,
      provider: 'ARC Gateway',
      model_id: 'arc-error',
      fallback_used: false,
      attempts: 1,
    });
  }
}
