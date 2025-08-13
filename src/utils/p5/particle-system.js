/**
 * Particle System Utilities
 * Reusable particle system for audio-reactive visualizations
 */

/**
 * Audio-reactive particle class
 */
export class Particle {
  constructor(p, x, y, amp, frequencyBand, markovSeed = 0) {
    this.p = p
    this.pos = p.createVector(x, y)
    this.vel = p.createVector(0, 0)
    this.acc = p.createVector(0, 0)
    this.frequencyBand = frequencyBand // 0-7: different frequency ranges
    this.lifeFrames = 0

    // Individual particle properties for unique movement
    this.noiseOffsetX = p.random(1000)
    this.noiseOffsetY = p.random(1000)
    this.noiseScale = p.random(0.01, 0.05)
    this.noiseStrength = p.random(0.5, 2.0)
    this.individualSeed = p.random(10000)
    this.rotationSpeed = p.random(-0.1, 0.1)
    this.oscillationSpeed = p.random(0.02, 0.08)
    this.oscillationAmplitude = p.random(5, 20)

    // Individual color variation properties based on markov seed
    const primaryHue = markovSeed % 360 // Use markov seed for primary hue
    const hueVariation = p.random(-30, 30) // ±30 degree variation
    this.colorHue = (primaryHue + hueVariation + 360) % 360
    this.colorSaturation = p.random(60, 100)
    this.colorBrightness = p.random(70, 100)
    this.colorShiftSpeed = p.random(0.5, 2.0)
    this.colorShiftDirection = p.random([-1, 1])

    // More dramatic amplitude mapping using exponential scaling
    const normalizedAmp = amp / 255
    const exponentialAmp = Math.pow(normalizedAmp, 0.3) // Makes low values more sensitive

    // Configure particle based on frequency band
    this.configureByFrequencyBand(exponentialAmp, primaryHue)

    this.vel = p
      .createVector(p.cos(p.random(p.TWO_PI)), p.sin(p.random(p.TWO_PI)))
      .mult(this.speed * 0.05)
    this.alpha = 1
    this.size = this.size * 0.1
    this.originalSize = this.size
    this.lifeFrames = 0
    this.maxLifeFrames = 200 + p.random(50)
    this.audioReactivity = exponentialAmp // Store for dynamic updates
  }

  configureByFrequencyBand(exponentialAmp, primaryHue) {
    const p = this.p

    // Boost the exponential amplitude for more dramatic response
    const boostedAmp = Math.pow(exponentialAmp, 0.3) // More sensitive curve

    // Add random variation to lifespan to prevent synchronized death
    const lifespanVariation = p.random(0.7, 1.3)

    switch (this.frequencyBand) {
      case 0: // Sub-bass (20-60 Hz) - much more dramatic
        this.speed = p.map(boostedAmp, 0, 1, 0, 15)
        this.size = p.map(boostedAmp, 0, 1, 8, 35)
        this.alphaDecay = 1.5
        this.maxLifeFrames = Math.floor(
          (180 + boostedAmp * 120) * lifespanVariation
        )
        this.colorHue = (primaryHue + p.random(-10, 10) + 360) % 360
        this.colorSaturation = p.random(90, 100)
        this.colorBrightness = p.random(90, 100)
        this.noiseStrength *= 0.3
        break
      case 1: // Bass (60-250 Hz) - most dramatic
        this.speed = p.map(boostedAmp, 0, 1, 0, 25)
        this.size = p.map(boostedAmp, 0, 1, 6, 32)
        this.alphaDecay = 2
        this.maxLifeFrames = Math.floor(
          (150 + boostedAmp * 100) * lifespanVariation
        )
        this.colorHue = (primaryHue + 30 + p.random(-8, 8) + 360) % 360
        this.colorSaturation = p.random(85, 100)
        this.colorBrightness = p.random(85, 100)
        this.noiseStrength *= 0.6
        break
      case 2: // Low Mid (250-500 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 28)
        this.size = p.map(boostedAmp, 0, 1, 5, 28)
        this.alphaDecay = 2.5
        this.maxLifeFrames = Math.floor(
          (120 + boostedAmp * 80) * lifespanVariation
        )
        this.colorHue = (primaryHue + 60 + p.random(-8, 8) + 360) % 360
        this.colorSaturation = p.random(80, 100)
        this.colorBrightness = p.random(80, 100)
        this.noiseStrength *= 1.0
        break
      case 3: // Mid (500-2000 Hz) - very responsive
        this.speed = p.map(boostedAmp, 0, 1, 0, 30)
        this.size = p.map(boostedAmp, 0, 1, 4, 25)
        this.alphaDecay = 3
        this.maxLifeFrames = Math.floor(
          (100 + boostedAmp * 60) * lifespanVariation
        )
        this.colorHue = (primaryHue + 90 + p.random(-8, 8) + 360) % 360
        this.colorSaturation = p.random(75, 100)
        this.colorBrightness = p.random(75, 100)
        this.noiseStrength *= 1.4
        break
      case 4: // High Mid (2000-4000 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 32)
        this.size = p.map(boostedAmp, 0, 1, 3, 22)
        this.alphaDecay = 3.5
        this.maxLifeFrames = Math.floor(
          (80 + boostedAmp * 40) * lifespanVariation
        )
        this.colorHue = (primaryHue + 120 + p.random(-8, 8) + 360) % 360
        this.colorSaturation = p.random(70, 100)
        this.colorBrightness = p.random(70, 100)
        this.noiseStrength *= 1.8
        break
      case 5: // Presence (4000-6000 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 35)
        this.size = p.map(boostedAmp, 0, 1, 2, 20)
        this.alphaDecay = 4
        this.maxLifeFrames = Math.floor(
          (60 + boostedAmp * 30) * lifespanVariation
        )
        this.colorHue = (primaryHue + 150 + p.random(-8, 8) + 360) % 360
        this.colorSaturation = p.random(65, 100)
        this.colorBrightness = p.random(65, 100)
        this.noiseStrength *= 2.2
        break
      case 6: // Brilliance (6000-8000 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 38)
        this.size = p.map(boostedAmp, 0, 1, 2, 18)
        this.alphaDecay = 4.5
        this.maxLifeFrames = Math.floor(
          (40 + boostedAmp * 20) * lifespanVariation
        )
        this.colorHue = (primaryHue + 180 + p.random(-8, 8) + 360) % 360
        this.colorSaturation = p.random(60, 100)
        this.colorBrightness = p.random(60, 100)
        this.noiseStrength *= 2.6
        break
      case 7: // Air (8000-20000 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 40)
        this.size = p.map(boostedAmp, 0, 1, 1, 16)
        this.alphaDecay = 5
        this.maxLifeFrames = Math.floor(
          (30 + boostedAmp * 15) * lifespanVariation
        )
        this.colorHue = (primaryHue + 210 + p.random(-8, 8) + 360) % 360
        this.colorSaturation = p.random(55, 100)
        this.colorBrightness = p.random(55, 100)
        this.noiseStrength *= 3.0
        break
      default:
        this.speed = p.map(boostedAmp, 0, 1, 0, 25)
        this.size = p.map(boostedAmp, 0, 1, 4, 25)
        this.alphaDecay = 3
        this.colorHue = (primaryHue + p.random(-20, 20) + 360) % 360
        this.colorSaturation = p.random(50, 100)
        this.colorBrightness = p.random(60, 100)
    }
  }

  update(p, audioData, frequencyBands) {
    const p5 = p || this.p

    // Individual noise-based movement
    const noiseX = p5.noise(this.noiseOffsetX) * 2 - 1
    const noiseY = p5.noise(this.noiseOffsetY) * 2 - 1

    // Add smooth noise movement
    const noiseForce = p5
      .createVector(noiseX, noiseY)
      .mult(this.noiseStrength * 0.05)
    this.vel.add(noiseForce)

    // Individual oscillation
    const oscillationX =
      p5.sin(p5.frameCount * this.oscillationSpeed + this.individualSeed) *
      this.oscillationAmplitude *
      0.005
    const oscillationY =
      p5.cos(p5.frameCount * this.oscillationSpeed + this.individualSeed) *
      this.oscillationAmplitude *
      0.005
    this.vel.add(oscillationX, oscillationY)

    // Update position
    this.pos.add(this.vel)
    this.lifeFrames++

    // Update alpha based on life progress
    const lifeProgress = this.lifeFrames / this.maxLifeFrames
    this.alpha = 100 * (1 - lifeProgress)

    // Update noise offsets
    this.noiseOffsetX += this.noiseScale
    this.noiseOffsetY += this.noiseScale

    // Apply frequency band-specific movement patterns
    this.applyFrequencyBandMovement(p5)

    // Limit velocity based on audio reactivity
    this.vel.limit(1.0 + this.audioReactivity * 2.0)
  }

  applyFrequencyBandMovement(p) {
    const p5 = p || this.p

    switch (this.frequencyBand) {
      case 0: // Sub-bass - strong gravitational pull to center
        const center = p5.createVector(p5.width / 2, p5.height / 2)
        const toCenter = p5.createVector(
          center.x - this.pos.x,
          center.y - this.pos.y
        )
        toCenter.normalize()
        toCenter.mult(0.6 * this.audioReactivity)
        this.vel.add(toCenter)
        break
      case 1: // Bass - spiral movement
        this.vel.rotate(this.rotationSpeed * this.audioReactivity)
        break
      case 2: // Low Mid - bouncing off edges with audio-reactive bounciness
        if (this.pos.x < 0 || this.pos.x > p5.width)
          this.vel.x *= -(0.6 + this.audioReactivity * 0.4)
        if (this.pos.y < 0 || this.pos.y > p5.height)
          this.vel.y *= -(0.6 + this.audioReactivity * 0.4)
        break
      case 3: // Mid - wavey movement
        this.vel.x +=
          p5.sin(p5.frameCount * 0.15 + this.individualSeed) *
          0.1 *
          this.audioReactivity
        this.vel.y +=
          p5.cos(p5.frameCount * 0.15 + this.individualSeed) *
          0.1 *
          this.audioReactivity
        break
      case 4: // High Mid - expanding/contracting movement
        const expansionForce = p5.createVector(
          this.pos.x - p5.width / 2,
          this.pos.y - p5.height / 2
        )
        expansionForce.normalize()
        expansionForce.mult(0.2 * this.audioReactivity)
        this.vel.add(expansionForce)
        break
      case 5: // Presence - chaotic movement
        this.vel.add(
          p5
            .createVector(p5.random(-0.2, 0.2), p5.random(-0.2, 0.2))
            .mult(this.audioReactivity)
        )
        break
      case 6: // Brilliance - rapid oscillation
        this.vel.x +=
          p5.sin(p5.frameCount * 0.3 + this.individualSeed) *
          0.15 *
          this.audioReactivity
        this.vel.y +=
          p5.sin(p5.frameCount * 0.3 + this.individualSeed) *
          0.15 *
          this.audioReactivity
        break
      case 7: // Air - random direction changes
        if (p5.random() < 0.1 * this.audioReactivity) {
          this.vel.rotate(p5.random(-p5.PI / 4, p5.PI / 4))
        }
        break
    }
  }

  draw() {
    const p = this.p
    p.noStroke()

    // Dynamic color shifting
    this.colorHue +=
      this.colorShiftSpeed *
      0.2 *
      this.colorShiftDirection *
      this.audioReactivity
    if (this.colorHue > 360) this.colorHue -= 360
    if (this.colorHue < 0) this.colorHue += 360

    // Create color with current properties
    p.colorMode(p.HSB, 360, 100, 100, 1)
    const currentColor = p.color(
      this.colorHue,
      this.colorSaturation,
      this.colorBrightness,
      this.alpha / 255
    )

    // Size pulsing based on frequency band and audio reactivity
    let pulseSize = this.size
    const pulseIntensity = this.audioReactivity * 0.5

    if (this.frequencyBand === 0) {
      // Sub-bass pulses more dramatically
      pulseSize *= 1 + p.sin(p.frameCount * 0.3) * pulseIntensity
    } else if (this.frequencyBand === 1) {
      // Bass pulses
      pulseSize *= 1 + p.sin(p.frameCount * 0.25) * pulseIntensity
    } else if (this.frequencyBand >= 6) {
      // High frequencies vibrate rapidly
      pulseSize *= 1 + p.sin(p.frameCount * 0.8) * pulseIntensity
    } else {
      // Mid frequencies have moderate pulsing
      pulseSize *= 1 + p.sin(p.frameCount * 0.15) * pulseIntensity
    }

    p.fill(currentColor)
    p.ellipse(this.pos.x, this.pos.y, pulseSize)

    // Reset color mode
    p.colorMode(p.RGB, 255, 255, 255, 255)
  }

  isDead() {
    return this.lifeFrames <= 0
  }
}

/**
 * Calculate particle count based on frequency band and audio intensity
 * @param {number} band - Frequency band index (0-7)
 * @param {number} exponentialAmp - Exponential amplitude value
 * @param {number} canvasScale - Canvas size scaling factor
 * @returns {number} Number of particles to spawn
 */
export const calculateParticleCount = (band, exponentialAmp, canvasScale) => {
  let baseParticles
  switch (band) {
    case 0:
      baseParticles = 8
      break // Sub-bass - more dramatic
    case 1:
      baseParticles = 12
      break // Bass - most dramatic
    case 2:
      baseParticles = 10
      break // Low Mid
    case 3:
      baseParticles = 15
      break // Mid - very responsive
    case 4:
      baseParticles = 12
      break // High Mid
    case 5:
      baseParticles = 10
      break // Presence
    case 6:
      baseParticles = 8
      break // Brilliance
    case 7:
      baseParticles = 6
      break // Air
    default:
      baseParticles = 10
  }

  // Much more dramatic response to audio
  const audioMultiplier = exponentialAmp > 0.05 ? 8 : 1 // 8x boost when audio detected
  const dramaticResponse = Math.pow(exponentialAmp, 0.15) // Much more sensitive curve

  return Math.max(
    1,
    Math.floor(baseParticles * canvasScale * dramaticResponse * audioMultiplier)
  )
}

/**
 * Calculate staggered spawn timing for particles
 * @param {number} band - Frequency band index (0-7)
 * @param {number} frameCount - Current frame count
 * @param {number} totalParticles - Total particles to spawn
 * @returns {Object} Spawn timing information
 */
export const calculateStaggeredSpawn = (band, frameCount, totalParticles) => {
  // Different spawn intervals for different frequency bands
  const spawnIntervals = [8, 6, 7, 5, 6, 7, 8, 9] // Frames between spawns for each band
  const interval = spawnIntervals[band] || 7

  // Offset each band to prevent all spawning at once
  const bandOffset = band * 3
  const adjustedFrame = frameCount + bandOffset

  // Check if it's time to spawn
  const shouldSpawn = adjustedFrame % interval === 0

  // Calculate which particle in the sequence to spawn
  const spawnIndex = Math.floor(adjustedFrame / interval) % totalParticles

  return {
    shouldSpawn,
    spawnIndex,
    interval,
  }
}

/**
 * Calculate maximum total particles based on canvas size
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} pixelsPerParticle - Pixels per particle ratio
 * @returns {number} Maximum total particles
 */
export const calculateMaxParticles = (
  canvasWidth,
  canvasHeight,
  pixelsPerParticle = 3000
) => {
  const canvasArea = canvasWidth * canvasHeight
  return Math.floor(canvasArea / pixelsPerParticle)
}

/**
 * Calculate canvas scaling factor for particle counts
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} baseSize - Base size for scaling (default: 400)
 * @returns {number} Canvas scaling factor
 */
export const calculateCanvasScale = (
  canvasWidth,
  canvasHeight,
  baseSize = 400
) => {
  const canvasArea = canvasWidth * canvasHeight
  return Math.sqrt(canvasArea) / baseSize
}
