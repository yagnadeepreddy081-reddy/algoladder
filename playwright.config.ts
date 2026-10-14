import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests. These boot the real Next.js server against the real
 * database, sign up real accounts and click real buttons — which is the only
 * way to prove that "every button works" rather than asserting it.
 *
 *   npm run test:e2e
 *   npm run test:e2e -- --ui        (locally, with the inspector)
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      // The test server is on localhost, so never send its requests through a
      // system HTTP proxy. Some proxies reject the parentheses that Next.js
      // puts in route-group chunk URLs (/_next/.../app/(app)/...), which shows
      // up as a chunk-load failure and a navigation that silently never
      // commits.
      args: ['--no-proxy-server'],
      // Set PW_CHROMIUM_PATH to reuse a Chromium you already have on disk
      // instead of letting `npx playwright install` download another one.
      ...(process.env.PW_CHROMIUM_PATH
        ? { executablePath: process.env.PW_CHROMIUM_PATH }
        : {}),
    },
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /mobile\.spec\.ts/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.ts/ },
  ],

  webServer: {
    env: { ALLOW_DEV_RESET_LINKS: 'true' },
    command: `npx next start -p ${PORT}`,
    url: baseURL,
    // Never reuse a server that happens to be on the port: `next build` swaps
    // the chunk hashes, and an older server left running would serve HTML that
    // asks for chunks it no longer has — which surfaces as navigations that
    // silently refuse to commit rather than as an obvious error.
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});

