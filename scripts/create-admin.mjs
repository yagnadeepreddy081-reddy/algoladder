#!/usr/bin/env node
/**
 * admin:create — grant the admin role.
 *
 *   # promote an account that already signed up (recommended)
 *   npm run admin:create -- you@example.com
 *
 *   # create a brand new admin account
 *   npm run admin:create -- you@example.com --password 'SomeStrongPass1' --name 'Yagnadeep'
 *
 *   # take it away again
 *   npm run admin:create -- you@example.com --revoke
 */

import { randomBytes, scrypt as _scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { createPool } from './_env.mjs';

const scrypt = promisify(_scrypt);

// NOTE: this must stay byte-compatible with src/lib/auth/password.ts.
const PARAMS = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize('NFKC'), salt, 64, PARAMS);
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('hex'), derived.toString('hex')].join('$');
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? null : process.argv[i + 1];
}

const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const email = (positional[0] ?? '').toLowerCase().trim();
const password = arg('password');
const name = arg('name');
const revoke = process.argv.includes('--revoke');

if (!email || !email.includes('@')) {
  console.error('\n  Usage: npm run admin:create -- you@example.com [--password "Pass1234" --name "Your Name"] [--revoke]\n');
  process.exit(1);
}

const pool = createPool();

async function main() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT id, role FROM users WHERE email = $1', [email]);
    let userId = rows[0]?.id;

    if (revoke) {
      if (!userId) {
        console.error(`\n  No account found for ${email}.\n`);
        process.exit(1);
      }
      await client.query("UPDATE users SET role = 'user' WHERE id = $1", [userId]);
      await client.query('DELETE FROM admin_users WHERE user_id = $1', [userId]);
      console.log(`\n  Admin access revoked for ${email}.\n`);
      return;
    }

    if (!userId) {
      if (!password) {
        console.error(
          `\n  No account exists for ${email}.\n` +
            '  Either sign up in the app first and re-run this command, or pass --password to create the account now.\n',
        );
        process.exit(1);
      }
      if (password.length < 8) {
        console.error('\n  Password must be at least 8 characters.\n');
        process.exit(1);
      }

      const hash = await hashPassword(password);
      await client.query('BEGIN');
      const created = await client.query(
        `INSERT INTO users (email, password_hash, role, email_verified)
         VALUES ($1, $2, 'admin', true) RETURNING id`,
        [email, hash],
      );
      userId = created.rows[0].id;
      await client.query(
        `INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, name ?? email.split('@')[0]],
      );
      await client.query(
        `INSERT INTO subscriptions (user_id, plan, status, provider)
         VALUES ($1, 'lifetime', 'active', 'mock') ON CONFLICT (user_id) DO NOTHING`,
        [userId],
      );
      await client.query(
        `INSERT INTO admin_users (user_id, note) VALUES ($1, 'Created via admin:create')
         ON CONFLICT (user_id) DO NOTHING`,
        [userId],
      );
      await client.query('COMMIT');
      console.log(`\n  Created admin account ${email}. You can sign in with it now.\n`);
      return;
    }

    await client.query('BEGIN');
    await client.query("UPDATE users SET role = 'admin' WHERE id = $1", [userId]);
    await client.query(
      `INSERT INTO admin_users (user_id, note) VALUES ($1, 'Promoted via admin:create')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );
    await client.query(
      `INSERT INTO subscriptions (user_id, plan, status, provider)
       VALUES ($1, 'lifetime', 'active', 'mock')
       ON CONFLICT (user_id) DO UPDATE SET plan = 'lifetime', status = 'active'`,
      [userId],
    );
    await client.query('COMMIT');
    console.log(`\n  ${email} is now an admin. Sign out and back in for the change to take effect.\n`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(`\n  admin:create failed: ${err.message}\n`);
  process.exit(1);
});
