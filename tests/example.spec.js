const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
  await page.goto('https://teamlida.github.io/tad-2025/');
  await expect(page).toHaveTitle(/Coffee Ordering System/);
});
