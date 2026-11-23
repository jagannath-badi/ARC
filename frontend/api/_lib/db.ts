import { neon } from '@neondatabase/serverless';

export interface VaultSession {
  id: string;
  title: string;
  has_dut: boolean;
  dut_image: string | null;
  message_count: number;
  messages: unknown[];
  created_at: string;
  updated_at: string;
}

export interface VaultSessionSummary {
  id: string;
  title: string;
  has_dut: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface SaveSessionInput {
  id?: string;
  title?: string;
  has_dut?: boolean;
  dut_image?: string | null;
  messages?: unknown[];
}

// In-memory fallback session store when DATABASE_URL is not configured
const inMemoryStore = new Map<string, VaultSession>();

let sqlClient: ReturnType<typeof neon> | null = null;
let activeDatabaseUrl: string | null = null;
let tableInitPromise: Promise<void> | null = null;

export function sanitizeDbError(err: unknown): string {
  if (err instanceof Error) {
    let msg = err.message;
    // Strip connection string or credentials from any database error message
    msg = msg.replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, '[REDACTED_DATABASE_URL]');
    msg = msg.replace(/password=[^\s;&]+/gi, 'password=[REDACTED]');
    return msg;
  }
  return 'Unknown database error';
}

function getDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  return url || null;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getDatabaseDriver(): 'neon' | 'memory' {
  return isDatabaseConfigured() ? 'neon' : 'memory';
}

function getSqlClient(): ReturnType<typeof neon> | null {
  const url = getDatabaseUrl();
  if (!url) {
    sqlClient = null;
    activeDatabaseUrl = null;
    return null;
  }
  if (!sqlClient || activeDatabaseUrl !== url) {
    sqlClient = neon(url);
    activeDatabaseUrl = url;
    tableInitPromise = null;
  }
  return sqlClient;
}

export async function ensureVaultSessionsTable(): Promise<void> {
  const sql = getSqlClient();
  if (!sql) return;

  if (!tableInitPromise) {
    tableInitPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS vault_sessions (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          has_dut BOOLEAN NOT NULL DEFAULT FALSE,
          dut_image TEXT,
          message_count INTEGER NOT NULL DEFAULT 0,
          messages JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
    })().catch((err: unknown) => {
      tableInitPromise = null;
      const safeMsg = sanitizeDbError(err);
      console.error('[Vault DB] Failed to initialize vault_sessions table:', safeMsg);
      throw new Error(`Database table initialization failed: ${safeMsg}`);
    });
  }

  return tableInitPromise;
}

function toIsoString(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  if (val) return String(val);
  return new Date().toISOString();
}

function parseMessages(val: unknown): unknown[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }
  return [];
}

export async function listSessions(): Promise<VaultSessionSummary[]> {
  const sql = getSqlClient();
  if (sql) {
    try {
      await ensureVaultSessionsTable();
      const rows = (await sql`
        SELECT id, title, has_dut, message_count, created_at, updated_at
        FROM vault_sessions
        ORDER BY updated_at DESC;
      `) as Array<Record<string, unknown>>;
      return rows.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        title: String(r.title || 'Study Session'),
        has_dut: Boolean(r.has_dut),
        message_count: Number(r.message_count) || 0,
        created_at: toIsoString(r.created_at),
        updated_at: toIsoString(r.updated_at),
      }));
    } catch (err: unknown) {
      const safeMsg = sanitizeDbError(err);
      console.warn('[Vault DB] listSessions error, falling back to in-memory store:', safeMsg);
      // Graceful fallback to in-memory store when database query fails
    }
  }

  // Fallback to in-memory store
  return Array.from(inMemoryStore.values())
    .map((s) => ({
      id: s.id,
      title: s.title,
      has_dut: s.has_dut,
      message_count: s.message_count,
      created_at: s.created_at,
      updated_at: s.updated_at,
    }))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getSession(id: string): Promise<VaultSession | null> {
  const sql = getSqlClient();
  if (sql) {
    try {
      await ensureVaultSessionsTable();
      const rows = (await sql`
        SELECT id, title, has_dut, dut_image, message_count, messages, created_at, updated_at
        FROM vault_sessions
        WHERE id = ${id}
        LIMIT 1;
      `) as Array<Record<string, unknown>>;
      if (!rows || rows.length === 0) {
        return null;
      }
      const r = rows[0]!;
      return {
        id: String(r.id),
        title: String(r.title || 'Study Session'),
        has_dut: Boolean(r.has_dut),
        dut_image: r.dut_image ? String(r.dut_image) : null,
        message_count: Number(r.message_count) || 0,
        messages: parseMessages(r.messages),
        created_at: toIsoString(r.created_at),
        updated_at: toIsoString(r.updated_at),
      };
    } catch (err: unknown) {
      const safeMsg = sanitizeDbError(err);
      console.warn('[Vault DB] getSession error, falling back to in-memory store:', safeMsg);
      // Graceful fallback to in-memory store
    }
  }

  // Fallback to in-memory store
  return inMemoryStore.get(id) || null;
}

export async function saveSession(input: SaveSessionInput): Promise<VaultSession> {
  const id = input.id?.trim() || `arc-session-${Date.now()}`;
  const now = new Date().toISOString();
  const title = input.title?.trim() || 'Study Session';
  const dut_image = input.dut_image || null;
  const has_dut = input.has_dut !== undefined ? input.has_dut : Boolean(dut_image);
  const messages = Array.isArray(input.messages) ? input.messages : [];
  const message_count = messages.length;

  const sql = getSqlClient();
  if (sql) {
    try {
      await ensureVaultSessionsTable();
      const messagesJson = JSON.stringify(messages);

      const rows = (await sql`
        INSERT INTO vault_sessions (
          id, title, has_dut, dut_image, message_count, messages, created_at, updated_at
        )
        VALUES (
          ${id},
          ${title},
          ${has_dut},
          ${dut_image},
          ${message_count},
          ${messagesJson}::jsonb,
          ${now},
          ${now}
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          has_dut = EXCLUDED.has_dut,
          dut_image = EXCLUDED.dut_image,
          message_count = EXCLUDED.message_count,
          messages = EXCLUDED.messages,
          updated_at = EXCLUDED.updated_at
        RETURNING id, title, has_dut, dut_image, message_count, messages, created_at, updated_at;
      `) as Array<Record<string, unknown>>;

      const r = rows[0]!;
      return {
        id: String(r.id),
        title: String(r.title || title),
        has_dut: Boolean(r.has_dut),
        dut_image: r.dut_image ? String(r.dut_image) : null,
        message_count: Number(r.message_count) || message_count,
        messages: parseMessages(r.messages),
        created_at: toIsoString(r.created_at),
        updated_at: toIsoString(r.updated_at),
      };
    } catch (err: unknown) {
      const safeMsg = sanitizeDbError(err);
      console.warn('[Vault DB] saveSession error, falling back to in-memory store:', safeMsg);
      // Graceful fallback to in-memory store
    }
  }

  // Fallback to in-memory store
  const existing = inMemoryStore.get(id);
  const session: VaultSession = {
    id,
    title,
    has_dut,
    dut_image,
    message_count,
    messages,
    created_at: existing?.created_at || now,
    updated_at: now,
  };
  inMemoryStore.set(id, session);
  return session;
}

export async function deleteSession(id: string): Promise<boolean> {
  const sql = getSqlClient();
  if (sql) {
    try {
      await ensureVaultSessionsTable();
      await sql`
        DELETE FROM vault_sessions
        WHERE id = ${id};
      `;
      return true;
    } catch (err: unknown) {
      const safeMsg = sanitizeDbError(err);
      console.warn('[Vault DB] deleteSession error, falling back to in-memory store:', safeMsg);
      // Graceful fallback to in-memory store
    }
  }

  // Fallback to in-memory store
  return inMemoryStore.delete(id);
}
