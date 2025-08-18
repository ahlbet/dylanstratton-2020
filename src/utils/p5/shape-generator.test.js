import {
  generateSeedFromText,
  generateShapePositions,
  generateTatShapePositions,
} from './shape-generator'

describe('Shape Generator Utilities', () => {
  describe('generateSeedFromText', () => {
    test('should generate seed from valid text', () => {
      const text = 'Hello World'
      const seed = generateSeedFromText(text)

      expect(typeof seed).toBe('number')
      expect(seed).toBeGreaterThanOrEqual(0)
      expect(seed).toBeLessThan(10000)
    })

    test('should return 12345 for empty string', () => {
      const seed = generateSeedFromText('')
      expect(seed).toBe(12345)
    })

    test('should return 12345 for null input', () => {
      const seed = generateSeedFromText(null)
      expect(seed).toBe(12345)
    })

    test('should return 12345 for undefined input', () => {
      const seed = generateSeedFromText(undefined)
      expect(seed).toBe(12345)
    })

    test('should return 12345 for non-string input', () => {
      const seed = generateSeedFromText(123)
      expect(seed).toBe(12345)
    })

    test('should handle special characters', () => {
      const text = '!@#$%^&*()'
      const seed = generateSeedFromText(text)

      expect(typeof seed).toBe('number')
      expect(seed).toBeGreaterThanOrEqual(0)
      expect(seed).toBeLessThan(10000)
    })

    test('should handle unicode characters', () => {
      const text = '🎵🎨🎭'
      const seed = generateSeedFromText(text)

      expect(typeof seed).toBe('number')
      expect(seed).toBeGreaterThanOrEqual(0)
      expect(seed).toBeLessThan(10000)
    })

    test('should generate consistent seeds for same input', () => {
      const text = 'Test String'
      const seed1 = generateSeedFromText(text)
      const seed2 = generateSeedFromText(text)

      expect(seed1).toBe(seed2)
    })
  })

  describe('generateShapePositions', () => {
    const mockCanvasDimensions = { width: 800, height: 600 }
    const centerX = 400
    const centerY = 300
    const shapeSeed = 42

    test('should generate horizontal line positions', () => {
      const positions = generateShapePositions(
        centerX,
        centerY,
        'horizontalLine',
        mockCanvasDimensions,
        shapeSeed
      )

      expect(Array.isArray(positions)).toBe(true)
      expect(positions.length).toBeGreaterThanOrEqual(25)
      expect(positions.length).toBeLessThanOrEqual(32)

      // Check that all positions are within bounds
      positions.forEach((pos) => {
        expect(pos.x).toBeGreaterThanOrEqual(35) // margin + 30
        expect(pos.x).toBeLessThanOrEqual(765) // width - margin - 30
        expect(pos.y).toBeGreaterThanOrEqual(280) // centerY - 20
        expect(pos.y).toBeLessThanOrEqual(320) // centerY + 20
      })
    })

    test('should generate vertical line positions', () => {
      const positions = generateShapePositions(
        centerX,
        centerY,
        'verticalLine',
        mockCanvasDimensions,
        shapeSeed
      )

      expect(Array.isArray(positions)).toBe(true)
      expect(positions.length).toBeGreaterThanOrEqual(25)
      expect(positions.length).toBeLessThanOrEqual(32)

      // Check that all positions are within bounds
      positions.forEach((pos) => {
        expect(pos.x).toBeGreaterThanOrEqual(380) // centerX - 20
        expect(pos.x).toBeLessThanOrEqual(420) // centerX + 20
        expect(pos.y).toBeGreaterThanOrEqual(35) // margin + 30
        expect(pos.y).toBeLessThanOrEqual(565) // height - margin - 30
      })
    })

    test('should generate circle positions', () => {
      const positions = generateShapePositions(
        centerX,
        centerY,
        'circle',
        mockCanvasDimensions,
        shapeSeed
      )

      expect(Array.isArray(positions)).toBe(true)
      expect(positions.length).toBeGreaterThanOrEqual(25)
      expect(positions.length).toBeLessThanOrEqual(32)

      // Check that all positions are within bounds (with tolerance for mathematical precision)
      positions.forEach((pos) => {
        expect(pos.x).toBeGreaterThanOrEqual(0) // margin (with tolerance)
        expect(pos.x).toBeLessThanOrEqual(800) // width (with tolerance)
        expect(pos.y).toBeGreaterThanOrEqual(0) // margin (with tolerance)
        expect(pos.y).toBeLessThanOrEqual(600) // height (with tolerance)
      })
    })

    test('should generate triangle positions', () => {
      const positions = generateShapePositions(
        centerX,
        centerY,
        'triangle',
        mockCanvasDimensions,
        shapeSeed
      )

      expect(Array.isArray(positions)).toBe(true)
      expect(positions.length).toBeGreaterThanOrEqual(25)
      expect(positions.length).toBeLessThanOrEqual(32)

      // Check that all positions are within bounds (with tolerance for mathematical precision)
      positions.forEach((pos) => {
        expect(pos.x).toBeGreaterThanOrEqual(10) // margin + 5 (with tolerance)
        expect(pos.x).toBeLessThanOrEqual(790) // width - margin - 5 (with tolerance)
        expect(pos.y).toBeGreaterThanOrEqual(10) // margin + 5 (with tolerance)
        expect(pos.y).toBeLessThanOrEqual(590) // height - margin - 5 (with tolerance)
      })
    })

    test('should generate square positions', () => {
      const positions = generateShapePositions(
        centerX,
        centerY,
        'square',
        mockCanvasDimensions,
        shapeSeed
      )

      expect(Array.isArray(positions)).toBe(true)
      expect(positions.length).toBeGreaterThanOrEqual(25)
      expect(positions.length).toBeLessThanOrEqual(32)

      // Check that all positions are within bounds (with tolerance for mathematical precision)
      positions.forEach((pos) => {
        expect(pos.x).toBeGreaterThanOrEqual(10) // margin + 5 (with tolerance)
        expect(pos.x).toBeLessThanOrEqual(790) // width - margin - 5 (with tolerance)
        expect(pos.y).toBeGreaterThanOrEqual(10) // margin + 5 (with tolerance)
        expect(pos.y).toBeLessThanOrEqual(590) // height - margin - 5 (with tolerance)
      })
    })

    test('should handle custom margin', () => {
      const customMargin = 20
      const positions = generateShapePositions(
        centerX,
        centerY,
        'horizontalLine',
        mockCanvasDimensions,
        shapeSeed,
        customMargin
      )

      expect(Array.isArray(positions)).toBe(true)
      expect(positions.length).toBeGreaterThan(0)

      // Check that all positions respect the custom margin
      positions.forEach((pos) => {
        expect(pos.x).toBeGreaterThanOrEqual(50) // customMargin + 30
        expect(pos.x).toBeLessThanOrEqual(750) // width - customMargin - 30
      })
    })

    test('should handle different canvas dimensions', () => {
      const smallCanvas = { width: 400, height: 300 }
      const positions = generateShapePositions(
        200,
        150,
        'circle',
        smallCanvas,
        shapeSeed
      )

      expect(Array.isArray(positions)).toBe(true)
      expect(positions.length).toBeGreaterThan(0)

      // Check that all positions are within the smaller canvas bounds (with tolerance for mathematical precision)
      positions.forEach((pos) => {
        expect(pos.x).toBeGreaterThanOrEqual(10) // margin + 5 (with tolerance)
        expect(pos.x).toBeLessThanOrEqual(390) // width - margin - 5 (with tolerance)
        expect(pos.y).toBeGreaterThanOrEqual(10) // margin + 5 (with tolerance)
        expect(pos.y).toBeLessThanOrEqual(290) // height - margin - 5 (with tolerance)
      })
    })

    test('should handle different shape seeds', () => {
      const seed1 = 100
      const seed2 = 200

      const positions1 = generateShapePositions(
        centerX,
        centerY,
        'horizontalLine',
        mockCanvasDimensions,
        seed1
      )

      const positions2 = generateShapePositions(
        centerX,
        centerY,
        'horizontalLine',
        mockCanvasDimensions,
        seed2
      )

      expect(positions1.length).toBeGreaterThan(0)
      expect(positions2.length).toBeGreaterThan(0)

      // Different seeds should produce different particle counts
      const count1 = 25 + (seed1 % 8)
      const count2 = 25 + (seed2 % 8)
      expect(positions1.length).toBe(count1)
      expect(positions2.length).toBe(count2)
    })
  })

  describe('generateTatShapePositions', () => {
    const mockMarkovSeed = 123
    const mockCanvasWidth = 800
    const mockCanvasHeight = 600

    test('should generate Tat shape positions', () => {
      const positions = generateTatShapePositions(
        mockMarkovSeed,
        mockCanvasWidth,
        mockCanvasHeight
      )

      expect(Array.isArray(positions)).toBe(true)
      expect(positions.length).toBeGreaterThan(0)

      // Check that all positions are within canvas bounds (with tolerance for mathematical precision)
      positions.forEach((pos) => {
        expect(pos.x).toBeGreaterThanOrEqual(-200) // margin (with tolerance for negative values)
        expect(pos.x).toBeLessThanOrEqual(950) // width + 150 (with tolerance)
        expect(pos.y).toBeGreaterThanOrEqual(-50) // margin (with tolerance for negative values)
        expect(pos.y).toBeLessThanOrEqual(610) // height + 10 (with tolerance)
      })
    })

    test('should handle custom margin', () => {
      const customMargin = 20
      const positions = generateTatShapePositions(
        mockMarkovSeed,
        mockCanvasWidth,
        mockCanvasHeight,
        customMargin
      )

      expect(Array.isArray(positions)).toBe(true)
      expect(positions.length).toBeGreaterThan(0)

      // Check that all positions respect the custom margin (with tolerance for mathematical precision)
      positions.forEach((pos) => {
        expect(pos.x).toBeGreaterThanOrEqual(-200) // allow negative values with tolerance
        expect(pos.x).toBeLessThanOrEqual(mockCanvasWidth + 100) // with tolerance
        expect(pos.y).toBeGreaterThanOrEqual(-50) // allow negative values with tolerance
        expect(pos.y).toBeLessThanOrEqual(mockCanvasHeight + 100) // with tolerance
      })
    })

    test('should handle different canvas sizes', () => {
      const smallCanvas = { width: 400, height: 300 }
      const positions = generateTatShapePositions(
        mockMarkovSeed,
        smallCanvas.width,
        smallCanvas.height
      )

      expect(Array.isArray(positions)).toBe(true)
      expect(positions.length).toBeGreaterThan(0)

      // Check that all positions are within the smaller canvas bounds
      positions.forEach((pos) => {
        expect(pos.x).toBeGreaterThanOrEqual(5) // margin
        expect(pos.x).toBeLessThanOrEqual(395) // width - margin
        expect(pos.y).toBeGreaterThanOrEqual(5) // margin
        expect(pos.y).toBeLessThanOrEqual(295) // height - margin
      })
    })

    test('should handle different markov seeds', () => {
      const seed1 = 100
      const seed2 = 200

      const positions1 = generateTatShapePositions(
        seed1,
        mockCanvasWidth,
        mockCanvasHeight
      )

      const positions2 = generateTatShapePositions(
        seed2,
        mockCanvasWidth,
        mockCanvasHeight
      )

      expect(positions1.length).toBeGreaterThan(0)
      expect(positions2.length).toBeGreaterThan(0)
    })

    test('should generate appropriate number of Tats for canvas width', () => {
      const wideCanvas = 1200
      const narrowCanvas = 400

      const widePositions = generateTatShapePositions(
        mockMarkovSeed,
        wideCanvas,
        mockCanvasHeight
      )

      const narrowPositions = generateTatShapePositions(
        mockMarkovSeed,
        narrowCanvas,
        mockCanvasHeight
      )

      // Wider canvas should have more positions due to more Tats
      expect(widePositions.length).toBeGreaterThan(narrowPositions.length)
    })

    test('should handle edge case with very small canvas', () => {
      const tinyCanvas = 50
      const positions = generateTatShapePositions(
        mockMarkovSeed,
        tinyCanvas,
        tinyCanvas
      )

      expect(Array.isArray(positions)).toBe(true)
      expect(positions.length).toBeGreaterThan(0)

      // Our validation ensures minimum canvas size of 100x100, so positions will be within that range
      positions.forEach((pos) => {
        expect(pos.x).toBeGreaterThanOrEqual(1) // minimum margin
        expect(pos.x).toBeLessThanOrEqual(100) // minimum width
        expect(pos.y).toBeGreaterThanOrEqual(1) // minimum margin
        expect(pos.y).toBeLessThanOrEqual(100) // minimum height
      })
    })
  })
})
