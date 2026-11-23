import type { ExtendedRequest, ExtendedResponse } from './_lib/http.js';
import { parseRequestBody, sendJson } from './_lib/http.js';
import { executeVision, type ArcResponseStyle, type ArcPrivacyMode } from './_lib/provider.js';

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, {
      status: 'error',
      error_type: 'METHOD_NOT_ALLOWED',
      answer: 'Method Not Allowed. Use POST for artifact analysis.',
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
        provider: 'ARC Vision Engine',
        model_id: 'arc-vision-error',
        fallback_used: false,
        attempts: 0,
      });
      return;
    }

    const prompt = body?.prompt || 'Analyze this document, diagram, or visual artifact thoroughly.';
    const model = body?.model || body?.model_id;
    const provider = body?.provider;
    const style = (body?.style || body?.response_style) as ArcResponseStyle | undefined;
    const privacyMode = (body?.privacy_mode || body?.privacyMode) as ArcPrivacyMode | undefined;

    let fileBase64 = '';
    let mimeType = 'image/jpeg';

    if (body?.image && typeof body.image === 'string') {
      const rawImg = body.image.trim();
      if (rawImg.startsWith('data:')) {
        const parts = rawImg.split(',');
        const header = parts[0] || '';
        mimeType = header.split(';')[0]?.replace('data:', '') || 'image/jpeg';
        fileBase64 = parts[1] || '';
      } else {
        fileBase64 = rawImg;
        mimeType = body.mime_type || 'image/jpeg';
      }
    } else if (body?.fileData?.base64) {
      fileBase64 = body.fileData.base64;
      mimeType = body.fileData.mimeType || 'image/jpeg';
    }

    if (!fileBase64) {
      sendJson(res, 400, {
        status: 'error',
        error_type: 'MISSING_IMAGE_PAYLOAD',
        answer: 'Missing image payload: Provide a base64 encoded "image" or data URI in the request body.',
        provider: 'ARC Vision Engine',
        model_id: 'arc-vision-error',
        fallback_used: false,
        attempts: 1,
      });
      return;
    }

    const result = await executeVision({
      prompt,
      fileData: { mimeType, base64: fileBase64 },
      model,
      provider,
      style,
      privacyMode,
    });

    sendJson(res, 200, result);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Visual analysis failed.';
    sendJson(res, 500, {
      status: 'error',
      error_type: 'ANALYSIS_ERROR',
      answer: `Visual Analysis Error: ${errMsg}`,
      provider: 'ARC Vision Engine',
      model_id: 'arc-vision-error',
      fallback_used: false,
      attempts: 1,
    });
  }
}
