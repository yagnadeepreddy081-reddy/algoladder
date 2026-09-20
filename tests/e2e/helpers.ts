import { expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export const PASSWORD = 'LadderClimb7';

export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@algoladder.test`;
}

/** Sign up a brand new account and land on the dashboard. */
export async function signUp(page: Page, email = uniqueEmail(), name = 'Test Climber') {
  await page.goto('/signup');
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
  return { email, name };
}

export async function logIn(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
}

export async function signOut(page: Page) {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Sign out' }).first().click();
  await page.waitForURL(/\/login/);
}

/** Wait until a toast with this text has appeared. */
export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.getByRole('alert').or(page.locator('[aria-live="polite"]')).getByText(text)).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Call an API route from inside the page.
 *
 * Playwright's `page.request` uses its own cookie jar, so it arrives at the
 * server signed out. An in-page `fetch` carries the real session cookie, which
 * is what we actually want to assert on.
 */
export async function apiStatus(page: Page, url: string): Promise<number> {
  return page.evaluate(async (target) => {
    const res = await fetch(target);
    return res.status;
  }, url);
}

export async function apiJson<T>(page: Page, url: string): Promise<T> {
  return page.evaluate(async (target) => {
    const res = await fetch(target);
    return res.json();
  }, url) as Promise<T>;
}

export async function apiText(page: Page, url: string): Promise<string> {
  return page.evaluate(async (target) => {
    const res = await fetch(target);
    return res.text();
  }, url);
}
