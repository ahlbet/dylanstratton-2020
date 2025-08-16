import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/')

    // Check that the page loaded with correct title
    await expect(page).toHaveTitle(/All posts|degreesminutesseconds/)

    // Check that the page has content
    await expect(page.locator('body')).toBeVisible()

    // Check that we can see some text content
    const textContent = await page.textContent('body')
    expect(textContent?.length || 0).toBeGreaterThan(100)
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/')

    // Check that we can navigate to the same page (basic navigation works)
    await page.goto('/')
    await expect(page).toHaveURL('/')
  })

  test('should handle basic user interactions', async ({ page }) => {
    await page.goto('/')

    // Test that we can scroll the page
    await page.evaluate(() => window.scrollTo(0, 100))

    // Test that we can click on the page
    await page.click('body')

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible()
  })
})
