import type { ExtendedRequest, ExtendedResponse } from './_lib/http.js';
import { sendJson } from './_lib/http.js';
import { getProviderStatus } from './_lib/provider.js';
import { getDatabaseDriver } from './_lib/db.js';

export default async function handler(_req: ExtendedRequest, res: ExtendedResponse) {
  try {
    const status = getProviderStatus();
    sendJson(res, 200, {
      status: 'healthy',
      database: getDatabaseDriver(),
      models: {
        default: status.defaultModel,
        model_id: status.defaultModelId,
        provider: status.providerName,
        available_providers: status.availableProviders,
      },
    });
  } catch (err: unknown) {
    sendJson(res, 500, {
      status: 'error',
      database: getDatabaseDriver(),
      error: err instanceof Error ? err.message : 'Health check failure',
      models: {
        default: 'ARC Core Engine',
        model_id: 'arc-standby',
        provider: 'ARC Core',
        available_providers: [],
      },
    });
  }
}
