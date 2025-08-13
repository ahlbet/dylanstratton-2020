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
  calculateStaggeredSpawn,
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
    // Enhanced guards for proper initialization
    if (typeof window === 'undefined') {
      return
    }

    // Wait for p5 to be available
    if (!window.p5) {
      return
    }

    // Wait for audio context to be available
    if (!audioRef || !audioRef.current) {
      return
    }

    // Wait for container to be available
    if (!containerRef.current) {
      return
    }

    // Clean up any existing p5 instance before creating a new one
    if (p5InstanceRef.current) {
      try {
        p5InstanceRef.current.remove()
      } catch (error) {
        // Error removing p5 instance
      }
      p5InstanceRef.current = null
    }

    const P5 = window.p5

    const sketch = (p) => {
      let fft
      let sourceNode
      let particles = []
      let frequencyData = []
      let smoothedData = []
      let isInitialized = false

      // Generate seed from markov text
      const markovSeed = generateSeedFromText(markovText)
      let tatShapePositions = []

      p.setup = async () => {
        try {
          // Additional safety check for canvas dimensions
          if (!containerRef.current) {
            return
          }

          // Setup canvas and audio using utilities
          const setup = await setupAudioReactiveCanvas(
            p,
            P5,
            audioRef.current,
            {
              fftSmoothing: 0.9,
              fftSize: 2048,
              onResize: (width, height) => {
                if (!isInitialized || !width || !height) return

                // Regenerate Tat shape positions for new canvas size
                tatShapePositions = generateTatShapePositions(
                  markovSeed,
                  width,
                  height,
                  5
                )

                // Re-add dynamic movement properties to new positions
                addDynamicMovementToPositions(tatShapePositions, p)
              },
            }
          )

          // Extract setup components
          fft = setup.fft
          sourceNode = setup.sourceNode
          const { width: containerWidth, height: containerHeight } =
            setup.dimensions

          // Guard against failed FFT setup
          if (!fft) {
            return
          }

          // Guard against invalid canvas dimensions
          if (
            !containerWidth ||
            !containerHeight ||
            containerWidth <= 0 ||
            containerHeight <= 0
          ) {
            return
          }

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
            if (
              !isInitialized ||
              !tatShapePositions ||
              !p ||
              !p.width ||
              !p.height
            )
              return

            // Update Tat shape positions with current canvas dimensions
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
            calculateStaggeredSpawn,
            Particle
          )

          isInitialized = true
        } catch (error) {
          console.error('Error in p5 setup:', error)
        }
      }
    }

    // Create p5 instance with error handling
    try {
      p5InstanceRef.current = new P5(sketch, containerRef.current)
    } catch (error) {
      console.error('Error creating p5 instance:', error)
      p5InstanceRef.current = null
    }

    // cleanup
    return () => {
      if (p5InstanceRef.current) {
        try {
          p5InstanceRef.current.remove()
        } catch (error) {
          console.warn('Error removing p5 instance during cleanup:', error)
        }
        p5InstanceRef.current = null
      }
    }
  }, [audioRef, markovText]) // Add markovText to dependencies

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
