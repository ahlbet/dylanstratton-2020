/**
 * Utility to fix p5.js windowResized issues on mobile browsers
 * Prevents excessive windowResized calls during scrolling
 */

// Debounce function to limit how often windowResized is called
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Check if we're on a mobile device
function isMobileDevice() {
  if (typeof window === 'undefined') return false

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

// Create a mobile-friendly windowResized wrapper
function createMobileFriendlyWindowResized(originalWindowResized, p5Instance) {
  if (!isMobileDevice()) {
    // On desktop, use the original function without debouncing
    return originalWindowResized
  }

  // On mobile, debounce the windowResized call
  const debouncedWindowResized = debounce(() => {
    // Only call windowResized if the canvas dimensions actually changed
    const currentWidth = p5Instance.canvas
      ? p5Instance.canvas.width
      : p5Instance.windowWidth
    const currentHeight = p5Instance.canvas
      ? p5Instance.canvas.height
      : p5Instance.windowHeight

    // Check if dimensions actually changed significantly (more than 10px)
    const widthChanged = Math.abs(currentWidth - p5Instance.windowWidth) > 10
    const heightChanged = Math.abs(currentHeight - p5Instance.windowHeight) > 10

    if (widthChanged || heightChanged) {
      originalWindowResized()
    }
  }, 250) // 250ms debounce delay

  return debouncedWindowResized
}

// Apply the fix to a p5 instance
function applyMobileFix(p5Instance) {
  if (!p5Instance || !p5Instance.windowResized) return

  // Store the original windowResized function
  const originalWindowResized = p5Instance.windowResized

  // Replace with mobile-friendly version
  p5Instance.windowResized = createMobileFriendlyWindowResized(
    originalWindowResized,
    p5Instance
  )
}

module.exports = {
  debounce,
  isMobileDevice,
  createMobileFriendlyWindowResized,
  applyMobileFix,
}
