/**
 * Particle System Utilities
 * Reusable particle system for audio-reactive visualizations
 */

/**
 * Audio-reactive particle class
 */
export class Particle {
  // Helper function to map all colors to blue-to-red spectrum (eliminates green entirely)
  static avoidGreenHue(hue) {
    // Map the full 360° spectrum to blue-to-red (240° to 0°/360°)
    // This creates a continuous blue -> purple -> red -> orange -> yellow -> blue gradient

    if (hue >= 0 && hue < 60) {
      // Red to orange (0-59°) - keep as is
      return hue
    } else if (hue >= 60 && hue < 120) {
      // Orange to yellow (60-119°) - map to red-orange range
      return 0 + ((hue - 60) / 59) * 30 // Map 60-119 to 0-30
    } else if (hue >= 120 && hue < 180) {
      // Green to cyan (120-179°) - map to blue range
      return 240 - ((hue - 120) / 59) * 40 // Map 120-179 to 240-200
    } else if (hue >= 180 && hue < 240) {
      // Cyan to blue (180-239°) - keep in blue range
      return hue
    } else if (hue >= 240 && hue < 300) {
      // Blue to magenta (240-299°) - keep as is
      return hue
    } else if (hue >= 300 && hue < 360) {
      // Magenta to red (300-359°) - map to red range
      return 0 + ((hue - 300) / 59) * 30 // Map 300-359 to 0-30
    }

    return hue
  }

  // Helper function to adjust saturation and brightness for blue-to-red spectrum
  static adjustGreenishColors(hue, saturation, brightness) {
    // Since we're eliminating green entirely, we can be more generous with saturation and brightness
    // Just ensure colors aren't too intense
    return {
      saturation: Math.max(50, Math.min(100, saturation * 0.9)), // Slight reduction, min 50
      brightness: Math.max(60, Math.min(100, brightness * 0.9)), // Slight reduction, min 60
    }
  }

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
    this.colorHue = Particle.avoidGreenHue(
      (primaryHue + hueVariation + 360) % 360
    )
    const baseSaturationInit = p.random(60, 100)
    const baseBrightnessInit = p.random(70, 100)
    const adjustedColorsInit = Particle.adjustGreenishColors(
      this.colorHue,
      baseSaturationInit,
      baseBrightnessInit
    )
    this.colorSaturation = adjustedColorsInit.saturation
    this.colorBrightness = adjustedColorsInit.brightness
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
        this.colorHue = Particle.avoidGreenHue(
          (primaryHue + p.random(-10, 10) + 360) % 360
        )
        const baseSaturation = p.random(90, 100)
        const baseBrightness = p.random(90, 100)
        const adjustedColors = Particle.adjustGreenishColors(
          this.colorHue,
          baseSaturation,
          baseBrightness
        )
        this.colorSaturation = adjustedColors.saturation
        this.colorBrightness = adjustedColors.brightness
        this.noiseStrength *= 0.3
        break
      case 1: // Bass (60-250 Hz) - most dramatic
        this.speed = p.map(boostedAmp, 0, 1, 0, 25)
        this.size = p.map(boostedAmp, 0, 1, 6, 32)
        this.alphaDecay = 2
        this.maxLifeFrames = Math.floor(
          (150 + boostedAmp * 100) * lifespanVariation
        )
        this.colorHue = Particle.avoidGreenHue(
          (primaryHue + 30 + p.random(-8, 8) + 360) % 360
        )
        const baseSaturation1 = p.random(85, 100)
        const baseBrightness1 = p.random(85, 100)
        const adjustedColors1 = Particle.adjustGreenishColors(
          this.colorHue,
          baseSaturation1,
          baseBrightness1
        )
        this.colorSaturation = adjustedColors1.saturation
        this.colorBrightness = adjustedColors1.brightness
        this.noiseStrength *= 0.6
        break
      case 2: // Low Mid (250-500 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 28)
        this.size = p.map(boostedAmp, 0, 1, 5, 28)
        this.alphaDecay = 2.5
        this.maxLifeFrames = Math.floor(
          (120 + boostedAmp * 80) * lifespanVariation
        )
        this.colorHue = Particle.avoidGreenHue(
          (primaryHue + 60 + p.random(-8, 8) + 360) % 360
        )
        const baseSaturation2 = p.random(80, 100)
        const baseBrightness2 = p.random(80, 100)
        const adjustedColors2 = Particle.adjustGreenishColors(
          this.colorHue,
          baseSaturation2,
          baseBrightness2
        )
        this.colorSaturation = adjustedColors2.saturation
        this.colorBrightness = adjustedColors2.brightness
        this.noiseStrength *= 1.0
        break
      case 3: // Mid (500-2000 Hz) - very responsive
        this.speed = p.map(boostedAmp, 0, 1, 0, 30)
        this.size = p.map(boostedAmp, 0, 1, 4, 25)
        this.alphaDecay = 3
        this.maxLifeFrames = Math.floor(
          (100 + boostedAmp * 60) * lifespanVariation
        )
        this.colorHue = Particle.avoidGreenHue(
          (primaryHue + 90 + p.random(-8, 8) + 360) % 360
        )
        const baseSaturation3 = p.random(75, 100)
        const baseBrightness3 = p.random(75, 100)
        const adjustedColors3 = Particle.adjustGreenishColors(
          this.colorHue,
          baseSaturation3,
          baseBrightness3
        )
        this.colorSaturation = adjustedColors3.saturation
        this.colorBrightness = adjustedColors3.brightness
        this.noiseStrength *= 1.4
        break
      case 4: // High Mid (2000-4000 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 32)
        this.size = p.map(boostedAmp, 0, 1, 3, 22)
        this.alphaDecay = 3.5
        this.maxLifeFrames = Math.floor(
          (80 + boostedAmp * 40) * lifespanVariation
        )
        this.colorHue = Particle.avoidGreenHue(
          (primaryHue + 140 + p.random(-8, 8) + 360) % 360
        )
        const baseSaturation4 = p.random(70, 100)
        const baseBrightness4 = p.random(70, 100)
        const adjustedColors4 = Particle.adjustGreenishColors(
          this.colorHue,
          baseSaturation4,
          baseBrightness4
        )
        this.colorSaturation = adjustedColors4.saturation
        this.colorBrightness = adjustedColors4.brightness
        this.noiseStrength *= 1.8
        break
      case 5: // Presence (4000-6000 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 35)
        this.size = p.map(boostedAmp, 0, 1, 2, 20)
        this.alphaDecay = 4
        this.maxLifeFrames = Math.floor(
          (60 + boostedAmp * 30) * lifespanVariation
        )
        this.colorHue = Particle.avoidGreenHue(
          (primaryHue + 150 + p.random(-8, 8) + 360) % 360
        )
        const baseSaturation5 = p.random(65, 100)
        const baseBrightness5 = p.random(65, 100)
        const adjustedColors5 = Particle.adjustGreenishColors(
          this.colorHue,
          baseSaturation5,
          baseBrightness5
        )
        this.colorSaturation = adjustedColors5.saturation
        this.colorBrightness = adjustedColors5.brightness
        this.noiseStrength *= 2.2
        break
      case 6: // Brilliance (6000-8000 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 38)
        this.size = p.map(boostedAmp, 0, 1, 2, 18)
        this.alphaDecay = 4.5
        this.maxLifeFrames = Math.floor(
          (40 + boostedAmp * 20) * lifespanVariation
        )
        this.colorHue = Particle.avoidGreenHue(
          (primaryHue + 180 + p.random(-8, 8) + 360) % 360
        )
        const baseSaturation6 = p.random(60, 100)
        const baseBrightness6 = p.random(60, 100)
        const adjustedColors6 = Particle.adjustGreenishColors(
          this.colorHue,
          baseSaturation6,
          baseBrightness6
        )
        this.colorSaturation = adjustedColors6.saturation
        this.colorBrightness = adjustedColors6.brightness
        this.noiseStrength *= 2.6
        break
      case 7: // Air (8000-20000 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 40)
        this.size = p.map(boostedAmp, 0, 1, 1, 16)
        this.alphaDecay = 5
        this.maxLifeFrames = Math.floor(
          (30 + boostedAmp * 15) * lifespanVariation
        )
        this.colorHue = Particle.avoidGreenHue(
          (primaryHue + 210 + p.random(-8, 8) + 360) % 360
        )
        const baseSaturation7 = p.random(55, 100)
        const baseBrightness7 = p.random(55, 100)
        const adjustedColors7 = Particle.adjustGreenishColors(
          this.colorHue,
          baseSaturation7,
          baseBrightness7
        )
        this.colorSaturation = adjustedColors7.saturation
        this.colorBrightness = adjustedColors7.brightness
        this.noiseStrength *= 3.0
        break
      default:
        this.speed = p.map(boostedAmp, 0, 1, 0, 25)
        this.size = p.map(boostedAmp, 0, 1, 4, 25)
        this.alphaDecay = 3
        this.colorHue = Particle.avoidGreenHue(
          (primaryHue + p.random(-20, 20) + 360) % 360
        )
        const baseSaturationDefault = p.random(50, 100)
        const baseBrightnessDefault = p.random(60, 100)
        const adjustedColorsDefault = Particle.adjustGreenishColors(
          this.colorHue,
          baseSaturationDefault,
          baseBrightnessDefault
        )
        this.colorSaturation = adjustedColorsDefault.saturation
        this.colorBrightness = adjustedColorsDefault.brightness
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
      case 0: // Sub-bass - dramatic pulsing/throbbing movement that's very obvious
        // Create a pulsing force that expands and contracts based on audio
        const center = p5.createVector(p5.width / 2, p5.height / 2)
        const toCenter = p5.createVector(
          center.x - this.pos.x,
          center.y - this.pos.y
        )

        // Much more dramatic pulsing effect - very obvious difference between drums/no drums
        const pulseStrength = 2.5 * this.audioReactivity // Increased from 0.4 to 2.5 (6x stronger)
        const pulseDirection =
          p5.sin(p5.frameCount * 0.15 + this.individualSeed) * pulseStrength

        if (pulseDirection > 0) {
          // Expand outward - much more dramatic
          toCenter.normalize()
          toCenter.mult(pulseDirection)
          this.vel.add(toCenter)
        } else {
          // Contract inward - also more dramatic
          toCenter.normalize()
          toCenter.mult(pulseDirection * 0.8) // Increased from 0.3 to 0.8
          this.vel.add(toCenter)
        }
        break
      case 1: // Bass - much more dramatic spiral movement
        this.vel.rotate(this.rotationSpeed * this.audioReactivity * 3.0) // Increased from 1.0 to 3.0
        break
      case 2: // Low Mid - much more dramatic bouncing with audio-reactive bounciness
        if (this.pos.x < 0 || this.pos.x > p5.width)
          this.vel.x *= -(0.8 + this.audioReactivity * 1.2) // Increased from 0.6 + 0.4 to 0.8 + 1.2
        if (this.pos.y < 0 || this.pos.y > p5.height)
          this.vel.y *= -(0.8 + this.audioReactivity * 1.2) // Increased from 0.6 + 0.4 to 0.8 + 1.2
        break
      case 3: // Mid - much more dramatic wavey movement
        this.vel.x +=
          p5.sin(p5.frameCount * 0.2 + this.individualSeed) *
          0.4 * // Increased from 0.1 to 0.4 (4x stronger)
          this.audioReactivity
        this.vel.y +=
          p5.cos(p5.frameCount * 0.2 + this.individualSeed) *
          0.4 * // Increased from 0.1 to 0.4 (4x stronger)
          this.audioReactivity
        break
      case 4: // High Mid - much more dramatic expanding/contracting movement
        const expansionForce = p5.createVector(
          this.pos.x - p5.width / 2,
          this.pos.y - p5.height / 2
        )
        expansionForce.normalize()
        expansionForce.mult(0.8 * this.audioReactivity) // Increased from 0.2 to 0.8 (4x stronger)
        this.vel.add(expansionForce)
        break
      case 5: // Presence - much more dramatic chaotic movement
        this.vel.add(
          p5
            .createVector(p5.random(-0.6, 0.6), p5.random(-0.6, 0.6)) // Increased from 0.2 to 0.6 (3x stronger)
            .mult(this.audioReactivity)
        )
        break
      case 6: // Brilliance - much more dramatic rapid oscillation
        this.vel.x +=
          p5.sin(p5.frameCount * 0.4 + this.individualSeed) *
          0.6 * // Increased from 0.15 to 0.6 (4x stronger)
          this.audioReactivity
        this.vel.y +=
          p5.sin(p5.frameCount * 0.4 + this.individualSeed) *
          0.6 * // Increased from 0.6 (4x stronger)
          this.audioReactivity
        break
      case 7: // Air - much more dramatic random direction changes
        if (p5.random() < 0.3 * this.audioReactivity) {
          // Increased from 0.1 to 0.3 (3x more frequent)
          this.vel.rotate(p5.random(-p5.PI / 2, p5.PI / 2)) // Increased from PI/4 to PI/2 (2x more dramatic)
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

    // Ensure we still avoid green hues after dynamic shifting
    this.colorHue = Particle.avoidGreenHue(this.colorHue)

    // Adjust saturation and brightness to avoid greenish appearance
    const adjustedColors = Particle.adjustGreenishColors(
      this.colorHue,
      this.colorSaturation,
      this.colorBrightness
    )

    // Create color with current properties
    p.colorMode(p.HSB, 360, 100, 100, 1)
    const currentColor = p.color(
      this.colorHue,
      adjustedColors.saturation,
      adjustedColors.brightness,
      this.alpha / 255
    )

    // Much more dramatic size pulsing based on frequency band and audio reactivity
    let pulseSize = this.size
    const pulseIntensity = this.audioReactivity * 2.0 // Increased from 0.5 to 2.0 (4x stronger)

    if (this.frequencyBand === 0) {
      // Sub-bass pulses much more dramatically - very obvious difference
      pulseSize *= 1 + p.sin(p.frameCount * 0.4) * pulseIntensity
    } else if (this.frequencyBand === 1) {
      // Bass pulses more dramatically
      pulseSize *= 1 + p.sin(p.frameCount * 0.3) * pulseIntensity
    } else if (this.frequencyBand >= 6) {
      // High frequencies vibrate much more rapidly
      pulseSize *= 1 + p.sin(p.frameCount * 1.0) * pulseIntensity
    } else {
      // Mid frequencies have much more dramatic pulsing
      pulseSize *= 1 + p.sin(p.frameCount * 0.2) * pulseIntensity
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
  // Shorter spawn intervals for more continuous particle flow
  const spawnIntervals = [3, 2, 3, 2, 3, 2, 3, 2] // Frames between spawns for each band
  const interval = spawnIntervals[band] || 3

  // Offset each band to prevent all spawning at once
  const bandOffset = band * 2
  const adjustedFrame = frameCount + bandOffset

  // Check if it's time to spawn
  const shouldSpawn = adjustedFrame % interval === 0

  // Calculate which particle in the sequence to spawn
  // Use modulo to cycle through particles continuously
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
