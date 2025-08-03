// src/components/AudioFFT.js
import React, { useRef, useEffect } from 'react'
import { useAudioPlayer } from '../../contexts/audio-player-context/audio-player-context'

import {
  getFrequencyBands,
  generateSeedFromText,
  generateTatShapePositions,
  analyzeFrequencyBands,
  Particle,
  calculateParticleCount,
  calculateMaxParticles,
  calculateCanvasScale,
  updateTatShapePositions,
  addDynamicMovementToPositions,
  calculateSpawnPosition,
  setupAudioReactiveCanvas,
  initializeFrequencyData,
  createAudioReactiveAnimationLoop,
} from '../../utils/p5'

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
        // Setup canvas and audio using utilities
        const setup = setupAudioReactiveCanvas(p, P5, audioRef.current, {
          fftSmoothing: 0.9,
          fftSize: 2048,
          onResize: (width, height) => {
            // Regenerate Tat shape positions for new canvas size
            tatShapePositions = generateTatShapePositions(
              markovSeed,
              width,
              height,
              5
            )
          },
        })

        // Extract setup components
        fft = setup.fft
        sourceNode = setup.sourceNode
        const { width: containerWidth, height: containerHeight } =
          setup.dimensions

        // Initialize frequency data arrays
        const frequencyDataInit = initializeFrequencyData(8)
        frequencyData = frequencyDataInit.frequencyData
        smoothedData = frequencyDataInit.smoothedData

        // Generate Tat shape positions for particle spawning
        tatShapePositions = generateTatShapePositions(
          markovSeed,
          containerWidth,
          containerHeight,
          5
        )

        // Add dynamic movement to spawn positions
        addDynamicMovementToPositions(tatShapePositions, p)

        // Update spawn positions dynamically
        const updateSpawnPositions = () => {
          updateTatShapePositions(tatShapePositions, p)
        }

        // Create the main animation loop using utility (after FFT is initialized)
        p.draw = createAudioReactiveAnimationLoop(
          p,
          fft,
          particles,
          smoothedData,
          tatShapePositions,
          markovSeed,
          updateSpawnPositions,
          analyzeFrequencyBands,
          getFrequencyBands,
          calculateMaxParticles,
          calculateCanvasScale,
          calculateParticleCount,
          calculateSpawnPosition,
          Particle
        )
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
