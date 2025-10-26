import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	timeout: 30_000,
	retries: 1,
	reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
	use: {
		headless: true,
		viewport: { width: 1280, height: 720 },
		ignoreHTTPSErrors: true,
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		trace: 'retain-on-failure',
		/*connectOptions: {
			wsEndpoint: 'ws://localhost:9222/devtools/browser',
		},*/
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
	],
});
