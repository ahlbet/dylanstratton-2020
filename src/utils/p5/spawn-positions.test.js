import {
  updateTatShapePositions,
  addDynamicMovementToPositions,
  calculateTatSpawnPosition,
  calculateFallbackSpawnPosition,
  calculateSpawnPosition,
} from './spawn-positions'

// Mock p5 instance
const mockP5 = {
  width: 800,
  height: 600,
  frameCount: 1,
  random: jest.fn(),
  noise: jest.fn(),
  TWO_PI: Math.PI * 2,
}

describe('spawn-positions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockP5.random.mockImplementation((min, max) => (min + max) / 2)
    mockP5.noise.mockImplementation(() => 0.5)
  })

  describe('updateTatShapePositions', () => {
    it('should update Tat shape positions with dynamic movement', () => {
      const tatShapePositions = [
        {
          x: 100,
          y: 100,
          originalX: 100,
          originalY: 100,
          movementAngle: 0,
          movementSpeed: 1,
          movementDirection: 1,
          movementRadius: 50,
        },
      ]

      updateTatShapePositions(tatShapePositions, mockP5)

      expect(tatShapePositions[0].x).toBeDefined()
      expect(tatShapePositions[0].y).toBeDefined()
      expect(tatShapePositions[0].movementAngle).toBeGreaterThan(0)
    })

    it('should keep positions within canvas bounds', () => {
      const tatShapePositions = [
        {
          x: 0,
          y: 0,
          originalX: 0,
          originalY: 0,
          movementAngle: 0,
          movementSpeed: 1,
          movementDirection: 1,
          movementRadius: 1000, // Large radius to test bounds
        },
      ]

      updateTatShapePositions(tatShapePositions, mockP5)

      expect(tatShapePositions[0].x).toBeGreaterThanOrEqual(20)
      expect(tatShapePositions[0].x).toBeLessThanOrEqual(mockP5.width - 20)
      expect(tatShapePositions[0].y).toBeGreaterThanOrEqual(20)
      expect(tatShapePositions[0].y).toBeLessThanOrEqual(mockP5.height - 20)
    })

    it('should handle multiple positions', () => {
      const tatShapePositions = [
        {
          x: 100,
          y: 100,
          originalX: 100,
          originalY: 100,
          movementAngle: 0,
          movementSpeed: 1,
          movementDirection: 1,
          movementRadius: 50,
        },
        {
          x: 200,
          y: 200,
          originalX: 200,
          originalY: 200,
          movementAngle: Math.PI,
          movementSpeed: 2,
          movementDirection: -1,
          movementRadius: 30,
        },
      ]

      updateTatShapePositions(tatShapePositions, mockP5)

      expect(tatShapePositions).toHaveLength(2)
      expect(tatShapePositions[0].x).toBeDefined()
      expect(tatShapePositions[1].x).toBeDefined()
    })
  })

  describe('addDynamicMovementToPositions', () => {
    it('should add dynamic movement properties to positions', () => {
      const tatShapePositions = [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
      ]

      addDynamicMovementToPositions(tatShapePositions, mockP5)

      tatShapePositions.forEach((pos) => {
        expect(pos.originalX).toBe(pos.x)
        expect(pos.originalY).toBe(pos.y)
        expect(pos.movementSpeed).toBeDefined()
        expect(pos.movementRadius).toBeDefined()
        expect(pos.movementAngle).toBeDefined()
        expect(pos.movementDirection).toBeDefined()
      })
    })

    it('should use p5.random for movement properties', () => {
      const tatShapePositions = [{ x: 100, y: 100 }]

      addDynamicMovementToPositions(tatShapePositions, mockP5)

      expect(mockP5.random).toHaveBeenCalledWith(0.2, 0.8) // movementSpeed - updated for slower movement
      expect(mockP5.random).toHaveBeenCalledWith(20, 360) // movementRadius
      expect(mockP5.random).toHaveBeenCalledWith(mockP5.TWO_PI) // movementAngle
      expect(mockP5.random).toHaveBeenCalledWith([-1, 1]) // movementDirection
    })
  })

  describe('calculateTatSpawnPosition', () => {
    it('should calculate spawn position using Tat shape positions', () => {
      const tatShapePositions = [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        { x: 300, y: 300 },
      ]

      const result = calculateTatSpawnPosition(
        tatShapePositions,
        0, // bandIndex
        1, // particleIndex
        mockP5
      )

      expect(result).toBeDefined()
      expect(result.x).toBeDefined()
      expect(result.y).toBeDefined()
      expect(mockP5.noise).toHaveBeenCalled()
    })

    it('should return null for empty Tat shape positions', () => {
      const result = calculateTatSpawnPosition([], 0, 1, mockP5)

      expect(result).toBeNull()
    })

    it('should handle different band and particle indices', () => {
      const tatShapePositions = [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
      ]

      const result1 = calculateTatSpawnPosition(
        tatShapePositions,
        1, // bandIndex
        0, // particleIndex
        mockP5
      )
      const result2 = calculateTatSpawnPosition(
        tatShapePositions,
        0, // bandIndex
        2, // particleIndex
        mockP5
      )

      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
    })
  })

  describe('calculateFallbackSpawnPosition', () => {
    it('should calculate center spawn position', () => {
      const result = calculateFallbackSpawnPosition(
        'center',
        800, // canvasWidth
        600, // canvasHeight
        1, // frameCount
        0, // bandIndex
        mockP5
      )

      expect(result.x).toBeDefined()
      expect(result.y).toBeDefined()
      expect(mockP5.noise).toHaveBeenCalled()
    })

    it('should calculate left spawn position', () => {
      const result = calculateFallbackSpawnPosition(
        'left',
        800,
        600,
        1,
        0,
        mockP5
      )

      expect(result.x).toBeDefined()
      expect(result.y).toBeDefined()
    })

    it('should calculate right spawn position', () => {
      const result = calculateFallbackSpawnPosition(
        'right',
        800,
        600,
        1,
        0,
        mockP5
      )

      expect(result.x).toBeDefined()
      expect(result.y).toBeDefined()
    })

    it('should calculate top spawn position', () => {
      const result = calculateFallbackSpawnPosition(
        'top',
        800,
        600,
        1,
        0,
        mockP5
      )

      expect(result.x).toBeDefined()
      expect(result.y).toBeDefined()
    })

    it('should calculate bottom spawn position', () => {
      const result = calculateFallbackSpawnPosition(
        'bottom',
        800,
        600,
        1,
        0,
        mockP5
      )

      expect(result.x).toBeDefined()
      expect(result.y).toBeDefined()
    })

    it('should calculate top-left spawn position', () => {
      const result = calculateFallbackSpawnPosition(
        'top-left',
        800,
        600,
        1,
        0,
        mockP5
      )

      expect(result.x).toBeDefined()
      expect(result.y).toBeDefined()
    })

    it('should calculate bottom-right spawn position', () => {
      const result = calculateFallbackSpawnPosition(
        'bottom-right',
        800,
        600,
        1,
        0,
        mockP5
      )

      expect(result.x).toBeDefined()
      expect(result.y).toBeDefined()
    })

    it('should use random positioning for unknown spawn areas', () => {
      const result = calculateFallbackSpawnPosition(
        'unknown',
        800,
        600,
        1,
        0,
        mockP5
      )

      expect(result.x).toBeDefined()
      expect(result.y).toBeDefined()
      expect(mockP5.random).toHaveBeenCalledWith(0, 800)
      expect(mockP5.random).toHaveBeenCalledWith(0, 600)
    })

    it('should add noise to spawn positions', () => {
      calculateFallbackSpawnPosition('center', 800, 600, 1, 0, mockP5)

      expect(mockP5.noise).toHaveBeenCalled()
    })
  })

  describe('calculateSpawnPosition', () => {
    it('should return Tat position when available', () => {
      const tatShapePositions = [{ x: 100, y: 100 }]

      const result = calculateSpawnPosition(
        tatShapePositions,
        'center',
        800,
        600,
        1,
        0,
        0,
        mockP5
      )

      expect(result).toBeDefined()
      expect(result.x).toBeDefined()
      expect(result.y).toBeDefined()
    })

    it('should fallback to spawn area positioning when no Tat positions', () => {
      const result = calculateSpawnPosition(
        [],
        'center',
        800,
        600,
        1,
        0,
        0,
        mockP5
      )

      expect(result).toBeDefined()
      expect(result.x).toBeDefined()
      expect(result.y).toBeDefined()
    })

    it('should handle different spawn areas in fallback', () => {
      const result = calculateSpawnPosition(
        [],
        'left',
        800,
        600,
        1,
        0,
        0,
        mockP5
      )

      expect(result).toBeDefined()
      expect(result.x).toBeDefined()
      expect(result.y).toBeDefined()
    })
  })
})
