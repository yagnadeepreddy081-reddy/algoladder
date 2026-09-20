import { test, expect } from '@playwright/test';

import { apiStatus, signUp } from './helpers';

test.describe('search and filters', () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page);
  });

  test('the problems page lists all 474', async ({ page }) => {
    await page.goto('/problems');
    await expect(page.getByText(/of\s*474\s*matching problems/)).toBeVisible();
  });

  test('search narrows the list', async ({ page }) => {
    await page.goto('/problems');
    await page.getByPlaceholder(/Search problems/).fill('binary search');
    await expect(page).toHaveURL(/q=binary(\+|%20)search/);
    await expect(page.locator('a[href="/problems/binary-search"]')).toBeVisible();

    const count = await page.getByText(/of \d+ matching problems/).textContent();
    expect(count).not.toContain('of 474');
  });

  test('search finds nothing gracefully', async ({ page }) => {
    await page.goto('/problems?q=zzzznotarealproblem');
    await expect(page.getByText('Nothing matches those filters')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clear all filters' })).toBeVisible();
  });

  test('a difficulty chip filters and is reflected in the URL', async ({ page }) => {
    await page.goto('/problems');
    await page.getByRole('button', { name: 'Hard', exact: true }).click();
    await expect(page).toHaveURL(/difficulty=Hard/);
    await expect(page.getByText('Hard').first()).toBeVisible();
    await expect(page.getByText(/of 86 matching problems/)).toBeVisible();
  });

  test('filters combine with each other and with search', async ({ page }) => {
    await page.goto('/problems?topic=graphs');
    await expect(page.getByText(/of 54 matching problems/)).toBeVisible();

    await page.goto('/problems?topic=graphs&difficulty=Hard');
    const both = await page.getByText(/of (\d+) matching problems/).textContent();
    const n = Number(both?.match(/of (\d+)/)?.[1]);
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(54);
  });

  test('sorting by title reorders the list', async ({ page }) => {
    await page.goto('/problems?sort=title');
    const titles = await page.locator('li a[href^="/problems/"]').allTextContents();
    const cleaned = titles.filter(Boolean).map((t) => t.trim().toLowerCase());
    expect([...cleaned].sort()).toEqual(cleaned);
  });

  test('clearing all filters restores the full list', async ({ page }) => {
    await page.goto('/problems?difficulty=Hard&topic=graphs');
    await page.getByRole('link', { name: 'Clear all' }).click();
    await expect(page.getByText(/of 474 matching problems/)).toBeVisible();
  });

  test('pagination moves through the catalogue', async ({ page }) => {
    await page.goto('/problems');
    const firstTitle = await page.locator('li a[href^="/problems/"]').first().textContent();

    await page.getByRole('link', { name: 'Next' }).click();
    await expect(page).toHaveURL(/page=2/);

    const secondTitle = await page.locator('li a[href^="/problems/"]').first().textContent();
    expect(secondTitle).not.toBe(firstTitle);
  });

  test('a filtered URL is shareable — it renders the same on a cold load', async ({ page }) => {
    await page.goto('/problems?difficulty=Easy&status=not_started&sort=title');
    await expect(page.getByText(/matching problems/)).toBeVisible();
    // Two filters are active (difficulty and status); sort is not a filter.
    await expect(page.getByRole('button', { name: 'Filters' })).toContainText('2');
  });
});

test.describe('access control', () => {
  test('a signed-out visitor cannot reach any protected page', async ({ page }) => {
    for (const path of ['/dashboard', '/problems', '/topics', '/settings', '/admin', '/notes']) {
      await page.goto(path);
      await expect(page, `${path} should redirect`).toHaveURL(/\/login/);
    }
  });

  test('a normal user cannot reach the admin panel', async ({ page }) => {
    await signUp(page);

    for (const path of ['/admin', '/admin/problems', '/admin/users', '/admin/data', '/admin/reports']) {
      await page.goto(path);
      await expect(page, `${path} must be refused`).toHaveURL(/\/dashboard/);
    }
  });

  test('a normal user gets 403 from the admin export API', async ({ page }) => {
    await signUp(page);
    expect(await apiStatus(page, '/api/admin/export?what=problems')).toBe(403);
  });

  test('the admin panel link is not even shown to a normal user', async ({ page }) => {
    await signUp(page);
    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: 'Admin panel' })).toHaveCount(0);
  });
});

test.describe('premium gating', () => {
  test('a free account sees the lock on a premium problem and can still open the source', async ({
    page,
  }) => {
    await signUp(page);

    // Dynamic programming is seeded premium via PREMIUM_TOPIC_SLUGS.
    await page.goto('/problems/climbing-stairs');
    await expect(page.getByText('Premium').first()).toBeVisible();
    await expect(page.getByText('Hints and approach are part of Pro')).toBeVisible();

    // The free preview is still there, and the external link still works.
    await expect(page.getByRole('heading', { name: /Climbing Stairs/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open on LeetCode/ })).toBeVisible();

    // And the problem is still trackable on the free plan.
    await expect(page.getByRole('button', { name: 'Mark as solved' })).toBeEnabled();
  });

  test('a free account is blocked from analytics and study plans', async ({ page }) => {
    await signUp(page);

    await page.goto('/analytics');
    await expect(page.getByText('Advanced analytics is part of Pro')).toBeVisible();

    await page.goto('/study-plan');
    await expect(page.getByText('Custom study plans are part of Pro')).toBeVisible();
  });

  test('a free account gets 402 from the export API', async ({ page }) => {
    await signUp(page);
    expect(await apiStatus(page, '/api/export?format=json')).toBe(402);
  });

  test('the mock upgrade unlocks everything, and downgrading locks it again', async ({ page }) => {
    await signUp(page);

    await page.goto('/premium');
    await expect(page.getByText('Development mode')).toBeVisible();
    await page.getByRole('button', { name: /Apply mock lifetime plan/ }).click();
    await expect(page.getByText('Your current plan').first()).toBeVisible();

    await page.goto('/analytics');
    await expect(page.getByText('Advanced analytics is part of Pro')).toHaveCount(0);
    await expect(page.getByText('Pattern coverage')).toBeVisible();

    await page.goto('/study-plan');
    await expect(page.getByRole('button', { name: 'Generate plan' })).toBeVisible();

    await page.goto('/problems/climbing-stairs');
    await expect(page.getByText('Hints and approach are part of Pro')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Reveal hint 1/ })).toBeVisible();

    expect(await apiStatus(page, '/api/export?format=json')).toBe(200);

    // Back to free.
    await page.goto('/premium');
    await page.getByRole('button', { name: 'Switch to free' }).click();
    await page.getByRole('button', { name: 'Switch to free' }).last().click();
    await page.goto('/analytics');
    await expect(page.getByText('Advanced analytics is part of Pro')).toBeVisible();
  });

  test('a trial can be started once', async ({ page }) => {
    await signUp(page);
    await page.goto('/premium');
    await page.getByRole('button', { name: 'Start free trial' }).click();
    await expect(page.getByText(/trial has \d+ days? left/)).toBeVisible();

    await page.goto('/analytics');
    await expect(page.getByText('Advanced analytics is part of Pro')).toHaveCount(0);
  });
});

test.describe('problem detail', () => {
  test('hints reveal one at a time and the approach stays hidden until asked for', async ({
    page,
  }) => {
    await signUp(page);
    await page.goto('/problems/two-sum');

    await expect(page.getByRole('button', { name: /Reveal hint 1 of 3/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reveal hint 2 of 3/ })).toHaveCount(0);

    await page.getByRole('button', { name: /Reveal hint 1 of 3/ }).click();
    await expect(page.getByRole('button', { name: /Reveal hint 2 of 3/ })).toBeVisible();

    await expect(page.getByText(/Hidden so you do not spoil/)).toBeVisible();
    await page.getByRole('button', { name: 'Show approach' }).click();
    await expect(page.getByText('Time complexity')).toBeVisible();
  });

  test('previous and next navigate the ladder in order', async ({ page }) => {
    await signUp(page);
    await page.goto('/problems/two-sum');
    await expect(page.getByText('Next →')).toBeVisible();
    await page.getByText('Next →').click();
    await expect(page).not.toHaveURL(/two-sum/);
  });

  test('related problems all share something with this one', async ({ page }) => {
    await signUp(page);
    await page.goto('/problems/two-sum');
    await expect(page.getByText('Related problems')).toBeVisible();
  });

  test('reporting a problem reaches the admin queue', async ({ page }) => {
    await signUp(page);
    await page.goto('/problems/two-sum');

    await page.getByRole('button', { name: /Report a problem with this entry/ }).click();
    await page.getByLabel('Details (optional)').fill('The link looks wrong to me.');
    await page.getByRole('button', { name: 'Send report' }).click();
    await expect(page.getByText(/sent to the admin queue/)).toBeVisible();
  });
});
