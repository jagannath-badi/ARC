import type { ExtendedRequest, ExtendedResponse } from './_lib/http.js';
import { getRequestPath, sendJson } from './_lib/http.js';

// 44-byte standard silent WAV header with 0 samples
const SILENT_WAV_BASE64 = 'UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
const SILENT_WAV_BUFFER = Buffer.from(SILENT_WAV_BASE64, 'base64');

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
  const pathname = getRequestPath(req);

  if (pathname === '/api/voices' || pathname === '/api/voice') {
    sendJson(res, 200, {
      default: 'arc-precision',
      personas: [
        {
          id: 'arc-precision',
          name: 'ARC Precision',
          gender: 'female',
          accent: 'en-US',
          default_rate: '1.0',
        },
        {
          id: 'arc-studio',
          name: 'Studio Clear',
          gender: 'female',
          accent: 'en-US',
          default_rate: '1.05',
        },
        {
          id: 'arc-lead',
          name: 'Academic Lead',
          gender: 'male',
          accent: 'en-US',
          default_rate: '1.0',
        },
        {
          id: 'arc-cadence',
          name: 'Classic British',
          gender: 'male',
          accent: 'en-GB',
          default_rate: '0.95',
        },
        {
          id: 'arc-specialist',
          name: 'Resolute Specialist',
          gender: 'male',
          accent: 'en-US',
          default_rate: '0.95',
        },
        {
          id: 'arc-agile',
          name: 'Agile Assistant',
          gender: 'male',
          accent: 'en-US',
          default_rate: '1.15',
        },
        {
          id: 'arc-calm',
          name: 'Whisper Calm',
          gender: 'female',
          accent: 'en-US',
          default_rate: '0.92',
        },
        {
          id: 'arc-academic',
          name: 'Academic Precision',
          gender: 'female',
          accent: 'en-GB',
          default_rate: '1.0',
        },
      ],
    });
    return;
  }

  if (pathname === '/api/tts') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/wav');
    res.end(SILENT_WAV_BUFFER);
    return;
  }

  if (pathname === '/api/stt') {
    sendJson(res, 200, { text: '', status: 'ok' });
    return;
  }

  sendJson(res, 404, { detail: 'Voice endpoint not found' });
}
