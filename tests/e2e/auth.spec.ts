import { test, expect } from '@playwright/test';

import { PASSWORD, logIn, signUp, uniqueEmail } from './helpers';

test.describe('authentication', () => {
  test('a visitor sees the landing page and the 474 count', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Climb the whole DSA ladder');
    await expect(page.getByText(/474 problems/).first()).toBeVisible();
  });

  test('signing up creates an account and lands on the dashboard', async ({ page }) => {
    const { name } = await signUp(page);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(name.split(' ')[0]);
    await expect(page.getByText('474', { exact: true }).first()).toBeVisible();
  });

  test('a duplicate e-mail is rejected with a field error', async ({ page }) => {
    const email = uniqueEmail('dupe');
    await signUp(page, email);

    // Sign out, then try the same address again.
    await page.getByRole('button', { name: 'Sign out' }).first().click();
    await page.waitForURL(/\/login/);

    await page.goto('/signup');
    await page.getByLabel('Name').fill('Someone Else');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Confirm password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('An account with this e-mail already exists')).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('a weak password is refused', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Name').fill('Weak');
    await page.getByLabel('E-mail').fill(uniqueEmail('weak'));
    await page.getByLabel('Password', { exact: true }).fill('alllowercase');
    await page.getByLabel('Confirm password').fill('alllowercase');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('alert').getByText(/uppercase letter/i)).toBeVisible();
  });

  test('mismatched passwords are refused', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Name').fill('Mismatch');
    await page.getByLabel('E-mail').fill(uniqueEmail('mismatch'));
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Confirm password').fill('SomethingElse9');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('log out then log back in, and the session works', async ({ page }) => {
    const { email } = await signUp(page);

    await page.getByRole('button', { name: 'Sign out' }).first().click();
    await page.waitForURL(/\/login/);
    await expect(page.getByText('You have been signed out')).toBeVisible();

    // Protected routes bounce you to the login page with a return path.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);

    await logIn(page, email);
    await page.waitForURL('**/dashboard');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('a wrong password does not reveal whether the account exists', async ({ page }) => {
    const { email } = await signUp(page);
    await page.getByRole('button', { name: 'Sign out' }).first().click();
    await page.waitForURL(/\/login/);

    await logIn(page, email, 'WrongPassword1');
    const realMessage = await page.getByRole('alert').first().textContent();

    await logIn(page, uniqueEmail('ghost'), 'WrongPassword1');
    const ghostMessage = await page.getByRole('alert').first().textContent();

    expect(realMessage).toBe(ghostMessage);
  });

  test('the forgot-password flow issues a working reset link', async ({ page }) => {
    const { email } = await signUp(page);
    await page.getByRole('button', { name: 'Sign out' }).first().click();
    await page.waitForURL(/\/login/);

    await page.goto('/forgot-password');
    await page.getByLabel('E-mail').fill(email);
    await page.getByRole('button', { name: 'Send reset link' }).click();

    // With EMAIL_ENABLED=false the link is surfaced in the UI for local testing.
    const link = page.getByRole('link', { name: /reset-password\?token=/ });
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();

    await page.goto(href!.replace(/^https?:\/\/[^/]+/, ''));
    await page.getByLabel('New password', { exact: true }).fill('BrandNewPass9');
    await page.getByLabel('Confirm new password').fill('BrandNewPass9');
    await page.getByRole('button', { name: 'Set new password' }).click();

    await page.waitForURL(/\/login/);
    await expect(page.getByText(/password has been changed/i)).toBeVisible();

    // The old password must no longer work, and the new one must.
    await logIn(page, email, PASSWORD);
    await expect(page.getByRole('alert').first()).toBeVisible();

    await logIn(page, email, 'BrandNewPass9');
    await page.waitForURL('**/dashboard');
  });

  test('the forgot-password form says the same thing for an unknown address', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel('E-mail').fill(uniqueEmail('nobody'));
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText(/If an account exists for that address/)).toBeVisible();
  });

  test('a 404 page is shown for an unknown route', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByText('That rung is not on the ladder')).toBeVisible();
  });
});
