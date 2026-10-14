import { test, expect } from '@playwright/test';

test('guest roadmap filters and browser persistence', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: 'The roadmap', exact: true })).toBeVisible();
  await page.getByLabel('Search problems', {exact:true}).fill('Fizz Buzz');
  await expect(page.getByRole('button', {name:'Fizz Buzz Basics'})).toBeVisible();
  await page.getByLabel('Status for Fizz Buzz').selectOption('solved');
  await page.getByRole('button', {name:'Add bookmark for Fizz Buzz'}).click();
  await page.getByRole('button', {name:'Fizz Buzz Basics'}).click();
  await page.getByLabel('Your notes').fill('Check divisibility by 15 first.');
  await page.getByLabel('Add to revision queue').check();
  await page.getByRole('button', {name:'Close problem'}).click();
  await page.reload();
  await page.getByLabel('Search problems', {exact:true}).fill('Fizz Buzz');
  await expect(page.getByLabel('Status for Fizz Buzz')).toHaveValue('solved');
  await expect(page.getByRole('button', {name:'Remove bookmark for Fizz Buzz'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button', {name:'Fizz Buzz Basics'}).click();
  await expect(page.getByLabel('Your notes')).toHaveValue('Check divisibility by 15 first.');
  await expect(page.getByLabel('Add to revision queue')).toBeChecked();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('guest demo fits a phone', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/demo');
  await expect(page.getByRole('heading', {name:'The roadmap',exact:true})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
