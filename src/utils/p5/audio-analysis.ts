/**
 * Audio Analysis Utilities
 * Reusable functions for analyzing audio frequency data
 */

// Define types for frequency ranges and bands
interface FrequencyRange {
  start: number
  end: number
  name: string
}

interface FrequencyBand {
  amp: number
  band: number
  name: string
  spawnArea: string
}

interface FrequencyAnalysisResult {
  frequencyData: number[]
  smoothedData: number[]
}

// Standard frequency ranges for audio analysis
export const FREQUENCY_RANGES: FrequencyRange[] = [
  { start: 20, end: 60, name: 'sub-bass' }, // 0
  { start: 60, end: 250, name: 'bass' }, // 1
  { start: 250, end: 500, name: 'low-mid' }, // 2
  { start: 500, end: 2000, name: 'mid' }, // 3
  { start: 2000, end: 4000, name: 'high-mid' }, // 4
  { start: 4000, end: 6000, name: 'presence' }, // 5
  { start: 6000, end: 8000, name: 'brilliance' }, // 6
  { start: 8000, end: 20000, name: 'air' }, // 7
]

/**
 * Get energy from custom frequency ranges for more granular control
 * @param fft - p5.FFT instance
 * @param startFreq - Start frequency in Hz
 * @param endFreq - End frequency in Hz
 * @returns Average energy in the frequency range
 */
export const getFrequencyEnergy = (
  fft: any,
  startFreq: number,
  endFreq: number
): number => {
  if (!fft || !fft.logAverages || !fft.getOctaveBands) {
    return 0
  }

  const spectrum = fft.logAverages(fft.getOctaveBands(1))
  if (!spectrum || spectrum.length === 0) {
    return 0
  }

  const startIndex = Math.floor(startFreq / (22050 / spectrum.length))
  const endIndex = Math.floor(endFreq / (22050 / spectrum.length))

  let total = 0
  let count = 0
  for (let i = startIndex; i <= endIndex && i < spectrum.length; i++) {
    if (i >= 0) {
      total += spectrum[i]
      count++
    }
  }
  return count > 0 ? total / count : 0
}

/**
 * Apply smoothing to frequency data to reduce jitter
 * @param currentData - Current smoothed data
 * @param newData - New raw data
 * @param smoothingFactor - Smoothing factor (0-1, higher = more smoothing)
 * @returns Smoothed data
 */
export const smoothFrequencyData = (
  currentData: number[] | null | undefined,
  newData: number[] | null | undefined,
  smoothingFactor: number = 0.7
): number[] => {
  // Handle null/undefined inputs
  if (!currentData || !newData) {
    return newData || currentData || []
  }

  // Ensure arrays have the same length
  const maxLength = Math.max(currentData.length, newData.length)
  const paddedCurrent =
    currentData.length < maxLength
      ? [...currentData, ...Array(maxLength - currentData.length).fill(0)]
      : currentData
  const paddedNew =
    newData.length < maxLength
      ? [...newData, ...Array(maxLength - newData.length).fill(0)]
      : newData

  return paddedCurrent.map(
    (current, index) =>
      (current || 0) * smoothingFactor +
      (paddedNew[index] || 0) * (1 - smoothingFactor)
  )
}

/**
 * Analyze all frequency bands and return processed data
 * @param fft - p5.FFT instance
 * @param smoothedData - Previous smoothed data array
 * @param smoothingFactor - Smoothing factor for data
 * @returns Object containing frequency data and smoothed data
 */
export const analyzeFrequencyBands = (
  fft: any,
  smoothedData: number[] = [],
  smoothingFactor: number = 0.7
): FrequencyAnalysisResult => {
  if (!fft) {
    return {
      frequencyData: Array(8).fill(0),
      smoothedData: Array(8).fill(0),
    }
  }

  const frequencyData: number[] = []

  // Get energy from each frequency range
  FREQUENCY_RANGES.forEach((range) => {
    const rawEnergy = getFrequencyEnergy(fft, range.start, range.end)
    frequencyData.push(rawEnergy)
  })

  // Apply smoothing
  const newSmoothedData = smoothFrequencyData(
    smoothedData,
    frequencyData,
    smoothingFactor
  )

  return {
    frequencyData: newSmoothedData,
    smoothedData: newSmoothedData,
  }
}

/**
 * Get frequency band configuration with spawn areas
 * @param frequencyData - Processed frequency data
 * @returns Array of band objects with amplitude, band index, name, and spawn area
 */
export const getFrequencyBands = (frequencyData: number[] | null | undefined): FrequencyBand[] => {
  // Handle null/undefined inputs
  if (!frequencyData) {
    frequencyData = []
  }

  return FREQUENCY_RANGES.map((range, index) => ({
    amp: frequencyData[index] || 0,
    band: index,
    name: range.name,
    spawnArea: [
      'center',
      'left',
      'right',
      'top',
      'bottom',
      'top-left',
      'bottom-right',
      'center',
    ][index],
  }))
}
