import {
  createAudioReactiveAnimationLoop,
  createSimpleParticleLoop,
  createParticleSpawningLoop,
} from './sketch-animation-loop'

// Mock p5 instance
const mockP5 = {
  width: 800,
  height: 600,
  frameCount: 1,
  floor: (n) => Math.floor(n),
}

// Mock FFT instance
const mockFFT = {
  analyze: jest.fn(),
}

// Mock particles array
const mockParticles = []

// Mock smoothed data
const mockSmoothedData = [0.5, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6, 0.1]

// Mock tat shape positions
const mockTatShapePositions = [
  { x: 100, y: 100 },
  { x: 200, y: 200 },
  { x: 300, y: 300 },
]

// Mock utility functions
const mockUpdateSpawnPositions = jest.fn()
const mockAnalyzeFrequencyBands = jest.fn(() => ({
  frequencyData: [100, 150, 200, 250, 300, 350, 400, 450],
  smoothedData: [0.5, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6, 0.1],
}))
const mockGetFrequencyBands = jest.fn(() => [
  { band: 0, amp: 128, spawnArea: 'top' },
  { band: 1, amp: 192, spawnArea: 'bottom' },
  { band: 2, amp: 64, spawnArea: 'left' },
])
const mockCalculateMaxParticles = jest.fn(() => 1000)
const mockCalculateCanvasScale = jest.fn(() => 1.5)
const mockCalculateParticleCount = jest.fn(() => 5)
const mockCalculateSpawnPosition = jest.fn(() => ({ x: 400, y: 300 }))
const mockCalculateStaggeredSpawn = jest.fn(() => ({
  shouldSpawn: true,
  spawnIndex: 0,
}))

// Mock Particle class
class MockParticle {
  constructor(p, x, y, amp, band, seed) {
    this.x = x
    this.y = y
    this.amp = amp
    this.band = band
    this.seed = seed
    this.dead = false
  }

  update() {
    // Mock update logic
  }

  draw() {
    // Mock draw logic
  }

  isDead() {
    return this.dead
  }
}

describe('sketch-animation-loop', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockParticles.length = 0
  })

  describe('createAudioReactiveAnimationLoop', () => {
    it('should create an animation loop function', () => {
      const animationLoop = createAudioReactiveAnimationLoop(
        mockP5,
        mockFFT,
        mockParticles,
        mockSmoothedData,
        mockTatShapePositions,
        123,
        mockUpdateSpawnPositions,
        mockAnalyzeFrequencyBands,
        mockGetFrequencyBands,
        mockCalculateMaxParticles,
        mockCalculateCanvasScale,
        mockCalculateParticleCount,
        mockCalculateSpawnPosition,
        mockCalculateStaggeredSpawn,
        MockParticle
      )

      expect(typeof animationLoop).toBe('function')
    })

    it('should execute animation loop when called', () => {
      const animationLoop = createAudioReactiveAnimationLoop(
        mockP5,
        mockFFT,
        mockParticles,
        mockSmoothedData,
        mockTatShapePositions,
        123,
        mockUpdateSpawnPositions,
        mockAnalyzeFrequencyBands,
        mockGetFrequencyBands,
        mockCalculateMaxParticles,
        mockCalculateCanvasScale,
        mockCalculateParticleCount,
        mockCalculateSpawnPosition,
        mockCalculateStaggeredSpawn,
        MockParticle
      )

      animationLoop()

      expect(mockFFT.analyze).toHaveBeenCalled()
      expect(mockUpdateSpawnPositions).toHaveBeenCalled()
      expect(mockAnalyzeFrequencyBands).toHaveBeenCalledWith(
        mockFFT,
        mockSmoothedData,
        0.7
      )
      expect(mockGetFrequencyBands).toHaveBeenCalled()
      expect(mockCalculateMaxParticles).toHaveBeenCalledWith(800, 600, 3000)
      expect(mockCalculateCanvasScale).toHaveBeenCalledWith(800, 600, 400)
    })

    it('should handle FFT not properly initialized', () => {
      const invalidFFT = { analyze: 'not a function' }
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const animationLoop = createAudioReactiveAnimationLoop(
        mockP5,
        invalidFFT,
        mockParticles,
        mockSmoothedData,
        mockTatShapePositions,
        123,
        mockUpdateSpawnPositions,
        mockAnalyzeFrequencyBands,
        mockGetFrequencyBands,
        mockCalculateMaxParticles,
        mockCalculateCanvasScale,
        mockCalculateParticleCount,
        mockCalculateSpawnPosition,
        mockCalculateStaggeredSpawn,
        MockParticle
      )

      animationLoop()

      expect(consoleSpy).toHaveBeenCalledWith(
        'FFT not properly initialized, skipping animation frame'
      )
      expect(mockFFT.analyze).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should spawn particles when conditions are met', () => {
      const animationLoop = createAudioReactiveAnimationLoop(
        mockP5,
        mockFFT,
        mockParticles,
        mockSmoothedData,
        mockTatShapePositions,
        123,
        mockUpdateSpawnPositions,
        mockAnalyzeFrequencyBands,
        mockGetFrequencyBands,
        mockCalculateMaxParticles,
        mockCalculateCanvasScale,
        mockCalculateParticleCount,
        mockCalculateSpawnPosition,
        mockCalculateStaggeredSpawn,
        MockParticle
      )

      animationLoop()

      expect(mockParticles.length).toBeGreaterThan(0)
      expect(mockCalculateStaggeredSpawn).toHaveBeenCalled()
      expect(mockCalculateSpawnPosition).toHaveBeenCalled()
    })

    it('should update and draw existing particles', () => {
      // Add a mock particle
      const mockParticle = new MockParticle(mockP5, 100, 100, 128, 0, 123)
      mockParticles.push(mockParticle)

      const updateSpy = jest.spyOn(mockParticle, 'update')
      const drawSpy = jest.spyOn(mockParticle, 'draw')

      const animationLoop = createAudioReactiveAnimationLoop(
        mockP5,
        mockFFT,
        mockParticles,
        mockSmoothedData,
        mockTatShapePositions,
        123,
        mockUpdateSpawnPositions,
        mockAnalyzeFrequencyBands,
        mockGetFrequencyBands,
        mockCalculateMaxParticles,
        mockCalculateCanvasScale,
        mockCalculateParticleCount,
        mockCalculateSpawnPosition,
        mockCalculateStaggeredSpawn,
        MockParticle
      )

      animationLoop()

      expect(updateSpy).toHaveBeenCalled()
      expect(drawSpy).toHaveBeenCalled()
    })

    it('should remove dead particles', () => {
      // Add a dead particle
      const deadParticle = new MockParticle(mockP5, 100, 100, 128, 0, 123)
      deadParticle.dead = true
      mockParticles.push(deadParticle)

      const animationLoop = createAudioReactiveAnimationLoop(
        mockP5,
        mockFFT,
        mockParticles,
        mockSmoothedData,
        mockTatShapePositions,
        123,
        mockUpdateSpawnPositions,
        mockAnalyzeFrequencyBands,
        mockGetFrequencyBands,
        mockCalculateMaxParticles,
        mockCalculateCanvasScale,
        mockCalculateParticleCount,
        mockCalculateSpawnPosition,
        mockCalculateStaggeredSpawn,
        MockParticle
      )

      animationLoop()

      expect(mockParticles).not.toContain(deadParticle)
    })
  })

  describe('createSimpleParticleLoop', () => {
    it('should create a simple particle loop function', () => {
      const particleLoop = createSimpleParticleLoop(mockParticles)

      expect(typeof particleLoop).toBe('function')
    })

    it('should update and draw particles when called', () => {
      const mockParticle = new MockParticle(mockP5, 100, 100, 128, 0, 123)
      mockParticles.push(mockParticle)

      const updateSpy = jest.spyOn(mockParticle, 'update')
      const drawSpy = jest.spyOn(mockParticle, 'draw')

      const particleLoop = createSimpleParticleLoop(mockParticles)
      particleLoop()

      expect(updateSpy).toHaveBeenCalled()
      expect(drawSpy).toHaveBeenCalled()
    })

    it('should remove dead particles', () => {
      const deadParticle = new MockParticle(mockP5, 100, 100, 128, 0, 123)
      deadParticle.dead = true
      mockParticles.push(deadParticle)

      const particleLoop = createSimpleParticleLoop(mockParticles)
      particleLoop()

      expect(mockParticles).not.toContain(deadParticle)
    })
  })

  describe('createParticleSpawningLoop', () => {
    it('should create a particle spawning loop function', () => {
      const spawningLoop = createParticleSpawningLoop(
        mockP5,
        mockParticles,
        mockGetFrequencyBands(),
        mockTatShapePositions,
        123,
        mockCalculateMaxParticles,
        mockCalculateCanvasScale,
        mockCalculateParticleCount,
        mockCalculateSpawnPosition,
        MockParticle
      )

      expect(typeof spawningLoop).toBe('function')
    })

    it('should spawn particles when called', () => {
      const spawningLoop = createParticleSpawningLoop(
        mockP5,
        mockParticles,
        mockGetFrequencyBands(),
        mockTatShapePositions,
        123,
        mockCalculateMaxParticles,
        mockCalculateCanvasScale,
        mockCalculateParticleCount,
        mockCalculateSpawnPosition,
        MockParticle
      )

      spawningLoop()

      expect(mockParticles.length).toBeGreaterThan(0)
      expect(mockCalculateMaxParticles).toHaveBeenCalledWith(800, 600, 3000)
      expect(mockCalculateCanvasScale).toHaveBeenCalledWith(800, 600, 400)
      expect(mockCalculateParticleCount).toHaveBeenCalled()
      expect(mockCalculateSpawnPosition).toHaveBeenCalled()
    })

    it('should respect particle limits', () => {
      // Fill particles to limit
      mockCalculateMaxParticles.mockReturnValue(1)
      for (let i = 0; i < 2; i++) {
        mockParticles.push(new MockParticle(mockP5, 100, 100, 128, 0, 123))
      }

      const spawningLoop = createParticleSpawningLoop(
        mockP5,
        mockParticles,
        mockGetFrequencyBands(),
        mockTatShapePositions,
        123,
        mockCalculateMaxParticles,
        mockCalculateCanvasScale,
        mockCalculateParticleCount,
        mockCalculateSpawnPosition,
        MockParticle
      )

      const initialCount = mockParticles.length
      spawningLoop()

      // Should not spawn more particles when at limit
      expect(mockParticles.length).toBe(initialCount)
    })
  })
})
