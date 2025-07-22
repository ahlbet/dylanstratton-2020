import React from 'react'
import P5Sketch from '../p5-sketch/p5-sketch'

// Audio-reactive grid sketch
const AudioReactiveGridSketchFunction = (p, markovText = '') => {
  // Global variables
  let particles = []
  let margin = 50
  let spacing = 30
  let radius = 300
  let num = 2000

  // Generate a seed from Markov text to influence sketch behavior
  const generateSeedFromText = (text) => {
    if (!text) return 0

    let seed = 0
    for (let i = 0; i < text.length; i++) {
      seed += text.charCodeAt(i) * (i + 1)
    }
    return seed % 10000
  }

  const markovSeed = generateSeedFromText(markovText)

  // Function to create gravitational points
  const createGravitationalPoints = () => {
    gravitationalPoints = []
    const canvasWidth = p.canvas ? p.canvas.width : 800
    const canvasHeight = p.canvas ? p.canvas.height : 400

    for (let i = 0; i < numGravityPoints; i++) {
      const x = margin + Math.random() * (canvasWidth - 2 * margin)
      const y = margin + Math.random() * (canvasHeight - 2 * margin)
      const strength = 0.5 + Math.random() * 1.5 // Random strength between 0.5 and 2.0
      const seed = (markovSeed + i * 123) % 10000
      const moveSpeed =
        (0.05 + Math.random() * 0.1) * gravityMoveSpeedMultiplier // Movement speed influenced by Markov seed
      const moveDirection = Math.random() * Math.PI * 2 // Random initial direction
      gravitationalPoints.push({
        x,
        y,
        strength,
        seed,
        moveSpeed,
        moveDirection,
      })
    }
  }

  // Function to update gravity points positions
  const updateGravityPoints = () => {
    const canvasWidth = p.canvas ? p.canvas.width : 800
    const canvasHeight = p.canvas ? p.canvas.height : 400

    for (let gravityPoint of gravitationalPoints) {
      // Update direction with slight randomness
      gravityPoint.moveDirection += (Math.random() - 0.5) * 0.1

      // Calculate new position
      const newX =
        gravityPoint.x +
        Math.cos(gravityPoint.moveDirection) * gravityPoint.moveSpeed
      const newY =
        gravityPoint.y +
        Math.sin(gravityPoint.moveDirection) * gravityPoint.moveSpeed

      // Bounce off edges
      if (newX < margin || newX > canvasWidth - margin) {
        gravityPoint.moveDirection = Math.PI - gravityPoint.moveDirection
      }
      if (newY < margin || newY > canvasHeight - margin) {
        gravityPoint.moveDirection = -gravityPoint.moveDirection
      }

      // Update position with bounds checking
      gravityPoint.x = Math.max(margin, Math.min(canvasWidth - margin, newX))
      gravityPoint.y = Math.max(margin, Math.min(canvasHeight - margin, newY))
    }
  }

  // Global sketch parameters influenced by Markov text - moderate impact
  const globalSpeedMultiplier = 0.6 + (markovSeed % 100) / 50 // 0.6 to 2.6 (moderate range)
  const globalColorIntensity = 0.5 + (markovSeed % 100) / 50 // 0.5 to 2.5 (moderate range)
  const globalParticleInteraction = 0.3 + (markovSeed % 150) / 30 // 0.3 to 5.3 (moderate range)
  const globalParticleSize = 0.7 + (markovSeed % 75) / 25 // 0.7 to 3.7 (moderate size variation)
  const globalParticleBirthRate = 0.5 + (markovSeed % 100) / 50 // 0.5 to 2.5 (birth rate variation)
  const globalGravityStrength = 0.8 + (markovSeed % 100) / 50 // 0.8 to 2.8 (gravity strength variation)
  const primaryHue = markovSeed % 360 // Primary hue for this blog post (0-359)
  const globalSwirlStrength = 0.3 + (markovSeed % 100) / 100 // 0.3 to 1.3 (swirl strength variation)
  const globalSwirlDirection = markovSeed % 2 === 0 ? 1 : -1 // Clockwise or counter-clockwise
  const globalSwirlSpeed = 0.5 + (markovSeed % 100) / 100 // 0.5 to 1.5 (swirl change speed)

  // Gravitational points system
  let gravitationalPoints = []
  const numGravityPoints = 2 + Math.floor((markovSeed % 100) / 15) // 2-8 gravity points based on seed
  const gravityMoveSpeedMultiplier = 0.3 + (markovSeed % 100) / 100 // 0.3 to 1.3 movement speed multiplier

  // Audio analysis variables
  let mic
  let fft
  let audioContext
  let audioElement
  let audioSource
  let analyser
  let dataArray
  let bufferLength
  let corsDetected = false

  class Particle {
    constructor(x, y, r, op, startX, startY, seed) {
      this.x = x
      this.y = y
      this.r = r
      this.op = op
      this.startX = startX
      this.startY = startY

      // Use seed to create unique particle characteristics - moderate impact
      this.seed = seed
      this.baseMov = 0.8 + (seed % 150) / 60 // Movement speed varies moderately by seed (slightly reduced)
      this.mov = this.baseMov
      this.slow = 20 + (seed % 200) / 2 // Noise scale varies moderately by seed
      this.fadeRate = 0.2 + (seed % 100) / 100 // Fade rate varies moderately by seed
      this.isFading = true

      // Color personality based on seed - moderate impact
      this.colorOffset = (seed % 360) / 360 // Different starting color (full range)
      this.colorSpeed = 0.3 + (seed % 100) / 40 // Color cycling speed varies moderately
    }

    show(audioData) {
      p.noStroke()

      // Get audio level for this particle with smooth interpolation
      let audioIndexFloat = p.map(this.x, 0, p.width, 0, audioData.length - 1)
      let audioIndex1 = Math.floor(audioIndexFloat)
      let audioIndex2 = Math.min(audioIndex1 + 1, audioData.length - 1)
      let blend = audioIndexFloat - audioIndex1

      let audioLevel1 = audioData[audioIndex1] || 0
      let audioLevel2 = audioData[audioIndex2] || 0
      let audioLevel = audioLevel1 * (1 - blend) + audioLevel2 * blend
      let normalizedLevel = audioLevel / 255

      // Primary hue-based color system - restricted to primary hue variations
      let timeHue = (p.frameCount * this.colorSpeed) % 360
      let audioHue = normalizedLevel * 60 * globalColorIntensity // Very small range for subtle variation
      let hueVariation =
        ((timeHue * 0.2 + audioHue * 0.3 + this.colorOffset * 30) % 60) - 30 // -30 to +30 degrees
      let hue = (primaryHue + hueVariation + 360) % 360

      // HSV to RGB conversion for primary hue with limited variation
      let h = hue / 60
      let c = 200 // Fixed chroma for consistent brightness
      let x = c * (1 - Math.abs((h % 2) - 1))
      let m = 55 // Fixed lightness offset

      let r, g, b
      if (h < 1) {
        r = c
        g = x
        b = 0
      } else if (h < 2) {
        r = x
        g = c
        b = 0
      } else if (h < 3) {
        r = 0
        g = c
        b = x
      } else if (h < 4) {
        r = 0
        g = x
        b = c
      } else if (h < 5) {
        r = x
        g = 0
        b = c
      } else {
        r = c
        g = 0
        b = x
      }

      r = Math.min(255, Math.max(0, r + m))
      g = Math.min(255, Math.max(0, g + m))
      b = Math.min(255, Math.max(0, b + m))

      // Moderate radius variation based on audio and global particle size
      let audioRadius = (this.r + normalizedLevel * 2.5) * globalParticleSize
      p.fill(r, g, b, this.op * 0.5) // Full opacity for visibility on white background
      p.ellipse(this.x, this.y, audioRadius)
    }

    move(i, audioData, allParticles) {
      // Get audio data for this particle's position with smooth interpolation
      let audioIndexFloat = p.map(
        i,
        0,
        particles.length,
        0,
        audioData.length - 1
      )
      let audioIndex1 = Math.floor(audioIndexFloat)
      let audioIndex2 = Math.min(audioIndex1 + 1, audioData.length - 1)
      let blend = audioIndexFloat - audioIndex1

      let audioLevel1 = audioData[audioIndex1] || 0
      let audioLevel2 = audioData[audioIndex2] || 0

      // Give extra weight to low frequencies for bass drum detection
      let lowFreqWeight = 4.0 // 4x more weight for low frequencies
      let highFreqWeight = 1.0 // Normal weight for high frequencies

      let weight1 = audioIndex1 < 16 ? lowFreqWeight : highFreqWeight
      let weight2 = audioIndex2 < 16 ? lowFreqWeight : highFreqWeight

      let audioLevel =
        (audioLevel1 * weight1 * (1 - blend) + audioLevel2 * weight2 * blend) /
        Math.max(weight1, weight2)
      let normalizedLevel = Math.min(1.0, audioLevel / 255) // Clamp to prevent overflow

      // Only move if there's significant audio
      if (normalizedLevel < 0.1) {
        // Reset to start position when no audio
        this.x = this.startX
        this.y = this.startY
        return
      }

      let t = p.frameCount / 100.0
      let wonkV = 10000

      // Calculate gravitational attraction to all gravity points
      let gravityX = 0
      let gravityY = 0
      let totalGravityStrength = 0

      for (let gravityPoint of gravitationalPoints) {
        let distance = p.dist(this.x, this.y, gravityPoint.x, gravityPoint.y)
        let maxDistance = 200 // Maximum distance for gravity effect

        if (distance < maxDistance) {
          // Calculate gravitational force (inverse square law)
          let force =
            (gravityPoint.strength * globalGravityStrength) /
            (distance * distance + 1)

          // Calculate direction to gravity point
          let dirX = (gravityPoint.x - this.x) / distance
          let dirY = (gravityPoint.y - this.y) / distance

          gravityX += dirX * force
          gravityY += dirY * force
          totalGravityStrength += force
        }
      }

      // Calculate influence from nearby particles
      let neighborInfluence = 0
      let neighborCount = 0
      const influenceRadius = 30 * globalParticleInteraction // Distance for particle interaction

      for (let j = 0; j < allParticles.length; j++) {
        if (i === j) continue // Skip self

        let otherParticle = allParticles[j]
        let distance = p.dist(this.x, this.y, otherParticle.x, otherParticle.y)

        if (distance < influenceRadius) {
          // Calculate influence based on distance and other particle's audio level
          let influence = (influenceRadius - distance) / influenceRadius
          let otherAudioIndex = Math.floor(
            p.map(j, 0, allParticles.length, 0, audioData.length - 1)
          )
          let otherAudioLevel = audioData[otherAudioIndex] || 0
          let otherNormalizedLevel = otherAudioLevel / 255

          neighborInfluence += influence * otherNormalizedLevel
          neighborCount++
        }
      }

      // Average neighbor influence
      if (neighborCount > 0) {
        neighborInfluence /= neighborCount
      }

      // Combine local audio with neighbor influence
      let combinedLevel = (normalizedLevel + neighborInfluence) / 2

      // Adjust movement based on combined audio and neighbor influence - moderate impact
      let audioMultiplier = 1 + combinedLevel * 1.25 // 1x to 2.25x movement for moderate effect
      this.mov = this.baseMov * audioMultiplier * globalSpeedMultiplier

      // Apply gravitational force
      if (totalGravityStrength > 0) {
        gravityX /= totalGravityStrength
        gravityY /= totalGravityStrength

        // Add gravitational movement (further reduced strength)
        this.x += gravityX * this.mov * 0.05
        this.y += gravityY * this.mov * 0.05
      }

      // Apply dynamic global swirl force
      let canvasCenterX = p.width / 2
      let canvasCenterY = p.height / 2
      let distanceFromCenter = p.dist(
        this.x,
        this.y,
        canvasCenterX,
        canvasCenterY
      )
      let maxDistance = p.dist(0, 0, canvasCenterX, canvasCenterY)

      // Dynamic swirl direction and strength based on time (simplified)
      let time = p.frameCount * 0.005 * globalSwirlSpeed
      let dynamicDirection = Math.sin(time) > 0 ? 1 : -1
      let dynamicStrength =
        globalSwirlStrength * (0.7 + Math.sin(time * 0.3) * 0.3)

      // Calculate swirl direction (perpendicular to radius)
      let dx = this.x - canvasCenterX
      let dy = this.y - canvasCenterY
      let swirlX = -dy * dynamicDirection // Perpendicular vector
      let swirlY = dx * dynamicDirection

      // Normalize and apply swirl force
      let swirlLength = Math.sqrt(swirlX * swirlX + swirlY * swirlY)
      if (swirlLength > 0) {
        swirlX /= swirlLength
        swirlY /= swirlLength

        // Swirl strength decreases with distance from center
        let swirlIntensity =
          dynamicStrength * (1 - distanceFromCenter / maxDistance)
        this.x += swirlX * this.mov * swirlIntensity * 0.2
        this.y += swirlY * this.mov * swirlIntensity * 0.2
      }

      // Add some noise-based movement for organic feel
      let wonkX = p.map(p.sin(this.startX * i), -1, 1, -wonkV, wonkV)
      let wonkY = p.map(p.cos(this.startY * i), -1, 1, -wonkV, wonkV)

      this.x += p.map(
        p.noise(wonkX / this.slow, t, i),
        0,
        1,
        -this.mov * 0.3,
        this.mov * 0.3
      )
      this.y += p.map(
        p.noise(t, i, wonkY / this.slow),
        0,
        1,
        -this.mov * 0.3,
        this.mov * 0.3
      )
    }

    update() {
      if (
        this.x > p.width - margin ||
        this.y > p.height - margin ||
        this.x < margin ||
        this.y < margin
      ) {
        this.x = this.startX
        this.y = this.startY
      }
    }

    fade(audioData) {
      // Get average audio level for fade effect
      let avgLevel =
        audioData.reduce((sum, val) => sum + val, 0) / audioData.length
      let normalizedAvg = avgLevel / 255

      // Adjust fade rate based on audio - make it extremely dramatic
      let audioFadeRate = this.fadeRate * (1 + normalizedAvg * 10) // 1x to 11x fade rate

      if (this.isFading) {
        this.op -= audioFadeRate
      } else {
        this.op += audioFadeRate
      }

      if (this.op > 255) {
        this.isFading = true
      }

      if (this.op < 0) {
        this.isFading = false
      }
    }
  }

  // Function to find and analyze audio elements on the page
  const setupAudioAnalysis = () => {
    try {
      // Find audio elements on the page
      const audioElements = document.querySelectorAll('audio')

      if (audioElements.length === 0) {
        return
      }

      // Use the first audio element found
      audioElement = audioElements[0]

      // Since all audio files are from Supabase, always use alternative detection
      // This avoids CORS issues and provides better performance
      corsDetected = true
      setupAlternativeAudioDetection()
    } catch (error) {
      console.error('Error setting up audio analysis:', error)
      corsDetected = true
      setupAlternativeAudioDetection()
    }
  }

  // Alternative audio detection method that works with CORS restrictions
  const setupAlternativeAudioDetection = () => {
    if (!audioElement) return

    // Listen for audio events (no logging needed)
    audioElement.addEventListener('play', () => {})
    audioElement.addEventListener('pause', () => {})
    audioElement.addEventListener('ended', () => {})
  }

  // Function to get current audio data
  const getAudioData = () => {
    // Find any playing audio element
    const allAudioElements = document.querySelectorAll('audio')
    let playingAudioElement = null

    for (let el of allAudioElements) {
      if (!el.paused && !el.ended && el.readyState >= 2) {
        playingAudioElement = el
        break
      }
    }

    // Update our audio element reference if we found a playing one
    if (playingAudioElement && playingAudioElement !== audioElement) {
      audioElement = playingAudioElement
    }

    // Always use alternative method for Supabase audio files
    return getAlternativeAudioData()
  }

  // Alternative audio data method that works with CORS restrictions
  // Function to birth new particles based on audio intensity
  const birthParticles = (audioData) => {
    if (!audioData || audioData.length === 0) return

    // Calculate overall audio intensity with emphasis on low frequencies
    const lowFreqAudio =
      audioData.slice(0, 16).reduce((sum, val) => sum + val, 0) / 16
    const highFreqAudio =
      audioData.slice(16).reduce((sum, val) => sum + val, 0) /
      (audioData.length - 16)

    // Weight low frequencies much more heavily for bass drum detection
    const weightedAudioLevel = (lowFreqAudio * 3 + highFreqAudio * 1) / 4
    const normalizedAudioLevel = weightedAudioLevel / 255

    // Birth rate based on audio intensity and global birth rate - reduced sensitivity
    const birthRate = normalizedAudioLevel * globalParticleBirthRate * 0.2 // Reduced birth rate

    // Multiple birth attempts per frame for more dramatic effect
    const birthAttempts = Math.floor(birthRate * 5) + 1 // 1 to 6+ attempts based on audio

    for (let attempt = 0; attempt < birthAttempts; attempt++) {
      if (Math.random() < birthRate) {
        // Random position within canvas bounds
        const x = margin + Math.random() * (p.width - 2 * margin)
        const y = margin + Math.random() * (p.height - 2 * margin)

        // Create unique seed for new particle
        const particleSeed = (markovSeed + Math.random() * 10000) % 10000

        // Create new particle with high initial opacity
        const newParticle = new Particle(x, y, 0.15, 256, x, y, particleSeed)
        particles.push(newParticle)
      }
    }
  }

  // Function to kill particles based on audio intensity
  const killParticles = (audioData) => {
    if (!audioData || audioData.length === 0) return

    // Calculate overall audio intensity with emphasis on low frequencies
    const lowFreqAudio =
      audioData.slice(0, 16).reduce((sum, val) => sum + val, 0) / 16
    const highFreqAudio =
      audioData.slice(16).reduce((sum, val) => sum + val, 0) /
      (audioData.length - 16)

    // Weight low frequencies much more heavily for bass drum detection
    const weightedAudioLevel = (lowFreqAudio * 3 + highFreqAudio * 1) / 4
    const normalizedAudioLevel = weightedAudioLevel / 255

    // Kill rate based on audio intensity (inverse relationship - more audio = less killing) - much more sensitive
    const killRate = (1 - normalizedAudioLevel) * 0.3 // Much higher kill rate

    // Multiple kill attempts per frame for more dramatic effect
    const killAttempts = Math.floor(killRate * 3) + 1 // 1 to 4+ attempts based on audio

    for (let attempt = 0; attempt < killAttempts; attempt++) {
      if (Math.random() < killRate && particles.length > 30) {
        // Lower minimum particles for more dramatic effect
        // Remove a random particle
        const randomIndex = Math.floor(Math.random() * particles.length)
        particles.splice(randomIndex, 1)
      }
    }
  }

  const getAlternativeAudioData = () => {
    if (!audioElement) {
      return new Array(64).fill(0)
    }

    const isPlaying = !audioElement.paused && !audioElement.ended
    const currentTime = audioElement.currentTime
    const duration = audioElement.duration
    const volume = audioElement.volume || 1

    if (!isPlaying) {
      return new Array(64).fill(0)
    }

    // Create simulated audio data based on playback state
    const data = new Array(64).fill(0)

    // Create more realistic frequency distribution that responds to volume
    for (let i = 0; i < 64; i++) {
      // Base level that responds to volume
      let baseLevel = 60 * volume

      // Add time-based variation that's more musical
      let timeVariation = Math.sin(currentTime * 2 + i * 0.1) * 40 * volume

      // Add some randomness for natural feel
      let randomVariation = (Math.random() - 0.5) * 30 * volume

      // Create frequency bands that respond differently - bass drum emphasis
      let frequencyResponse
      if (i < 8) {
        // Very low frequencies (sub-bass) - bass drum territory - MUCH stronger
        frequencyResponse =
          Math.sin(currentTime * 0.3 + i * 0.02) * 150 * volume
      } else if (i < 16) {
        // Low frequencies (bass) - still strong for bass drum
        frequencyResponse =
          Math.sin(currentTime * 0.5 + i * 0.05) * 120 * volume
      } else if (i < 32) {
        // Mid frequencies - balanced
        frequencyResponse = Math.sin(currentTime * 1.5 + i * 0.08) * 60 * volume
      } else if (i < 48) {
        // High-mid frequencies - more active
        frequencyResponse = Math.sin(currentTime * 2.5 + i * 0.12) * 70 * volume
      } else {
        // High frequencies - most active
        frequencyResponse = Math.sin(currentTime * 3.5 + i * 0.15) * 80 * volume
      }

      data[i] = Math.max(
        0,
        Math.min(
          255,
          baseLevel + timeVariation + randomVariation + frequencyResponse
        )
      )
    }

    return data
  }

  p.setup = () => {
    // Get the container width and use fixed height
    const containerWidth = p.canvas ? p.canvas.parentElement.offsetWidth : 800
    const canvasHeight = 400

    p.createCanvas(containerWidth, canvasHeight)
    p.background(0)

    // Update global variables to use full canvas dimensions
    margin = 5 // Minimal margin
    spacing = Math.max(100, containerWidth * 0.015) // Responsive spacing
    radius = Math.min(containerWidth, canvasHeight) * 0.4 // Responsive radius

    // Create gravitational points
    createGravitationalPoints()

    // Setup audio analysis
    setupAudioAnalysis()

    p.seed()
  }

  p.windowResized = () => {
    // Resize canvas when window is resized
    const containerWidth = p.canvas.parentElement.offsetWidth
    const canvasHeight = 400

    p.resizeCanvas(containerWidth, canvasHeight)
    p.background(0)

    // Update global variables for new canvas dimensions
    margin = 5 // Minimal margin
    spacing = Math.max(100, containerWidth * 0.015) // Responsive spacing
    radius = Math.min(containerWidth, canvasHeight) * 0.4 // Responsive radius

    // Re-seed particles for new canvas size
    particles = []
    p.seed()
  }

  p.draw = () => {
    // Get current audio data
    const audioData = getAudioData()

    // Update gravity points positions
    updateGravityPoints()

    // Birth and kill particles based on audio
    birthParticles(audioData)
    killParticles(audioData)

    for (let i = 0; i < particles.length; i++) {
      particles[i].move(i, audioData, particles)
      particles[i].show(audioData)
      particles[i].update()
      particles[i].fade(audioData)
    }
  }

  p.seed = () => {
    // Calculate number of particles based on canvas size and desired density
    const canvasArea = (p.width - 2 * margin) * (p.height - 2 * margin)
    const targetParticles =
      Math.floor(canvasArea / (spacing * spacing * 0.8)) + 5 // Add 5 more particles

    for (
      let particleIndex = 0;
      particleIndex < targetParticles;
      particleIndex++
    ) {
      // Create unique seed for each particle
      let particleSeed = (markovSeed + particleIndex * 123) % 10000

      // Use Markov seed to influence random positioning
      let randomSeed1 = (particleSeed * 456) % 10000
      let randomSeed2 = (particleSeed * 789) % 10000

      // Generate random positions influenced by Markov seed
      let startX = margin + (randomSeed1 / 10000) * (p.width - 2 * margin)
      let startY = margin + (randomSeed2 / 10000) * (p.height - 2 * margin)

      // Add some clustering variation based on Markov seed
      let clusteringFactor = (markovSeed % 100) / 100 // 0 to 1 clustering intensity
      if (clusteringFactor > 0.5) {
        // Create some clustering by adjusting positions
        let clusterCenterX =
          p.width / 2 + Math.sin(markovSeed * 0.1) * (p.width * 0.3)
        let clusterCenterY =
          p.height / 2 + Math.cos(markovSeed * 0.1) * (p.height * 0.3)
        let distanceToCenter = Math.sqrt(
          (startX - clusterCenterX) ** 2 + (startY - clusterCenterY) ** 2
        )
        let maxDistance = Math.sqrt(p.width ** 2 + p.height ** 2) / 2

        // Pull particles toward cluster center
        let pullStrength = (clusteringFactor - 0.5) * 2 // 0 to 1 pull strength
        startX = startX + (clusterCenterX - startX) * pullStrength * 0.3
        startY = startY + (clusterCenterY - startY) * pullStrength * 0.3
      }

      // Ensure particles stay within bounds
      startX = Math.max(margin, Math.min(p.width - margin, startX))
      startY = Math.max(margin, Math.min(p.height - margin, startY))

      let particle = new Particle(
        startX,
        startY,
        0.15,
        256,
        startX,
        startY,
        particleSeed
      )
      particles.push(particle)
    }
    console.log(
      `Created ${particles.length} particles with markov seed: ${markovSeed}`
    ) // Debug log
  }
}

const AudioReactiveGridSketch = ({
  className = '',
  style = {},
  markovText = '',
}) => {
  return (
    <P5Sketch
      sketch={(p) => AudioReactiveGridSketchFunction(p, markovText)}
      className={className}
      style={style}
    />
  )
}

export default AudioReactiveGridSketch
