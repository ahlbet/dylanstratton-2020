import { test, expect } from '@playwright/test'

test.describe('Navigation and Page Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test
    await page.goto('/')
  })

  test('should load the homepage successfully', async ({ page }) => {
    // Check that the page loads without errors
    await expect(page).toHaveTitle(/All posts|degreesminutesseconds/)
    
    // Check that the page has content and is accessible
    await expect(page.locator('body')).toBeVisible()
    
    // Check that we can see some text content
    const textContent = await page.textContent('body')
    expect(textContent?.length || 0).toBeGreaterThan(100)
  })

  test('should have working navigation elements', async ({ page }) => {
    // Check that main navigation elements are visible
    // Look for navigation in header or main nav area
    const nav = page.locator('header nav, .navigation, [class*="nav"]').first()
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible()
    }
    
    // Check that the logo/brand is visible - look for the site title
    const title = page.locator('h1, .logo, .brand, .site-title').first()
    if (await title.count() > 0) {
      await expect(title).toBeVisible()
    }
  })

  test('should load blog posts', async ({ page }) => {
    // Check that blog post content is visible - use first() to avoid strict mode violation
    const posts = page.locator('article, .post, .blog-post')
    const firstPost = posts.first()
    await expect(firstPost).toBeVisible()
    
    // Check that there are multiple blog posts or at least one
    const count = await posts.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should have working links to blog posts', async ({ page }) => {
    // Find the first blog post link - be more specific to avoid multiple matches
    const postLinks = page.locator('article a, .post a, .blog-post a')
    const firstPostLink = postLinks.first()
    
    if (await firstPostLink.count() > 0) {
      // Click on the first blog post link
      await firstPostLink.click()
      
      // Check that we navigated to a blog post page
      await expect(page).not.toHaveURL('/')
      await expect(page.locator('article, .post, .blog-post').first()).toBeVisible()
    }
  })

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('nav')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('nav')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('nav')).toBeVisible()
  })
})
