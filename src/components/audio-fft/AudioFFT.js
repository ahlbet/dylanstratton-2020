// src/components/AudioFFT.js
import React, { useRef, useEffect } from 'react'
import { useAudioPlayer } from '../../contexts/audio-player-context/audio-player-context'
import {
  generateSeedFromText,
  generateTatShapePositions,
} from '../../utils/shape-generator'
export default function AudioFFT({ markovText = '' }) {
  const containerRef = useRef(null)
  const p5InstanceRef = useRef(null)
  const { audioRef } = useAudioPlayer()

  console.log('audioRef', audioRef)

  useEffect(() => {
    // guard: we need the audio DOM node + global p5 loaded (via your gatsby-ssr.js script tags)
    if (typeof window === 'undefined' || !window.p5 || !audioRef.current) {
      return
    }

    // 1) Guard: if we already spun up a sketch, do nothing
    if (p5InstanceRef.current) return

    const P5 = window.p5

    const sketch = (p) => {
      let fft
      let sourceNode
      let particles = []
      let frequencyData = []
      let smoothedData = []

      // Generate seed from markov text
      const markovSeed = generateSeedFromText(markovText)
      let tatShapePositions = []

      class Particle {
        constructor(x, y, amp, frequencyBand) {
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

          // Different behaviors based on frequency band
          const angle = p.random(p.TWO_PI)
          let speed, size, alphaDecay

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

          switch (frequencyBand) {
            case 0: // Sub-bass (20-60 Hz)
              speed = p.map(exponentialAmp, 0, 1, 0, 8)
              size = p.map(exponentialAmp, 0, 1, 5, 25)
              alphaDecay = 1.5
              this.colorHue = (primaryHue + p.random(-10, 10) + 360) % 360
              this.colorSaturation = p.random(90, 100)
              this.colorBrightness = p.random(90, 100)
              this.noiseStrength *= 0.3
              break
            case 1: // Bass (60-250 Hz)
              speed = p.map(exponentialAmp, 0, 1, 0, 15)
              size = p.map(exponentialAmp, 0, 1, 4, 22)
              alphaDecay = 2
              this.colorHue = (primaryHue + 30 + p.random(-8, 8) + 360) % 360
              this.colorSaturation = p.random(85, 100)
              this.colorBrightness = p.random(85, 100)
              this.noiseStrength *= 0.6
              break
            case 2: // Low Mid (250-500 Hz)
              speed = p.map(exponentialAmp, 0, 1, 0, 18)
              size = p.map(exponentialAmp, 0, 1, 3, 18)
              alphaDecay = 2.5
              this.colorHue = (primaryHue + 60 + p.random(-8, 8) + 360) % 360
              this.colorSaturation = p.random(80, 100)
              this.colorBrightness = p.random(80, 100)
              this.noiseStrength *= 1.0
              break
            case 3: // Mid (500-2000 Hz)
              speed = p.map(exponentialAmp, 0, 1, 0, 20)
              size = p.map(exponentialAmp, 0, 1, 2, 15)
              alphaDecay = 3
              this.colorHue = (primaryHue + 90 + p.random(-8, 8) + 360) % 360
              this.colorSaturation = p.random(75, 100)
              this.colorBrightness = p.random(75, 100)
              this.noiseStrength *= 1.4
              break
            case 4: // High Mid (2000-4000 Hz)
              speed = p.map(exponentialAmp, 0, 1, 0, 22)
              size = p.map(exponentialAmp, 0, 1, 1, 12)
              alphaDecay = 3.5
              this.colorHue = (primaryHue + 120 + p.random(-8, 8) + 360) % 360
              this.colorSaturation = p.random(70, 100)
              this.colorBrightness = p.random(70, 100)
              this.noiseStrength *= 1.8
              break
            case 5: // Presence (4000-6000 Hz)
              speed = p.map(exponentialAmp, 0, 1, 0, 25)
              size = p.map(exponentialAmp, 0, 1, 1, 10)
              alphaDecay = 4
              this.colorHue = (primaryHue + 150 + p.random(-8, 8) + 360) % 360
              this.colorSaturation = p.random(65, 100)
              this.colorBrightness = p.random(65, 100)
              this.noiseStrength *= 2.2
              break
            case 6: // Brilliance (6000-8000 Hz)
              speed = p.map(exponentialAmp, 0, 1, 0, 28)
              size = p.map(exponentialAmp, 0, 1, 1, 8)
              alphaDecay = 4.5
              this.colorHue = (primaryHue + 180 + p.random(-8, 8) + 360) % 360
              this.colorSaturation = p.random(60, 100)
              this.colorBrightness = p.random(60, 100)
              this.noiseStrength *= 2.6
              break
            case 7: // Air (8000-20000 Hz)
              speed = p.map(exponentialAmp, 0, 1, 0, 30)
              size = p.map(exponentialAmp, 0, 1, 1, 6)
              alphaDecay = 5
              this.colorHue = (primaryHue + 210 + p.random(-8, 8) + 360) % 360
              this.colorSaturation = p.random(55, 100)
              this.colorBrightness = p.random(55, 100)
              this.noiseStrength *= 3.0
              break
            default:
              speed = p.map(exponentialAmp, 0, 1, 0, 15)
              size = p.map(exponentialAmp, 0, 1, 2, 15)
              alphaDecay = 3
              this.colorHue = (primaryHue + p.random(-20, 20) + 360) % 360
              this.colorSaturation = p.random(50, 100)
              this.colorBrightness = p.random(60, 100)
          }

          this.vel = p
            .createVector(p.cos(angle), p.sin(angle))
            .mult(speed * 0.05) // Increased from 0.02 to 0.05
          this.alpha = 1
          this.size = size * 0.2 // Increased from 0.2 to 0.4
          this.alphaDecay = alphaDecay
          this.originalSize = size
          this.lifeFrames = 0
          this.maxLifeFrames = 200 + p.random(50) // Reduced from 300 to 200 for more responsive feel
          this.audioReactivity = exponentialAmp // Store for dynamic updates
        }

        update() {
          // Individual noise-based movement
          const noiseX = p.noise(this.noiseOffsetX) * 2 - 1
          const noiseY = p.noise(this.noiseOffsetY) * 2 - 1

          // Add smooth noise movement
          const noiseForce = p
            .createVector(noiseX, noiseY)
            .mult(this.noiseStrength * 0.05) // Increased from 0.02 to 0.05
          this.vel.add(noiseForce)

          // Individual oscillation
          const oscillationX =
            p.sin(p.frameCount * this.oscillationSpeed + this.individualSeed) *
            this.oscillationAmplitude *
            0.005 // Increased from 0.002 to 0.005
          const oscillationY =
            p.cos(p.frameCount * this.oscillationSpeed + this.individualSeed) *
            this.oscillationAmplitude *
            0.005 // Increased from 0.002 to 0.005
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

          // Different movement patterns based on frequency band (now layered with individual movement)
          switch (this.frequencyBand) {
            case 0: // Sub-bass - strong gravitational pull to center
              const center = p.createVector(p.width / 2, p.height / 2)
              const toCenter = P5.Vector.sub(center, this.pos)
              toCenter.normalize()
              toCenter.mult(0.6 * this.audioReactivity) // Audio-reactive strength
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

          // Limit velocity based on audio reactivity
          this.vel.limit(1.0 + this.audioReactivity * 2.0) // Increased limit and made it audio-reactive
        }

        draw() {
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

      p.setup = () => {
        const containerWidth =
          p.canvas && p.canvas.parentElement
            ? p.canvas.parentElement.offsetWidth
            : 800
        const containerHeight =
          p.canvas && p.canvas.parentElement
            ? p.canvas.parentElement.offsetHeight
            : 400

        p.createCanvas(containerWidth, containerHeight)

        // Ensure canvas is properly positioned within container
        if (p.canvas) {
          p.canvas.style.position = 'absolute'
          p.canvas.style.top = '0'
          p.canvas.style.left = '0'
          p.canvas.style.zIndex = '1'
        }
        // 1) grab p5.sound's AudioContext
        const audioCtx = p.getAudioContext()
        const audioEl = audioRef.current

        // 2) ensure CORS so the context can read samples
        audioEl.crossOrigin = 'anonymous'

        // 3) resume on user "play" gesture
        audioEl.addEventListener('play', () => {
          if (audioCtx.state === 'suspended') {
            audioCtx.resume()
          }
        })

        // —— GUARD: only create once per element —— //
        if (!audioEl.__p5AudioSource) {
          sourceNode = audioCtx.createMediaElementSource(audioEl)
          sourceNode.connect(audioCtx.destination)
          audioEl.__p5AudioSource = sourceNode
        } else {
          sourceNode = audioEl.__p5AudioSource
        }
        // — end guard — //

        // 4) set up FFT with higher resolution for more granular analysis
        fft = new P5.FFT(0.9, 2048) // Increased from 1024 to 2048 for more detail
        fft.setInput(sourceNode)

        // Initialize frequency data arrays
        frequencyData = new Array(8).fill(0)
        smoothedData = new Array(8).fill(0)

        // Generate Tat shape positions for particle spawning
        tatShapePositions = generateTatShapePositions(
          markovSeed,
          containerWidth,
          containerHeight,
          5
        )

        // Add dynamic movement to spawn positions
        tatShapePositions.forEach((pos, index) => {
          pos.originalX = pos.x
          pos.originalY = pos.y
          pos.movementSpeed = p.random(0.5, 2.0)
          pos.movementRadius = p.random(20, 360)
          pos.movementAngle = p.random(p.TWO_PI)
          pos.movementDirection = p.random([-1, 1])
        })
      }

      p.windowResized = () => {
        const containerWidth =
          p.canvas && p.canvas.parentElement
            ? p.canvas.parentElement.offsetWidth
            : 800
        const containerHeight =
          p.canvas && p.canvas.parentElement
            ? p.canvas.parentElement.offsetHeight
            : 400
        p.resizeCanvas(containerWidth, containerHeight)

        // Regenerate Tat shape positions for new canvas size
        tatShapePositions = generateTatShapePositions(
          markovSeed,
          containerWidth,
          containerHeight,
          5
        )
      }

      // Update spawn positions dynamically
      const updateSpawnPositions = () => {
        tatShapePositions.forEach((pos) => {
          // Circular movement around original position
          pos.movementAngle += pos.movementSpeed * 0.01 * pos.movementDirection

          pos.x =
            pos.originalX + Math.cos(pos.movementAngle) * pos.movementRadius
          pos.y =
            pos.originalY + Math.sin(pos.movementAngle) * pos.movementRadius

          // Keep within canvas bounds
          pos.x = Math.max(20, Math.min(p.width - 20, pos.x))
          pos.y = Math.max(20, Math.min(p.height - 20, pos.y))
        })
      }

      // Get energy from custom frequency ranges for more granular control
      const getFrequencyEnergy = (startFreq, endFreq) => {
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

      p.draw = () => {
        // p.background(0, 50)
        fft.analyze() // update the spectrum

        // Update spawn positions
        updateSpawnPositions()

        // Get energy from custom frequency ranges for more granular analysis
        const frequencyRanges = [
          { start: 20, end: 60, name: 'sub-bass' }, // 0
          { start: 60, end: 250, name: 'bass' }, // 1
          { start: 250, end: 500, name: 'low-mid' }, // 2
          { start: 500, end: 2000, name: 'mid' }, // 3
          { start: 2000, end: 4000, name: 'high-mid' }, // 4
          { start: 4000, end: 6000, name: 'presence' }, // 5
          { start: 6000, end: 8000, name: 'brilliance' }, // 6
          { start: 8000, end: 20000, name: 'air' }, // 7
        ]

        // Update frequency data with smoothing
        frequencyRanges.forEach((range, index) => {
          const rawEnergy = getFrequencyEnergy(range.start, range.end)
          // Apply smoothing to reduce jitter
          smoothedData[index] = smoothedData[index] * 0.7 + rawEnergy * 0.3
          frequencyData[index] = smoothedData[index]
        })

        // Create particles for each frequency band with more dramatic mapping
        const frequencyBands = frequencyRanges.map((range, index) => ({
          amp: frequencyData[index],
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

        // Limit total particles based on canvas size
        const canvasArea = p.width * p.height
        const pixelsPerParticle = 3000 // Reduced from 5000 for more particles
        const maxTotalParticles = Math.floor(canvasArea / pixelsPerParticle)
        const currentParticleCount = particles.length

        frequencyBands.forEach((band) => {
          // More dramatic particle count mapping using exponential scaling
          const normalizedAmp = band.amp / 255
          const exponentialAmp = Math.pow(normalizedAmp, 0.4) // More sensitive to low values

          // Particle counts scaled by canvas size and audio intensity
          const canvasScale = Math.sqrt(canvasArea) / 400 // Increased from 500
          let baseParticles
          switch (band.band) {
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

          // Scale particles based on canvas size and make more sensitive to audio
          const maxParticles = Math.max(
            1,
            Math.floor(baseParticles * canvasScale * exponentialAmp * 3) // Multiplied by 3 for more sensitivity
          )

          const count = p.floor(maxParticles)

          // Only spawn if we're under the total particle limit
          if (currentParticleCount < maxTotalParticles) {
            for (let i = 0; i < count; i++) {
              let spawnX, spawnY

              // Use Tat shape positions for spawning when available
              if (tatShapePositions.length > 0) {
                const positionIndex =
                  (band.band * count + i) % tatShapePositions.length
                const position = tatShapePositions[positionIndex]

                // Add smooth noise to spawn position
                const noiseOffsetX = position.x * 0.01 + p.frameCount * 0.005
                const noiseOffsetY = position.y * 0.01 + p.frameCount * 0.005
                const noiseX = (p.noise(noiseOffsetX) - 0.5) * 60 // Increased from 40
                const noiseY = (p.noise(noiseOffsetY) - 0.5) * 60 // Increased from 40

                spawnX = position.x + noiseX
                spawnY = position.y + noiseY
              } else {
                // Fallback to original spawn areas with smooth noise movement
                const time = p.frameCount * 0.01
                let baseX, baseY

                switch (band.spawnArea) {
                  case 'center':
                    const centerRadius = 100 + Math.sin(time * 0.5) * 30 // Increased radius
                    const centerAngle = time * 0.3
                    baseX = p.width / 2 + Math.cos(centerAngle) * centerRadius
                    baseY = p.height / 2 + Math.sin(centerAngle) * centerRadius
                    break
                  case 'left':
                    const leftY =
                      p.height * 0.5 + Math.sin(time * 0.4) * p.height * 0.4 // Increased movement
                    baseX = p.width * 0.15 + Math.sin(time * 0.6) * 50 // Increased movement
                    baseY = leftY
                    break
                  case 'right':
                    const rightY =
                      p.height * 0.5 + Math.cos(time * 0.4) * p.height * 0.4
                    baseX = p.width * 0.85 + Math.sin(time * 0.6) * 50
                    baseY = rightY
                    break
                  case 'top':
                    const topX =
                      p.width * 0.5 + Math.sin(time * 0.5) * p.width * 0.4
                    baseX = topX
                    baseY = p.height * 0.15 + Math.sin(time * 0.7) * 50
                    break
                  case 'bottom':
                    const bottomX =
                      p.width * 0.5 + Math.cos(time * 0.5) * p.width * 0.4
                    baseX = bottomX
                    baseY = p.height * 0.85 + Math.sin(time * 0.7) * 50
                    break
                  case 'top-left':
                    baseX = p.width * 0.2 + Math.sin(time * 0.3) * 40
                    baseY = p.height * 0.2 + Math.cos(time * 0.4) * 40
                    break
                  case 'bottom-right':
                    baseX = p.width * 0.8 + Math.sin(time * 0.3) * 40
                    baseY = p.height * 0.8 + Math.cos(time * 0.4) * 40
                    break
                  default:
                    baseX = p.random(0, p.width)
                    baseY = p.random(0, p.height)
                }

                // Add smooth noise to fallback spawn positions
                const noiseOffsetX =
                  baseX * 0.01 + p.frameCount * 0.003 + band.band * 100
                const noiseOffsetY =
                  baseY * 0.01 + p.frameCount * 0.003 + band.band * 100
                const noiseX = (p.noise(noiseOffsetX) - 0.5) * 50 // Increased from 30
                const noiseY = (p.noise(noiseOffsetY) - 0.5) * 50 // Increased from 30

                spawnX = baseX + noiseX
                spawnY = baseY + noiseY
              }

              particles.push(new Particle(spawnX, spawnY, band.amp, band.band))
            }
          }
        })

        // update & draw
        for (let i = particles.length - 1; i >= 0; i--) {
          const pt = particles[i]
          pt.update()
          pt.draw()
          if (pt.isDead()) particles.splice(i, 1)
        }

        // Debug info (optional - remove in production)
        if (p.frameCount % 60 === 0) {
          console.log(
            'Frequency bands:',
            frequencyBands.map((band) => ({
              name: band.name,
              amp: Math.round(band.amp),
            }))
          )
        }
      }
    }

    // 4) spin up p5 with proper container
    p5InstanceRef.current = new P5(sketch, containerRef.current)

    // cleanup
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove()
        p5InstanceRef.current = null
      }
    }
  }, [audioRef])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 1,
      }}
      ref={containerRef}
    />
  )
}
