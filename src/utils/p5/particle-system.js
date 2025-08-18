/**
 * Particle System Utilities
 * Reusable particle system for audio-reactive visualizations
 */

/**
 * Audio-reactive particle class
 */
export class Particle {
  // Global constants for particle behavior
  static MAX_VELOCITY = 6.0 // Maximum velocity for any particle
  static MAX_SPEED = 8.0 // Maximum speed multiplier for any particle

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

  constructor(p, x, y, amp, frequencyBand, markovSeed = 0, visualStyle = null) {
    this.p = p
    this.pos = p.createVector(x, y)
    this.vel = p.createVector(0, 0)
    this.acc = p.createVector(0, 0)
    this.frequencyBand = frequencyBand // 0-7: different frequency ranges
    this.lifeFrames = 0
    this.visualStyle = visualStyle // Store visual style for use throughout the particle's lifecycle
    this.markovSeed = markovSeed // Store markov seed for fallback color generation

    // Individual particle properties for unique movement
    this.noiseOffsetX = p.random(1000)
    this.noiseOffsetY = p.random(1000)
    this.noiseScale = p.random(0.005, 0.025) // Reduced from 0.01, 0.05
    this.noiseStrength = p.random(0.5, 2.0)
    this.individualSeed = p.random(10000)
    this.rotationSpeed = p.random(-0.1, 0.1)
    this.oscillationSpeed = p.random(0.01, 0.04) // Reduced from 0.02, 0.08
    this.oscillationAmplitude = p.random(5, 20)

    // Individual color variation properties based on visual style
    if (visualStyle) {
      // Use visual style colors with individual variations
      const hueVariation = p.random(-15, 15) // ±15 degree variation
      this.colorHue = Particle.avoidGreenHue(
        (visualStyle.primaryHue + hueVariation + 360) % 360
      )

      // Use individual saturation and brightness from visual style
      const satVariation = p.random(-10, 10)
      const brightVariation = p.random(-10, 10)
      this.colorSaturation = Math.max(
        50,
        Math.min(100, (visualStyle.primarySaturation || 85) + satVariation)
      )
      this.colorBrightness = Math.max(
        60,
        Math.min(100, (visualStyle.primaryBrightness || 85) + brightVariation)
      )
    } else {
      // Fallback to markov seed colors
      const primaryHue = markovSeed % 360
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
    }

    this.colorShiftSpeed = p.random(0.5, 2.0)
    this.colorShiftDirection = p.random([-1, 1])

    // Much more dramatic amplitude mapping using exponential scaling
    const normalizedAmp = amp / 255
    const exponentialAmp = Math.pow(normalizedAmp, 0.08) // Much more sensitive to low values (increased from 0.15)

    // Configure particle based on frequency band and visual style
    this.configureByFrequencyBand(exponentialAmp, visualStyle)

    this.vel = p
      .createVector(p.cos(p.random(p.TWO_PI)), p.sin(p.random(p.TWO_PI)))
      .mult(this.speed * 0.02) // Reduced from 0.05
    this.alpha = 1
    this.size = this.size * 0.1
    this.originalSize = this.size
    this.lifeFrames = 0
    this.maxLifeFrames = 200 + p.random(50)
    this.audioReactivity = exponentialAmp // Store for dynamic updates
  }

  configureByFrequencyBand(exponentialAmp, visualStyle) {
    const p = this.p

    // Boost the exponential amplitude for more dramatic response
    const boostedAmp = Math.pow(exponentialAmp, 0.2) // More sensitive curve (increased from 0.3)

    // Add random variation to lifespan to prevent synchronized death
    const lifespanVariation = p.random(0.7, 1.3)

    // Apply visual style overrides if available
    const baseSize = visualStyle?.maxParticleSize ?? 25
    const baseSpeed = visualStyle?.movementSpeed ?? 1.0
    const baseOscillation = visualStyle?.oscillationStrength ?? 15

    switch (this.frequencyBand) {
      case 0: // Sub-bass (20-60 Hz) - much more dramatic
        this.speed = p.map(boostedAmp, 0, 1, 0, 8 * baseSpeed) // Reduced from 15
        this.size = p.map(boostedAmp, 0, 1, 8, baseSize * 1.4)
        this.alphaDecay = 1.5
        this.maxLifeFrames = Math.floor(
          (180 + boostedAmp * 120) * lifespanVariation
        )
        // Use visual style colors if available
        if (visualStyle) {
          this.colorHue = Particle.avoidGreenHue(
            (visualStyle.primaryHue + p.random(-10, 10) + 360) % 360
          )
          this.colorSaturation = Math.max(
            50,
            Math.min(
              100,
              (visualStyle.primarySaturation || 90) + p.random(-5, 5)
            )
          )
          this.colorBrightness = Math.max(
            60,
            Math.min(
              100,
              (visualStyle.primaryBrightness || 90) + p.random(-5, 5)
            )
          )
        } else {
          this.colorHue = Particle.avoidGreenHue(
            ((this.markovSeed % 360) + p.random(-10, 10) + 360) % 360
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
        }
        this.noiseStrength *= 0.3
        this.oscillationAmplitude = baseOscillation * 0.8
        break
      case 1: // Bass (60-250 Hz) - most dramatic
        this.speed = p.map(boostedAmp, 0, 1, 0, 12 * baseSpeed) // Reduced from 25
        this.size = p.map(boostedAmp, 0, 1, 6, baseSize * 1.3)
        this.alphaDecay = 2
        this.maxLifeFrames = Math.floor(
          (150 + boostedAmp * 100) * lifespanVariation
        )
        if (visualStyle) {
          this.colorHue = Particle.avoidGreenHue(
            (visualStyle.secondaryHue + p.random(-8, 8) + 360) % 360
          )
          this.colorSaturation = Math.max(
            50,
            Math.min(
              100,
              (visualStyle.secondarySaturation || 85) + p.random(-5, 5)
            )
          )
          this.colorBrightness = Math.max(
            60,
            Math.min(
              100,
              (visualStyle.secondaryBrightness || 85) + p.random(-5, 5)
            )
          )
        } else {
          this.colorHue = Particle.avoidGreenHue(
            ((this.markovSeed % 360) + 30 + p.random(-8, 8) + 360) % 360
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
        }
        this.noiseStrength *= 0.6
        this.oscillationAmplitude = baseOscillation * 1.0
        break
      case 2: // Low Mid (250-500 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 14 * baseSpeed) // Reduced from 28
        this.size = p.map(boostedAmp, 0, 1, 5, baseSize * 1.1)
        this.alphaDecay = 2.5
        this.maxLifeFrames = Math.floor(
          (120 + boostedAmp * 80) * lifespanVariation
        )
        if (visualStyle) {
          this.colorHue = Particle.avoidGreenHue(
            (visualStyle.accentHue + p.random(-8, 8) + 360) % 360
          )
          this.colorSaturation = Math.max(
            50,
            Math.min(
              100,
              (visualStyle.accentSaturation || 80) + p.random(-5, 5)
            )
          )
          this.colorBrightness = Math.max(
            60,
            Math.min(
              100,
              (visualStyle.accentBrightness || 80) + p.random(-5, 5)
            )
          )
        } else {
          this.colorHue = Particle.avoidGreenHue(
            ((this.markovSeed % 360) + 60 + p.random(-8, 8) + 360) % 360
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
        }
        this.noiseStrength *= 1.0
        this.oscillationAmplitude = baseOscillation * 1.2
        break
      case 3: // Mid (500-2000 Hz) - very responsive
        this.speed = p.map(boostedAmp, 0, 1, 0, 15 * baseSpeed) // Reduced from 30
        this.size = p.map(boostedAmp, 0, 1, 4, baseSize * 1.0)
        this.alphaDecay = 3
        this.maxLifeFrames = Math.floor(
          (100 + boostedAmp * 60) * lifespanVariation
        )
        if (visualStyle) {
          this.colorHue = Particle.avoidGreenHue(
            (visualStyle.tertiaryHue + p.random(-8, 8) + 360) % 360
          )
          this.colorSaturation = Math.max(
            50,
            Math.min(
              100,
              (visualStyle.tertiarySaturation || 75) + p.random(-5, 5)
            )
          )
          this.colorBrightness = Math.max(
            60,
            Math.min(
              100,
              (visualStyle.tertiaryBrightness || 75) + p.random(-5, 5)
            )
          )
        } else {
          this.colorHue = Particle.avoidGreenHue(
            ((this.markovSeed % 360) + 90 + p.random(-8, 8) + 360) % 360
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
        }
        this.noiseStrength *= 1.4
        this.oscillationAmplitude = baseOscillation * 1.4
        break
      case 4: // High Mid (2000-4000 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 16 * baseSpeed) // Reduced from 32
        this.size = p.map(boostedAmp, 0, 1, 3, baseSize * 0.9)
        this.alphaDecay = 3.5
        this.maxLifeFrames = Math.floor(
          (80 + boostedAmp * 40) * lifespanVariation
        )
        if (visualStyle) {
          this.colorHue = Particle.avoidGreenHue(
            (visualStyle.primaryHue + 140 + p.random(-8, 8) + 360) % 360
          )
          this.colorSaturation = Math.max(
            50,
            Math.min(
              100,
              (visualStyle.primarySaturation || 70) + p.random(-5, 5)
            )
          )
          this.colorBrightness = Math.max(
            60,
            Math.min(
              100,
              (visualStyle.primaryBrightness || 70) + p.random(-5, 5)
            )
          )
        } else {
          this.colorHue = Particle.avoidGreenHue(
            ((this.markovSeed % 360) + 140 + p.random(-8, 8) + 360) % 360
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
        }
        this.noiseStrength *= 1.8
        this.oscillationAmplitude = baseOscillation * 1.6
        break
      case 5: // Presence (4000-6000 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 18 * baseSpeed) // Reduced from 35
        this.size = p.map(boostedAmp, 0, 1, 2, baseSize * 0.8)
        this.alphaDecay = 4
        this.maxLifeFrames = Math.floor(
          (60 + boostedAmp * 30) * lifespanVariation
        )
        if (visualStyle) {
          this.colorHue = Particle.avoidGreenHue(
            (visualStyle.secondaryHue + 150 + p.random(-8, 8) + 360) % 360
          )
          this.colorSaturation = Math.max(
            50,
            Math.min(
              100,
              (visualStyle.secondarySaturation || 65) + p.random(-5, 5)
            )
          )
          this.colorBrightness = Math.max(
            60,
            Math.min(
              100,
              (visualStyle.secondaryBrightness || 65) + p.random(-5, 5)
            )
          )
        } else {
          this.colorHue = Particle.avoidGreenHue(
            ((this.markovSeed % 360) + 150 + p.random(-8, 8) + 360) % 360
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
        }
        this.noiseStrength *= 2.2
        this.oscillationAmplitude = baseOscillation * 1.8
        break
      case 6: // Brilliance (6000-8000 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 19 * baseSpeed) // Reduced from 38
        this.size = p.map(boostedAmp, 0, 1, 2, baseSize * 0.7)
        this.alphaDecay = 4.5
        this.maxLifeFrames = Math.floor(
          (40 + boostedAmp * 20) * lifespanVariation
        )
        if (visualStyle) {
          this.colorHue = Particle.avoidGreenHue(
            (visualStyle.accentHue + 180 + p.random(-8, 8) + 360) % 360
          )
          this.colorSaturation = Math.max(
            50,
            Math.min(
              100,
              (visualStyle.accentSaturation || 60) + p.random(-5, 5)
            )
          )
          this.colorBrightness = Math.max(
            60,
            Math.min(
              100,
              (visualStyle.accentBrightness || 60) + p.random(-5, 5)
            )
          )
        } else {
          this.colorHue = Particle.avoidGreenHue(
            ((this.markovSeed % 360) + 180 + p.random(-8, 8) + 360) % 360
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
        }
        this.noiseStrength *= 2.6
        this.oscillationAmplitude = baseOscillation * 2.0
        break
      case 7: // Air (8000-20000 Hz)
        this.speed = p.map(boostedAmp, 0, 1, 0, 20 * baseSpeed) // Reduced from 40
        this.size = p.map(boostedAmp, 0, 1, 1, baseSize * 0.6)
        this.alphaDecay = 5
        this.maxLifeFrames = Math.floor(
          (30 + boostedAmp * 15) * lifespanVariation
        )
        if (visualStyle) {
          this.colorHue = Particle.avoidGreenHue(
            (visualStyle.tertiaryHue + 210 + p.random(-8, 8) + 360) % 360
          )
          this.colorSaturation = Math.max(
            50,
            Math.min(
              100,
              (visualStyle.tertiarySaturation || 55) + p.random(-5, 5)
            )
          )
          this.colorBrightness = Math.max(
            60,
            Math.min(
              100,
              (visualStyle.tertiaryBrightness || 55) + p.random(-5, 5)
            )
          )
        } else {
          this.colorHue = Particle.avoidGreenHue(
            ((this.markovSeed % 360) + 210 + p.random(-8, 8) + 360) % 360
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
        }
        this.noiseStrength *= 3.0
        this.oscillationAmplitude = baseOscillation * 2.2
        break
      default:
        this.speed = p.map(boostedAmp, 0, 1, 0, 12 * baseSpeed) // Reduced from 25
        this.size = p.map(boostedAmp, 0, 1, 4, baseSize * 1.0)
        this.alphaDecay = 3
        if (visualStyle) {
          this.colorHue = Particle.avoidGreenHue(
            (visualStyle.primaryHue + p.random(-20, 20) + 360) % 360
          )
          this.colorSaturation = Math.max(
            50,
            Math.min(
              100,
              (visualStyle.primarySaturation || 75) + p.random(-5, 5)
            )
          )
          this.colorBrightness = Math.max(
            60,
            Math.min(
              100,
              (visualStyle.primaryBrightness || 75) + p.random(-5, 5)
            )
          )
        } else {
          this.colorHue = Particle.avoidGreenHue(
            ((this.markovSeed % 360) + p.random(-20, 20) + 360) % 360
          )
          const baseSaturationDefault = p.random(75, 100)
          const baseBrightnessDefault = p.random(75, 100)
          const adjustedColorsDefault = Particle.adjustGreenishColors(
            this.colorHue,
            baseSaturationDefault,
            baseBrightnessDefault
          )
          this.colorSaturation = adjustedColorsDefault.saturation
          this.colorBrightness = adjustedColorsDefault.brightness
        }
        this.oscillationAmplitude = baseOscillation * 1.0
    }
  }

  update(p, audioData, frequencyBands) {
    const p5 = p || this.p

    // Update particle with real-time frequency data if available
    if (frequencyBands && frequencyBands[this.frequencyBand]) {
      const currentBand = frequencyBands[this.frequencyBand]
      const currentAmp = currentBand.amp / 255

      // Much more sensitive amplitude mapping - exponential curve for dramatic response
      const exponentialAmp = Math.pow(currentAmp, 0.1) // More sensitive than 0.15

      // Update audio reactivity in real-time
      this.audioReactivity = exponentialAmp

      // Real-time size adjustment based on current frequency amplitude
      const baseSize = this.visualStyle?.maxParticleSize ?? 25
      const sizeMultiplier = 0.2 + exponentialAmp * 3.0 // Scale from 0.2x to 3.2x (more dramatic)
      this.size = this.originalSize * sizeMultiplier

      // Real-time speed adjustment based on current frequency amplitude
      const baseSpeed = this.visualStyle?.movementSpeed ?? 1.0
      const speedMultiplier = 0.1 + exponentialAmp * 4.0 // Scale from 0.1x to 4.1x (more dramatic)
      this.speed = this.speed * speedMultiplier

      // Ensure speed doesn't exceed maximum reasonable limit
      const maxSpeed = Particle.MAX_SPEED // Maximum reasonable speed limit
      this.speed = Math.min(this.speed, maxSpeed)
    }

    // Apply visual style movement modifiers
    const movementMultiplier = this.visualStyle?.movementSpeed ?? 1.0
    const oscillationMultiplier = this.visualStyle?.oscillationStrength ?? 15

    // Individual noise-based movement
    const noiseX = p5.noise(this.noiseOffsetX) * 2 - 1
    const noiseY = p5.noise(this.noiseOffsetY) * 2 - 1

    // Add smooth noise movement with visual style modifier
    const noiseForce = p5
      .createVector(noiseX, noiseY)
      .mult(this.noiseStrength * 0.02 * movementMultiplier) // Reduced from 0.05
    this.vel.add(noiseForce)

    // Individual oscillation with visual style modifier - reduced for more natural movement
    const oscillationX =
      p5.sin(p5.frameCount * this.oscillationSpeed + this.individualSeed) *
      this.oscillationAmplitude *
      0.0005 * // Reduced from 0.002 for much more subtle oscillation
      (oscillationMultiplier / 15) // Normalize to base oscillation strength
    const oscillationY =
      p5.cos(p5.frameCount * this.oscillationSpeed + this.individualSeed) *
      this.oscillationAmplitude *
      0.0005 * // Reduced from 0.002 for much more subtle oscillation
      (oscillationMultiplier / 15) // Normalize to base oscillation strength
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

    // Check if particle is already too far from spawn before applying movement
    const currentDistance = Math.sqrt(
      Math.pow(this.pos.x - this.spawnX, 2) +
        Math.pow(this.pos.y - this.spawnY, 2)
    )

    // If already too far, reduce movement forces - much more aggressive for sub-bass
    let distanceMultiplier
    if (this.frequencyBand === 0) {
      // Sub-bass - extremely aggressive force reduction
      distanceMultiplier =
        currentDistance > 30 ? 0.1 : currentDistance > 20 ? 0.3 : 1.0
    } else {
      // Other frequencies - standard force reduction
      distanceMultiplier = currentDistance > 60 ? 0.3 : 1.0
    }

    // Make distance multiplier more responsive to audio - allow more movement when audio is loud
    distanceMultiplier = distanceMultiplier * (0.5 + this.audioReactivity * 0.5) // Audio affects how much movement is allowed

    // Apply frequency band-specific movement patterns
    this.applyFrequencyBandMovement(p5, distanceMultiplier)

    // Limit velocity based on audio reactivity and distance from spawn - much more dramatic variation
    const maxVelocity =
      (0.5 + this.audioReactivity * 4.0) *
      distanceMultiplier *
      0.75 *
      movementMultiplier // Apply visual style movement modifier

    // Apply absolute maximum velocity limit to prevent excessive speed
    const absoluteMaxVelocity = Particle.MAX_VELOCITY // Maximum velocity regardless of audio reactivity
    const finalMaxVelocity = Math.min(maxVelocity, absoluteMaxVelocity)

    this.vel.limit(finalMaxVelocity)

    // Constrain particle position to stay close to spawn position
    this.constrainToSpawnArea(p5)
  }

  applyFrequencyBandMovement(p, distanceMultiplier = 1.0) {
    const p5 = p || this.p

    // Apply visual style movement modifiers
    const movementMultiplier = this.visualStyle?.movementSpeed ?? 1.0
    const rotationMultiplier = this.visualStyle?.rotationSpeed ?? 0.0
    const spawnPattern = this.visualStyle?.spawnPattern ?? 0

    switch (this.frequencyBand) {
      case 0: // Sub-bass - much more controlled pulsing movement
        // Create a pulsing force that expands and contracts based on audio
        const center = p5.createVector(p5.width / 2, p5.height / 2)
        const toCenter = p5.createVector(
          center.x - this.pos.x,
          center.y - this.pos.y
        )

        // Much more subtle pulsing effect - directly tied to audio level
        const pulseStrength = 1.5 * this.audioReactivity * movementMultiplier // Reduced from 3.0 for less dramatic effect
        // Use audio reactivity to control the frequency and intensity of pulsing
        const audioFrequency = 0.1 + this.audioReactivity * 0.2 // Reduced from 0.15 for less dramatic frequency
        const pulseDirection =
          p5.sin(p5.frameCount * audioFrequency + this.individualSeed) *
          pulseStrength *
          (1 + this.audioReactivity * 1.5) // Reduced from 3 for less dramatic effect

        if (pulseDirection > 0) {
          // Expand outward - controlled dramatic effect with audio-reactive variation
          toCenter.normalize()
          const expandForce = pulseDirection * distanceMultiplier * 0.5
          // Add some chaotic variation based on audio level
          const chaoticVariation =
            p5.sin(
              p5.frameCount * (0.3 + this.audioReactivity * 0.6) +
                this.individualSeed * 0.3
            ) *
            this.audioReactivity *
            0.8
          toCenter.mult(expandForce + chaoticVariation)
          this.vel.add(toCenter)
        } else {
          // Contract inward - controlled dramatic effect with audio-reactive variation
          toCenter.normalize()
          const contractForce = pulseDirection * 0.6 * distanceMultiplier * 0.5
          // Add some chaotic variation based on audio level
          const chaoticVariation =
            p5.sin(
              p5.frameCount * (0.25 + this.audioReactivity * 0.4) +
                this.individualSeed * 0.5
            ) *
            this.audioReactivity *
            0.6
          toCenter.mult(contractForce + chaoticVariation)
          this.vel.add(toCenter)
        }

        // Much more responsive velocity limit for sub-bass - varies dramatically with audio
        const subBassMaxVel =
          (0.3 + this.audioReactivity * 1.5) * 0.75 * movementMultiplier
        const absoluteSubBassMax = Particle.MAX_VELOCITY * 0.67 // 67% of global max for sub-bass
        this.vel.limit(Math.min(subBassMaxVel, absoluteSubBassMax))
        break
      case 1: // Bass - much more dramatic spiral movement directly tied to audio
        // Audio affects both rotation speed and adds chaotic variation
        const audioRotationSpeed =
          (this.rotationSpeed + rotationMultiplier) *
          this.audioReactivity *
          7.0 * // Increased from 5.0 for more sensitivity
          movementMultiplier // Apply visual style modifiers
        const chaoticVariation =
          p5.sin(p5.frameCount * (0.25 + this.audioReactivity * 0.7)) * // Increased from 0.2 for more sensitivity
          this.audioReactivity *
          3.0 // Increased from 2.0 for more dramatic effect
        this.vel.rotate(audioRotationSpeed + chaoticVariation)

        // Much more responsive velocity limit for bass - varies dramatically with audio
        const bassMaxVel =
          (0.5 + this.audioReactivity * 2.0) * 0.75 * movementMultiplier
        const absoluteBassMax = Particle.MAX_VELOCITY * 0.83 // 83% of global max for bass
        this.vel.limit(Math.min(bassMaxVel, absoluteBassMax))
        break
      case 2: // Low Mid - much more dramatic bouncing with audio-reactive bounciness
        if (this.pos.x < 0 || this.pos.x > p5.width)
          this.vel.x *= -(0.8 + this.audioReactivity * 2.5) * movementMultiplier // Apply visual style movement modifier
        if (this.pos.y < 0 || this.pos.y > p5.height)
          this.vel.y *= -(0.8 + this.audioReactivity * 2.5) * movementMultiplier // Apply visual style movement modifier
        break
      case 3: // Mid - much more dramatic wavey movement directly tied to audio
        // Audio affects both frequency and amplitude of wavey movement - reduced for more natural movement
        const audioWaveFreq = 0.15 + this.audioReactivity * 0.3 // Reduced from 0.25 for less dramatic frequency
        const audioWaveAmp =
          0.6 * // Reduced from 1.2 for less dramatic amplitude
          this.audioReactivity *
          (1 + this.audioReactivity * 2) * // Reduced from 4 for less dramatic effect
          movementMultiplier // Apply visual style movement modifier

        this.vel.x +=
          p5.sin(p5.frameCount * audioWaveFreq + this.individualSeed) *
          audioWaveAmp
        this.vel.y +=
          p5.cos(p5.frameCount * audioWaveFreq + this.individualSeed) *
          audioWaveAmp

        // Add velocity limit for mid frequencies
        const midMaxVel = Particle.MAX_VELOCITY // 100% of global max for mid
        this.vel.limit(midMaxVel)
        break
      case 4: // High Mid - much more dramatic expanding/contracting movement
        const expansionForce = p5.createVector(
          this.pos.x - p5.width / 2,
          this.pos.y - p5.height / 2
        )
        expansionForce.normalize()
        expansionForce.mult(1.5 * this.audioReactivity * movementMultiplier) // Apply visual style movement modifier
        this.vel.add(expansionForce)

        // Add velocity limit for high mid frequencies
        const highMidMaxVel = Particle.MAX_VELOCITY * 0.92 // 92% of global max for high mid
        this.vel.limit(highMidMaxVel)
        break
      case 5: // Presence - much more dramatic chaotic movement
        this.vel.add(
          p5
            .createVector(p5.random(-1.0, 1.0), p5.random(-1.0, 1.0)) // Increased from 0.6 to 1.0 (much more dramatic)
            .mult(this.audioReactivity * movementMultiplier) // Apply visual style movement modifier
        )

        // Add velocity limit for presence frequencies
        const presenceMaxVel = Particle.MAX_VELOCITY * 0.83 // 83% of global max for presence
        this.vel.limit(presenceMaxVel)
        break
      case 6: // Brilliance - much more dramatic rapid oscillation directly tied to audio
        // Audio affects both oscillation frequency and creates chaotic patterns - reduced for more natural movement
        const audioOscFreq = 0.3 + this.audioReactivity * 0.5 // Reduced from 0.5 for less dramatic frequency
        const audioOscAmp =
          0.8 * // Reduced from 1.5 for less dramatic amplitude
          this.audioReactivity *
          (1 + this.audioReactivity * 2.5) * // Reduced from 5 for less dramatic effect
          movementMultiplier // Apply visual style movement modifier

        // Add chaotic variation based on audio level
        const chaoticX =
          p5.sin(p5.frameCount * audioOscFreq * 2 + this.individualSeed * 0.5) *
          this.audioReactivity *
          0.5
        const chaoticY =
          p5.cos(
            p5.frameCount * audioOscFreq * 1.5 + this.individualSeed * 0.7
          ) *
          this.audioReactivity *
          0.5

        this.vel.x +=
          p5.sin(p5.frameCount * audioOscFreq + this.individualSeed) *
            audioOscAmp +
          chaoticX
        this.vel.y +=
          p5.cos(p5.frameCount * audioOscFreq + this.individualSeed) *
            audioOscAmp +
          chaoticY

        // Add velocity limit for brilliance frequencies
        const brillianceMaxVel = Particle.MAX_VELOCITY * 0.75 // 75% of global max for brilliance
        this.vel.limit(brillianceMaxVel)
        break
      case 7: // Air - much more dramatic random direction changes
        if (p5.random() < 0.5 * this.audioReactivity) {
          // Increased from 0.3 to 0.5 (much more frequent)
          this.vel.rotate(p5.random(-p5.PI, p5.PI) * movementMultiplier) // Apply visual style movement modifier
        }

        // Add velocity limit for air frequencies
        const airMaxVel = Particle.MAX_VELOCITY * 0.67 // 67% of global max for air
        this.vel.limit(airMaxVel)
        break
    }
  }

  constrainToSpawnArea(p) {
    const p5 = p || this.p

    // Calculate distance from spawn position manually (for test compatibility)
    const dx = this.pos.x - this.spawnX
    const dy = this.pos.y - this.spawnY
    const distanceFromSpawn = Math.sqrt(dx * dx + dy * dy)

    // Maximum allowed distance from spawn position - much more restrictive
    // Sub-bass and bass get even tighter constraints due to their strong movement patterns
    let maxDistance
    if (this.frequencyBand === 0) {
      // Sub-bass - extremely tight constraints due to dramatic pulsing
      maxDistance = 25 + this.audioReactivity * 15 // 25px to 40px max
    } else if (this.frequencyBand === 1) {
      // Bass - very tight constraints due to spiral movement
      maxDistance = 30 + this.audioReactivity * 20 // 30px to 50px max
    } else {
      // Other frequencies - standard tight constraints
      maxDistance = 40 + this.audioReactivity * 30 // 40px to 70px max
    }

    if (distanceFromSpawn > maxDistance) {
      // Calculate direction back to spawn position
      const toSpawn = p5.createVector(
        this.spawnX - this.pos.x,
        this.spawnY - this.pos.y
      )
      toSpawn.normalize()

      // Move particle back to allowed area
      const overshoot = distanceFromSpawn - maxDistance
      this.pos.add(toSpawn.mult(overshoot))

      // Reduce velocity in the direction away from spawn
      const awayFromSpawn = p5.createVector(
        this.pos.x - this.spawnX,
        this.pos.y - this.spawnY
      )
      awayFromSpawn.normalize()
      const velocityComponent = this.vel.dot(awayFromSpawn)

      if (velocityComponent > 0) {
        // Much more aggressive velocity reduction in the direction away from spawn
        this.vel.sub(awayFromSpawn.mult(velocityComponent * 0.8)) // Increased from 0.5 to 0.8
      }
    } else if (distanceFromSpawn > maxDistance * 0.7) {
      // Add gentle pull back toward spawn when getting close to boundary
      const toSpawn = p5.createVector(
        this.spawnX - this.pos.x,
        this.spawnY - this.pos.y
      )
      toSpawn.normalize()

      // Stronger pull force for sub-bass and bass due to their strong movement patterns
      let pullStrength
      if (this.frequencyBand === 0) {
        // Sub-bass - much stronger pull due to dramatic pulsing
        pullStrength = 0.3 * (distanceFromSpawn - maxDistance * 0.7)
      } else if (this.frequencyBand === 1) {
        // Bass - stronger pull due to spiral movement
        pullStrength = 0.2 * (distanceFromSpawn - maxDistance * 0.7)
      } else {
        // Other frequencies - standard gentle pull
        pullStrength = 0.1 * (distanceFromSpawn - maxDistance * 0.7)
      }

      toSpawn.mult(pullStrength)
      this.vel.add(toSpawn)
    }
  }

  draw() {
    const p = this.p
    p.noStroke()

    // Apply visual style color modifiers
    const colorShiftSpeed = this.visualStyle?.enablePulse
      ? this.colorShiftSpeed * 1.5
      : this.colorShiftSpeed
    const enableTrails = this.visualStyle?.enableTrails ?? false
    const enableRipple = this.visualStyle?.enableRipple ?? false
    const enableGlow = this.visualStyle?.enableGlow ?? false
    const enableSparkle = this.visualStyle?.enableSparkle ?? false
    const trailLength = this.visualStyle?.trailLength ?? 1
    const glowRadius = this.visualStyle?.glowRadius ?? 1.2
    const sparkleFrequency = this.visualStyle?.sparkleFrequency ?? 0.1

    // Dynamic color shifting with visual style modifier
    this.colorHue +=
      colorShiftSpeed * 0.2 * this.colorShiftDirection * this.audioReactivity
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

    // Much more subtle size pulsing based on frequency band and audio reactivity
    let pulseSize = this.size

    // Use audio reactivity to control the intensity of the pulse
    const audioMultiplier = Math.max(0.1, this.audioReactivity) // Increased minimum for less dramatic contrast

    if (this.frequencyBand === 0) {
      // Sub-bass pulses subtly
      const pulseFactor = 0.8 + 0.2 * p.sin(p.frameCount * 0.3) // Reduced from 0.4-1.0 to 0.8-1.0 range
      const sizeMultiplier = 0.8 + pulseFactor * 0.2 // Scale from 0.8x to 1.0x (much more subtle)
      pulseSize = this.size * sizeMultiplier * (0.7 + audioMultiplier * 0.6) // Less dramatic audio scaling
    } else if (this.frequencyBand === 1) {
      // Bass pulses subtly
      const pulseFactor = 0.8 + 0.2 * p.sin(p.frameCount * 0.25) // Reduced range and frequency
      const sizeMultiplier = 0.8 + pulseFactor * 0.2 // Scale from 0.8x to 1.0x (much more subtle)
      pulseSize = this.size * sizeMultiplier * (0.7 + audioMultiplier * 0.6) // Less dramatic audio scaling
    } else if (this.frequencyBand >= 6) {
      // High frequencies vibrate subtly
      const pulseFactor = 0.8 + 0.2 * p.sin(p.frameCount * 0.6) // Reduced range and frequency
      const sizeMultiplier = 0.8 + pulseFactor * 0.2 // Scale from 0.8x to 1.0x (much more subtle)
      pulseSize = this.size * sizeMultiplier * (0.7 + audioMultiplier * 0.6) // Less dramatic audio scaling
    } else {
      // Mid frequencies have subtle pulsing
      const pulseFactor = 0.8 + 0.2 * p.sin(p.frameCount * 0.2) // Reduced range and frequency
      const sizeMultiplier = 0.8 + pulseFactor * 0.2 // Scale from 0.8x to 1.0x (much more subtle)
      pulseSize = this.size * sizeMultiplier * (0.7 + audioMultiplier * 0.6) // Less dramatic audio scaling
    }

    // Safety check - ensure size never goes below 80% of original size (increased from 40%)
    const absoluteMinSize = this.size * 0.8
    pulseSize = Math.max(pulseSize, absoluteMinSize)

    // Apply visual style effects in order (back to front)

    // 1. Glow effect (drawn first, behind everything)
    if (enableGlow) {
      let glowHue = this.colorHue
      let glowSaturation = this.colorSaturation
      let glowBrightness = this.colorBrightness

      if (this.visualStyle) {
        // Alternate between different visual style colors for glow
        const glowColorIndex = Math.floor(p.random(0, 4))
        switch (glowColorIndex) {
          case 0: // Primary color
            glowHue = this.visualStyle.primaryHue
            glowSaturation = (this.visualStyle.primarySaturation || 85) * 0.8
            glowBrightness = (this.visualStyle.primaryBrightness || 85) * 1.3
            break
          case 1: // Secondary color
            glowHue = this.visualStyle.secondaryHue
            glowSaturation = (this.visualStyle.secondarySaturation || 80) * 0.8
            glowBrightness = (this.visualStyle.secondaryBrightness || 80) * 1.3
            break
          case 2: // Accent color
            glowHue = this.visualStyle.accentHue
            glowSaturation = (this.visualStyle.accentSaturation || 75) * 0.8
            glowBrightness = (this.visualStyle.accentBrightness || 75) * 1.3
            break
          case 3: // Tertiary color
            glowHue = this.visualStyle.tertiaryHue
            glowSaturation = (this.visualStyle.tertiarySaturation || 70) * 0.8
            glowBrightness = (this.visualStyle.tertiaryBrightness || 70) * 1.3
            break
        }
      }

      // Apply blur effect if enabled
      if (this.visualStyle?.enableBlur) {
        p.drawingContext.filter = `blur(${this.visualStyle.blurIntensity || 1}px)`
      }

      // Apply distortion effect if enabled
      if (this.visualStyle?.enableDistortion) {
        const distortionX =
          Math.sin(p.frameCount * 0.1 + this.individualSeed) *
          (this.visualStyle.distortionStrength || 2)
        const distortionY =
          Math.cos(p.frameCount * 0.1 + this.individualSeed) *
          (this.visualStyle.distortionStrength || 2)
        p.push()
        p.translate(distortionX, distortionY)
      }

      // Apply polar distortion if enabled
      if (this.visualStyle?.enablePolarDistortion) {
        const polarRadius = this.visualStyle.polarDistortionRadius || 1.5
        const polarAngle = Math.atan2(
          this.pos.y - p.height / 2,
          this.pos.x - p.width / 2
        )
        const polarDistortion =
          Math.sin(polarAngle * 3 + p.frameCount * 0.05) * polarRadius
        p.push()
        p.translate(
          Math.cos(polarAngle) * polarDistortion,
          Math.sin(polarAngle) * polarDistortion
        )
      }

      // Apply chromatic aberration if enabled
      if (this.visualStyle?.chromaticAberration) {
        // Draw multiple colored versions with slight offsets
        const aberrationOffset = 2
        for (let i = 0; i < 3; i++) {
          const offsetX = (i - 1) * aberrationOffset
          const offsetY = (i - 1) * aberrationOffset
          const aberrationHue = (glowHue + i * 30) % 360
          p.fill(
            aberrationHue,
            glowSaturation,
            glowBrightness,
            (this.alpha / 255) * 0.3
          )
          p.ellipse(
            this.pos.x + offsetX,
            this.pos.y + offsetY,
            pulseSize * glowRadius
          )
        }
      } else {
        // Standard glow without aberration
        p.fill(
          glowHue,
          glowSaturation,
          glowBrightness,
          (this.alpha / 255) * 0.3
        )
        p.ellipse(this.pos.x, this.pos.y, pulseSize * glowRadius)
      }

      // Reset distortion effects
      if (
        this.visualStyle?.enableDistortion ||
        this.visualStyle?.enablePolarDistortion
      ) {
        p.pop()
      }

      // Reset blur effect
      if (this.visualStyle?.enableBlur) {
        p.drawingContext.filter = 'none'
      }
    }

    // 2. Trail effects (drawn next, behind main particle)
    if (enableTrails) {
      for (let i = 1; i <= trailLength; i++) {
        const trailAlpha =
          (this.alpha / 255) * (0.3 / i) * (1 - i / (trailLength + 1))
        const trailSize = pulseSize * (1 + i * 0.2)

        let trailHue = this.colorHue
        let trailSaturation = adjustedColors.saturation
        let trailBrightness = adjustedColors.brightness

        // Use visual style colors for trails if available
        if (this.visualStyle) {
          // Use different colors for different trail layers
          switch (i % 3) {
            case 0: // First trail layer
              trailHue = this.visualStyle.primaryHue
              trailSaturation = this.visualStyle.primarySaturation || 85
              trailBrightness = this.visualStyle.primaryBrightness || 85
              break
            case 1: // Second trail layer
              trailHue = this.visualStyle.secondaryHue
              trailSaturation = this.visualStyle.secondarySaturation || 80
              trailBrightness = this.visualStyle.secondaryBrightness || 80
              break
            case 2: // Third trail layer
              trailHue = this.visualStyle.accentHue
              trailSaturation = this.visualStyle.accentSaturation || 75
              trailBrightness = this.visualStyle.accentBrightness || 75
              break
          }
        }

        p.fill(trailHue, trailSaturation, trailBrightness, trailAlpha)
        p.ellipse(this.pos.x, this.pos.y, trailSize)
      }
    }

    // 3. Ripple effect
    if (enableRipple) {
      const rippleSize = pulseSize * (1 + p.sin(p.frameCount * 0.1) * 0.3)

      let rippleHue = this.colorHue
      let rippleSaturation = adjustedColors.saturation
      let rippleBrightness = adjustedColors.brightness

      // Use visual style colors for ripple if available
      if (this.visualStyle) {
        // Use tertiary color for ripple effect
        rippleHue = this.visualStyle.tertiaryHue
        rippleSaturation = this.visualStyle.tertiarySaturation || 70
        rippleBrightness = this.visualStyle.tertiaryBrightness || 70
      }

      p.fill(
        rippleHue,
        rippleSaturation,
        rippleBrightness,
        (this.alpha / 255) * 0.2
      )
      p.ellipse(this.pos.x, this.pos.y, rippleSize * 1.8)
    }

    // 2. Main particle (drawn on top of glow)
    // Apply motion blur if enabled
    if (this.visualStyle?.motionBlur) {
      const motionBlurLength = 3
      const motionBlurAlpha = this.alpha / 255 / motionBlurLength

      for (let i = 0; i < motionBlurLength; i++) {
        const blurOffset = i * 0.5
        const blurAlpha =
          (motionBlurAlpha * (motionBlurLength - i)) / motionBlurLength

        p.fill(
          this.colorHue,
          adjustedColors.saturation,
          adjustedColors.brightness,
          blurAlpha
        )
        p.ellipse(
          this.pos.x - this.vel.x * blurOffset,
          this.pos.y - this.vel.y * blurOffset,
          pulseSize * (1 - blurOffset * 0.1)
        )
      }
    }

    // Apply depth of field effect if enabled
    if (this.visualStyle?.depthOfField) {
      const centerX = p.width / 2
      const centerY = p.height / 2
      const distanceFromCenter = Math.sqrt(
        Math.pow(this.pos.x - centerX, 2) + Math.pow(this.pos.y - centerY, 2)
      )
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)
      const focusDistance = maxDistance * 0.3 // Focus on center 30% of canvas

      if (Math.abs(distanceFromCenter - focusDistance) > maxDistance * 0.2) {
        // Apply blur to out-of-focus particles
        p.drawingContext.filter = `blur(${(Math.abs(distanceFromCenter - focusDistance) / maxDistance) * 3}px)`
      }
    }

    // Draw main particle
    p.fill(
      this.colorHue,
      adjustedColors.saturation,
      adjustedColors.brightness,
      this.alpha / 255
    )
    p.ellipse(this.pos.x, this.pos.y, pulseSize)

    // Reset depth of field blur
    if (this.visualStyle?.depthOfField) {
      p.drawingContext.filter = 'none'
    }

    // 5. Sparkle effect (drawn last, on top)
    if (enableSparkle && p.random() < sparkleFrequency) {
      const sparkleSize = pulseSize * 0.3
      const sparkleAlpha = (this.alpha / 255) * 0.8

      let sparkleHue = 0 // Default to white
      let sparkleSaturation = 0
      let sparkleBrightness = 100

      // Use visual style colors for sparkle if available
      if (this.visualStyle) {
        // Alternate between different visual style colors for sparkles
        const sparkleColorIndex = Math.floor(p.random(0, 4))
        switch (sparkleColorIndex) {
          case 0: // Primary color
            sparkleHue = this.visualStyle.primaryHue
            sparkleSaturation = this.visualStyle.primarySaturation || 85
            sparkleBrightness = this.visualStyle.primaryBrightness || 85
            break
          case 1: // Secondary color
            sparkleHue = this.visualStyle.secondaryHue
            sparkleSaturation = this.visualStyle.secondarySaturation || 80
            sparkleBrightness = this.visualStyle.secondaryBrightness || 80
            break
          case 2: // Accent color
            sparkleHue = this.visualStyle.accentHue
            sparkleSaturation = this.visualStyle.accentSaturation || 75
            sparkleBrightness = this.visualStyle.accentBrightness || 75
            break
          case 3: // Tertiary color
            sparkleHue = this.visualStyle.tertiaryHue
            sparkleSaturation = this.visualStyle.tertiarySaturation || 70
            sparkleBrightness = this.visualStyle.tertiaryBrightness || 70
            break
        }
      }

      p.fill(sparkleHue, sparkleSaturation, sparkleBrightness, sparkleAlpha)
      p.ellipse(
        this.pos.x + p.random(-pulseSize / 2, pulseSize / 2),
        this.pos.y + p.random(-pulseSize / 2, pulseSize / 2),
        sparkleSize
      )
    }

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
 * @param {Object} visualStyle - Visual style parameters
 * @returns {number} Number of particles to spawn
 */
export const calculateParticleCount = (
  band,
  exponentialAmp,
  canvasScale,
  visualStyle = null
) => {
  // Apply visual style density modifier
  const densityMultiplier = visualStyle?.shapeDensity ?? 1.0

  let baseParticles
  switch (band) {
    case 0:
      baseParticles = 15
      break // Sub-bass - more dramatic, higher base count
    case 1:
      baseParticles = 20
      break // Bass - most dramatic, highest base count
    case 2:
      baseParticles = 18
      break // Low Mid - high base count
    case 3:
      baseParticles = 25
      break // Mid - very responsive, highest base count
    case 4:
      baseParticles = 20
      break // High Mid - high base count
    case 5:
      baseParticles = 15
      break // Presence - moderate base count
    case 6:
      baseParticles = 12
      break // Brilliance - lower base count
    case 7:
      baseParticles = 10
      break // Air - lowest base count
    default:
      baseParticles = 15
  }

  // Much more granular response to audio - particle count directly correlates with loudness
  let audioMultiplier

  if (exponentialAmp < 0.01) {
    // Very quiet - minimal particles
    audioMultiplier = 0.05 // Reduced from 0.1 for more dramatic contrast
  } else if (exponentialAmp < 0.05) {
    // Quiet - few particles
    audioMultiplier = 0.3 // Reduced from 0.5 for more dramatic contrast
  } else if (exponentialAmp < 0.1) {
    // Moderate - normal particles
    audioMultiplier = 1.0
  } else if (exponentialAmp < 0.2) {
    // Loud - many particles
    audioMultiplier = 4.0 // Increased from 3.0 for more dramatic response
  } else if (exponentialAmp < 0.4) {
    // Very loud - lots of particles
    audioMultiplier = 8.0 // Increased from 6.0 for more dramatic response
  } else {
    // Extremely loud - maximum particles
    audioMultiplier = 15.0 // Increased from 10.0 for more dramatic response
  }

  // Much more sensitive curve for dramatic response
  const dramaticResponse = Math.pow(exponentialAmp, 0.08) // Even more sensitive than 0.1

  return Math.max(
    1,
    Math.floor(
      baseParticles *
        canvasScale *
        dramaticResponse *
        audioMultiplier *
        densityMultiplier
    )
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
 * @param {Object} visualStyle - Visual style parameters
 * @returns {number} Maximum total particles
 */
export const calculateMaxParticles = (
  canvasWidth,
  canvasHeight,
  pixelsPerParticle = 3000,
  visualStyle = null
) => {
  const canvasArea = canvasWidth * canvasHeight
  const baseMaxParticles = Math.floor(canvasArea / pixelsPerParticle)

  // Apply visual style particle count modifier
  const particleCountModifier = visualStyle?.particleCount ?? 200
  const normalizedModifier = particleCountModifier / 200 // Normalize to base value

  return Math.floor(baseMaxParticles * normalizedModifier)
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
