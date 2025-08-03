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
import {
  updateTatShapePositions,
  addDynamicMovementToPositions,
  calculateSpawnPosition,
} from '../../utils/spawn-positions'
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
        addDynamicMovementToPositions(tatShapePositions, p)
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
        updateTatShapePositions(tatShapePositions, p)
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
              // Calculate spawn position using utility
              const spawnPosition = calculateSpawnPosition(
                tatShapePositions,
                band.spawnArea,
                p.width,
                p.height,
                p.frameCount,
                band.band,
                i,
                p
              )

              particles.push(
                new Particle(
                  p,
                  spawnPosition.x,
                  spawnPosition.y,
                  band.amp,
                  band.band,
                  markovSeed
                )
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
