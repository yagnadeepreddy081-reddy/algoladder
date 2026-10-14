import { test, expect } from '@playwright/test';

import { logIn, signUp } from './helpers';

test.describe('tracking progress', () => {
  test('marking a problem solved persists across a refresh and a re-login', async ({ page }) => {
    const { email } = await signUp(page);

    await page.goto('/problems/two-sum');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Two Sum');

    await page.getByRole('button', { name: 'Mark as solved' }).click();
    await expect(page.getByRole('button', { name: /Solved — undo/ })).toBeVisible();

    // A refresh must not lose it — this is the "does it really hit the DB" test.
    await page.reload();
    await expect(page.getByRole('button', { name: /Solved — undo/ })).toBeVisible();

    // Nor must signing out and back in.
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Sign out' }).first().click();
    await page.waitForURL(/\/login/);
    await logIn(page, email);
    await page.waitForURL('**/dashboard');

    await page.goto('/problems/two-sum');
    await expect(page.getByRole('button', { name: /Solved — undo/ })).toBeVisible();
  });

  test('the dashboard counts reflect what was actually solved', async ({ page }) => {
    await signUp(page);

    await page.goto('/dashboard');
    const solvedTile = page.getByTestId('stat-solved');
    await expect(solvedTile).toContainText('0');

    await page.goto('/problems/two-sum');
    await page.getByRole('button', { name: 'Mark as solved' }).click();
    await expect(page.getByRole('button', { name: /Solved — undo/ })).toBeVisible();

    await page.goto('/dashboard');
    await expect(solvedTile).toContainText('1');
    await expect(page.getByText('474', { exact: true }).first()).toBeVisible();
  });

  test('the status selector writes every state', async ({ page }) => {
    await signUp(page);
    await page.goto('/problems/fizz-buzz');

    const select = page.locator('select').first();

    // Wait for each save to be confirmed before reloading, otherwise the
    // reload races the server action rather than testing persistence.
    await select.selectOption('in_progress');
    await expect(page.getByText('Marked as in progress')).toBeVisible();
    await page.reload();
    await expect(page.locator('select').first()).toHaveValue('in_progress');

    await page.locator('select').first().selectOption('needs_revision');
    await expect(page.getByText('Added to your revision list')).toBeVisible();
    await page.reload();
    await expect(page.locator('select').first()).toHaveValue('needs_revision');

    await page.locator('select').first().selectOption('solved');
    await expect(page.getByText('Marked as solved')).toBeVisible();
    await page.reload();
    await expect(page.locator('select').first()).toHaveValue('solved');

    // "Needs revision" also puts it on the revision list.
    await page.goto('/revision');
    await expect(page.getByText('Fizz Buzz').first()).toBeVisible();
  });

  test('bookmarking shows up on the bookmarks page', async ({ page }) => {
    await signUp(page);

    await page.goto('/bookmarks');
    await expect(page.getByText('Nothing bookmarked yet')).toBeVisible();

    await page.goto('/problems/valid-palindrome');
    await page.getByRole('button', { name: 'Bookmark this problem' }).click();
    await expect(page.getByRole('button', { name: 'Remove bookmark' })).toBeVisible();

    await page.goto('/bookmarks');
    await expect(page.getByRole('link', { name: 'Valid Palindrome' })).toBeVisible();
  });

  test('notes and code snippets save and reload', async ({ page }) => {
    await signUp(page);
    await page.goto('/problems/two-sum');

    await page.getByRole('button', { name: '+ Add note' }).click();
    await page.getByLabel('Note title').fill('Watch the duplicate case');
    await page.getByLabel('Note', { exact: true }).fill('I forgot the map can already hold the key.');
    await page.getByLabel('Code snippet').fill('// java\nmap.put(nums[i], i);');
    await page.getByRole('button', { name: 'Save note' }).click();

    await expect(page.getByText('Watch the duplicate case')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Watch the duplicate case')).toBeVisible();
    await expect(page.getByText('map.put(nums[i], i);')).toBeVisible();

    // And on the all-notes page.
    await page.goto('/notes');
    await expect(page.getByText('Watch the duplicate case')).toBeVisible();
  });

  test('attempts and time spent accumulate', async ({ page }) => {
    await signUp(page);
    await page.goto('/problems/two-sum');

    await page.getByRole('button', { name: '+ 1' }).click();
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: '+ 1' }).click();
    await page.waitForTimeout(600);
    await page.reload();

    const attempts = page.locator('div', { has: page.getByText('Attempts', { exact: true }) }).last();
    await expect(attempts).toContainText('2');

    await page.getByLabel('Minutes to add').fill('45');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.waitForTimeout(600);
    await page.reload();

    const time = page.locator('div', { has: page.getByText('Time spent', { exact: true }) }).last();
    await expect(time).toContainText('45m');
  });

  test('topic progress updates as problems are solved', async ({ page }) => {
    await signUp(page);

    await page.goto('/topics/basics');
    await expect(page.getByTestId('stat-completed')).toContainText('0');

    await page.goto('/problems/fizz-buzz');
    await page.getByRole('button', { name: 'Mark as solved' }).click();
    await expect(page.getByRole('button', { name: /Solved — undo/ })).toBeVisible();

    // The topic page, the roadmap page and the dashboard must all agree.
    await page.goto('/topics/basics');
    await expect(page.getByTestId('stat-completed')).toContainText('1');
    await expect(page.getByTestId('stat-completed')).toContainText('5% of this topic');

    await page.goto('/topics');
    await expect(page.locator('a[href="/topics/basics"]')).toContainText(/1\s*\/\s*20 solved/);

    await page.goto('/dashboard');
    await expect(page.getByTestId('stat-solved')).toContainText('1');
  });

  test('resetting progress clears everything', async ({ page }) => {
    await signUp(page);

    await page.goto('/problems/two-sum');
    await page.getByRole('button', { name: 'Mark as solved' }).click();
    await expect(page.getByRole('button', { name: /Solved — undo/ })).toBeVisible();

    await page.goto('/settings');
    await page.getByRole('button', { name: 'Reset progress' }).click();
    await page.getByRole('button', { name: 'Yes, reset everything' }).click();

    await page.goto('/dashboard');
    const solvedTile = page.getByTestId('stat-solved');
    await expect(solvedTile).toContainText('0');
  });
});

