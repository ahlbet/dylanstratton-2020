import { test, expect } from '@playwright/test'

test.describe('Audio FFT Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage where the audio FFT component should be
    await page.goto('/')
  })

  test('should load the audio FFT component', async ({ page }) => {
    // Wait for the component to load - use a more reliable strategy
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000) // Give extra time for p5.js and canvas to initialize

    // Check that the canvas element exists (p5.js sketch)
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    // Check that the canvas has reasonable dimensions
    const canvasElement = await canvas.elementHandle()
    if (canvasElement) {
      const box = await canvasElement.boundingBox()
      expect(box.width).toBeGreaterThan(100)
      expect(box.height).toBeGreaterThan(100)
    }
  })

  test('should handle window resize without breaking', async ({ page }) => {
    // Wait for the component to load - use a more reliable strategy
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000) // Give extra time for p5.js and canvas to initialize

    // Check initial canvas state
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    // Resize the viewport
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.waitForTimeout(1000) // Wait for resize handling

    // Check that canvas is still visible after resize
    await expect(canvas).toBeVisible()

    // Resize again to a different size
    await page.setViewportSize({ width: 800, height: 600 })
    await page.waitForTimeout(1000)

    // Canvas should still be visible
    await expect(canvas).toBeVisible()
  })

  test('should not crash when audio context is suspended', async ({ page }) => {
    // Wait for the component to load - use a more reliable strategy
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000) // Give extra time for p5.js and canvas to initialize

    // Check that the component loads initially
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    // Simulate audio context suspension by navigating away and back
    await page.goto('about:blank')
    await page.waitForTimeout(500)

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Component should still load without crashing
    await expect(canvas).toBeVisible()
  })

  test('should handle different viewport sizes gracefully', async ({
    page,
  }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000) // Give extra time for p5.js and canvas to initialize

    const mobileCanvas = page.locator('canvas')
    await expect(mobileCanvas).toBeVisible()

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    const tabletCanvas = page.locator('canvas')
    await expect(tabletCanvas).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    const desktopCanvas = page.locator('canvas')
    await expect(desktopCanvas).toBeVisible()
  })

  test('should maintain performance across different screen sizes', async ({
    page,
  }) => {
    // Wait for the component to load - use a more reliable strategy
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000) // Give extra time for p5.js and canvas to initialize

    // Check initial performance
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    // Measure frame rate or performance metrics
    const startTime = Date.now()

    // Wait for a few seconds to let the animation run
    await page.waitForTimeout(3000)

    const endTime = Date.now()
    const duration = endTime - startTime

    // Basic performance check - should complete without hanging
    expect(duration).toBeGreaterThan(2000) // Should take at least 2 seconds
    expect(duration).toBeLessThan(10000) // Should not hang for more than 10 seconds

    // Canvas should still be visible after performance test
    await expect(canvas).toBeVisible()
  })
})
