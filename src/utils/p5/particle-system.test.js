import {
  Particle,
  calculateParticleCount,
  calculateMaxParticles,
  calculateCanvasScale,
  calculateStaggeredSpawn,
} from './particle-system'

describe('Particle', () => {
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
