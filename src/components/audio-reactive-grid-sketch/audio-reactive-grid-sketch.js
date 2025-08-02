import React, { useState, useEffect } from 'react'
import P5SketchComponent from '../p5-sketch/p5-sketch'

const createAudioReactiveGridSketch =
  (p5, markovText = '') =>
  (p) => {
    let particles = []
    let margin = 25
    let tatShapePositions = []

    // Use the global audio analyzer from the audio player context
    let audioSetupAttempted = false

    const generateSeedFromText = (text) => {
      if (!text || typeof text !== 'string') return 0

      let seed = 0
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i)
        if (isFinite(charCode)) {
          seed += charCode * (i + 1)
        }
      }

      const finalSeed = seed % 10000
      return isFinite(finalSeed) ? finalSeed : 0
    }

    let markovSeed = generateSeedFromText(markovText)

    // Generate unique color scheme based on markov seed
    const generateColorScheme = (seed) => {
      // Use seed to create a pseudo-random but deterministic color generator
      const seededRandom = (s) => {
        const x = Math.sin(s) * 10000
        return x - Math.floor(x)
      }

      // Generate base hue rotation (0-360 degrees)
      const baseHue = seededRandom(seed) * 360

      // Generate color temperature and saturation preferences
      const warmth = seededRandom(seed + 1000) // 0-1, affects color temperature
      const saturation = 0.7 + seededRandom(seed + 2000) * 0.3 // 0.7-1.0, high saturation for neon
      const brightness = 0.8 + seededRandom(seed + 3000) * 0.2 // 0.8-1.0, bright for neon

      return {
        baseHue,
        warmth,
        saturation,
        brightness,
        // Pre-calculate color zones for each frequency band
        bass: (baseHue + seededRandom(seed + 100) * 60) % 360, // ±30° variation
        lowMid: (baseHue + 60 + seededRandom(seed + 200) * 40) % 360, // +60° ±20°
        mid: (baseHue + 120 + seededRandom(seed + 300) * 40) % 360, // +120° ±20°
        highMid: (baseHue + 180 + seededRandom(seed + 400) * 40) % 360, // +180° ±20°
        treble: (baseHue + 240 + seededRandom(seed + 500) * 40) % 360, // +240° ±20°
      }
    }

    const colorScheme = generateColorScheme(markovSeed)

    // Convert HSL to RGB for p5.js
    const hslToRgb = (h, s, l) => {
      h = h / 360
      const a = s * Math.min(l, 1 - l)
      const f = (n) => {
        const k = (n + h * 12) % 12
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
        return Math.round(255 * color)
      }
      return [f(0), f(8), f(4)]
    }

    if (!isFinite(markovSeed)) {
      markovSeed = Math.floor(Math.random() * 10000)
    }

    const generateTatShapePositions = () => {
      const shapes = [
        'horizontalLine',
        'verticalLine',
        'circle',
        'triangle',
        'square',
      ]
      const positions = []
      const centerX = p.width / 2 + ((markovSeed % 200) - 100)
      const centerY = p.height / 2 + (((markovSeed * 7) % 200) - 100)
      const typesCount = Math.floor(markovSeed % 5) + 1

      for (let i = 0; i < typesCount; i++) {
        const shapeIndex = Math.floor(
          (markovSeed * (i + 1) * 123) % shapes.length
        )
        const shapeType = shapes[shapeIndex]
        const shapePositions = generateShapePositions(
          centerX,
          centerY,
          shapeType,
          { width: p.width, height: p.height },
          markovSeed * (i + 1)
        )
        positions.push(...shapePositions)
      }
      return positions
    }

    const generateShapePositions = (
      centerX,
      centerY,
      shapeType,
      canvasDimensions,
      shapeSeed
    ) => {
      const positions = []
      const numParticles = 20 + (shapeSeed % 6)
      const { width, height } = canvasDimensions
      const insetMargin = margin + 30

      switch (shapeType) {
        case 'horizontalLine':
          for (let i = 0; i < numParticles; i++) {
            const t = i / (numParticles - 1)
            const x = insetMargin + t * (width - 2 * insetMargin)
            const y = centerY + (((shapeSeed * i) % 40) - 20)
            positions.push({ x, y })
          }
          break
        case 'verticalLine':
          for (let i = 0; i < numParticles; i++) {
            const t = i / (numParticles - 1)
            const x = centerX + (((shapeSeed * i) % 40) - 20)
            const y = insetMargin + t * (height - 2 * insetMargin)
            positions.push({ x, y })
          }
          break
        case 'circle':
          for (let i = 0; i < numParticles; i++) {
            const angle = (i / numParticles) * Math.PI * 2
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
            const vertices = [
              { x: centerX, y: insetMargin },
              { x: insetMargin, y: height - insetMargin },
              { x: width - insetMargin, y: height - insetMargin },
            ]
            if (i < 3) {
              positions.push(vertices[i])
            } else {
              const edgeIndex = (i - 3) % 3
              const t = ((shapeSeed * i) % 100) / 100
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
              const corners = [
                { x: insetMargin, y: insetMargin },
                { x: width - insetMargin, y: insetMargin },
                { x: width - insetMargin, y: height - insetMargin },
                { x: insetMargin, y: height - insetMargin },
              ]
              positions.push(corners[i])
            } else {
              const side = (i - 4) % 4
              const t = ((shapeSeed * i) % 100) / 100
              let x, y
              switch (side) {
                case 0:
                  x = insetMargin + t * (width - 2 * insetMargin)
                  y = insetMargin
                  break
                case 1:
                  x = width - insetMargin
                  y = insetMargin + t * (height - 2 * insetMargin)
                  break
                case 2:
                  x = width - insetMargin - t * (width - 2 * insetMargin)
                  y = height - insetMargin
                  break
                case 3:
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

    class Particle {
      constructor(x, y, r, op, startX, startY, seed) {
        this.x = isFinite(x) ? x : 0
        this.y = isFinite(y) ? y : 0
        this.r = isFinite(r) ? r : 1
        this.op = isFinite(op) ? op : 255
        this.startX = isFinite(startX) ? startX : 0
        this.startY = isFinite(startY) ? startY : 0
        this.seed = isFinite(seed) ? seed : Math.random() * 10000
        this.baseMov = 0.8 + (this.seed % 150) / 60
        this.mov = this.baseMov
        this.slow = 10 + (this.seed % 200) / 2
        this.fadeRate = 0.2 + (this.seed % 100) / 100
        this.isFading = true
        this.colorOffset = (this.seed % 360) / 360
        this.colorSpeed = 0.3 + (this.seed % 100) / 40

        // Smoothed brightness values for temporal stability
        this.smoothedBrightness = 0
        this.smoothedSize = this.r
        this.smoothedOpacity = 10
        this.brightnessSmoothing = 0.15 + (this.seed % 50) / 1000 // 0.15-0.2 range for variation

        // Smoothed color values for slower color transitions
        this.smoothedColorIntensity = 0.2
        this.smoothedHue = 200 // Initialize with neutral blue hue
        this.colorSmoothing = this.brightnessSmoothing * 0.25 // 75% slower than brightness

        if (!isFinite(this.baseMov)) this.baseMov = 1
        if (!isFinite(this.mov)) this.mov = 1
        if (!isFinite(this.slow)) this.slow = 10
        if (!isFinite(this.fadeRate)) this.fadeRate = 0.2
        if (!isFinite(this.colorOffset)) this.colorOffset = 0
        if (!isFinite(this.colorSpeed)) this.colorSpeed = 0.3
        if (!isFinite(this.colorSmoothing)) this.colorSmoothing = 0.04
      }

      // Create organic frequency band mapping for textural variation
      getFrequencyBand(maxBands) {
        // Use particle position and seed to create organic frequency zones

        // Distance from center creates concentric frequency rings
        let centerX = p.width / 2
        let centerY = p.height / 2
        let distanceFromCenter = Math.sqrt(
          Math.pow(this.startX - centerX, 2) +
            Math.pow(this.startY - centerY, 2)
        )
        let maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2))
        let distanceRatio = distanceFromCenter / maxDistance // 0 to 1

        // Angle from center creates radial frequency spokes
        let angle = Math.atan2(this.startY - centerY, this.startX - centerX)
        let normalizedAngle = (angle + Math.PI) / (2 * Math.PI) // 0 to 1

        // Noise creates organic texture
        let noiseX = this.startX * 0.01
        let noiseY = this.startY * 0.01
        let noiseValue = p.noise(noiseX, noiseY, this.seed * 0.001) // 0 to 1

        // Seed creates particle-specific frequency affinity
        let seedRatio = (this.seed % 1000) / 1000 // 0 to 1

        // Combine different mapping strategies for complex patterns
        let frequencyMix =
          distanceRatio * 0.4 + // Concentric rings (bass center, treble edges) - increased
          normalizedAngle * 0.3 + // Radial spokes - increased
          noiseValue * 0.2 + // Organic texture - reduced
          seedRatio * 0.1 // Random variation

        // Bias towards bass frequencies for kick drum responsiveness
        // Instead of pushing to extremes, bias towards lower frequencies
        frequencyMix = Math.pow(frequencyMix, 0.7) // Bias towards bass (0.7 < 1)

        // Map to frequency bands - emphasize bass range
        let baseFreq = frequencyMix * maxBands

        // Extra bass boost - ensure center particles get very low frequencies
        if (distanceRatio < 0.3) {
          // Particles near center
          baseFreq = baseFreq * 0.6 // Force them into lower frequency range
        }

        // Add time-based slow drift for subtle animation
        let timeDrift = Math.sin(p.frameCount * 0.01 + this.seed * 0.1) * 2

        return Math.max(0, Math.min(maxBands - 1, baseFreq + timeDrift))
      }

      show(audioData) {
        p.noStroke()

        if (!audioData || !Array.isArray(audioData) || audioData.length === 0) {
          audioData = new Array(64).fill(0)
        }

        // Use the same organic frequency mapping as movement
        let audioIndexFloat = this.getFrequencyBand(audioData.length)
        if (!isFinite(audioIndexFloat)) audioIndexFloat = 0

        let audioIndex1 = Math.floor(audioIndexFloat)
        let audioIndex2 = Math.min(audioIndex1 + 1, audioData.length - 1)
        let blend = audioIndexFloat - audioIndex1
        if (!isFinite(blend)) blend = 0

        let audioLevel1 = audioData[audioIndex1] || 0
        let audioLevel2 = audioData[audioIndex2] || 0
        let audioLevel = audioLevel1 * (1 - blend) + audioLevel2 * blend

        // Apply same amplification as movement for consistent sensitivity
        let rawNormalizedLevel = (audioLevel / 255) * 2.5
        rawNormalizedLevel = Math.pow(rawNormalizedLevel, 0.7) // Power curve to boost quiet sounds
        rawNormalizedLevel = Math.min(rawNormalizedLevel, 1.0) // Cap at 1.0
        if (!isFinite(rawNormalizedLevel)) rawNormalizedLevel = 0

        // Smooth the brightness over time to reduce jarring changes
        let targetBrightness = rawNormalizedLevel
        this.smoothedBrightness =
          this.smoothedBrightness +
          (targetBrightness - this.smoothedBrightness) *
            this.brightnessSmoothing

        // Use smoothed values with gentle base levels
        let normalizedLevel = this.smoothedBrightness

        // Smooth size changes
        let targetSize = this.r + normalizedLevel * 0.5
        this.smoothedSize =
          this.smoothedSize +
          (targetSize - this.smoothedSize) * this.brightnessSmoothing * 2
        let audioRadius = Math.max(this.r * 2, this.smoothedSize) // Minimum size

        // Smooth opacity changes with higher base level
        let targetOpacity = 140 + normalizedLevel * 115 // 140-255 range (higher base)
        this.smoothedOpacity =
          this.smoothedOpacity +
          (targetOpacity - this.smoothedOpacity) *
            this.brightnessSmoothing *
            0.1
        let baseOpacity = this.smoothedOpacity

        // Creative frequency-based color mapping with smoothing
        let frequencyRatio = audioIndex1 / (audioData.length - 1) // 0 to 1
        let targetColorIntensity = normalizedLevel * 0.8 + 0.2 // 0.2 to 1.0 (never fully dark)

        // Smooth color intensity changes
        this.smoothedColorIntensity =
          this.smoothedColorIntensity +
          (targetColorIntensity - this.smoothedColorIntensity) *
            this.colorSmoothing

        // Determine target hue based on frequency
        let currentTargetHue
        if (frequencyRatio < 0.25) {
          currentTargetHue = colorScheme.bass
        } else if (frequencyRatio < 0.45) {
          currentTargetHue = colorScheme.lowMid
        } else if (frequencyRatio < 0.65) {
          currentTargetHue = colorScheme.mid
        } else if (frequencyRatio < 0.82) {
          currentTargetHue = colorScheme.highMid
        } else {
          currentTargetHue = colorScheme.treble
        }

        // Initialize smoothedHue on first frame if needed
        if (this.smoothedHue === 200) {
          this.smoothedHue = currentTargetHue
        }

        // Smooth hue transitions
        this.smoothedHue =
          this.smoothedHue +
          (currentTargetHue - this.smoothedHue) * this.colorSmoothing

        // Use smoothed values for final color calculation
        let targetHue = this.smoothedHue
        let saturation = colorScheme.saturation
        let lightness = Math.min(
          0.7,
          colorScheme.brightness * this.smoothedColorIntensity
        ) // Cap lightness
        let r, g, b

        // Convert HSL to RGB
        const [red, green, blue] = hslToRgb(targetHue, saturation, lightness)
        r = red
        g = green
        b = blue

        // Keep colors pure - no white shimmer effect

        // Keep colors within safe range - no saturation boost to avoid white
        r = Math.min(220, Math.floor(r)) // Cap at 220 instead of 255
        g = Math.min(220, Math.floor(g))
        b = Math.min(220, Math.floor(b))

        // Electric pulsing effect - keep within safe range
        let pulseMultiplier = 0.7 + normalizedLevel * 0.3 // 0.7 to 1.0 (safer range)
        r = Math.floor(r * pulseMultiplier)
        g = Math.floor(g * pulseMultiplier)
        b = Math.floor(b * pulseMultiplier)

        // Draw main particle
        p.fill(r, g, b, baseOpacity)
        p.ellipse(this.x, this.y, audioRadius)
        p.ellipse(
          this.x + p.noise(Math.sin(this.x)) * 10,
          this.y + p.noise(Math.cos(this.y)) * 10,
          audioRadius * 0.8
        )
        p.ellipse(
          this.x - p.noise(Math.sin(this.x)) * 10,
          this.y - p.noise(Math.cos(this.y)) * 10,
          audioRadius * 0.6
        )
        p.ellipse(
          this.x + p.noise(Math.sin(this.x)) * 20,
          this.y + p.noise(Math.cos(this.y)) * 20,
          audioRadius * 0.4
        )
        p.ellipse(
          this.x - p.noise(Math.sin(this.x)) * 20,
          this.y - p.noise(Math.cos(this.y)) * 20,
          audioRadius * 0.2
        )

        // Enhanced neon glow effects - more visible with faint main particles
        if (normalizedLevel > 0.05) {
          // Much lower threshold for better visibility
          let glowIntensity = Math.max(0, (normalizedLevel - 0.05) / 0.95) // 0 to 1

          // Large outer glow - colored aura (always present, varies in intensity)
          let outerGlowSize = audioRadius * (2.5 + normalizedLevel * 2.0)
          let outerGlowOpacity = Math.max(30, glowIntensity * 100) // Higher minimum and max opacity
          p.fill(r, g, b, outerGlowOpacity)
          p.ellipse(this.x, this.y, outerGlowSize)

          // Medium glow - more saturated (smoother threshold)
          if (normalizedLevel > 0.15) {
            let mediumGlowSize = audioRadius * (1.8 + normalizedLevel * 1.5)
            let mediumGlowOpacity = Math.max(25, (normalizedLevel - 0.15) * 200) // Higher intensity
            // Use base colors for glow - no boost to avoid white
            let glowR = r
            let glowG = g
            let glowB = b
            p.fill(glowR, glowG, glowB, mediumGlowOpacity)
            p.ellipse(this.x, this.y, mediumGlowSize)
          }

          // Enhanced core using saturated color instead of white
          if (normalizedLevel > 0.3) {
            let coreOpacity = Math.max(20, (normalizedLevel - 0.3) * 180) // Higher intensity
            let coreSize = audioRadius * 0.6
            // Use base color for core - no boost to avoid white
            let coreR = r
            let coreG = g
            let coreB = b
            p.fill(coreR, coreG, coreB, Math.min(150, coreOpacity))
            p.ellipse(this.x, this.y, coreSize)
          }
        }

        // Electric neon trails for ultra-active particles
        if (normalizedLevel > 0.8) {
          let trailIntensity = (normalizedLevel - 0.8) * 5 // 0-1

          // Multiple trail segments for electric effect
          for (let t = 0.2; t <= 0.6; t += 0.2) {
            let trailX = this.x + (this.startX - this.x) * t
            let trailY = this.y + (this.startY - this.y) * t
            let trailOpacity = 1 * trailIntensity * (1 - t) // Fixed trail opacity since main particle is now very faint
            let trailSize = audioRadius * (0.8 - t * 0.3)

            // Use base colors for trails - no boost to avoid white
            let trailR = r
            let trailG = g
            let trailB = b

            p.fill(trailR, trailG, trailB, trailOpacity)
            p.ellipse(trailX, trailY, trailSize)
            p.ellipse(trailX + 10, trailY + 10, trailSize * 0.8)
            p.ellipse(trailX - 10, trailY - 10, trailSize * 0.6)
            p.ellipse(trailX + 20, trailY + 20, trailSize * 0.4)
            p.ellipse(trailX - 20, trailY - 20, trailSize * 0.2)
          }
        }
      }

      move(i, audioData, isPlaying = false) {
        if (!audioData || !Array.isArray(audioData) || audioData.length === 0) {
          audioData = new Array(64).fill(0)
        }

        // Only move particles if audio is actually playing
        if (!isPlaying) {
          return // Stay completely still when no audio is playing
        }

        // Create organic frequency mapping based on particle position and seed
        let audioIndexFloat = this.getFrequencyBand(audioData.length)
        if (!isFinite(audioIndexFloat)) audioIndexFloat = 0

        let audioIndex1 = Math.floor(audioIndexFloat)
        let audioIndex2 = Math.min(audioIndex1 + 1, audioData.length - 1)
        let blend = audioIndexFloat - audioIndex1
        if (!isFinite(blend)) blend = 0

        // Get the frequency level for this particle
        let audioLevel1 = audioData[audioIndex1] || 0
        let audioLevel2 = audioData[audioIndex2] || 0
        let audioLevel = audioLevel1 * (1 - blend) + audioLevel2 * blend

        // Amplify audio sensitivity by 2.5x and apply power curve for better low-volume response
        let normalizedLevel = (audioLevel / 255) * 2.5
        normalizedLevel = Math.pow(normalizedLevel, 0.7) // Power curve to boost quiet sounds
        normalizedLevel = Math.min(normalizedLevel, 1.0) // Cap at 1.0
        if (!isFinite(normalizedLevel)) normalizedLevel = 0

        // Free-roaming movement system based on audio energy and frequency
        let baseMovement = (0.24 + normalizedLevel * 1.2) * 1.5 // 0.36 to 2.16 movement speed (+50%)
        let t = p.frameCount / 60.0

        // Primary direction based on audio energy and frequency band
        let primaryDirection =
          (this.seed + audioIndex1 * 0.8 + normalizedLevel * 3 + t * 0.3) % // Increased direction change speed by 50%
          (Math.PI * 2)

        // Secondary direction for complex movement patterns
        let secondaryDirection =
          (this.seed * 2 + audioIndex1 * 1.2 + t * 0.225) % (Math.PI * 2) // Increased direction change speed by 50%

        // Audio-driven movement - particles move in response to their frequency band
        if (normalizedLevel > 0.01) {
          // Lowered threshold from 0.05 to 0.01 for higher sensitivity
          let audioForce = normalizedLevel * baseMovement * 0.8 // Reduced movement multiplier

          // Main movement direction
          this.x += Math.cos(primaryDirection) * audioForce
          this.y += Math.sin(primaryDirection) * audioForce

          // Add secondary movement for more complex paths
          this.x += Math.cos(secondaryDirection) * audioForce * 0.2 // Reduced from 0.4
          this.y += Math.sin(secondaryDirection) * audioForce * 0.2
        }

        // Perlin noise for organic, flowing movement
        let noiseScale = 0.008
        let noiseTime = t * 0.3 // Increased by 50% for faster noise evolution
        let noiseStrength = (0.8 + normalizedLevel * 1.5) * 1.5 // Increased by 50%

        let noiseX =
          p.noise(this.x * noiseScale, this.y * noiseScale, noiseTime) - 0.5
        let noiseY =
          p.noise(
            this.x * noiseScale + 100,
            this.y * noiseScale + 100,
            noiseTime
          ) - 0.5

        this.x += noiseX * noiseStrength
        this.y += noiseY * noiseStrength

        // Frequency-based flow patterns
        let frequencyFlow =
          Math.sin(t * 0.6 + audioIndex1 * 0.3) * normalizedLevel * 1.8 // Increased time component by 50%
        let flowDirection = (audioIndex1 / audioData.length) * Math.PI * 2

        this.x += Math.cos(flowDirection) * frequencyFlow
        this.y += Math.sin(flowDirection) * frequencyFlow

        // Very slight gravitational force towards center
        let centerX = p.width / 2
        let centerY = p.height / 2
        let distanceToCenter = Math.sqrt(
          Math.pow(this.x - centerX, 2) + Math.pow(this.y - centerY, 2)
        )

        if (distanceToCenter > 0) {
          let gravityStrength = 0.002 // Very weak gravitational force
          let gravityForce =
            gravityStrength * Math.min(distanceToCenter / 100, 1.0) // Scale with distance

          let directionToCenter = Math.atan2(centerY - this.y, centerX - this.x)
          this.x += Math.cos(directionToCenter) * gravityForce
          this.y += Math.sin(directionToCenter) * gravityForce
        }

        // Canvas boundary handling - reset to starting position if off canvas
        let margin = 20
        if (
          this.x < -margin ||
          this.x > p.width + margin ||
          this.y < -margin ||
          this.y > p.height + margin
        ) {
          this.x = this.startX
          this.y = this.startY
        }

        // Final safety checks
        if (!isFinite(this.x)) this.x = this.startX
        if (!isFinite(this.y)) this.y = this.startY
      }

      update() {
        // No constraints - particles are free to roam!
        // Boundary wrapping is handled in the move() method
      }
    }

    // Simple setup that uses the global analyzer from audio player context
    const setupAudioAnalysis = () => {
      if (typeof window === 'undefined' || audioSetupAttempted) return
      audioSetupAttempted = true
    }

    const getAudioData = () => {
      // Use the global analyzer from audio player context
      const analyzer = window.audioAnalyzer

      if (!analyzer) {
        return { data: new Array(64).fill(0), isPlaying: false }
      }

      const bufferLength = analyzer.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyzer.getByteFrequencyData(dataArray)

      // Check if audio is playing by looking for audio elements
      let isPlaying = false
      const audioElements = document.querySelectorAll('audio')
      for (let audio of audioElements) {
        if (!audio.paused && !audio.ended && audio.readyState > 0) {
          isPlaying = true
          break
        }
      }

      return { data: Array.from(dataArray), isPlaying }
    }

    p.setup = () => {
      const container = document.getElementById('sketch-container')
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
      setupAudioAnalysis()
      tatShapePositions = generateTatShapePositions()
      p.seed()
    }

    p.windowResized = () => {
      const container = document.getElementById('sketch-container')
      p.resizeCanvas(container.offsetWidth, container.offsetHeight)
      p.background(0)
      tatShapePositions = generateTatShapePositions()
      particles = []
      p.seed()
    }

    p.draw = () => {
      // p.background(0, 0, 0, 10) // Clear the background each frame

      // Re-check for audio every 2 seconds if not set up
      if (!audioSetupAttempted && p.frameCount % 120 === 0) {
        setupAudioAnalysis()
      }

      const audioInfo = getAudioData()
      const audioData = audioInfo.data
      const isPlaying = audioInfo.isPlaying

      for (let i = 0; i < particles.length; i++) {
        particles[i].move(i, audioData, isPlaying)
        particles[i].show(audioData)
        particles[i].update()
      }
    }

    p.seed = () => {
      if (tatShapePositions.length === 0) {
        console.warn(
          'No TatsSketch positions generated, falling back to random positioning'
        )
        for (let y = margin; y < p.height - margin; y += 50) {
          for (let x = margin; x < p.width - margin; x += 50) {
            tatShapePositions.push({ x, y })
          }
        }
      }

      for (let i = 0; i < tatShapePositions.length; i++) {
        const position = tatShapePositions[i]
        let particleSeed =
          (markovSeed + position.x * position.y + i * 123) % 10000
        let startX = Math.max(margin, Math.min(p.width - margin, position.x))
        let startY = Math.max(margin, Math.min(p.height - margin, position.y))
        const variation = 5
        startX += (((particleSeed % 100) - 50) / 50) * variation
        startY += ((((particleSeed * 7) % 100) - 50) / 50) * variation
        startX = Math.max(margin, Math.min(p.width - margin, startX))
        startY = Math.max(margin, Math.min(p.height - margin, startY))

        let particle = new Particle(
          startX,
          startY,
          2,
          256,
          startX,
          startY,
          particleSeed
        )
        particles.push(particle)
      }
    }
  }

const AudioReactiveGridSketch = ({
  className = '',
  style = {},
  markovText = '',
}) => {
  const [sketch, setSketch] = useState(null)

  useEffect(() => {
    let isMounted = true

    // Simple p5 import without p5.sound complications
    import('p5')
      .then((p5Module) => {
        if (isMounted) {
          const p5 = p5Module.default
          setSketch(() => createAudioReactiveGridSketch(p5, markovText))
        }
      })
      .catch((error) => {
        console.error('Failed to load p5:', error)
      })

    return () => {
      isMounted = false
    }
  }, [markovText])

  return (
    <div id="sketch-container" className={className} style={style}>
      {sketch && (
        <P5SketchComponent
          sketch={sketch}
          className={className}
          style={style}
        />
      )}
    </div>
  )
}

export default AudioReactiveGridSketch
