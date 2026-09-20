/**
 * Loads .env.local / .env before any test module imports `@/lib/db`, which
 * reads DATABASE_URL at pool-creation time.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function load(file: string) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
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

load('.env.test.local');
load('.env.local');
load('.env');

process.env.AUTH_SECRET ??= 'test-secret-value-that-is-long-enough-for-hs256';
