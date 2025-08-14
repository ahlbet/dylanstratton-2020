/**
 * Test helper utilities for Playwright e2e tests
 */

/**
 * Wait for the page to be fully loaded and stable
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} timeout - Timeout in milliseconds
 */
export async function waitForPageStable(page, timeout = 10000) {
  await page.waitForLoadState('domcontentloaded', { timeout })
  
  // Wait for any animations or dynamic content to settle
  await page.waitForTimeout(1000)
}

/**
 * Check if an element exists and is visible
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @returns {Promise<boolean>} - Whether element exists and is visible
 */
export async function elementExistsAndVisible(page, selector) {
  const element = page.locator(selector)
  const count = await element.count()
  if (count === 0) return false
  
  try {
    await expect(element.first()).toBeVisible({ timeout: 5000 })
    return true
  } catch {
    return false
  }
}

/**
 * Get the first matching element that exists
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string[]} selectors - Array of CSS selectors to try
 * @returns {Promise<import('@playwright/test').Locator|null>} - First matching element or null
 */
export async function getFirstMatchingElement(page, selectors) {
  for (const selector of selectors) {
    const element = page.locator(selector)
    if (await element.count() > 0) {
      return element.first()
    }
  }
  return null
}

/**
 * Check if the current page is a blog post
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<boolean>} - Whether current page is a blog post
 */
export async function isBlogPost(page) {
  const url = page.url()
  return /\/\d{2}[a-z]{3}\d{2}\//.test(url) // Matches format like /25aug06/
}

/**
 * Navigate to a random blog post from the homepage
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<boolean>} - Whether navigation was successful
 */
export async function navigateToRandomBlogPost(page) {
  const postSelectors = [
    'article a',
    '.post a',
    '.blog-post a',
    '[class*="post"] a'
  ]
  
  const postLink = await getFirstMatchingElement(page, postSelectors)
  if (!postLink) return false
  
  await postLink.click()
  await waitForPageStable(page)
  
  return isBlogPost(page)
}

/**
 * Take a screenshot with timestamp for debugging
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} name - Screenshot name
 */
export async function takeDebugScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `debug-${name}-${timestamp}.png`
  
  try {
    await page.screenshot({ 
      path: `test-results/${filename}`,
      fullPage: true 
    })
    console.log(`Debug screenshot saved: ${filename}`)
  } catch (error) {
    console.warn(`Failed to take debug screenshot: ${error.message}`)
  }
}

/**
 * Check for console errors during test execution
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<string[]>} - Array of error messages
 */
export async function getConsoleErrors(page) {
  const errors = []
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  return errors
}

/**
 * Wait for a specific condition with timeout
 * @param {Function} condition - Function that returns a boolean
 * @param {number} timeout - Timeout in milliseconds
 * @param {number} interval - Check interval in milliseconds
 */
export async function waitForCondition(condition, timeout = 10000, interval = 100) {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  
  throw new Error(`Condition not met within ${timeout}ms`)
}
