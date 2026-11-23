import type { ExtendedRequest, ExtendedResponse } from './_lib/http.js';
import { sendJson } from './_lib/http.js';
import { getAvailableModelsList } from './_lib/provider.js';

export default async function handler(_req: ExtendedRequest, res: ExtendedResponse) {
  const models = getAvailableModelsList();
  sendJson(res, 200, {
    models,
    default_model: models[0]?.id || 'auto',
  });
}
