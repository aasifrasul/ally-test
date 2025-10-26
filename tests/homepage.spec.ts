import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
	test('should have correct title', async ({ page }) => {
		await page.goto('https://localhost:3001');
		await expect(page).toHaveTitle(/Ally Test/);
	});

	test('should contain heading text', async ({ page }) => {
		await page.goto('https://localhost:3001');
		const heading = page.locator('h1');
		await expect(heading).toHaveText('My Peronal Project');
	});
});
