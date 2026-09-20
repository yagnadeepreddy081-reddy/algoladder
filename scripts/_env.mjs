/** Shared bootstrap for the CLI scripts: load .env files, build a pg Pool. */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, '..');

/** Minimal .env parser — avoids a dependency and handles quotes + comments. */
function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const rawLine of readFileSync(file, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue; // real env wins
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

export function loadEnv() {
  loadEnvFile(resolve(ROOT, '.env.local'));
  loadEnvFile(resolve(ROOT, '.env'));
}

export function createPool() {
  loadEnv();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      '\n  DATABASE_URL is not set.\n' +
        '  Copy .env.example to .env.local and point DATABASE_URL at your Postgres database.\n',
    );
    process.exit(1);
  }
  const sslmode = (process.env.PGSSLMODE ?? 'disable').toLowerCase();
  return new pg.Pool({
    connectionString,
    ssl: sslmode === 'disable' ? false : { rejectUnauthorized: false },
    max: 5,
  });
}
