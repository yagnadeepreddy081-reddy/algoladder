#!/usr/bin/env node
/**
 * db:migrate — applies every .sql file in db/migrations in name order,
 * recording what has run in the _migrations table so it is safe to re-run.
 *
 *   npm run db:migrate
 *   npm run db:migrate -- --reset   DROP the public schema first (destructive)
 */

import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPool, ROOT } from './_env.mjs';

const reset = process.argv.includes('--reset');
const pool = createPool();

const MIGRATIONS_DIR = resolve(ROOT, 'db', 'migrations');

async function main() {
  const client = await pool.connect();
  try {
    if (reset) {
      console.log('  --reset given: dropping and recreating the public schema...');
      await client.query('DROP SCHEMA public CASCADE');
      await client.query('CREATE SCHEMA public');
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name       text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const applied = new Set(
      (await client.query('SELECT name FROM _migrations')).rows.map((r) => r.name),
    );

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  skip   ${file}`);
        continue;
      }
      const sql = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8');
      console.log(`  apply  ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        ran += 1;
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }

    console.log(`\n  Migrations complete (${ran} applied, ${files.length - ran} already up to date).\n`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(`\n  migrate failed: ${err.message}\n`);
  process.exit(1);
});
