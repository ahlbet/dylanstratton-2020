// src/components/AudioFFT.js
import React, { useRef, useEffect } from 'react'
import { useAudioPlayer } from '../../contexts/audio-player-context/audio-player-context'
import {
  generateSeedFromText,
  generateTatShapePositions,
} from '../../utils/shape-generator'
import {
  analyzeFrequencyBands,
  getFrequencyBands,
} from '../../utils/audio-analysis'
import {
  Particle,
  calculateParticleCount,
  calculateMaxParticles,
  calculateCanvasScale,
} from '../../utils/particle-system'
export default function AudioFFT({ markovText = '' }) {
  const containerRef = useRef(null)
  const p5InstanceRef = useRef(null)
  const { audioRef } = useAudioPlayer()

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

      p.draw = () => {
        // p.background(0, 50)
        fft.analyze() // update the spectrum

        // Update spawn positions
        updateSpawnPositions()

        // Analyze frequency bands using utility functions
        const analysis = analyzeFrequencyBands(fft, smoothedData, 0.7)
        frequencyData = analysis.frequencyData
        smoothedData = analysis.smoothedData

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

              particles.push(
                new Particle(p, spawnX, spawnY, band.amp, band.band, markovSeed)
              )
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
