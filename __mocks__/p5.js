// Mock for p5.js
const mockP5 = jest.fn().mockImplementation((sketch, element) => {
  // Mock p5 instance
  const mockInstance = {
    remove: jest.fn(),
    canvas: element,
    createCanvas: jest.fn(),
    background: jest.fn(),
    noStroke: jest.fn(),
    fill: jest.fn(),
    ellipse: jest.fn(),
    map: jest.fn(),
    dist: jest.fn(),
    sin: jest.fn(),
    cos: jest.fn(),
    noise: jest.fn(),
    frameCount: 0,
    width: 800,
    height: 400,
    windowWidth: 800,
    windowHeight: 400,
    resizeCanvas: jest.fn(),
    seed: jest.fn(),
    setup: jest.fn(),
    draw: jest.fn(),
    windowResized: jest.fn(),
  }

  // Call the sketch function with the mock instance
  if (typeof sketch === 'function') {
    sketch(mockInstance)
  }

  // Apply mobile fix if available (for testing)
  if (typeof window !== 'undefined' && window.navigator) {
    try {
      const { applyMobileFix } = require('../../src/utils/p5-mobile-fix')
      applyMobileFix(mockInstance)
    } catch (e) {
      // Ignore if mobile fix is not available in test environment
    }
  }

  return mockInstance
})

// Mock the default export
mockP5.default = mockP5

module.exports = mockP5
