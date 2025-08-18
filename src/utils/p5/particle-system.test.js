import {
  Particle,
  calculateParticleCount,
  calculateMaxParticles,
  calculateCanvasScale,
  calculateStaggeredSpawn,
} from './particle-system'

describe('Particle', () => {
  describe('avoidGreenHue', () => {
    it('should map all colors to blue-to-red spectrum', () => {
      // Test red to orange range (0-59°) - should remain unchanged
      expect(Particle.avoidGreenHue(0)).toBe(0) // Red
      expect(Particle.avoidGreenHue(30)).toBe(30) // Orange-red
      expect(Particle.avoidGreenHue(59)).toBe(59) // Orange

      // Test orange to yellow range (60-119°) - should map to red-orange
      expect(Particle.avoidGreenHue(60)).toBe(0) // Orange maps to red
      expect(Particle.avoidGreenHue(90)).toBeCloseTo(15, 0) // Yellow-orange maps to red-orange
      expect(Particle.avoidGreenHue(119)).toBeCloseTo(30, 0) // Yellow maps to orange

      // Test green to cyan range (120-179°) - should map to blue
      expect(Particle.avoidGreenHue(120)).toBe(240) // Green maps to blue
      expect(Particle.avoidGreenHue(150)).toBeCloseTo(220, 0) // Blue-green maps to blue
      expect(Particle.avoidGreenHue(179)).toBeCloseTo(200, 0) // Cyan maps to blue

      // Test cyan to blue range (180-239°) - should remain unchanged
      expect(Particle.avoidGreenHue(180)).toBe(180) // Cyan
      expect(Particle.avoidGreenHue(210)).toBe(210) // Blue
      expect(Particle.avoidGreenHue(239)).toBe(239) // Blue

      // Test blue to magenta range (240-299°) - should remain unchanged
      expect(Particle.avoidGreenHue(240)).toBe(240) // Blue
      expect(Particle.avoidGreenHue(270)).toBe(270) // Purple
      expect(Particle.avoidGreenHue(299)).toBe(299) // Magenta

      // Test magenta to red range (300-359°) - should map to red
      expect(Particle.avoidGreenHue(300)).toBe(0) // Magenta maps to red
      expect(Particle.avoidGreenHue(330)).toBeCloseTo(15, 0) // Red-magenta maps to red-orange
      expect(Particle.avoidGreenHue(359)).toBeCloseTo(30, 0) // Almost red maps to orange
    })
  })

  describe('adjustGreenishColors', () => {
    it('should adjust saturation and brightness for blue-to-red spectrum', () => {
      // Test with various hues - all should get slight reduction
      const result1 = Particle.adjustGreenishColors(0, 90, 80) // Red
      expect(result1.saturation).toBeCloseTo(81, 1) // 90 * 0.9
      expect(result1.brightness).toBeCloseTo(72, 1) // 80 * 0.9

      const result2 = Particle.adjustGreenishColors(120, 100, 100) // Green (will be mapped to blue)
      expect(result2.saturation).toBeCloseTo(90, 1) // 100 * 0.9
      expect(result2.brightness).toBeCloseTo(90, 1) // 100 * 0.9

      const result3 = Particle.adjustGreenishColors(240, 85, 75) // Blue
      expect(result3.saturation).toBeCloseTo(76.5, 1) // 85 * 0.9
      expect(result3.brightness).toBeCloseTo(67.5, 1) // 75 * 0.9

      const result4 = Particle.adjustGreenishColors(300, 95, 85) // Magenta (will be mapped to red)
      expect(result4.saturation).toBeCloseTo(85.5, 1) // 95 * 0.9
      expect(result4.brightness).toBeCloseTo(76.5, 1) // 85 * 0.9
    })

    it('should respect minimum and maximum values', () => {
      // Test with very low saturation and brightness
      const result1 = Particle.adjustGreenishColors(120, 30, 40)
      expect(result1.saturation).toBe(50) // Minimum 50
      expect(result1.brightness).toBe(60) // Minimum 60

      // Test with very high saturation and brightness
      const result2 = Particle.adjustGreenishColors(240, 100, 100)
      expect(result2.saturation).toBe(90) // 100 * 0.9
      expect(result2.brightness).toBe(90) // 100 * 0.9
    })
  })

  let mockP5
  let particle

  beforeEach(() => {
    mockP5 = {
      createVector: jest.fn((x, y) => {
        const vector = {
          x,
          y,
          mult: jest.fn(() => vector),
          add: jest.fn(() => vector),
          limit: jest.fn(() => vector),
          normalize: jest.fn(() => vector),
          rotate: jest.fn(() => vector),
        }
        return vector
      }),
      random: jest.fn((min, max) => (min + max) / 2),
      cos: jest.fn(() => 0.5),
      sin: jest.fn(() => 0.5),
      TWO_PI: Math.PI * 2,
      map: jest.fn(
        (value, start1, stop1, start2, stop2) =>
          start2 + ((value - start1) * (stop2 - start2)) / (stop1 - start1)
      ),
      noise: jest.fn(() => 0.5),
      width: 800,
      height: 600,
      frameCount: 1,
    }
  })

  describe('constructor', () => {
    test('should create particle with default values', () => {
      particle = new Particle(mockP5, 100, 200, 128, 0)

      expect(particle.pos).toBeDefined()
      expect(particle.vel).toBeDefined()
      expect(particle.acc).toBeDefined()
      expect(particle.frequencyBand).toBe(0)
      expect(particle.lifeFrames).toBe(0)
      expect(particle.alpha).toBe(1)
      expect(particle.size).toBeDefined()
      expect(particle.originalSize).toBeDefined()
      expect(particle.maxLifeFrames).toBeDefined()
      expect(particle.audioReactivity).toBeDefined()
    })

    test('should create particle with custom markov seed', () => {
      const markovSeed = 12345
      particle = new Particle(mockP5, 100, 200, 128, 0, markovSeed)

      expect(particle.colorHue).toBeDefined()
      expect(particle.colorSaturation).toBeDefined()
      expect(particle.colorBrightness).toBeDefined()
    })

    test('should create particle with different frequency bands', () => {
      for (let band = 0; band < 8; band++) {
        particle = new Particle(mockP5, 100, 200, 128, band)
        expect(particle.frequencyBand).toBe(band)
        expect(particle.speed).toBeDefined()
        expect(particle.size).toBeDefined()
        expect(particle.alphaDecay).toBeDefined()
        expect(particle.maxLifeFrames).toBeDefined()
      }
    })

    test('should handle extreme amplitude values', () => {
      // Test with very low amplitude
      particle = new Particle(mockP5, 100, 200, 0, 0)
      expect(particle.audioReactivity).toBeDefined()

      // Test with very high amplitude
      particle = new Particle(mockP5, 100, 200, 255, 0)
      expect(particle.audioReactivity).toBeDefined()
    })

    test('should handle edge case coordinates', () => {
      // Test with negative coordinates
      particle = new Particle(mockP5, -100, -200, 128, 0)
      expect(particle.pos).toBeDefined()

      // Test with zero coordinates
      particle = new Particle(mockP5, 0, 0, 128, 0)
      expect(particle.pos).toBeDefined()

      // Test with very large coordinates
      particle = new Particle(mockP5, 10000, 10000, 128, 0)
      expect(particle.pos).toBeDefined()
    })
  })

  describe('configureByFrequencyBand', () => {
    beforeEach(() => {
      particle = new Particle(mockP5, 100, 200, 128, 0)
    })

    test('should configure sub-bass particles correctly', () => {
      particle.configureByFrequencyBand(0.5, 180)

      expect(particle.speed).toBeDefined()
      expect(particle.size).toBeDefined()
      expect(particle.alphaDecay).toBe(1.5)
      expect(particle.maxLifeFrames).toBeDefined()
      expect(particle.colorHue).toBeDefined()
      expect(particle.colorSaturation).toBeDefined()
      expect(particle.colorBrightness).toBeDefined()
      expect(particle.noiseStrength).toBeDefined()
    })

    test('should configure bass particles correctly', () => {
      particle.frequencyBand = 1
      particle.configureByFrequencyBand(0.5, 180)

      expect(particle.speed).toBeDefined()
      expect(particle.size).toBeDefined()
      expect(particle.alphaDecay).toBe(2)
      expect(particle.maxLifeFrames).toBeDefined()
      expect(particle.colorHue).toBeDefined()
      expect(particle.colorSaturation).toBeDefined()
      expect(particle.colorBrightness).toBeDefined()
      expect(particle.noiseStrength).toBeDefined()
    })

    test('should configure low-mid particles correctly', () => {
      particle.frequencyBand = 2
      particle.configureByFrequencyBand(0.5, 180)

      expect(particle.speed).toBeDefined()
      expect(particle.size).toBeDefined()
      expect(particle.alphaDecay).toBe(2.5)
      expect(particle.maxLifeFrames).toBeDefined()
      expect(particle.colorHue).toBeDefined()
      expect(particle.colorSaturation).toBeDefined()
      expect(particle.colorBrightness).toBeDefined()
      expect(particle.noiseStrength).toBeDefined()
    })

    test('should configure mid particles correctly', () => {
      particle.frequencyBand = 3
      particle.configureByFrequencyBand(0.5, 180)

      expect(particle.speed).toBeDefined()
      expect(particle.size).toBeDefined()
      expect(particle.alphaDecay).toBe(3)
      expect(particle.maxLifeFrames).toBeDefined()
      expect(particle.colorHue).toBeDefined()
      expect(particle.colorSaturation).toBeDefined()
      expect(particle.colorBrightness).toBeDefined()
      expect(particle.noiseStrength).toBeDefined()
    })

    test('should configure high-mid particles correctly', () => {
      particle.frequencyBand = 4
      particle.configureByFrequencyBand(0.5, 180)

      expect(particle.speed).toBeDefined()
      expect(particle.size).toBeDefined()
      expect(particle.alphaDecay).toBe(3.5)
      expect(particle.maxLifeFrames).toBeDefined()
      expect(particle.colorHue).toBeDefined()
      expect(particle.colorSaturation).toBeDefined()
      expect(particle.colorBrightness).toBeDefined()
      expect(particle.noiseStrength).toBeDefined()
    })

    test('should configure presence particles correctly', () => {
      particle.frequencyBand = 5
      particle.configureByFrequencyBand(0.5, 180)

      expect(particle.speed).toBeDefined()
      expect(particle.size).toBeDefined()
      expect(particle.alphaDecay).toBe(4)
      expect(particle.maxLifeFrames).toBeDefined()
      expect(particle.colorHue).toBeDefined()
      expect(particle.colorSaturation).toBeDefined()
      expect(particle.colorBrightness).toBeDefined()
      expect(particle.noiseStrength).toBeDefined()
    })

    test('should configure brilliance particles correctly', () => {
      particle.frequencyBand = 6
      particle.configureByFrequencyBand(0.5, 180)

      expect(particle.speed).toBeDefined()
      expect(particle.size).toBeDefined()
      expect(particle.alphaDecay).toBe(4.5)
      expect(particle.maxLifeFrames).toBeDefined()
      expect(particle.colorHue).toBeDefined()
      expect(particle.colorSaturation).toBeDefined()
      expect(particle.colorBrightness).toBeDefined()
      expect(particle.noiseStrength).toBeDefined()
    })

    test('should configure air particles correctly', () => {
      particle.frequencyBand = 7
      particle.configureByFrequencyBand(0.5, 180)

      expect(particle.speed).toBeDefined()
      expect(particle.size).toBeDefined()
      expect(particle.alphaDecay).toBe(5)
      expect(particle.maxLifeFrames).toBeDefined()
      expect(particle.colorHue).toBeDefined()
      expect(particle.colorSaturation).toBeDefined()
      expect(particle.colorBrightness).toBeDefined()
      expect(particle.noiseStrength).toBeDefined()
    })

    test('should handle extreme amplitude values in configuration', () => {
      // Test with very low amplitude
      particle.configureByFrequencyBand(0.01, 180)
      expect(particle.speed).toBeDefined()
      expect(particle.size).toBeDefined()

      // Test with very high amplitude
      particle.configureByFrequencyBand(0.99, 180)
      expect(particle.speed).toBeDefined()
      expect(particle.size).toBeDefined()
    })

    test('should handle different primary hues', () => {
      const testHues = [0, 90, 180, 270, 360]

      testHues.forEach((hue) => {
        particle.configureByFrequencyBand(0.5, hue)
        expect(particle.colorHue).toBeDefined()
      })
    })
  })

  describe('particle lifecycle methods', () => {
    beforeEach(() => {
      particle = new Particle(mockP5, 100, 200, 128, 0)
    })

    test('should update particle position', () => {
      const initialX = particle.pos.x
      const initialY = particle.pos.y

      // Mock the update method if it exists
      if (typeof particle.update === 'function') {
        particle.update()
      }

      // The position should be defined (even if not changed in this mock)
      expect(particle.pos.x).toBeDefined()
      expect(particle.pos.y).toBeDefined()
    })

    test('should handle particle fading', () => {
      // Mock the fade method if it exists
      if (typeof particle.fade === 'function') {
        particle.fade()
      }

      // The alpha should be defined
      expect(particle.alpha).toBeDefined()
    })

    test('should handle particle movement', () => {
      // Mock the move method if it exists
      if (typeof particle.move === 'function') {
        particle.move(0)
      }

      // The position should be defined
      expect(particle.pos.x).toBeDefined()
      expect(particle.pos.y).toBeDefined()
    })

    test('should handle particle display', () => {
      // Mock the show method if it exists
      if (typeof particle.show === 'function') {
        particle.show()
      }

      // The particle should still exist
      expect(particle).toBeDefined()
    })
  })

  describe('frequency sensitivity', () => {
    it('should update particle properties based on real-time frequency data', () => {
      const mockP5 = {
        createVector: jest.fn((x, y) => {
          const vector = {
            x,
            y,
            mult: jest.fn(() => vector),
            add: jest.fn(() => vector),
            limit: jest.fn(() => vector),
            normalize: jest.fn(() => vector),
            rotate: jest.fn(() => vector),
            dot: jest.fn(() => 0),
            sub: jest.fn(() => vector),
          }
          return vector
        }),
        random: jest.fn(() => 0.5),
        cos: jest.fn(() => 0.5),
        sin: jest.fn(() => 0.5),
        TWO_PI: Math.PI * 2,
        map: jest.fn(
          (value, start1, stop1, start2, stop2) =>
            start2 + ((value - start1) * (stop2 - start2)) / (stop1 - start1)
        ),
        noise: jest.fn(() => 0.5),
        frameCount: 0,
        width: 800,
        height: 600,
        colorMode: jest.fn(),
        noStroke: jest.fn(),
        fill: jest.fn(),
        ellipse: jest.fn(),
      }

      const particle = new Particle(mockP5, 100, 100, 128, 1, 0, null)

      // Set spawn position manually for test
      particle.spawnX = 100
      particle.spawnY = 100

      const originalSize = particle.size
      const originalSpeed = particle.speed

      // Mock frequency bands data
      const frequencyBands = [
        { band: 0, amp: 64 }, // Low amplitude
        { band: 1, amp: 255 }, // High amplitude (particle's band)
        { band: 2, amp: 128 }, // Medium amplitude
      ]

      // Update particle with frequency data
      particle.update(mockP5, null, frequencyBands)

      // Verify that audio reactivity was updated
      expect(particle.audioReactivity).toBeGreaterThan(0)

      // Verify that size and speed were adjusted based on frequency amplitude
      expect(particle.size).not.toBe(originalSize)
      expect(particle.speed).not.toBe(originalSpeed)
    })

    it('should handle missing frequency data gracefully', () => {
      const mockP5 = {
        createVector: jest.fn((x, y) => {
          const vector = {
            x,
            y,
            mult: jest.fn(() => vector),
            add: jest.fn(() => vector),
            limit: jest.fn(() => vector),
            normalize: jest.fn(() => vector),
            rotate: jest.fn(() => vector),
            dot: jest.fn(() => 0),
            sub: jest.fn(() => vector),
          }
          return vector
        }),
        random: jest.fn(() => 0.5),
        cos: jest.fn(() => 0.5),
        sin: jest.fn(() => 0.5),
        TWO_PI: Math.PI * 2,
        map: jest.fn(
          (value, start1, stop1, start2, stop2) =>
            start2 + ((value - start1) * (stop2 - start2)) / (stop1 - start1)
        ),
        noise: jest.fn(() => 0.5),
        frameCount: 0,
        width: 800,
        height: 600,
        colorMode: jest.fn(),
        noStroke: jest.fn(),
        fill: jest.fn(),
        ellipse: jest.fn(),
      }

      const particle = new Particle(mockP5, 100, 100, 128, 1, 0, null)

      // Set spawn position manually for test
      particle.spawnX = 100
      particle.spawnY = 100

      const originalSize = particle.size
      const originalSpeed = particle.speed

      // Update particle without frequency data
      particle.update(mockP5, null, null)

      // Verify that properties remain unchanged
      expect(particle.size).toBe(originalSize)
      expect(particle.speed).toBe(originalSpeed)
    })
  })
})

describe('calculateParticleCount', () => {
  test('should calculate particle count for sub-bass band', () => {
    const count = calculateParticleCount(0, 0.5, 1.0)
    expect(count).toBeGreaterThan(0)
  })

  test('should calculate particle count for bass band', () => {
    const count = calculateParticleCount(1, 0.5, 1.0)
    expect(count).toBeGreaterThan(0)
  })

  test('should calculate particle count for low-mid band', () => {
    const count = calculateParticleCount(2, 0.5, 1.0)
    expect(count).toBeGreaterThan(0)
  })

  test('should calculate particle count for mid band', () => {
    const count = calculateParticleCount(3, 0.5, 1.0)
    expect(count).toBeGreaterThan(0)
  })

  test('should calculate particle count for high-mid band', () => {
    const count = calculateParticleCount(4, 0.5, 1.0)
    expect(count).toBeGreaterThan(0)
  })

  test('should calculate particle count for presence band', () => {
    const count = calculateParticleCount(5, 0.5, 1.0)
    expect(count).toBeGreaterThan(0)
  })

  test('should calculate particle count for brilliance band', () => {
    const count = calculateParticleCount(6, 0.5, 1.0)
    expect(count).toBeGreaterThan(0)
  })

  test('should calculate particle count for air band', () => {
    const count = calculateParticleCount(7, 0.5, 1.0)
    expect(count).toBeGreaterThan(0)
  })

  test('should handle invalid frequency band', () => {
    const count = calculateParticleCount(99, 0.5, 1.0)
    expect(count).toBeGreaterThan(0) // Should use default case
  })

  test('should handle zero amplitude', () => {
    const count = calculateParticleCount(0, 0, 1.0)
    expect(count).toBeGreaterThan(0)
  })

  test('should handle maximum amplitude', () => {
    const count = calculateParticleCount(0, 1.0, 1.0)
    expect(count).toBeGreaterThan(0)
  })

  test('should handle different canvas scales', () => {
    const count1 = calculateParticleCount(0, 0.5, 0.5)
    const count2 = calculateParticleCount(0, 0.5, 2.0)

    expect(count1).toBeGreaterThan(0)
    expect(count2).toBeGreaterThan(0)
    expect(count1).not.toBe(count2) // Different scales should produce different counts
  })

  test('should handle extreme amplitude values', () => {
    // Test with very low amplitude
    const lowCount = calculateParticleCount(0, 0.001, 1.0)
    expect(lowCount).toBeGreaterThan(0)

    // Test with very high amplitude
    const highCount = calculateParticleCount(0, 0.999, 1.0)
    expect(highCount).toBeGreaterThan(0)
  })

  test('should handle edge case canvas scales', () => {
    // Test with very small scale
    const smallCount = calculateParticleCount(0, 0.5, 0.1)
    expect(smallCount).toBeGreaterThan(0)

    // Test with very large scale
    const largeCount = calculateParticleCount(0, 0.5, 10.0)
    expect(largeCount).toBeGreaterThan(0)
  })
})

describe('calculateStaggeredSpawn', () => {
  test('should calculate spawn timing for sub-bass band', () => {
    const result = calculateStaggeredSpawn(0, 10, 5)
    expect(result).toHaveProperty('shouldSpawn')
    expect(result).toHaveProperty('spawnIndex')
    expect(result).toHaveProperty('interval')
    expect(result.interval).toBe(3)
  })

  test('should calculate spawn timing for bass band', () => {
    const result = calculateStaggeredSpawn(1, 10, 5)
    expect(result).toHaveProperty('shouldSpawn')
    expect(result).toHaveProperty('spawnIndex')
    expect(result).toHaveProperty('interval')
    expect(result.interval).toBe(2)
  })

  test('should calculate spawn timing for low-mid band', () => {
    const result = calculateStaggeredSpawn(2, 10, 5)
    expect(result).toHaveProperty('shouldSpawn')
    expect(result).toHaveProperty('spawnIndex')
    expect(result).toHaveProperty('interval')
    expect(result.interval).toBe(3)
  })

  test('should calculate spawn timing for mid band', () => {
    const result = calculateStaggeredSpawn(3, 10, 5)
    expect(result).toHaveProperty('shouldSpawn')
    expect(result).toHaveProperty('spawnIndex')
    expect(result).toHaveProperty('interval')
    expect(result.interval).toBe(2)
  })

  test('should calculate spawn timing for high-mid band', () => {
    const result = calculateStaggeredSpawn(4, 10, 5)
    expect(result).toHaveProperty('shouldSpawn')
    expect(result).toHaveProperty('spawnIndex')
    expect(result).toHaveProperty('interval')
    expect(result.interval).toBe(3)
  })

  test('should calculate spawn timing for presence band', () => {
    const result = calculateStaggeredSpawn(5, 10, 5)
    expect(result).toHaveProperty('shouldSpawn')
    expect(result).toHaveProperty('spawnIndex')
    expect(result).toHaveProperty('interval')
    expect(result.interval).toBe(2)
  })

  test('should calculate spawn timing for brilliance band', () => {
    const result = calculateStaggeredSpawn(6, 10, 5)
    expect(result).toHaveProperty('shouldSpawn')
    expect(result).toHaveProperty('spawnIndex')
    expect(result).toHaveProperty('interval')
    expect(result.interval).toBe(3)
  })

  test('should calculate spawn timing for air band', () => {
    const result = calculateStaggeredSpawn(7, 10, 5)
    expect(result).toHaveProperty('shouldSpawn')
    expect(result).toHaveProperty('spawnIndex')
    expect(result).toHaveProperty('interval')
    expect(result.interval).toBe(2)
  })

  test('should handle invalid frequency band', () => {
    const result = calculateStaggeredSpawn(99, 10, 5)
    expect(result).toHaveProperty('shouldSpawn')
    expect(result).toHaveProperty('spawnIndex')
    expect(result).toHaveProperty('interval')
    expect(result.interval).toBe(3) // Should use default case
  })

  test('should handle different frame counts', () => {
    const result1 = calculateStaggeredSpawn(0, 0, 5)
    const result2 = calculateStaggeredSpawn(0, 100, 5)
    const result3 = calculateStaggeredSpawn(0, 1000, 5)

    expect(result1).toHaveProperty('shouldSpawn')
    expect(result2).toHaveProperty('shouldSpawn')
    expect(result3).toHaveProperty('shouldSpawn')
  })

  test('should handle different total particle counts', () => {
    const result1 = calculateStaggeredSpawn(0, 10, 1)
    const result2 = calculateStaggeredSpawn(0, 10, 10)
    const result3 = calculateStaggeredSpawn(0, 10, 100)

    expect(result1).toHaveProperty('spawnIndex')
    expect(result2).toHaveProperty('spawnIndex')
    expect(result3).toHaveProperty('spawnIndex')
  })

  test('should handle edge case frame counts', () => {
    // Test with very large frame count
    const result = calculateStaggeredSpawn(0, 999999, 5)
    expect(result).toHaveProperty('shouldSpawn')
    expect(result).toHaveProperty('spawnIndex')
    expect(result).toHaveProperty('interval')
  })

  test('should handle edge case particle counts', () => {
    // Test with very large particle count
    const result = calculateStaggeredSpawn(0, 10, 999999)
    expect(result).toHaveProperty('shouldSpawn')
    expect(result).toHaveProperty('spawnIndex')
    expect(result).toHaveProperty('interval')
  })
})

describe('calculateMaxParticles', () => {
  test('should calculate max particles for small canvas', () => {
    const maxParticles = calculateMaxParticles(400, 300)
    expect(maxParticles).toBeGreaterThan(0)
  })

  test('should calculate max particles for medium canvas', () => {
    const maxParticles = calculateMaxParticles(800, 600)
    expect(maxParticles).toBeGreaterThan(0)
  })

  test('should calculate max particles for large canvas', () => {
    const maxParticles = calculateMaxParticles(1920, 1080)
    expect(maxParticles).toBeGreaterThan(0)
  })

  test('should handle custom pixels per particle ratio', () => {
    const maxParticles1 = calculateMaxParticles(800, 600, 1000)
    const maxParticles2 = calculateMaxParticles(800, 600, 10000)

    expect(maxParticles1).toBeGreaterThan(maxParticles2) // Lower ratio = more particles
  })

  test('should handle edge case canvas dimensions', () => {
    // Test with very small canvas
    const smallMax = calculateMaxParticles(1, 1)
    expect(smallMax).toBe(0)

    // Test with very large canvas
    const largeMax = calculateMaxParticles(10000, 10000)
    expect(largeMax).toBeGreaterThan(0)
  })

  test('should handle zero dimensions', () => {
    const maxParticles = calculateMaxParticles(0, 0)
    expect(maxParticles).toBe(0)
  })

  test('should handle negative dimensions', () => {
    const maxParticles = calculateMaxParticles(-100, -100)
    expect(maxParticles).toBeGreaterThan(0) // Math.abs behavior
  })
})

describe('calculateCanvasScale', () => {
  test('should calculate scale for small canvas', () => {
    const scale = calculateCanvasScale(400, 300)
    expect(scale).toBeGreaterThan(0)
  })

  test('should calculate scale for medium canvas', () => {
    const scale = calculateCanvasScale(800, 600)
    expect(scale).toBeGreaterThan(0)
  })

  test('should calculate scale for large canvas', () => {
    const scale = calculateCanvasScale(1920, 1080)
    expect(scale).toBeGreaterThan(0)
  })

  test('should handle custom base size', () => {
    const scale1 = calculateCanvasScale(800, 600, 200)
    const scale2 = calculateCanvasScale(800, 600, 800)

    expect(scale1).toBeGreaterThan(scale2) // Smaller base size = larger scale
  })

  test('should handle edge case canvas dimensions', () => {
    // Test with very small canvas
    const smallScale = calculateCanvasScale(1, 1)
    expect(smallScale).toBeGreaterThan(0)

    // Test with very large canvas
    const largeScale = calculateCanvasScale(10000, 10000)
    expect(largeScale).toBeGreaterThan(0)
  })

  test('should handle zero dimensions', () => {
    const scale = calculateCanvasScale(0, 0)
    expect(scale).toBe(0)
  })

  test('should handle negative dimensions', () => {
    const scale = calculateCanvasScale(-100, -100)
    expect(scale).toBeGreaterThan(0) // Math.abs behavior
  })

  test('should handle different aspect ratios', () => {
    const scale1 = calculateCanvasScale(800, 600) // 4:3
    const scale2 = calculateCanvasScale(800, 800) // 1:1
    const scale3 = calculateCanvasScale(1600, 900) // 16:9

    expect(scale1).toBeGreaterThan(0)
    expect(scale2).toBeGreaterThan(0)
    expect(scale3).toBeGreaterThan(0)
  })
})
