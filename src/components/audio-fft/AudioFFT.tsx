// src/components/AudioFFT.tsx
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

interface BlogPostMetadata {
  title?: string
  date?: string
  daily_id?: string | number
  markovText?: string
  cover_art?: string
}

interface AudioFFTProps {
  markovText?: string
  blogPostMetadata?: BlogPostMetadata
}

// Extend Window interface to include p5
declare global {
  interface Window {
    p5: any
  }
}

// Generate a comprehensive seed from blog post metadata
const generateBlogPostSeed = (metadata: BlogPostMetadata): number => {
  let seed = 0

  // Use title (most important for visual identity)
  if (metadata.title) {
    for (let i = 0; i < metadata.title.length; i++) {
      seed += metadata.title.charCodeAt(i) * (i + 1) * 3
    }
  }

  // Use daily_id if available
  if (metadata.daily_id) {
    seed += Number(metadata.daily_id) * 1000
  }

  // Use date components
  if (metadata.date) {
    const date = new Date(metadata.date)
    seed += date.getFullYear() * 10000
    seed += (date.getMonth() + 1) * 100
    seed += date.getDate()
  }

  // Use markov text length and content
  if (metadata.markovText) {
    seed += metadata.markovText.length * 7
    for (let i = 0; i < Math.min(metadata.markovText.length, 50); i++) {
      seed += metadata.markovText.charCodeAt(i) * (i + 1)
    }
  }

  // Use cover art URL if available
  if (metadata.cover_art) {
    for (let i = 0; i < Math.min(metadata.cover_art.length, 30); i++) {
      seed += metadata.cover_art.charCodeAt(i) * (i + 1)
    }
  }

  return Math.abs(seed) % 1000000
}

// Generate visual style parameters based on blog post metadata
const generateVisualStyle = (seed: number) => {
  const p5 = window.p5

  return {
    // Color palette variations - more dramatic ranges
    primaryHue: seed % 360,
    secondaryHue: (seed * 137) % 360,
    accentHue: (seed * 73) % 360,

    // Shape and pattern variations - more dramatic ranges
    shapeDensity: 0.3 + ((seed % 100) / 100) * 2.7, // 0.3 to 3.0 (more dramatic)
    particleCount: 50 + (seed % 350), // 50 to 400 (wider range)
    maxParticleSize: 2 + (seed % 15), // 2 to 17 (more size variation)

    // Movement and animation variations - more dramatic ranges
    movementSpeed: 0.2 + ((seed % 100) / 100) * 3.8, // 0.2 to 4.0 (much more dramatic)
    oscillationStrength: 3 + (seed % 35), // 3 to 38 (more oscillation variation)
    rotationSpeed: -0.5 + ((seed % 100) / 100) * 1.0, // -0.5 to 0.5 (more rotation variation)

    // Audio reactivity variations - more dramatic ranges
    frequencySensitivity: 0.3 + ((seed % 100) / 100) * 2.7, // 0.3 to 3.0 (more dramatic)
    amplitudeScaling: 0.05 + ((seed % 100) / 100) * 0.45, // 0.05 to 0.5 (more dramatic)

    // Layout variations - more diverse patterns
    spawnPattern: seed % 6, // 0: random, 1: grid, 2: spiral, 3: wave, 4: radial, 5: chaotic
    symmetryLevel: seed % 4, // 0: none, 1: horizontal, 2: vertical, 3: both axes

    // Special effects - more varied combinations
    enableTrails: seed % 4 === 0, // 25% chance (reduced from 33%)
    enablePulse: seed % 3 === 0, // 33% chance (reduced from 50%)
    enableRipple: seed % 5 === 0, // 20% chance (reduced from 25%)
    enableGlow: seed % 6 === 0, // 16.7% chance (new effect)
    enableSparkle: seed % 7 === 0, // 14.3% chance (new effect)

    // Advanced visual parameters
    colorShiftIntensity: 0.5 + ((seed % 100) / 100) * 2.5, // 0.5 to 3.0
    trailLength: 1 + (seed % 4), // 1 to 4 trail layers
    glowRadius: 1.2 + ((seed % 100) / 100) * 1.8, // 1.2 to 3.0
    sparkleFrequency: 0.1 + ((seed % 100) / 100) * 0.9, // 0.1 to 1.0
  }
}

export default function AudioFFT({
  markovText = '',
  blogPostMetadata = {},
}: AudioFFTProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<any>(null)
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
        console.warn('Error removing p5 instance:', error)
      }
      p5InstanceRef.current = null
    }

    const P5 = window.p5

    const sketch = (p: any) => {
      let fft: any
      let sourceNode: any
      let particles: Particle[] = []
      let frequencyData: number[] = []
      let smoothedData: number[] = []
      let isInitialized = false

      // Generate comprehensive seed from blog post metadata
      const blogPostSeed = generateBlogPostSeed(blogPostMetadata)
      const markovSeed = generateSeedFromText(markovText)
      const combinedSeed = blogPostSeed + markovSeed

      // Generate visual style parameters
      const visualStyle = generateVisualStyle(combinedSeed)

      let tatShapePositions: any[] = []

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
              onResize: (width: number, height: number) => {
                if (!isInitialized || !width || !height) return

                // Regenerate Tat shape positions for new canvas size
                tatShapePositions = generateTatShapePositions(
                  combinedSeed,
                  width,
                  height,
                  5
                )

                // Re-add dynamic movement properties to new positions
                addDynamicMovementToPositions(tatShapePositions, p)

                // Clear existing particles to prevent them from spawning at old positions
                particles.length = 0
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

          // Generate Tat shape positions for particle spawning with visual style
          tatShapePositions = generateTatShapePositions(
            combinedSeed,
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
            combinedSeed,
            updateSpawnPositions,
            analyzeFrequencyBands,
            getFrequencyBands,
            calculateMaxParticles,
            calculateCanvasScale,
            calculateParticleCount,
            calculateSpawnPosition,
            calculateStaggeredSpawn,
            Particle,
            visualStyle
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
  }, [audioRef, markovText, blogPostMetadata]) // Add blogPostMetadata to dependencies

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
