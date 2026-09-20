import { Pool, type QueryResultRow } from 'pg';

/**
 * A single pg Pool shared across the whole server process.
 *
 * Next.js hot-reloads modules in development, which would otherwise create a
 * new pool on every edit and exhaust the connection limit within minutes, so
 * the pool is stashed on globalThis.
 */

declare global {
  // eslint-disable-next-line no-var
  var __algoladderPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.',
    );
  }
  const sslmode = (process.env.PGSSLMODE ?? 'disable').toLowerCase();
  return new Pool({
    connectionString,
    ssl: sslmode === 'disable' ? false : { rejectUnauthorized: false },
    max: Number(process.env.PGPOOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export function getPool(): Pool {
  if (!globalThis.__algoladderPool) {
    globalThis.__algoladderPool = createPool();
  }
  return globalThis.__algoladderPool;
}

/** Run a parameterised query and get the rows back. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params as never[]);
  return result.rows;
}

/** Run a query expecting at most one row. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Run a statement and report how many rows it touched. */
export async function execute(text: string, params: unknown[] = []): Promise<number> {
  const result = await getPool().query(text, params as never[]);
  return result.rowCount ?? 0;
}

/** Run several statements inside one transaction. */
export async function transaction<T>(
  fn: (client: import('pg').PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Cheap liveness probe used by the health route and the setup checklist. */
export async function isDatabaseReachable(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    await query('SELECT 1');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
