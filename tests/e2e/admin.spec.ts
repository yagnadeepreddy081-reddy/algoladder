import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

import { apiJson, apiStatus, apiText, signUp, uniqueEmail } from './helpers';

/**
 * These tests promote a freshly created account to admin using the same CLI
 * the README tells you to use, then drive the admin panel through the UI.
 */
async function makeAdmin(page: import('@playwright/test').Page) {
  const email = uniqueEmail('admin');
  await signUp(page, email, 'Admin Climber');

  execSync(`node scripts/create-admin.mjs ${email}`, { cwd: process.cwd(), stdio: 'pipe' });

  // The role lives in the session token, so sign out and back in.
  await page.getByRole('button', { name: 'Sign out' }).first().click();
  await page.waitForURL(/\/login/);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('LadderClimb7');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('**/dashboard');

  return email;
}

test.describe('admin panel', () => {
  test('an admin sees the panel and the dataset reads 474', async ({ page }) => {
    await makeAdmin(page);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Admin overview' })).toBeVisible();

    const tile = page.getByTestId('stat-active-problems');
    await expect(tile).toContainText('474');
    await expect(tile).toContainText('exactly 474');
  });

  test('dataset validation passes from the admin panel', async ({ page }) => {
    await makeAdmin(page);
    await page.goto('/admin/data');

    await expect(page.getByText(/PASSED — exactly 474 valid problems/)).toBeVisible();

    await page.getByRole('button', { name: 'Re-run' }).click();
    await expect(page.getByText(/PASSED — exactly 474 valid problems/)).toBeVisible();
  });

  test('an admin can edit a problem and the change is visible to users', async ({ page }) => {
    await makeAdmin(page);

    await page.goto('/admin/problems?q=fizz+buzz');
    await page.getByRole('link', { name: 'Fizz Buzz' }).click();
    await expect(page.getByRole('heading', { name: /Edit: Fizz Buzz/ })).toBeVisible();

    const marker = `Edited by an end-to-end test at ${Date.now()}.`;
    await page.getByLabel('Short description').fill(marker);
    await page.getByRole('button', { name: 'Save problem' }).click();

    await page.waitForURL(/\/admin\/problems/);

    await page.goto('/problems/fizz-buzz');
    await expect(page.getByText(marker).first()).toBeVisible();
  });

  test('the editor refuses a duplicate title', async ({ page }) => {
    await makeAdmin(page);

    await page.goto('/admin/problems?q=fizz+buzz');
    await page.getByRole('link', { name: 'Fizz Buzz' }).click();
    await page.getByLabel('Title').fill('Two Sum');
    await page.getByRole('button', { name: 'Save problem' }).click();

    await expect(page.getByText(/already has that exact title/)).toBeVisible();
  });

  test('an admin can toggle a problem between free and premium', async ({ page }) => {
    await makeAdmin(page);

    await page.goto('/admin/problems?q=fizz+buzz');
    const row = page.locator('li', { hasText: 'Fizz Buzz' }).first();
    await row.getByTitle('Make premium').click();
    await expect(page.getByText('Marked premium')).toBeVisible();

    await page.goto('/admin/problems?q=fizz+buzz');
    await expect(page.locator('li', { hasText: 'Fizz Buzz' }).first()).toContainText('Pro');

    // Put it back so the suite is idempotent.
    await page.locator('li', { hasText: 'Fizz Buzz' }).first().getByTitle('Make free').click();
    await expect(page.getByText('Marked free')).toBeVisible();
  });

  test('an admin can reorder problems', async ({ page }) => {
    await makeAdmin(page);

    await page.goto('/admin/problems');
    const firstBefore = await page.locator('li a[href^="/admin/problems/"]').first().textContent();

    await page.locator('li').filter({ hasText: firstBefore! }).first()
      .getByTitle('Move down in recommended order').click();
    await expect(page.getByText('Order updated')).toBeVisible();

    await page.goto('/admin/problems');
    const firstAfter = await page.locator('li a[href^="/admin/problems/"]').first().textContent();
    expect(firstAfter).not.toBe(firstBefore);

    // Restore the original order.
    await page.locator('li').filter({ hasText: firstBefore! }).first()
      .getByTitle('Move up in recommended order').click();
    await expect(page.getByText('Order updated')).toBeVisible();
  });

  test('an admin can export the dataset as JSON and CSV', async ({ page }) => {
    await makeAdmin(page);

    expect(await apiStatus(page, '/api/admin/export?what=problems&format=json')).toBe(200);
    const rows = await apiJson<unknown[]>(page, '/api/admin/export?what=problems&format=json');
    expect(rows).toHaveLength(474);

    const text = await apiText(page, '/api/admin/export?what=problems&format=csv');
    expect(text.split('\n')).toHaveLength(475); // header + 474
  });

  test('a JSON export round-trips back through the importer', async ({ page }) => {
    await makeAdmin(page);

    const rows = await apiJson<Record<string, unknown>[]>(
      page,
      '/api/admin/export?what=problems&format=json',
    );
    const subset = JSON.stringify(rows.slice(0, 3));

    await page.goto('/admin/data');
    await page.getByLabel('…or paste the JSON here').fill(subset);
    await page.getByRole('button', { name: 'Import problems' }).click();

    await expect(page.getByText(/Imported 3 problems/)).toBeVisible();
    await expect(page.getByText(/PASSED — exactly 474 valid problems/)).toBeVisible();
  });

  test('the importer rejects malformed JSON without touching the dataset', async ({ page }) => {
    await makeAdmin(page);

    await page.goto('/admin/data');
    await page.getByLabel('…or paste the JSON here').fill('{ not json at all');
    await page.getByRole('button', { name: 'Import problems' }).click();
    await expect(page.getByText(/not valid JSON/)).toBeVisible();

    await page.getByRole('button', { name: 'Re-run' }).click();
    await expect(page.getByText(/PASSED — exactly 474 valid problems/)).toBeVisible();
  });

  test('an admin can see users and change a plan', async ({ page }) => {
    const adminEmail = await makeAdmin(page);

    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    await expect(page.getByText(adminEmail)).toBeVisible();

    const row = page.locator('tr', { hasText: adminEmail });
    await row.getByRole('combobox').selectOption('pro');
    await expect(page.getByText('Plan set to pro')).toBeVisible();
  });

  test('an admin cannot remove their own admin access', async ({ page }) => {
    const adminEmail = await makeAdmin(page);
    await page.goto('/admin/users');
    const row = page.locator('tr', { hasText: adminEmail });
    await expect(row.getByText('You')).toBeVisible();
  });

  test('reported problems reach the admin reports queue', async ({ page, browser }) => {
    // A normal user files a report...
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    await signUp(userPage);
    await userPage.goto('/problems/valid-anagram');
    await userPage.getByRole('button', { name: /Report a problem with this entry/ }).click();
    await userPage.getByLabel('Details (optional)').fill('Reported from an end-to-end test.');
    await userPage.getByRole('button', { name: 'Send report' }).click();
    await expect(userPage.getByText(/sent to the admin queue/)).toBeVisible();
    await userContext.close();

    // ...and an admin sees it.
    await makeAdmin(page);
    await page.goto('/admin/reports');
    await expect(page.getByText('Reported from an end-to-end test.').first()).toBeVisible();

    await page.locator('li', { hasText: 'Reported from an end-to-end test.' }).first()
      .getByRole('combobox').selectOption('resolved');
    await expect(page.getByText(/Report marked resolved/)).toBeVisible();
  });

  test('an admin always has premium access without paying', async ({ page }) => {
    await makeAdmin(page);
    await page.goto('/analytics');
    await expect(page.getByText('Advanced analytics is part of Pro')).toHaveCount(0);
  });
});
