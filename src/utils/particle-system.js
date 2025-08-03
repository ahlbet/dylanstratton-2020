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
    this.frequencyBand = frequencyBand // 0-7: different frequency ranges

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
    this.size = this.size * 0.2
    this.originalSize = this.size
    this.lifeFrames = 0
    this.maxLifeFrames = 200 + p.random(50)
    this.audioReactivity = exponentialAmp // Store for dynamic updates
  }

  configureByFrequencyBand(exponentialAmp, primaryHue) {
    const p = this.p

    switch (this.frequencyBand) {
      case 0: // Sub-bass (20-60 Hz)
        this.speed = p.map(exponentialAmp, 0, 1, 0, 8)
        this.size = p.map(exponentialAmp, 0, 1, 5, 25)
        this.alphaDecay = 1.5
        this.colorHue = (primaryHue + p.random(-10, 10) + 360) % 360
        this.colorSaturation = p.random(90, 100)
        this.colorBrightness = p.random(90, 100)
        this.noiseStrength *= 0.3
        break
      case 1: // Bass (60-250 Hz)
        this.speed = p.map(exponentialAmp, 0, 1, 0, 15)
        this.size = p.map(exponentialAmp, 0, 1, 4, 22)
        this.alphaDecay = 2
        this.colorHue = (primaryHue + 30 + p.random(-8, 8) + 360) % 360
        this.colorSaturation = p.random(85, 100)
        this.colorBrightness = p.random(85, 100)
        this.noiseStrength *= 0.6
        break
      case 2: // Low Mid (250-500 Hz)
        this.speed = p.map(exponentialAmp, 0, 1, 0, 18)
        this.size = p.map(exponentialAmp, 0, 1, 3, 18)
        this.alphaDecay = 2.5
        this.colorHue = (primaryHue + 60 + p.random(-8, 8) + 360) % 360
        this.colorSaturation = p.random(80, 100)
        this.colorBrightness = p.random(80, 100)
        this.noiseStrength *= 1.0
        break
      case 3: // Mid (500-2000 Hz)
        this.speed = p.map(exponentialAmp, 0, 1, 0, 20)
        this.size = p.map(exponentialAmp, 0, 1, 2, 15)
        this.alphaDecay = 3
        this.colorHue = (primaryHue + 90 + p.random(-8, 8) + 360) % 360
        this.colorSaturation = p.random(75, 100)
        this.colorBrightness = p.random(75, 100)
        this.noiseStrength *= 1.4
        break
      case 4: // High Mid (2000-4000 Hz)
        this.speed = p.map(exponentialAmp, 0, 1, 0, 22)
        this.size = p.map(exponentialAmp, 0, 1, 1, 12)
        this.alphaDecay = 3.5
        this.colorHue = (primaryHue + 120 + p.random(-8, 8) + 360) % 360
        this.colorSaturation = p.random(70, 100)
        this.colorBrightness = p.random(70, 100)
        this.noiseStrength *= 1.8
        break
      case 5: // Presence (4000-6000 Hz)
        this.speed = p.map(exponentialAmp, 0, 1, 0, 25)
        this.size = p.map(exponentialAmp, 0, 1, 1, 10)
        this.alphaDecay = 4
        this.colorHue = (primaryHue + 150 + p.random(-8, 8) + 360) % 360
        this.colorSaturation = p.random(65, 100)
        this.colorBrightness = p.random(65, 100)
        this.noiseStrength *= 2.2
        break
      case 6: // Brilliance (6000-8000 Hz)
        this.speed = p.map(exponentialAmp, 0, 1, 0, 28)
        this.size = p.map(exponentialAmp, 0, 1, 1, 8)
        this.alphaDecay = 4.5
        this.colorHue = (primaryHue + 180 + p.random(-8, 8) + 360) % 360
        this.colorSaturation = p.random(60, 100)
        this.colorBrightness = p.random(60, 100)
        this.noiseStrength *= 2.6
        break
      case 7: // Air (8000-20000 Hz)
        this.speed = p.map(exponentialAmp, 0, 1, 0, 30)
        this.size = p.map(exponentialAmp, 0, 1, 1, 6)
        this.alphaDecay = 5
        this.colorHue = (primaryHue + 210 + p.random(-8, 8) + 360) % 360
        this.colorSaturation = p.random(55, 100)
        this.colorBrightness = p.random(55, 100)
        this.noiseStrength *= 3.0
        break
      default:
        this.speed = p.map(exponentialAmp, 0, 1, 0, 15)
        this.size = p.map(exponentialAmp, 0, 1, 2, 15)
        this.alphaDecay = 3
        this.colorHue = (primaryHue + p.random(-20, 20) + 360) % 360
        this.colorSaturation = p.random(50, 100)
        this.colorBrightness = p.random(60, 100)
    }
  }

  update() {
    const p = this.p

    // Individual noise-based movement
    const noiseX = p.noise(this.noiseOffsetX) * 2 - 1
    const noiseY = p.noise(this.noiseOffsetY) * 2 - 1

    // Add smooth noise movement
    const noiseForce = p
      .createVector(noiseX, noiseY)
      .mult(this.noiseStrength * 0.05)
    this.vel.add(noiseForce)

    // Individual oscillation
    const oscillationX =
      p.sin(p.frameCount * this.oscillationSpeed + this.individualSeed) *
      this.oscillationAmplitude *
      0.005
    const oscillationY =
      p.cos(p.frameCount * this.oscillationSpeed + this.individualSeed) *
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
    this.applyFrequencyBandMovement()

    // Limit velocity based on audio reactivity
    this.vel.limit(1.0 + this.audioReactivity * 2.0)
  }

  applyFrequencyBandMovement() {
    const p = this.p

    switch (this.frequencyBand) {
      case 0: // Sub-bass - strong gravitational pull to center
        const center = p.createVector(p.width / 2, p.height / 2)
        const toCenter = p.createVector(
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
        if (this.pos.x < 0 || this.pos.x > p.width)
          this.vel.x *= -(0.6 + this.audioReactivity * 0.4)
        if (this.pos.y < 0 || this.pos.y > p.height)
          this.vel.y *= -(0.6 + this.audioReactivity * 0.4)
        break
      case 3: // Mid - wavey movement
        this.vel.x +=
          p.sin(p.frameCount * 0.15 + this.individualSeed) *
          0.1 *
          this.audioReactivity
        this.vel.y +=
          p.cos(p.frameCount * 0.15 + this.individualSeed) *
          0.1 *
          this.audioReactivity
        break
      case 4: // High Mid - expanding/contracting movement
        const expansionForce = p.createVector(
          this.pos.x - p.width / 2,
          this.pos.y - p.height / 2
        )
        expansionForce.normalize()
        expansionForce.mult(0.2 * this.audioReactivity)
        this.vel.add(expansionForce)
        break
      case 5: // Presence - chaotic movement
        this.vel.add(
          p.createVector(p.random(-0.2, 0.2), p.random(-0.2, 0.2)) *
            this.audioReactivity
        )
        break
      case 6: // Brilliance - rapid oscillation
        this.vel.x +=
          p.sin(p.frameCount * 0.3 + this.individualSeed) *
          0.15 *
          this.audioReactivity
        this.vel.y +=
          p.cos(p.frameCount * 0.3 + this.individualSeed) *
          0.15 *
          this.audioReactivity
        break
      case 7: // Air - random direction changes
        if (p.random() < 0.1 * this.audioReactivity) {
          this.vel.rotate(p.random(-p.PI / 4, p.PI / 4))
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
    return this.lifeFrames >= this.maxLifeFrames
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
      baseParticles = 3
      break // Sub-bass
    case 1:
      baseParticles = 4
      break // Bass
    case 2:
      baseParticles = 5
      break // Low Mid
    case 3:
      baseParticles = 6
      break // Mid
    case 4:
      baseParticles = 7
      break // High Mid
    case 5:
      baseParticles = 8
      break // Presence
    case 6:
      baseParticles = 9
      break // Brilliance
    case 7:
      baseParticles = 10
      break // Air
    default:
      baseParticles = 5
  }

  return Math.max(
    1,
    Math.floor(baseParticles * canvasScale * exponentialAmp * 3)
  )
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
