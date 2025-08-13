import {
  FREQUENCY_RANGES,
  getFrequencyEnergy,
  smoothFrequencyData,
  analyzeFrequencyBands,
  getFrequencyBands,
} from './audio-analysis'

describe('Audio Analysis Utilities', () => {
  describe('FREQUENCY_RANGES', () => {
    test('should have correct frequency ranges', () => {
      expect(FREQUENCY_RANGES).toHaveLength(8)
      expect(FREQUENCY_RANGES[0]).toEqual({
        start: 20,
        end: 60,
        name: 'sub-bass',
      })
      expect(FREQUENCY_RANGES[1]).toEqual({ start: 60, end: 250, name: 'bass' })
      expect(FREQUENCY_RANGES[2]).toEqual({
        start: 250,
        end: 500,
        name: 'low-mid',
      })
      expect(FREQUENCY_RANGES[3]).toEqual({
        start: 500,
        end: 2000,
        name: 'mid',
      })
      expect(FREQUENCY_RANGES[4]).toEqual({
        start: 2000,
        end: 4000,
        name: 'high-mid',
      })
      expect(FREQUENCY_RANGES[5]).toEqual({
        start: 4000,
        end: 6000,
        name: 'presence',
      })
      expect(FREQUENCY_RANGES[6]).toEqual({
        start: 6000,
        end: 8000,
        name: 'brilliance',
      })
      expect(FREQUENCY_RANGES[7]).toEqual({
        start: 8000,
        end: 20000,
        name: 'air',
      })
    })

    test('should have valid frequency ranges', () => {
      FREQUENCY_RANGES.forEach((range, index) => {
        expect(range.start).toBeGreaterThan(0)
        expect(range.end).toBeGreaterThan(range.start)
        expect(range.name).toBeTruthy()
        expect(typeof range.name).toBe('string')
      })
    })
  })

  describe('getFrequencyEnergy', () => {
    let mockFft

    beforeEach(() => {
      mockFft = {
        logAverages: jest.fn(() => [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]),
        getOctaveBands: jest.fn(() => [1]),
      }
    })

    test('should calculate frequency energy correctly', () => {
      const energy = getFrequencyEnergy(mockFft, 20, 60)
      expect(energy).toBeGreaterThan(0)
      expect(typeof energy).toBe('number')
    })

    test('should handle edge case frequencies', () => {
      const energy = getFrequencyEnergy(mockFft, 0, 100)
      expect(energy).toBeGreaterThan(0)
    })

    test('should handle high frequencies', () => {
      const energy = getFrequencyEnergy(mockFft, 8000, 20000)
      expect(energy).toBeGreaterThan(0)
    })

    test('should handle same start and end frequency', () => {
      const energy = getFrequencyEnergy(mockFft, 100, 100)
      expect(energy).toBeGreaterThan(0)
    })

    test('should handle invalid frequency ranges', () => {
      const energy = getFrequencyEnergy(mockFft, 20000, 10)
      expect(energy).toBe(0)
    })

    test('should handle empty spectrum', () => {
      mockFft.logAverages = jest.fn(() => [])
      const energy = getFrequencyEnergy(mockFft, 20, 60)
      expect(energy).toBe(0)
    })

    test('should handle single frequency bin', () => {
      mockFft.logAverages = jest.fn(() => [0.5])
      const energy = getFrequencyEnergy(mockFft, 20, 60)
      expect(energy).toBe(0.5)
    })
  })

  describe('smoothFrequencyData', () => {
    test('should smooth data correctly with default factor', () => {
      const currentData = [0.5, 0.5, 0.5]
      const newData = [1.0, 1.0, 1.0]
      const smoothed = smoothFrequencyData(currentData, newData)

      expect(smoothed).toHaveLength(3)
      smoothed.forEach((value) => {
        expect(value).toBeGreaterThan(0.5)
        expect(value).toBeLessThan(1.0)
      })
    })

    test('should smooth data with custom factor', () => {
      const currentData = [0.2, 0.2, 0.2]
      const newData = [1.0, 1.0, 1.0]
      const smoothingFactor = 0.9
      const smoothed = smoothFrequencyData(
        currentData,
        newData,
        smoothingFactor
      )

      expect(smoothed).toHaveLength(3)
      smoothed.forEach((value) => {
        expect(value).toBeGreaterThan(0.2)
        expect(value).toBeLessThan(1.0)
      })
    })

    test('should handle empty arrays', () => {
      const smoothed = smoothFrequencyData([], [], 0.5)
      expect(smoothed).toEqual([])
    })

    test('should handle different array lengths', () => {
      const currentData = [0.5, 0.5]
      const newData = [1.0, 1.0, 1.0]
      const smoothed = smoothFrequencyData(currentData, newData)

      // Function now pads arrays to the same length, so result should be length of longer array
      expect(smoothed).toHaveLength(3)
      expect(smoothed[0]).toBeCloseTo(0.65, 1) // 0.5 * 0.7 + 1.0 * 0.3
      expect(smoothed[1]).toBeCloseTo(0.65, 1) // 0.5 * 0.7 + 1.0 * 0.3
      expect(smoothed[2]).toBeCloseTo(0.3, 1) // 0 * 0.7 + 1.0 * 0.3
    })

    test('should handle extreme smoothing factors', () => {
      const currentData = [0.1, 0.1]
      const newData = [0.9, 0.9]

      // Very high smoothing (mostly keep current)
      const highSmoothing = smoothFrequencyData(currentData, newData, 0.99)
      expect(highSmoothing[0]).toBeCloseTo(0.1, 1)

      // Very low smoothing (mostly use new)
      const lowSmoothing = smoothFrequencyData(currentData, newData, 0.01)
      expect(lowSmoothing[0]).toBeCloseTo(0.9, 1)
    })

    test('should handle zero smoothing factor', () => {
      const currentData = [0.1, 0.1]
      const newData = [0.9, 0.9]
      const smoothed = smoothFrequencyData(currentData, newData, 0)

      expect(smoothed).toEqual(newData)
    })

    test('should handle one smoothing factor', () => {
      const currentData = [0.1, 0.1]
      const newData = [0.9, 0.9]
      const smoothed = smoothFrequencyData(currentData, newData, 1)

      expect(smoothed).toEqual(currentData)
    })
  })

  describe('analyzeFrequencyBands', () => {
    let mockFft

    beforeEach(() => {
      mockFft = {
        logAverages: jest.fn(() => [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]),
        getOctaveBands: jest.fn(() => [1]),
      }
    })

    test('should analyze frequency bands correctly', () => {
      const result = analyzeFrequencyBands(mockFft)

      expect(result).toHaveProperty('frequencyData')
      expect(result).toHaveProperty('smoothedData')
      expect(result.frequencyData).toHaveLength(8)
      expect(result.smoothedData).toHaveLength(8)
    })

    test('should use default smoothing factor', () => {
      const result = analyzeFrequencyBands(mockFft)
      expect(result.frequencyData).toHaveLength(8)
    })

    test('should use custom smoothing factor', () => {
      const smoothingFactor = 0.5
      const result = analyzeFrequencyBands(mockFft, [], smoothingFactor)
      expect(result.frequencyData).toHaveLength(8)
    })

    test('should handle existing smoothed data', () => {
      const existingData = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]
      const result = analyzeFrequencyBands(mockFft, existingData, 0.5)
      expect(result.frequencyData).toHaveLength(8)
    })

    test('should handle empty smoothed data', () => {
      const result = analyzeFrequencyBands(mockFft, [], 0.5)
      expect(result.frequencyData).toHaveLength(8)
    })

    test('should handle null smoothed data', () => {
      const result = analyzeFrequencyBands(mockFft, null, 0.5)
      expect(result.frequencyData).toHaveLength(8)
    })

    test('should handle undefined smoothed data', () => {
      const result = analyzeFrequencyBands(mockFft, undefined, 0.5)
      expect(result.frequencyData).toHaveLength(8)
    })
  })

  describe('getFrequencyBands', () => {
    test('should return frequency bands with correct structure', () => {
      const frequencyData = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
      const bands = getFrequencyBands(frequencyData)

      expect(bands).toHaveLength(8)
      bands.forEach((band, index) => {
        expect(band).toHaveProperty('amp')
        expect(band).toHaveProperty('band')
        expect(band).toHaveProperty('name')
        expect(band).toHaveProperty('spawnArea')
        expect(band.amp).toBe(frequencyData[index])
        expect(band.band).toBe(index)
        expect(band.name).toBe(FREQUENCY_RANGES[index].name)
      })
    })

    test('should handle empty frequency data', () => {
      const bands = getFrequencyBands([])
      expect(bands).toHaveLength(8)
      bands.forEach((band) => {
        expect(band.amp).toBe(0)
      })
    })

    test('should handle partial frequency data', () => {
      const frequencyData = [0.1, 0.2]
      const bands = getFrequencyBands(frequencyData)
      expect(bands).toHaveLength(8)
      expect(bands[0].amp).toBe(0.1)
      expect(bands[1].amp).toBe(0.2)
      expect(bands[2].amp).toBe(0)
    })

    test('should handle null frequency data', () => {
      const bands = getFrequencyBands(null)
      expect(bands).toHaveLength(8)
      bands.forEach((band) => {
        expect(band.amp).toBe(0)
      })
    })

    test('should handle undefined frequency data', () => {
      const bands = getFrequencyBands(undefined)
      expect(bands).toHaveLength(8)
      bands.forEach((band) => {
        expect(band.amp).toBe(0)
      })
    })

    test('should handle extreme frequency values', () => {
      const frequencyData = [0, 1, -1, 1000, -1000, 0.5, 0.25, 0.75]
      const bands = getFrequencyBands(frequencyData)
      expect(bands).toHaveLength(8)
      expect(bands[0].amp).toBe(0)
      expect(bands[1].amp).toBe(1)
      expect(bands[2].amp).toBe(-1)
      expect(bands[3].amp).toBe(1000)
    })
  })
})
