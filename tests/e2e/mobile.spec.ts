import { test, expect } from '@playwright/test';

import { signUp } from './helpers';

/**
 * Runs under the "mobile" Playwright project (Pixel 7 viewport), so these
 * assertions are about the real responsive behaviour, not a resized desktop.
 */
test.describe('mobile layout', () => {
  test('the desktop sidebar is hidden and the bottom bar takes over', async ({ page }) => {
    await signUp(page);

    await expect(page.locator('aside')).toBeHidden();

    const bottomNav = page.getByRole('navigation', { name: 'Primary' });
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Problems' })).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: 'Topics' })).toBeVisible();
  });

  test('the collapsible menu opens and navigates', async ({ page }) => {
    await signUp(page);

    const menuButton = page.getByRole('button', { name: 'Open menu' });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    await expect(page.locator('#mobile-menu')).toBeVisible();
    await page.locator('#mobile-menu').getByRole('link', { name: 'Bookmarks' }).click();
    await expect(page).toHaveURL(/\/bookmarks/);
  });

  test('nothing overflows horizontally on any main page', async ({ page }) => {
    await signUp(page);

    for (const path of [
      '/dashboard',
      '/problems',
      '/topics',
      '/topics/arrays',
      '/problems/two-sum',
      '/revision',
      '/settings',
      '/premium',
    ]) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });

  test('the problem list is usable at phone width', async ({ page }) => {
    await signUp(page);
    await page.goto('/problems');

    const firstLink = page.locator('li a[href^="/problems/"]').first();
    await expect(firstLink).toBeVisible();

    // The status selector must still be reachable and tappable.
    const select = page.locator('select').first();
    await expect(select).toBeVisible();
    const box = await select.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(28);
  });

  test('a problem can be solved from a phone', async ({ page }) => {
    await signUp(page);
    await page.goto('/problems/two-sum');

    await page.getByRole('button', { name: 'Mark as solved' }).click();
    await expect(page.getByRole('button', { name: /Solved — undo/ })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: /Solved — undo/ })).toBeVisible();
  });

  test('the bottom bar clears the page content', async ({ page }) => {
    await signUp(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const nav = page.getByRole('navigation', { name: 'Primary' });
    const navBox = await nav.boundingBox();
    const main = page.locator('#main');
    const mainBox = await main.boundingBox();

    // The main region reserves bottom padding, so its painted content does not
    // sit underneath the fixed navigation bar.
    expect(mainBox!.y + mainBox!.height).toBeGreaterThan(navBox!.y);
    const padding = await main.evaluate((el) => getComputedStyle(el).paddingBottom);
    expect(parseFloat(padding)).toBeGreaterThanOrEqual(64);
  });

  test('dark mode can be toggled and survives navigation', async ({ page }) => {
    await signUp(page);
    await page.goto('/dashboard');

    await page.getByRole('button', { name: /Switch to (dark|light) mode/ }).first().click();
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    await page.goto('/problems');
    const stillDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(stillDark).toBe(isDark);
  });
});
