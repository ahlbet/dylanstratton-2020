/**
 * Sketch Animation Loop Utilities
 * Reusable functions for managing animation loops in audio-reactive p5.js sketches
 */

/**
 * Create the main animation loop for audio-reactive particle systems
 * @param {Object} p - p5 instance
 * @param {Object} fft - FFT analyzer instance
 * @param {Array} particles - Array of particles
 * @param {Array} smoothedData - Smoothed frequency data array
 * @param {Array} tatShapePositions - Tat shape positions for spawning
 * @param {number} markovSeed - Seed for consistent theming
 * @param {Function} updateSpawnPositions - Function to update spawn positions
 * @param {Function} analyzeFrequencyBands - Function to analyze frequency bands
 * @param {Function} getFrequencyBands - Function to get frequency band configuration
 * @param {Function} calculateMaxParticles - Function to calculate max particles
 * @param {Function} calculateCanvasScale - Function to calculate canvas scale
 * @param {Function} calculateParticleCount - Function to calculate particle count
 * @param {Function} calculateSpawnPosition - Function to calculate spawn position
 * @param {Function} ParticleClass - Particle class constructor
 * @returns {Function} Animation loop function
 */
export const createAudioReactiveAnimationLoop = (
  p,
  fft,
  particles,
  smoothedData,
  tatShapePositions,
  markovSeed,
  updateSpawnPositions,
  analyzeFrequencyBands,
  getFrequencyBands,
  calculateMaxParticles,
  calculateCanvasScale,
  calculateParticleCount,
  calculateSpawnPosition,
  ParticleClass
) => {
  return () => {
    // Update FFT spectrum
    fft.analyze()

    // Update spawn positions
    updateSpawnPositions()

    // Analyze frequency bands using utility functions
    const analysis = analyzeFrequencyBands(fft, smoothedData, 0.7)
    const frequencyData = analysis.frequencyData
    const newSmoothedData = analysis.smoothedData

    // Update smoothed data reference
    smoothedData.splice(0, smoothedData.length, ...newSmoothedData)

    // Create particles for each frequency band with more dramatic mapping
    const frequencyBands = getFrequencyBands(frequencyData)

    // Calculate particle limits and scaling using utilities
    const maxTotalParticles = calculateMaxParticles(p.width, p.height, 3000)
    const currentParticleCount = particles.length
    const canvasScale = calculateCanvasScale(p.width, p.height, 400)

    frequencyBands.forEach((band) => {
      // More dramatic particle count mapping using exponential scaling
      const normalizedAmp = band.amp / 255
      const exponentialAmp = Math.pow(normalizedAmp, 0.4) // More sensitive to low values

      // Calculate particle count using utility
      const maxParticles = calculateParticleCount(
        band.band,
        exponentialAmp,
        canvasScale
      )
      const count = p.floor(maxParticles)

      // Only spawn if we're under the total particle limit
      if (currentParticleCount < maxTotalParticles) {
        for (let i = 0; i < count; i++) {
          // Calculate spawn position using utility
          const spawnPosition = calculateSpawnPosition(
            tatShapePositions,
            band.spawnArea,
            p.width,
            p.height,
            p.frameCount,
            band.band,
            i,
            p
          )

          particles.push(
            new ParticleClass(
              p,
              spawnPosition.x,
              spawnPosition.y,
              band.amp,
              band.band,
              markovSeed
            )
          )
        }
      }
    })

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i]
      pt.update()
      pt.draw()
      if (pt.isDead()) particles.splice(i, 1)
    }
  }
}

/**
 * Create a simple particle update loop
 * @param {Array} particles - Array of particles
 * @returns {Function} Simple update loop function
 */
export const createSimpleParticleLoop = (particles) => {
  return () => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i]
      pt.update()
      pt.draw()
      if (pt.isDead()) particles.splice(i, 1)
    }
  }
}

/**
 * Create a particle spawning loop
 * @param {Object} p - p5 instance
 * @param {Array} particles - Array of particles
 * @param {Array} frequencyBands - Frequency band configuration
 * @param {Array} tatShapePositions - Spawn positions
 * @param {number} markovSeed - Seed for theming
 * @param {Function} calculateMaxParticles - Function to calculate max particles
 * @param {Function} calculateCanvasScale - Function to calculate canvas scale
 * @param {Function} calculateParticleCount - Function to calculate particle count
 * @param {Function} calculateSpawnPosition - Function to calculate spawn position
 * @param {Function} ParticleClass - Particle class constructor
 * @returns {Function} Particle spawning loop function
 */
export const createParticleSpawningLoop = (
  p,
  particles,
  frequencyBands,
  tatShapePositions,
  markovSeed,
  calculateMaxParticles,
  calculateCanvasScale,
  calculateParticleCount,
  calculateSpawnPosition,
  ParticleClass
) => {
  return () => {
    // Calculate particle limits and scaling using utilities
    const maxTotalParticles = calculateMaxParticles(p.width, p.height, 3000)
    const currentParticleCount = particles.length
    const canvasScale = calculateCanvasScale(p.width, p.height, 400)

    frequencyBands.forEach((band) => {
      // More dramatic particle count mapping using exponential scaling
      const normalizedAmp = band.amp / 255
      const exponentialAmp = Math.pow(normalizedAmp, 0.4) // More sensitive to low values

      // Calculate particle count using utility
      const maxParticles = calculateParticleCount(
        band.band,
        exponentialAmp,
        canvasScale
      )
      const count = p.floor(maxParticles)

      // Only spawn if we're under the total particle limit
      if (currentParticleCount < maxTotalParticles) {
        for (let i = 0; i < count; i++) {
          // Calculate spawn position using utility
          const spawnPosition = calculateSpawnPosition(
            tatShapePositions,
            band.spawnArea,
            p.width,
            p.height,
            p.frameCount,
            band.band,
            i,
            p
          )

          particles.push(
            new ParticleClass(
              p,
              spawnPosition.x,
              spawnPosition.y,
              band.amp,
              band.band,
              markovSeed
            )
          )
        }
      }
    })
  }
}
