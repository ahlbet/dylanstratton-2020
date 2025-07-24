import React, { Suspense, lazy } from 'react'

// Lazy load the actual sketch component to prevent SSR issues
const P5SketchComponent = lazy(() =>
  import('../p5-sketch/p5-sketch').then((module) => ({
    default: module.default,
  }))
)

// Audio-reactive grid sketch function - only runs client-side
const createAudioReactiveGridSketch =
  (markovText = '') =>
  (p) => {
    // Global variables
    let particles = []
    let margin = 25
    let spacing = 30
    let radius = 300
    let num = 2000
    let tatShapePositions = [] // Will store positions generated from TatsSketch logic

    // Generate a seed from Markov text to influence sketch behavior
    const generateSeedFromText = (text) => {
      if (!text || typeof text !== 'string') return 0

      let seed = 0
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i)
        if (isFinite(charCode)) {
          seed += charCode * (i + 1)
        }
      }

      // Validate final seed
      const finalSeed = seed % 10000
      return isFinite(finalSeed) ? finalSeed : 0
    }

    let markovSeed = generateSeedFromText(markovText)

    // Validate markovSeed
    if (!isFinite(markovSeed)) {
      markovSeed = Math.floor(Math.random() * 10000)
    }

    // TatsSketch shape generation logic adapted for particle positions - single Tat per blog post
    const generateTatShapePositions = () => {
      const shapes = [
        'horizontalLine',
        'verticalLine',
        'circle',
        'triangle',
        'square',
      ]

      const positions = []

      // Generate one central Tat position based on markov seed
      const centerX = p.width / 2 + ((markovSeed % 200) - 100) // Slight offset from center
      const centerY = p.height / 2 + (((markovSeed * 7) % 200) - 100) // Slight offset from center

      // Each Tat has 1-5 shape types based on markov seed
      const typesCount = Math.floor(markovSeed % 5) + 1

      for (let i = 0; i < typesCount; i++) {
        const shapeIndex = Math.floor(
          (markovSeed * (i + 1) * 123) % shapes.length
        )
        const shapeType = shapes[shapeIndex]

        // Generate positions based on shape type with full canvas dimensions
        const shapePositions = generateShapePositions(
          centerX,
          centerY,
          shapeType,
          { width: p.width, height: p.height }, // Pass full canvas dimensions
          markovSeed * (i + 1)
        )
        positions.push(...shapePositions)
      }

      return positions
    }

    // Generate particle positions for each shape type
    const generateShapePositions = (
      centerX,
      centerY,
      shapeType,
      canvasDimensions,
      shapeSeed
    ) => {
      const positions = []
      const numParticles = 25 + (shapeSeed % 8) // 30-37 particles per shape
      const { width, height } = canvasDimensions
      const insetMargin = margin + 30 // Additional inset to prevent particles from getting stuck at edges

      switch (shapeType) {
        case 'horizontalLine':
          for (let i = 0; i < numParticles; i++) {
            const t = i / (numParticles - 1) // 0 to 1
            const x = insetMargin + t * (width - 2 * insetMargin) // Inset width span
            const y = centerY + (((shapeSeed * i) % 40) - 20) // Vertical variation
            positions.push({ x, y })
          }
          break

        case 'verticalLine':
          for (let i = 0; i < numParticles; i++) {
            const t = i / (numParticles - 1) // 0 to 1
            const x = centerX + (((shapeSeed * i) % 40) - 20) // Horizontal variation
            const y = insetMargin + t * (height - 2 * insetMargin) // Inset height span
            positions.push({ x, y })
          }
          break

        case 'circle':
          for (let i = 0; i < numParticles; i++) {
            const angle = (i / numParticles) * Math.PI * 2
            // Use ellipse with inset margins
            const radiusX = (width - 2 * insetMargin) / 2
            const radiusY = (height - 2 * insetMargin) / 2
            const x =
              centerX +
              Math.cos(angle) * radiusX * (0.8 + ((shapeSeed * i) % 40) / 100)
            const y =
              centerY +
              Math.sin(angle) * radiusY * (0.8 + ((shapeSeed * i) % 40) / 100)
            positions.push({ x, y })
          }
          break

        case 'triangle':
          for (let i = 0; i < numParticles; i++) {
            // Three vertices of triangle with inset margins
            const vertices = [
              { x: centerX, y: insetMargin }, // top
              { x: insetMargin, y: height - insetMargin }, // bottom left
              { x: width - insetMargin, y: height - insetMargin }, // bottom right
            ]

            if (i < 3) {
              // Place particles at vertices
              positions.push(vertices[i])
            } else {
              // Place particles along edges
              const edgeIndex = (i - 3) % 3
              const t = ((shapeSeed * i) % 100) / 100 // Random position along edge
              const start = vertices[edgeIndex]
              const end = vertices[(edgeIndex + 1) % 3]
              const x = start.x + (end.x - start.x) * t
              const y = start.y + (end.y - start.y) * t
              positions.push({ x, y })
            }
          }
          break

        case 'square':
          for (let i = 0; i < numParticles; i++) {
            if (i < 4) {
              // Place particles at corners with inset margins
              const corners = [
                { x: insetMargin, y: insetMargin }, // top left
                { x: width - insetMargin, y: insetMargin }, // top right
                { x: width - insetMargin, y: height - insetMargin }, // bottom right
                { x: insetMargin, y: height - insetMargin }, // bottom left
              ]
              positions.push(corners[i])
            } else {
              // Place particles along edges
              const side = (i - 4) % 4
              const t = ((shapeSeed * i) % 100) / 100

              let x, y
              switch (side) {
                case 0: // top edge
                  x = insetMargin + t * (width - 2 * insetMargin)
                  y = insetMargin
                  break
                case 1: // right edge
                  x = width - insetMargin
                  y = insetMargin + t * (height - 2 * insetMargin)
                  break
                case 2: // bottom edge
                  x = width - insetMargin - t * (width - 2 * insetMargin)
                  y = height - insetMargin
                  break
                case 3: // left edge
                  x = insetMargin
                  y = height - insetMargin - t * (height - 2 * insetMargin)
                  break
              }
              positions.push({ x, y })
            }
          }
          break
      }

      return positions
    }

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
    let globalSpeedMultiplier = 4 + (markovSeed % 100) / 50 // 0.6 to 2.6 (moderate range)
    let globalColorIntensity = 0.5 + (markovSeed % 100) / 50 // 0.5 to 2.5 (moderate range)
    let globalParticleInteraction = 0.3 + (markovSeed % 150) / 30 // 0.3 to 5.3 (moderate range)
    let globalParticleSize = 0.8 + (markovSeed % 75) / 25 // 0.8 to 3.76 (ensures visible particles)
    let globalParticleBirthRate = 0.5 + (markovSeed % 100) / 50 // 0.5 to 2.5 (birth rate variation)
    let globalGravityStrength = 0.08 + (markovSeed % 100) / 10 // 0.8 to 2.8 (gravity strength variation)
    let primaryHue = markovSeed % 360 // Primary hue for this blog post (0-359)
    let globalSwirlStrength = 0.01 + (markovSeed % 100) / 100 // 0.3 to 1.3 (swirl strength variation)
    let globalSwirlDirection = markovSeed % 2 === 0 ? 1 : -1 // Clockwise or counter-clockwise
    let globalSwirlSpeed = 0.5 + (markovSeed % 100) / 100 // 0.5 to 1.5 (swirl change speed)

    // Validate all global parameters
    if (!isFinite(globalSpeedMultiplier)) globalSpeedMultiplier = 1
    if (!isFinite(globalColorIntensity)) globalColorIntensity = 1
    if (!isFinite(globalParticleInteraction)) globalParticleInteraction = 1
    if (!isFinite(globalParticleSize)) globalParticleSize = 1
    if (!isFinite(globalParticleBirthRate)) globalParticleBirthRate = 1
    if (!isFinite(globalGravityStrength)) globalGravityStrength = 1
    if (!isFinite(primaryHue)) primaryHue = 180
    if (!isFinite(globalSwirlStrength)) globalSwirlStrength = 0.5
    if (!isFinite(globalSwirlDirection)) globalSwirlDirection = 1
    if (!isFinite(globalSwirlSpeed)) globalSwirlSpeed = 1

    // Gravitational points system
    let gravitationalPoints = []
    let numGravityPoints = 2 + Math.floor((markovSeed % 100) / 15) // 2-8 gravity points based on seed
    let gravityMoveSpeedMultiplier = 0.3 + (markovSeed % 100) / 100 // 0.3 to 1.3 movement speed multiplier

    // Validate gravity parameters
    if (!isFinite(numGravityPoints) || numGravityPoints < 2)
      numGravityPoints = 2
    if (!isFinite(gravityMoveSpeedMultiplier)) gravityMoveSpeedMultiplier = 0.5

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
        // Validate and set position values
        this.x = isFinite(x) ? x : 0
        this.y = isFinite(y) ? y : 0
        this.r = isFinite(r) ? r : 1
        this.op = isFinite(op) ? op : 255
        this.startX = isFinite(startX) ? startX : 0
        this.startY = isFinite(startY) ? startY : 0

        // Use seed to create unique particle characteristics - moderate impact
        this.seed = isFinite(seed) ? seed : Math.random() * 10000
        this.baseMov = 0.8 + (this.seed % 150) / 60 // Movement speed varies moderately by seed (slightly reduced)
        this.mov = this.baseMov
        this.slow = 10 + (this.seed % 200) / 2 // Noise scale varies moderately by seed
        this.fadeRate = 0.2 + (this.seed % 100) / 100 // Fade rate varies moderately by seed
        this.isFading = true

        // Color personality based on seed - moderate impact
        this.colorOffset = (this.seed % 360) / 360 // Different starting color (full range)
        this.colorSpeed = 0.3 + (this.seed % 100) / 40 // Color cycling speed varies moderately

        // Validate all calculated values
        if (!isFinite(this.baseMov)) this.baseMov = 1
        if (!isFinite(this.mov)) this.mov = 1
        if (!isFinite(this.slow)) this.slow = 10
        if (!isFinite(this.fadeRate)) this.fadeRate = 0.2
        if (!isFinite(this.colorOffset)) this.colorOffset = 0
        if (!isFinite(this.colorSpeed)) this.colorSpeed = 0.3
      }

      show(audioData) {
        p.noStroke()

        // Validate inputs and provide safe defaults
        if (!audioData || !Array.isArray(audioData) || audioData.length === 0) {
          audioData = new Array(64).fill(0)
        }

        // Get audio level for this particle with smooth interpolation
        let audioIndexFloat = p.map(this.x, 0, p.width, 0, audioData.length - 1)

        // Validate audioIndexFloat
        if (!isFinite(audioIndexFloat)) {
          audioIndexFloat = 0
        }

        let audioIndex1 = Math.floor(audioIndexFloat)
        let audioIndex2 = Math.min(audioIndex1 + 1, audioData.length - 1)
        let blend = audioIndexFloat - audioIndex1

        // Validate blend
        if (!isFinite(blend)) {
          blend = 0
        }

        let audioLevel1 = audioData[audioIndex1] || 0
        let audioLevel2 = audioData[audioIndex2] || 0
        let audioLevel = audioLevel1 * (1 - blend) + audioLevel2 * blend
        let normalizedLevel = audioLevel / 255

        // Validate normalizedLevel
        if (!isFinite(normalizedLevel)) {
          normalizedLevel = 0
        }

        // Simplified color system - direct RGB calculation
        let colorTime = p.frameCount * this.colorSpeed * 0.01
        let audioColor = normalizedLevel * 100 * globalColorIntensity

        // Validate intermediate values
        if (!isFinite(colorTime)) colorTime = 0
        if (!isFinite(audioColor)) audioColor = 0

        // Create color variation based on primary hue with simple math
        let colorShift = (colorTime + audioColor + this.colorOffset * 50) % 360
        let baseHue = (primaryHue + colorShift) % 360

        // Validate hue values
        if (!isFinite(colorShift)) colorShift = 0
        if (!isFinite(baseHue)) baseHue = 0

        // Simple RGB generation based on hue ranges
        let r, g, b
        if (baseHue < 60) {
          r = 255
          g = Math.floor(baseHue * 4.25)
          b = 50
        } else if (baseHue < 120) {
          r = Math.floor(255 - (baseHue - 60) * 4.25)
          g = 255
          b = 50
        } else if (baseHue < 180) {
          r = 50
          g = 255
          b = Math.floor((baseHue - 120) * 4.25)
        } else if (baseHue < 240) {
          r = 50
          g = Math.floor(255 - (baseHue - 180) * 4.25)
          b = 255
        } else if (baseHue < 300) {
          r = Math.floor((baseHue - 240) * 4.25)
          g = 50
          b = 255
        } else {
          r = 255
          g = 50
          b = Math.floor(255 - (baseHue - 300) * 4.25)
        }

        // Validate RGB values
        r = isFinite(r) ? Math.max(0, Math.min(255, r)) : 255
        g = isFinite(g) ? Math.max(0, Math.min(255, g)) : 255
        b = isFinite(b) ? Math.max(0, Math.min(255, b)) : 255

        // Simple radius variation based on audio and global particle size
        let audioRadius = (this.r + normalizedLevel * 2.0) * globalParticleSize

        // Validate audioRadius
        if (!isFinite(audioRadius) || audioRadius <= 0) {
          audioRadius = 1
        }

        // Validate opacity
        let opacity = this.op * 0.5
        if (!isFinite(opacity)) {
          opacity = 128
        }

        p.fill(r, g, b, opacity)
        p.ellipse(this.x, this.y, audioRadius)
      }

      move(i, audioData, allParticles) {
        // Validate inputs and provide safe defaults
        if (!audioData || !Array.isArray(audioData) || audioData.length === 0) {
          audioData = new Array(64).fill(0)
        }

        // Get audio data for this particle's position with smooth interpolation
        let audioIndexFloat = p.map(
          i,
          0,
          particles.length,
          0,
          audioData.length - 1
        )

        // Validate audioIndexFloat
        if (!isFinite(audioIndexFloat)) {
          audioIndexFloat = 0
        }

        let audioIndex1 = Math.floor(audioIndexFloat)
        let audioIndex2 = Math.min(audioIndex1 + 1, audioData.length - 1)
        let blend = audioIndexFloat - audioIndex1

        // Validate blend
        if (!isFinite(blend)) {
          blend = 0
        }

        let audioLevel1 = audioData[audioIndex1] || 0
        let audioLevel2 = audioData[audioIndex2] || 0

        // Give extra weight to low frequencies for bass drum detection
        let lowFreqWeight = 4.0 // 4x more weight for low frequencies
        let highFreqWeight = 1.0 // Normal weight for high frequencies

        let weight1 = audioIndex1 < 16 ? lowFreqWeight : highFreqWeight
        let weight2 = audioIndex2 < 16 ? lowFreqWeight : highFreqWeight

        let audioLevel =
          (audioLevel1 * weight1 * (1 - blend) +
            audioLevel2 * weight2 * blend) /
          Math.max(weight1, weight2)
        let normalizedLevel = Math.min(1.0, audioLevel / 255) // Clamp to prevent overflow

        // Validate normalizedLevel
        if (!isFinite(normalizedLevel)) {
          normalizedLevel = 0
        }

        // Only move if there's significant audio
        if (normalizedLevel < 0.1) {
          // Reset to start position when no audio
          this.x = this.startX
          this.y = this.startY
          return
        }

        let t = p.frameCount / 100.0
        let wonkV = 30 // Reduced from 100 to decrease noise randomness

        // Validate t
        if (!isFinite(t)) {
          t = 0
        }

        // Adjust movement based on audio level - particles move independently
        let audioMultiplier = 1 + normalizedLevel * 1.75 // 1x to 2.25x movement based on individual audio level
        this.mov = this.baseMov * audioMultiplier * globalSpeedMultiplier

        // Validate movement values
        if (!isFinite(this.mov)) {
          this.mov = 1
        }

        // Simple directional movement based on audio (much more efficient)
        let audioDirection = (this.seed + p.frameCount * 0.01) % (Math.PI * 2)

        // Validate audioDirection
        if (!isFinite(audioDirection)) {
          audioDirection = 0
        }

        let moveX = Math.cos(audioDirection) * this.mov * normalizedLevel * 0.1
        let moveY = Math.sin(audioDirection) * this.mov * normalizedLevel * 0.1

        // Validate movement deltas
        if (isFinite(moveX)) {
          this.x += moveX
        }
        if (isFinite(moveY)) {
          this.y += moveY
        }

        // Add subtle noise-based movement for organic feel (reduced randomness)
        let wonkX = p.map(p.sin(this.startX * i), -1, 1, -wonkV, wonkV)
        let wonkY = p.map(p.cos(this.startY * i), -1, 1, -wonkV, wonkV)

        // Validate wonk values
        if (!isFinite(wonkX)) wonkX = 0
        if (!isFinite(wonkY)) wonkY = 0

        let noiseX = p.map(
          p.noise(wonkX / this.slow, t, i),
          0,
          1,
          -this.mov * 0.08,
          this.mov * 0.08
        )
        let noiseY = p.map(
          p.noise(t, i, wonkY / this.slow),
          0,
          1,
          -this.mov * 0.08,
          this.mov * 0.08
        )

        // Validate noise values and apply
        if (isFinite(noiseX)) {
          this.x += noiseX
        }
        if (isFinite(noiseY)) {
          this.y += noiseY
        }

        // Gentle center attraction - only every 10 frames for performance
        if (p.frameCount % 10 === 0) {
          let centerAttractionStrength = 0.0005 // Ultra-gentle pull
          let centerX = p.width / 2
          let centerY = p.height / 2
          let directionToCenterX = centerX - this.x
          let directionToCenterY = centerY - this.y

          // Validate center attraction values
          if (isFinite(directionToCenterX) && isFinite(directionToCenterY)) {
            // Simple attraction without expensive distance calculation
            this.x += directionToCenterX * centerAttractionStrength
            this.y += directionToCenterY * centerAttractionStrength
          }
        }

        // Ensure particle position remains valid
        if (!isFinite(this.x)) {
          this.x = this.startX
        }
        if (!isFinite(this.y)) {
          this.y = this.startY
        }
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
        // Validate inputs and provide safe defaults
        if (!audioData || !Array.isArray(audioData) || audioData.length === 0) {
          audioData = new Array(64).fill(0)
        }

        // Get average audio level for fade effect
        let avgLevel =
          audioData.reduce((sum, val) => sum + val, 0) / audioData.length
        let normalizedAvg = avgLevel / 255

        // Validate calculated values
        if (!isFinite(avgLevel)) avgLevel = 0
        if (!isFinite(normalizedAvg)) normalizedAvg = 0

        // Adjust fade rate based on audio - make it extremely dramatic
        let audioFadeRate = this.fadeRate * (1 + normalizedAvg * 1.1) // 1x to 11x fade rate

        // Validate fade rate
        if (!isFinite(audioFadeRate)) {
          audioFadeRate = this.fadeRate
        }

        if (this.isFading) {
          this.op -= audioFadeRate
        } else {
          this.op += audioFadeRate
        }

        // Validate opacity
        if (!isFinite(this.op)) {
          this.op = 128
        }

        if (this.op > 255) {
          this.isFading = true
        }

        if (this.op < 50) {
          // Don't let particles become completely invisible - maintain minimum opacity
          this.op = 50
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
        if (Math.random() < birthRate && tatShapePositions.length > 0) {
          // Choose a random TatsSketch position instead of completely random position
          const randomTatPosition =
            tatShapePositions[
              Math.floor(Math.random() * tatShapePositions.length)
            ]

          // Add small variation to avoid exact overlap
          const variation = 8 // Small random offset
          const x = randomTatPosition.x + (Math.random() - 0.5) * variation
          const y = randomTatPosition.y + (Math.random() - 0.5) * variation

          // Ensure position stays within canvas bounds
          const clampedX = Math.max(margin, Math.min(p.width - margin, x))
          const clampedY = Math.max(margin, Math.min(p.height - margin, y))

          // Create unique seed for new particle
          const particleSeed = (markovSeed + Math.random() * 10000) % 10000

          // Create new particle with high initial opacity using TatsSketch position
          const newParticle = new Particle(
            clampedX,
            clampedY,
            0.15,
            256,
            clampedX,
            clampedY,
            particleSeed
          )
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

      // Kill rate based on audio intensity (inverse relationship - more audio = less killing) - much gentler
      const killRate = (1 - normalizedAudioLevel) * 0.05 // Much lower kill rate for longer particle life

      // Single kill attempt per frame for gentler effect
      const killAttempts = Math.floor(killRate * 2) + 1 // 1 to 3 attempts based on audio

      for (let attempt = 0; attempt < killAttempts; attempt++) {
        if (Math.random() < killRate && particles.length > 100) {
          // Higher minimum particles to maintain population
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
          frequencyResponse =
            Math.sin(currentTime * 1.5 + i * 0.08) * 60 * volume
        } else if (i < 48) {
          // High-mid frequencies - more active
          frequencyResponse =
            Math.sin(currentTime * 2.5 + i * 0.12) * 70 * volume
        } else {
          // High frequencies - most active
          frequencyResponse =
            Math.sin(currentTime * 3.5 + i * 0.15) * 80 * volume
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
      // Get the container width and height dynamically
      const containerWidth =
        p.canvas && p.canvas.parentElement
          ? p.canvas.parentElement.offsetWidth
          : 800
      const containerHeight =
        p.canvas && p.canvas.parentElement
          ? p.canvas.parentElement.offsetHeight
          : 400

      p.createCanvas(containerWidth, containerHeight)
      p.background(0)

      // Update global variables to use full canvas dimensions
      margin = 5 // Minimal margin
      spacing = Math.max(100, containerWidth * 0.015) // Responsive spacing
      radius = Math.min(containerWidth, containerHeight) * 0.4 // Responsive radius

      // Generate TatsSketch-based particle positions
      tatShapePositions = generateTatShapePositions()

      // Setup audio analysis
      setupAudioAnalysis()

      p.seed()
    }

    p.windowResized = () => {
      // Resize canvas when window is resized
      const containerWidth =
        p.canvas && p.canvas.parentElement
          ? p.canvas.parentElement.offsetWidth
          : 800
      const containerHeight =
        p.canvas && p.canvas.parentElement
          ? p.canvas.parentElement.offsetHeight
          : 400

      p.resizeCanvas(containerWidth, containerHeight)
      p.background(0)

      // Update global variables for new canvas dimensions
      margin = 5 // Minimal margin
      spacing = Math.max(100, containerWidth * 0.015) // Responsive spacing
      radius = Math.min(containerWidth, containerHeight) * 0.4 // Responsive radius

      // Regenerate TatsSketch-based particle positions for new canvas size
      tatShapePositions = generateTatShapePositions()

      // Re-seed particles for new canvas size
      particles = []
      p.seed()
    }

    p.draw = () => {
      // Get current audio data
      const audioData = getAudioData()

      // Birth and kill particles based on audio
      // birthParticles(audioData)
      // killParticles(audioData)

      for (let i = 0; i < particles.length; i++) {
        particles[i].move(i, audioData, particles)
        particles[i].show(audioData)
        particles[i].update()
        // particles[i].fade(audioData)
      }
    }

    p.seed = () => {
      // Use TatsSketch positions as particle starting points
      if (tatShapePositions.length === 0) {
        console.warn(
          'No TatsSketch positions generated, falling back to random positioning'
        )
        // Fallback to a simple grid if no positions were generated
        for (let y = margin; y < p.height - margin; y += 50) {
          for (let x = margin; x < p.width - margin; x += 50) {
            tatShapePositions.push({ x, y })
          }
        }
      }

      // Create particles based on TatsSketch positions
      for (let i = 0; i < tatShapePositions.length; i++) {
        const position = tatShapePositions[i]

        // Create unique seed for each particle based on position and markov seed
        let particleSeed =
          (markovSeed + position.x * position.y + i * 123) % 10000

        // Ensure positions are within canvas bounds
        let startX = Math.max(margin, Math.min(p.width - margin, position.x))
        let startY = Math.max(margin, Math.min(p.height - margin, position.y))

        // Add some slight variation to avoid overlapping particles
        const variation = 5 // Small random offset
        startX += (((particleSeed % 100) - 50) / 50) * variation
        startY += ((((particleSeed * 7) % 100) - 50) / 50) * variation

        // Ensure particles stay within bounds after variation
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
    }
  }

// Client-side only component that renders the sketch
const ClientSideSketch = ({ className, style, markovText }) => {
  return (
    <P5SketchComponent
      sketch={createAudioReactiveGridSketch(markovText)}
      className={className}
      style={style}
    />
  )
}

// Main component with SSR handling
const AudioReactiveGridSketch = ({
  className = '',
  style = {},
  markovText = '',
}) => {
  // Return loading placeholder during SSR
  if (typeof window === 'undefined') {
    return (
      <div
        className={className}
        style={{
          ...style,
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          height: '400px',
        }}
      ></div>
    )
  }

  return (
    <Suspense
      fallback={
        <div
          className={className}
          style={{
            ...style,
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            height: '400px',
          }}
        ></div>
      }
    >
      <ClientSideSketch
        className={className}
        style={style}
        markovText={markovText}
      />
    </Suspense>
  )
}

export default AudioReactiveGridSketch
