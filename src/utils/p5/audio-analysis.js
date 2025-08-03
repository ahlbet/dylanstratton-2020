/**
 * Audio Analysis Utilities
 * Reusable functions for analyzing audio frequency data
 */

// Standard frequency ranges for audio analysis
export const FREQUENCY_RANGES = [
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
 * @param {Object} fft - p5.FFT instance
 * @param {number} startFreq - Start frequency in Hz
 * @param {number} endFreq - End frequency in Hz
 * @returns {number} Average energy in the frequency range
 */
export const getFrequencyEnergy = (fft, startFreq, endFreq) => {
  const spectrum = fft.logAverages(fft.getOctaveBands(1))
  const startIndex = Math.floor(startFreq / (22050 / spectrum.length))
  const endIndex = Math.floor(endFreq / (22050 / spectrum.length))

  let total = 0
  let count = 0
  for (let i = startIndex; i <= endIndex && i < spectrum.length; i++) {
    total += spectrum[i]
    count++
  }
  return count > 0 ? total / count : 0
}

/**
 * Apply smoothing to frequency data to reduce jitter
 * @param {Array} currentData - Current smoothed data
 * @param {Array} newData - New raw data
 * @param {number} smoothingFactor - Smoothing factor (0-1, higher = more smoothing)
 * @returns {Array} Smoothed data
 */
export const smoothFrequencyData = (
  currentData,
  newData,
  smoothingFactor = 0.7
) => {
  return currentData.map(
    (current, index) =>
      current * smoothingFactor + newData[index] * (1 - smoothingFactor)
  )
}

/**
 * Analyze all frequency bands and return processed data
 * @param {Object} fft - p5.FFT instance
 * @param {Array} smoothedData - Previous smoothed data array
 * @param {number} smoothingFactor - Smoothing factor for data
 * @returns {Object} Object containing frequency data and smoothed data
 */
export const analyzeFrequencyBands = (
  fft,
  smoothedData = [],
  smoothingFactor = 0.7
) => {
  const frequencyData = []

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
 * @param {Array} frequencyData - Processed frequency data
 * @returns {Array} Array of band objects with amplitude, band index, name, and spawn area
 */
export const getFrequencyBands = (frequencyData) => {
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
