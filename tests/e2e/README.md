# End-to-End (E2E) Tests

This directory contains Playwright e2e tests for the Dylan Stratton blog application.

## Test Files

### `navigation.spec.js`

Tests basic navigation functionality:

- Homepage loading
- Navigation elements visibility
- Blog post list display
- Blog post link navigation
- Responsive design handling

### `audio-fft.spec.js`

Tests the Audio FFT component functionality:

- Component loading
- Canvas rendering
- Window resize handling
- Audio context suspension recovery
- Performance across different viewport sizes

### `blog-posts.spec.js`

Tests blog post functionality:

- Blog post list display
- Individual blog post navigation
- Content rendering
- Back navigation
- Metadata display
- Different post formats

### `utils/test-helpers.js`

Common utility functions for tests:

- Page stability waiting
- Element existence checking
- Blog post navigation helpers
- Debug screenshot capture
- Console error monitoring

## Running Tests

### Prerequisites

1. Make sure your development server is running:

   ```bash
   yarn start
   # or
   yarn develop
   ```

2. Ensure the server is accessible at `http://localhost:8000` (or update `E2E_BASE_URL` in your environment)

### Basic Test Execution

```bash
# Run all e2e tests
yarn test:e2e

# Run specific test file
npx playwright test tests/e2e/navigation.spec.js

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug
```

### Test Configuration

The tests are configured in `playwright.config.js` with:

- Base URL: `http://localhost:8000` (configurable via `E2E_BASE_URL`)
- Multiple browser support (Chrome, Firefox, Safari)
- Screenshot and video capture on failure
- Trace capture on first retry

## Test Structure

Each test file follows this pattern:

```javascript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/')
  })

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.locator('selector')).toBeVisible()
  })
})
```

## Debugging Tests

### Screenshots

Tests automatically capture screenshots on failure. They're saved to `test-results/`.

### Manual Screenshots

Use the helper function in your tests:

```javascript
import { takeDebugScreenshot } from './utils/test-helpers'

test('debug test', async ({ page }) => {
  await takeDebugScreenshot(page, 'debug-step')
})
```

### Console Logs

Monitor console errors during tests:

```javascript
import { getConsoleErrors } from './utils/test-helpers'

test('check console errors', async ({ page }) => {
  const errors = await getConsoleErrors(page)
  expect(errors).toHaveLength(0)
})
```

## Writing New Tests

1. **Create a new spec file** in `tests/e2e/`
2. **Import test utilities** from `./utils/test-helpers`
3. **Use descriptive test names** that explain what's being tested
4. **Add proper assertions** to verify expected behavior
5. **Handle async operations** properly with `await`
6. **Use page objects** for complex interactions

### Example Test

```javascript
import { test, expect } from '@playwright/test'
import { waitForPageStable, takeDebugScreenshot } from './utils/test-helpers'

test.describe('New Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/')
    await waitForPageStable(page)

    // Your test logic here
    await expect(page.locator('.feature')).toBeVisible()

    // Debug screenshot if needed
    await takeDebugScreenshot(page, 'feature-test')
  })
})
```

## Common Selectors

The tests use flexible selectors to handle different HTML structures:

- Blog posts: `article, .post, .blog-post, [class*="post"]`
- Navigation: `nav, .navigation, [class*="nav"]`
- Content: `.post-content, .content, .markdown, p`

## Troubleshooting

### Tests Failing

1. **Check if dev server is running** at the expected URL
2. **Verify selectors** match your actual HTML structure
3. **Check console errors** in the browser during test execution
4. **Review screenshots** in `test-results/` for visual debugging

### Performance Issues

1. **Increase timeouts** for slow-loading components
2. **Use `waitForPageStable`** helper for dynamic content
3. **Check for memory leaks** in long-running tests

### Browser Issues

1. **Update Playwright** to latest version
2. **Clear browser cache** and test data
3. **Check browser compatibility** in `playwright.config.js`

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run E2E Tests
  run: |
    yarn start &
    sleep 30  # Wait for server to start
    yarn test:e2e
```
