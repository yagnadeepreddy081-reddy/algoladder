# Deploying AlgoLadder

Everything below fits inside free tiers. Total cost: nothing.

The stack is a plain Next.js app plus a Postgres connection string, so any host that runs Node will
work. Vercel is the least friction.

---

## 1. Create a Postgres database

### Supabase (recommended — generous free tier, stays free)

1. Sign up at supabase.com and create a project. Pick the region nearest you.
2. Save the database password it shows you — it is not shown again.
3. Project Settings → **Database** → Connection string → **URI**.
4. Use the **Session pooler** string (port 6543 or 5432 depending on what it offers). It looks like:
   ```
   postgresql://postgres.abcdefgh:YOUR-PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
   ```
5. You will set `PGSSLMODE=require` alongside it.

You do **not** need Supabase Auth, Storage or their client libraries. AlgoLadder only uses the
Postgres database, which means you are never locked in — any Postgres works.

### Neon (alternative)

Create a project, copy the connection string from the dashboard, and set `PGSSLMODE=require`.
Neon's free tier suspends an idle database, so the first request after a quiet period is slow.

---

## 2. Load the schema and the 474 problems

Do this from your machine, pointed at the production database, **before** the first deploy:

```bash
# in the project directory
cp .env.example .env.production.local
# edit it: DATABASE_URL=<your production string>, PGSSLMODE=require

DATABASE_URL="postgresql://...your production string..." PGSSLMODE=require npm run db:migrate
DATABASE_URL="postgresql://...your production string..." PGSSLMODE=require npm run db:seed
```

Expected output ends with:

```
  Seed complete. 474 active problems in the database.
```

If you want some topics premium, set `PREMIUM_TOPIC_SLUGS` **before** seeding.

---

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "AlgoLadder: 474-problem DSA roadmap"
git branch -M main
git remote add origin https://github.com/<you>/algoladder.git
git push -u origin main
```

`.gitignore` already excludes `.env.local`, `.env.production.local`, `node_modules` and `.next`.
**Check that no `.env*` file with a real password got committed** before you push.

---

## 4. Deploy on Vercel

1. vercel.com → Add New → Project → import the repository.
2. Framework preset: **Next.js** (detected automatically). Leave the build command alone — it runs
   `npm run build`, which validates the dataset first.
3. Add these environment variables (Production, Preview and Development):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | your production connection string |
   | `PGSSLMODE` | `require` |
   | `AUTH_SECRET` | a fresh 48-byte random string — **not** the one from your laptop |
   | `AUTH_SESSION_DAYS` | `30` |
   | `NEXT_PUBLIC_APP_NAME` | `AlgoLadder` |
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
   | `EMAIL_ENABLED` | `false` |
   | `MOCK_SUBSCRIPTIONS` | `false` |
   | `NEXT_PUBLIC_MOCK_SUBSCRIPTIONS` | `false` |
   | `PAYMENTS_ENABLED` | `false` |
   | `ADMIN_EMAILS` | your e-mail, so your first sign-up is an admin |
   | `PREMIUM_TOPIC_SLUGS` | `dynamic-programming,advanced-dsa` |

   Generate the secret with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

4. Deploy. The first build takes two or three minutes.
5. Update `NEXT_PUBLIC_APP_URL` to the real URL and redeploy, so password-reset links point at the
   right host.

### Connection pooling

Serverless functions open a lot of short-lived connections. Two things keep that sane:

- Use Supabase's **pooler** connection string (or Neon's pooled endpoint), not the direct one.
- `PGPOOL_MAX` defaults to 10 per instance. On a free tier, set it to `5`.

---

## 5. Make yourself an admin

If you set `ADMIN_EMAILS`, just sign up with that address.

Otherwise, sign up first, then run against the production database:

```bash
DATABASE_URL="postgresql://...production..." PGSSLMODE=require \
  npm run admin:create -- you@example.com
```

Sign out and back in — the role travels in the session token.

---

## Netlify

Works with the official Next.js runtime.

1. New site from Git, build command `npm run build`, publish directory `.next`.
2. Install the `@netlify/plugin-nextjs` plugin (Netlify usually offers it automatically).
3. Set the same environment variables as above.

## Cloudflare Pages

Needs `@cloudflare/next-on-pages`, and the Node Postgres driver requires the Node.js compatibility
flag:

```bash
npm i -D @cloudflare/next-on-pages
```

Build command `npx @cloudflare/next-on-pages`, and set `nodejs_compat` in the Pages compatibility
flags. If you hit driver problems, Vercel or Netlify are the lower-friction choice.

## Running it on your own server

```bash
npm ci
npm run build
npm start          # listens on :3000
```

Put nginx or Caddy in front for TLS. Use a process manager (`pm2`, or a systemd unit) so it
restarts on reboot.

---

## Updating the dataset after deployment

The database is the live copy; the repository is the source of truth.

```bash
# edit data/source/roadmap.mjs
npm run dataset:build
npm run validate-problems

DATABASE_URL="postgresql://...production..." PGSSLMODE=require \
  npm run db:seed -- --prune
```

Seeding upserts the catalogue and **never touches user progress, notes or bookmarks**. `--prune`
removes problems no longer in the dataset — and deleting a problem cascades to progress rows for
it, so only prune when you mean it.

You can also import through **Admin → Import / export** in the running app, which does the same
thing in one transaction.

---

## Before you share the link

- [ ] `npm run dataset:check-urls` has been run and the failures dealt with
- [ ] `AUTH_SECRET` in production is different from your local one
- [ ] `PAYMENTS_ENABLED=false` and `MOCK_SUBSCRIPTIONS=false` in production
- [ ] `NEXT_PUBLIC_APP_URL` matches the deployed URL
- [ ] No `.env` file with a real password is in the repository
- [ ] You have an admin account and can reach `/admin`
- [ ] `/admin/data` reports **PASSED — exactly 474 valid problems**
- [ ] The originality note in the landing page footer is still there and still accurate



## Guest workspace and reset email

The `/demo` route renders from the bundled catalogue without a database. It offers browser-local guest tracking, a manual revision queue and progress export. Deploying the full repository still requires its normal npm dependencies and build.

For account password resets, configure `EMAIL_ENABLED=true`, `RESEND_API_KEY`, and `EMAIL_FROM` from a verified sender domain. Set `ALLOW_DEV_RESET_LINKS=false` in production. The transport uses [Resend's send-email REST API](https://resend.com/docs/api-reference/emails/send-email).

Set `WANDBOX_URL` only when using your own compiler service. The default service must be reachable for Run and Submit. Guest mode links to original problem platforms and does not execute code.

Before sharing on LinkedIn, verify the CI workflow on the release commit and test the deployed URL. See SHOWCASE.md for the recording checklist and draft post.
