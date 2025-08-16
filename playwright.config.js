import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Add useful defaults for e2e tests
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    // Increase timeouts for slower components
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // Add mobile testing
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  // Global setup and teardown
  globalSetup: require.resolve('./tests/e2e/global-setup.js'),
  // Output directory for test results
  outputDir: 'test-results/',
  // Timeout for the entire test suite
  timeout: 60000,
  // Expect timeout for individual assertions
  expect: {
    timeout: 10000,
  },
})
