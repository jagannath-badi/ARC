export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  answer: string;
  provider: string;
  model_id: string;
  status: 'success' | 'error';
  error_type?: string | null;
  fallback_used: boolean;
  attempts: number;
  original_model?: string | null;
}

export interface HealthResponse {
  status: string;
  models: {
    default?: string;
    model_id?: string;
    provider?: string;
    [key: string]: unknown;
  };
}

export interface ModelOption {
  id: string;
  label: string;
  provider: string;
  specialty: string;
  supports_vision: boolean;
}

export interface ModelsResponse {
  models: ModelOption[];
  default_model: string;
}

export interface OperatorUser {
  id: string;
  username: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: OperatorUser;
}

export interface SessionSummary {
  id: string;
  title: string;
  has_dut: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface SessionMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  imagePreviewUrl?: string;
  metadata?: {
    provider?: string;
    model_id?: string;
    attempts?: number;
    fallback_used?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SessionDetail {
  id: string;
  title: string;
  dut_image: string | null;
  messages: SessionMessage[];
  created_at: string;
  updated_at: string;
}

export interface SaveSessionPayload {
  id?: string;
  title?: string;
  dut_image?: string | null;
  messages: unknown[];
}

export interface VaultStats {
  total_documents: number;
  total_chunks: number;
  branches: Record<string, number>;
  source_types: Record<string, number>;
  database_size_bytes: number;
}


const TOKEN_KEY = 'arc_token';
const LEGACY_TOKEN_KEY = 'circuitsnap_token';

export function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) return token;
    // Fallback read & one-time migration from legacy circuitsnap_token
    const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacyToken) {
      localStorage.setItem(TOKEN_KEY, legacyToken);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      return legacyToken;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // ignore localStorage errors
  }
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Checks the status of the ARC academic API layer.
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch('/api/health');
  if (!response.ok) {
    let errorDetail = `Health check failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson) {
        errorDetail = errJson.error || (errJson.detail && (typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail))) || errorDetail;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

/**
 * Fetches available AI models from GET /api/models.
 */
export async function fetchAvailableModels(): Promise<ModelOption[]> {
  const response = await fetch('/api/models');
  if (!response.ok) {
    let errorDetail = `Failed to fetch models (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errorDetail);
  }
  const data: ModelsResponse = await response.json();
  return data.models || [];
}

export type ArcResponseStyle = 'academic' | 'guided' | 'natural' | 'concise' | 'engineer';

/**
 * Sends a textual multi-turn chat message to POST /api/chat.
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = [],
  model?: string,
  provider?: string,
  modelId?: string,
  privacyMode?: 'strict' | 'guarded' | 'relaxed',
  style: ArcResponseStyle = 'academic',
  vaultContext?: string
): Promise<ChatResponse> {
  const resolvedProvider =
    provider ||
    (model?.startsWith('gemini')
      ? 'Google Gemini'
      : model === 'openai-gateway'
      ? 'OpenAI Gateway'
      : undefined);

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      message,
      history,
      model: model || undefined,
      provider: resolvedProvider,
      model_id: modelId || undefined,
      privacy_mode: privacyMode || undefined,
      style: style || 'academic',
      stream: false,
      vault_context: vaultContext,
    }),
  });

  if (!response.ok) {
    let errorDetail = `Chat request failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson) {
        errorDetail = errJson.answer || errJson.error || errJson.detail || errorDetail;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Sends an image (with optional prompt) to POST /api/analyze using base64 payload.
 */
export async function analyzeImage(
  file: File,
  prompt?: string,
  model?: string,
  provider?: string,
  modelId?: string,
  style: ArcResponseStyle = 'academic',
  privacyMode?: 'strict' | 'guarded' | 'relaxed'
): Promise<ChatResponse> {
  const base64Data = await fileToBase64(file);
  const resolvedProvider =
    provider ||
    (model?.startsWith('gemini')
      ? 'Google Gemini'
      : model === 'openai-gateway'
      ? 'OpenAI Gateway'
      : undefined);

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      image: base64Data,
      mime_type: file.type || 'image/jpeg',
      prompt: prompt?.trim() || undefined,
      model: model || undefined,
      provider: resolvedProvider,
      model_id: modelId || undefined,
      style: style || 'academic',
      privacy_mode: privacyMode || undefined,
    }),
  });

  if (!response.ok) {
    let errorDetail = `Image analysis failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson) {
        errorDetail = errJson.answer || errJson.error || errJson.detail || errorDetail;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Registers a new operator account and saves access token in localStorage.
 */
export async function registerOperator(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let errorDetail = `Registration failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const data: AuthResponse = await response.json();
  setStoredToken(data.access_token);
  return data;
}

/**
 * Logs in an existing operator and saves access token in localStorage.
 */
export async function loginOperator(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let errorDetail = `Login failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  const data: AuthResponse = await response.json();
  setStoredToken(data.access_token);
  return data;
}

/**
 * Validates current stored bearer token and returns operator profile, or null if guest/expired.
 */
export async function fetchCurrentOperator(): Promise<OperatorUser | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        setStoredToken(null);
      }
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Logs out current operator by clearing stored bearer token.
 */
export function logoutOperator(): void {
  setStoredToken(null);
}

/**
 * Fetches all saved diagnostic sessions for the current operator.
 */
export async function fetchVaultSessions(): Promise<SessionSummary[]> {
  const response = await fetch('/api/vault/sessions', {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 401) return [];
    throw new Error(`Failed to fetch sessions (${response.status})`);
  }
  return response.json();
}

/**
 * Fetches full session detail by ID.
 */
export async function fetchSessionDetail(id: string): Promise<SessionDetail> {
  const response = await fetch(`/api/vault/sessions/${encodeURIComponent(id)}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch session detail (${response.status})`);
  }
  return response.json();
}

/**
 * Saves or updates a session in the operator's diagnostic vault.
 */
export async function saveCurrentSession(payload: SaveSessionPayload): Promise<SessionDetail> {
  const response = await fetch('/api/vault/sessions', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let errorDetail = `Failed to save session (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson?.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

/**
 * Deletes a session from the operator's vault.
 */
export async function deleteVaultSession(id: string): Promise<void> {
  const response = await fetch(`/api/vault/sessions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete session (${response.status})`);
  }
}

/**
 * Fetches statistics from the Self-Evolving Knowledge Vault.
 */
export async function fetchVaultStats(): Promise<VaultStats> {
  const response = await fetch('/api/learn/stats');
  if (!response.ok) {
    throw new Error(`Failed to fetch vault stats (${response.status})`);
  }
  return response.json();
}

/**
 * Ingests a syllabus note, PDF, or markdown document into the Self-Evolving Knowledge Vault.
 */
export async function ingestVaultDocument(
  file: File,
  branch = 'ALL'
): Promise<{ message: string; title: string; chunks_indexed: number }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('branch', branch);

  const response = await fetch('/api/learn/ingest', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `Document ingestion failed (${response.status})`;
    try {
      const err = await response.json();
      if (err?.detail) {
        errorDetail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Teaches or records user knowledge/feedback into the Knowledge Vault.
 */
export async function sendFeedbackToVault(
  text: string,
  branch = 'ALL',
  title = 'User Knowledge Contribution'
): Promise<{ message: string; chunks_indexed: number }> {
  const response = await fetch('/api/learn/feedback', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ text, branch, title }),
  });

  if (!response.ok) {
    let errorDetail = `Feedback ingestion failed (${response.status})`;
    try {
      const err = await response.json();
      if (err?.detail) {
        errorDetail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export interface StreamChatOptions {
  model?: string;
  provider?: string;
  modelId?: string;
  responseStyle?: string;
  style?: ArcResponseStyle;
  privacyMode?: 'strict' | 'guarded' | 'relaxed';
  vaultContext?: string;
  signal?: AbortSignal;
  onStep?: (step: string) => void;
  onChunk?: (chunk: string) => void;
  onDone?: (res: ChatResponse) => void;
  onError?: (err: Error) => void;
}

/**
 * Streams a chat query via Server-Sent Events (SSE) with real-time cognitive trace steps and chunk delivery.
 */
export async function streamChatMessage(
  message: string,
  history: ChatMessage[] = [],
  options: StreamChatOptions = {}
): Promise<void> {
  const { model, provider, modelId, responseStyle, style, privacyMode, vaultContext, signal, onStep, onChunk, onDone, onError } = options;
  const resolvedStyle: ArcResponseStyle =
    style ||
    (responseStyle === 'guided' || responseStyle === 'natural' || responseStyle === 'concise' || responseStyle === 'engineer' || responseStyle === 'academic'
      ? (responseStyle as ArcResponseStyle)
      : 'academic');

  const resolvedProvider =
    provider ||
    (model?.startsWith('gemini')
      ? 'Google Gemini'
      : model === 'openai-gateway'
      ? 'OpenAI Gateway'
      : undefined);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      signal,
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      }),
      body: JSON.stringify({
        message,
        history,
        model: model || undefined,
        provider: resolvedProvider,
        model_id: modelId || undefined,
        response_style: responseStyle || undefined,
        style: resolvedStyle,
        privacy_mode: privacyMode || undefined,
        stream: true,
        vault_context: vaultContext,
      }),
    });

    if (!response.ok || !response.body) {
      // If 4xx (client error), do not fire duplicate POST fallback: throw immediately
      if (response.status >= 400 && response.status < 500) {
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error || errJson?.message || `Request failed with status ${response.status}`;
        throw new Error(errMsg);
      }
      // Fallback to standard chat endpoint if streaming fails due to server/stream issues
      const fallbackRes = await sendChatMessage(message, history, model, provider, modelId, privacyMode, resolvedStyle, vaultContext);
      onChunk?.(fallbackRes.answer);
      onDone?.(fallbackRes);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const processSseBlock = (block: string) => {
      if (!block.trim()) return;

      let eventType = 'message';
      let dataStr = '';

      const subLines = block.split('\n');
      for (const sub of subLines) {
        if (sub.startsWith('event:')) {
          eventType = sub.replace('event:', '').trim();
        } else if (sub.startsWith('data:')) {
          dataStr = sub.replace('data:', '').trim();
        }
      }

      if (!dataStr) return;

      let parsed: Record<string, any>;
      try {
        parsed = JSON.parse(dataStr);
      } catch {
        // ignore malformed non-JSON SSE line
        return;
      }

      if (eventType === 'step' && parsed?.step) {
        onStep?.(parsed.step);
      } else if (eventType === 'chunk' && parsed?.chunk) {
        onChunk?.(parsed.chunk);
      } else if (eventType === 'error') {
        const err = new Error(parsed?.message || parsed?.answer || 'Stream error');
        if (onError) {
          onError(err);
          return;
        }
        throw err;
      } else if (eventType === 'done') {
        const chatRes: ChatResponse = {
          answer: parsed?.answer || '',
          provider: parsed?.provider || 'ARC Core',
          model_id: parsed?.model_id || 'arc-auto',
          status: parsed?.status || 'success',
          error_type: parsed?.error_type || null,
          fallback_used: parsed?.fallback_used ?? false,
          attempts: parsed?.attempts ?? 1,
        };
        onDone?.(chatRes);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        processSseBlock(line);
      }
    }

    // Process any remaining tail block in buffer after stream ends
    if (buffer.trim()) {
      const remainingLines = buffer.split('\n\n');
      for (const line of remainingLines) {
        processSseBlock(line);
      }
    }
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      return;
    }
    if (onError) {
      onError(err instanceof Error ? err : new Error(String(err)));
    } else {
      throw err;
    }
  }
}



export interface VoicePersona {
  id: string;
  name: string;
  default_pitch: string;
  default_rate: string;
  gender: string;
  accent: string;
}

export interface VoicesResponse {
  default: string;
  personas: VoicePersona[];
}

export interface STTResponse {
  text: string;
}

export async function fetchVoices(): Promise<VoicesResponse> {
  const res = await fetch('/api/voices');
  if (!res.ok) throw new Error('Failed to fetch voices');
  return res.json();
}

export async function speechToText(blob: Blob, filename = 'speech.webm'): Promise<STTResponse> {
  const formData = new FormData();
  formData.append('file', blob, filename);
  const res = await fetch('/api/stt', { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `STT failed: ${res.status}`);
  }
  return res.json();
}

export async function textToSpeech(text: string, voice?: string, rate?: string, pitch?: string): Promise<Blob> {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, rate, pitch }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `TTS failed: ${res.status}`);
  }
  return res.blob();
}



