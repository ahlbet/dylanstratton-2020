import React, { Suspense, lazy } from 'react'
import { generateSeedFromText, generateTatShapePositions } from '../../utils/p5'

// Lazy load the actual sketch component to prevent SSR issues
const P5SketchComponent = lazy(() =>
  import('../p5-sketch/p5-sketch').then((module) => ({
    default: module.default,
  }))
)

// Audio-reactive grid sketch function - only runs client-side
export const createAudioReactiveGridSketch =
  (markovText = '', totalPlaylistDuration = 0) =>
  (p) => {
    // Global variables
    let particles = []
    let margin = 25
    let spacing = 30
    let radius = 300
    let num = 2000
    let tatShapePositions = [] // Will store positions generated from TatsSketch logic

    // Particle removal based on playlist time
    let lastRemovalTime = 0
    let particlesRemoved = 0
    let totalParticlesToRemove = 0
    let removalInterval = 0

    // Use shared seed generation utility

    let markovSeed = generateSeedFromText(markovText)

    // Validate markovSeed
    if (!isFinite(markovSeed)) {
      markovSeed = Math.floor(Math.random() * 10000)
    }

    // Use shared Tat shape generation utility

    // Use shared shape generation utilities

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
    let globalParticleSize = 8 + (markovSeed % 75) / 50 // 0.8 to 3.76 (ensures visible particles)
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
    let fft = null
    let fftBins = 64

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

        // Assign frequency band based on seed (4 bands: 0-3)
        this.frequencyBand = Math.floor(this.seed % 4)

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

        // Get audio level for this particle's frequency band
        const bandsPerFrequency = Math.floor(audioData.length / 4)
        const bandStartIndex = this.frequencyBand * bandsPerFrequency
        const bandEndIndex = Math.min(
          bandStartIndex + bandsPerFrequency,
          audioData.length - 1
        )

        // Calculate average audio level for this particle's frequency band
        let bandAudioSum = 0
        let bandAudioCount = 0

        for (let j = bandStartIndex; j <= bandEndIndex; j++) {
          if (audioData[j] !== undefined) {
            bandAudioSum += audioData[j]
            bandAudioCount++
          }
        }

        let audioLevel = bandAudioCount > 0 ? bandAudioSum / bandAudioCount : 0
        let normalizedLevel = audioLevel / 255

        // Validate normalizedLevel
        if (!isFinite(normalizedLevel)) {
          normalizedLevel = 0
        }

        // 4-band frequency color system
        let r, g, b

        // Define colors for each frequency band
        const bandColors = [
          { r: 255, g: 100, b: 100 }, // Band 0: Red (Sub-bass/Low frequencies)
          { r: 180, g: 150, b: 140 }, // Band 1: Teal (Bass/Mid frequencies) - avoiding green entirely
          { r: 100, g: 100, b: 255 }, // Band 2: Blue (Mid/High frequencies)
          { r: 255, g: 255, b: 100 }, // Band 3: Yellow (High frequencies)
        ]

        // Get base color for this particle's frequency band with validation
        const frequencyBand = this.frequencyBand || 0 // Default to band 0 if undefined
        const baseColor = bandColors[frequencyBand] || bandColors[0] // Fallback to first color if undefined

        // Add audio intensity variation
        let audioIntensity = normalizedLevel * globalColorIntensity
        let brightnessMultiplier = 0.5 + audioIntensity * 0.5 // 0.5 to 1.0 range

        // Apply brightness variation based on audio
        r = Math.floor(baseColor.r * brightnessMultiplier)
        g = Math.floor(baseColor.g * brightnessMultiplier)
        b = Math.floor(baseColor.b * brightnessMultiplier)

        // Add subtle color variation based on time and particle seed
        let colorVariation =
          Math.sin(p.frameCount * 0.01 + this.seed * 0.1) * 30
        
        // Apply color variation with special handling for green to avoid bright green
        r = Math.max(0, Math.min(255, r + colorVariation))
        
        // Limit green variation to prevent bright green particles
        let greenVariation = colorVariation
        if (this.frequencyBand === 1) { // Bass/Mid frequency band
          greenVariation = Math.min(colorVariation, 15) // Reduce green variation for this band
        }
        g = Math.max(0, Math.min(200, g + greenVariation)) // Cap green at 200 max
        
        b = Math.max(0, Math.min(255, b + colorVariation))

        // Dynamic radius that responds to frequency band audio intensity
        let baseRadius = this.r * globalParticleSize * 1.2 // Increased overall radius by 20%
        let audioRadiusMultiplier = 1 + normalizedLevel * 3.0 // Radius can grow up to 4x with loud audio
        let audioRadius = baseRadius * audioRadiusMultiplier

        // Validate audioRadius
        if (!isFinite(audioRadius) || audioRadius <= 0) {
          audioRadius = baseRadius
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

        // Get audio data for this particle's frequency band
        const bandsPerFrequency = Math.floor(audioData.length / 4)
        const bandStartIndex = this.frequencyBand * bandsPerFrequency
        const bandEndIndex = Math.min(
          bandStartIndex + bandsPerFrequency,
          audioData.length - 1
        )

        // Calculate average audio level for this particle's frequency band
        let bandAudioSum = 0
        let bandAudioCount = 0

        for (let j = bandStartIndex; j <= bandEndIndex; j++) {
          if (audioData[j] !== undefined) {
            bandAudioSum += audioData[j]
            bandAudioCount++
          }
        }

        let audioLevel = bandAudioCount > 0 ? bandAudioSum / bandAudioCount : 0
        let normalizedLevel = Math.min(1.0, audioLevel / 255) // Clamp to prevent overflow

        // Simple, smooth movement that responds to audio
        let t = p.frameCount * 0.005 // Very slow time progression

        // Adjust movement based on audio level - particles move independently
        let audioMultiplier = 1 + normalizedLevel * 1.0 // Gentle audio response
        this.mov = this.baseMov * audioMultiplier * globalSpeedMultiplier

        // Simple circular movement pattern
        let angle = (this.seed + t) % (Math.PI * 2)
        let radius = 0.3 + normalizedLevel * 0.2 // Small radius that grows with audio

        // Calculate smooth circular movement
        let moveX = Math.cos(angle) * this.mov * radius
        let moveY = Math.sin(angle) * this.mov * radius

        // Add gentle center attraction
        let centerX = p.width / 2
        let centerY = p.height / 2
        let toCenterX = centerX - this.x
        let toCenterY = centerY - this.y
        let distanceToCenter = Math.sqrt(
          toCenterX * toCenterX + toCenterY * toCenterY
        )

        // Only apply center attraction if particle is far from center
        if (distanceToCenter > Math.min(p.width, p.height) * 0.2) {
          let centerPull = 0.0002 * this.mov
          moveX += toCenterX * centerPull
          moveY += toCenterY * centerPull
        }

        // Apply movement with smoothing
        this.x += moveX * 0.1
        this.y += moveY * 0.1

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

    // Function to calculate particle removal parameters based on playlist duration
    const calculateParticleRemovalParams = () => {
      // Get totalPlaylistDuration from global variable
      const duration =
        typeof window !== 'undefined' ? window.totalPlaylistDuration || 0 : 0

      if (duration <= 0) {
        totalParticlesToRemove = 0
        removalInterval = 0
        return
      }

      // Calculate how many particles to remove total (even split)
      totalParticlesToRemove = particles.length // Remove 100% of particles

      // Calculate time interval between removals
      removalInterval = duration / totalParticlesToRemove

      // Reset counters
      particlesRemoved = 0
      lastRemovalTime = 0
    }

    // Function to remove particles based on current playback time
    const removeParticlesBasedOnTime = () => {
      if (
        totalParticlesToRemove <= 0 ||
        particlesRemoved >= totalParticlesToRemove
      ) {
        return
      }

      // Get current playback time from audio element - use the same logic as getAudioData
      const allAudioElements = document.querySelectorAll('audio')
      let playingAudioElement = null

      for (let el of allAudioElements) {
        if (!el.paused && !el.ended && el.readyState >= 2) {
          playingAudioElement = el
          break
        }
      }

      if (!playingAudioElement) {
        return
      }

      const currentTime = playingAudioElement.currentTime

      // Check if it's time to remove another particle
      if (currentTime - lastRemovalTime >= removalInterval) {
        // Remove one particle
        if (particles.length > 0) {
          const randomIndex = Math.floor(Math.random() * particles.length)
          particles.splice(randomIndex, 1)
          particlesRemoved++
          lastRemovalTime = currentTime
        }
      }
    }

    // FFT setup with automatic audio connection
    const setupFFT = () => {
      if (typeof window !== 'undefined' && window.p5 && window.p5.FFT && !fft) {
        try {
          fft = new window.p5.FFT(fftBins)
          if (fft.smooth) {
            fft.smooth(0.8)
          }
          console.log('FFT initialized - always running')

          // Try to connect to any playing audio
          connectToPlayingAudio()
        } catch (e) {
          console.error('Failed to create FFT:', e)
        }
      }
    }

    // Connect FFT to any playing audio elements
    const connectToPlayingAudio = () => {
      if (!fft) return

      const audioElements = document.querySelectorAll('audio')
      console.log('Found audio elements:', audioElements.length)

      for (let audioElement of audioElements) {
        console.log('Checking audio element:', {
          src: audioElement.src,
          readyState: audioElement.readyState,
          paused: audioElement.paused,
          currentTime: audioElement.currentTime,
          duration: audioElement.duration,
        })

        if (audioElement.src && audioElement.readyState >= 2) {
          try {
            // Check if fft.setInput method exists
            console.log(
              'FFT methods available:',
              Object.getOwnPropertyNames(fft)
            )
            console.log('fft.setInput exists:', typeof fft.setInput)

            // Try to set the audio element as input for FFT
            if (fft.setInput) {
              fft.setInput(audioElement)
              console.log('Connected FFT to audio element:', audioElement.src)
              return
            } else {
              console.log(
                'fft.setInput method not available, trying Web Audio API approach'
              )

              // Try alternative approach using Web Audio API
              try {
                const audioContext = new (window.AudioContext ||
                  window.webkitAudioContext)()
                if (audioContext.state === 'suspended') {
                  audioContext.resume()
                }

                const source =
                  audioContext.createMediaElementSource(audioElement)
                const analyser = audioContext.createAnalyser()
                analyser.fftSize = fftBins * 2
                analyser.smoothingTimeConstant = 0.8

                source.connect(analyser)
                analyser.connect(audioContext.destination)

                // Store the analyser for use in getAudioData
                fft.analyser = analyser
                fft.audioContext = audioContext

                console.log(
                  'Connected FFT to audio element via Web Audio API:',
                  audioElement.src
                )
                return
              } catch (webAudioError) {
                console.log(
                  'Web Audio API connection failed:',
                  webAudioError.message
                )
              }
            }
          } catch (e) {
            console.log('Could not connect FFT to audio element:', e.message)
            console.log('Error details:', e)
          }
        } else {
          console.log('Audio element not ready:', {
            hasSrc: !!audioElement.src,
            readyState: audioElement.readyState,
            readyStateText: [
              'HAVE_NOTHING',
              'HAVE_METADATA',
              'HAVE_CURRENT_DATA',
              'HAVE_FUTURE_DATA',
              'HAVE_ENOUGH_DATA',
            ][audioElement.readyState],
          })
        }
      }

      console.log('No suitable audio elements found for FFT connection')
    }

    // Function to get audio data - handles both p5.FFT and Web Audio API
    const getAudioData = () => {
      if (fft) {
        try {
          // If we have a Web Audio API analyser, use that
          if (fft.analyser) {
            const frequencyData = new Uint8Array(fft.analyser.frequencyBinCount)
            fft.analyser.getByteFrequencyData(frequencyData)
            const data = Array.from(frequencyData)

            // Debug: log FFT data occasionally
            if (p.frameCount % 60 === 0) {
              const avg =
                data.slice(0, 10).reduce((sum, val) => sum + val, 0) / 10
              console.log(
                'Web Audio FFT data avg:',
                avg,
                'first 5 values:',
                data.slice(0, 5)
              )
            }

            return data
          } else {
            // Use p5.FFT analyze method
            const data = fft.analyze()

            // Debug: log FFT data occasionally
            if (p.frameCount % 60 === 0) {
              const avg =
                data.slice(0, 10).reduce((sum, val) => sum + val, 0) / 10
              console.log(
                'p5.FFT data avg:',
                avg,
                'first 5 values:',
                data.slice(0, 5)
              )
            }

            return data
          }
        } catch (e) {
          console.warn('FFT analyze failed:', e)
          // Return zeros if FFT fails
          return new Array(fftBins).fill(0)
        }
      }

      // Return zeros if FFT not available
      return new Array(fftBins).fill(0)
    }

    // Sophisticated audio-reactive data that mimics real FFT analysis
    const getEnhancedAudioData = () => {
      const audioEls = document.querySelectorAll('audio')
      const playingAudio = Array.from(audioEls).find(
        (el) => !el.paused && !el.ended && el.readyState >= 2
      )

      if (!playingAudio) {
        return new Array(fftBins).fill(0)
      }

      const currentTime = playingAudio.currentTime
      const volume = playingAudio.volume || 1
      const isPlaying = !playingAudio.paused && !playingAudio.ended
      const duration = playingAudio.duration || 0

      if (!isPlaying) {
        return new Array(fftBins).fill(0)
      }

      // Create sophisticated frequency distribution that responds to audio characteristics
      const data = new Array(fftBins).fill(0)

      // Calculate musical timing patterns
      const bpm = 120 // Estimated BPM - could be made dynamic
      const beatTime = (currentTime * bpm) / 60
      const beatPhase = (beatTime % 1) * Math.PI * 2

      // Create rhythmic patterns that respond to beats
      const kickDrum = Math.sin(beatPhase) > 0.7 ? 1 : 0
      const snareDrum = Math.sin(beatPhase + Math.PI) > 0.7 ? 1 : 0
      const hiHat = Math.sin(beatPhase * 4) > 0.5 ? 1 : 0

      // Create dynamic spiral frequency band layout
      const centerX = p.width / 2
      const centerY = p.height / 2
      const maxRadius = Math.min(p.width, p.height) * 0.4

      // Spiral parameters that move with time
      const spiralTightness = 0.3 + Math.sin(currentTime * 0.1) * 0.1 // Spiral tightness varies
      const spiralRotation = currentTime * 0.2 // Spiral rotates over time
      const spiralExpansion = 1 + Math.sin(currentTime * 0.3) * 0.2 // Spiral expands/contracts

      for (let i = 0; i < fftBins; i++) {
        // Calculate spiral position for this frequency band
        const angle = (i / fftBins) * Math.PI * 4 + spiralRotation // Multiple rotations
        const radius =
          (i / fftBins) * maxRadius * spiralExpansion * spiralTightness

        // Add some organic variation to the spiral
        const radiusVariation = Math.sin(angle * 3 + currentTime * 0.5) * 20
        const finalRadius = Math.max(10, radius + radiusVariation)

        // Calculate position on spiral
        const spiralX = centerX + Math.cos(angle) * finalRadius
        const spiralY = centerY + Math.sin(angle) * finalRadius

        // Base level that responds to volume and position
        let baseLevel = 30 * volume * (1 + Math.sin(angle + currentTime) * 0.3)

        // Create frequency bands based on spiral position rather than linear index
        let rhythmicResponse = 0
        let frequencyCharacter = 0

        // Inner spiral (low frequencies) - bass and kick
        if (finalRadius < maxRadius * 0.2) {
          rhythmicResponse = kickDrum * 150 * volume
          frequencyCharacter = Math.sin(currentTime * 0.2 + angle) * 80 * volume
        }
        // Middle spiral (mid frequencies) - snare and vocals
        else if (finalRadius < maxRadius * 0.5) {
          rhythmicResponse = (kickDrum * 100 + snareDrum * 80) * volume
          frequencyCharacter = Math.sin(currentTime * 0.4 + angle) * 60 * volume
        }
        // Outer spiral (high frequencies) - hi-hats and cymbals
        else {
          rhythmicResponse = hiHat * 70 * volume
          frequencyCharacter = Math.sin(currentTime * 1.0 + angle) * 50 * volume
        }

        // Add melodic content that follows the spiral
        let melodicContent =
          Math.sin(currentTime * 0.5 + angle * 2) * 40 * volume

        // Add randomness that's influenced by spiral position
        let randomVariation =
          (Math.random() - 0.5) * 15 * volume * (1 + Math.sin(angle) * 0.5)

        // Add spiral-specific movement effects
        let spiralEffect = Math.sin(angle * 5 + currentTime * 2) * 30 * volume

        data[i] = Math.max(
          0,
          Math.min(
            255,
            baseLevel +
              rhythmicResponse +
              melodicContent +
              randomVariation +
              frequencyCharacter +
              spiralEffect
          )
        )
      }

      // Debug: log sophisticated audio data occasionally
      if (p.frameCount % 60 === 0) {
        const avg = data.slice(0, 10).reduce((sum, val) => sum + val, 0) / 10
      }

      return data
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

      // Birth rate based on audio intensity and global birth rate - MUCH more dramatic!
      const birthRate = normalizedAudioLevel * globalParticleBirthRate * 2.0 // Increased from 0.2 to 2.0 - 10x more dramatic!

      // Multiple birth attempts per frame for more dramatic effect
      const birthAttempts = Math.floor(birthRate * 15) + 1 // Increased from 5 to 15 - 3x more attempts

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
      p.frameRate(60) // Set consistent 60 FPS for smooth animation
      p.background(0)

      // Set up FFT - always running
      setupFFT()

      // Set up audio listeners to connect FFT when audio starts
      const audioElements = document.querySelectorAll('audio')
      audioElements.forEach((audioElement) => {
        audioElement.addEventListener('play', () => {
          console.log('Audio started playing, attempting FFT connection...')
          setTimeout(connectToPlayingAudio, 100)
        })
      })

      // Watch for new audio elements
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.tagName === 'AUDIO') {
              console.log('New audio element detected, setting up listener...')
              node.addEventListener('play', () => {
                console.log(
                  'New audio started playing, attempting FFT connection...'
                )
                setTimeout(connectToPlayingAudio, 100)
              })
            }
          })
        })
      })
      observer.observe(document.body, { childList: true, subtree: true })

      // Periodic check for playing audio that needs FFT connection
      setInterval(() => {
        const playingAudio = Array.from(
          document.querySelectorAll('audio')
        ).find((el) => !el.paused && el.readyState >= 2 && el.src)
        if (playingAudio && fft) {
          // Check if FFT is getting data
          const testData = fft.analyze()
          const avg =
            testData.slice(0, 10).reduce((sum, val) => sum + val, 0) / 10
          if (avg === 0) {
            console.log(
              'Audio playing but FFT returning zeros, attempting connection...'
            )
            connectToPlayingAudio()
          }
        }
      }, 2000)

      // Update global variables to use full canvas dimensions
      margin = 5 // Minimal margin
      spacing = Math.max(100, containerWidth * 0.015) // Responsive spacing
      radius = Math.min(containerWidth, containerHeight) * 0.4 // Responsive radius

      // Generate TatsSketch-based particle positions
      tatShapePositions = generateTatShapePositions()

      // Setup audio analysis
      setupFFT()

      p.seed()

      // Calculate particle removal parameters AFTER particles are created
      calculateParticleRemovalParams()
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
      tatShapePositions = generateTatShapePositions(
        markovSeed,
        p.width,
        p.height,
        margin
      )

      // Re-seed particles for new canvas size
      particles = []
      p.seed()

      // Recalculate particle removal parameters for new particle count
      calculateParticleRemovalParams()
    }

    p.draw = () => {
      // console.log('frameRate', p.frameRate())
      // Get current audio data
      const audioData = getAudioData()

      // Remove particles based on playlist time
      removeParticlesBasedOnTime()

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
const ClientSideSketch = ({
  className,
  style,
  markovText,
  totalPlaylistDuration,
}) => {
  return (
    <P5SketchComponent
      sketch={createAudioReactiveGridSketch(markovText, totalPlaylistDuration)}
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
  totalPlaylistDuration = 0,
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
        totalPlaylistDuration={totalPlaylistDuration}
      />
    </Suspense>
  )
}

export default AudioReactiveGridSketch
