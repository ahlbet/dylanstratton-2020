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

  // Use title (most important for visual identity) - enhanced weighting
  if (metadata.title) {
    for (let i = 0; i < metadata.title.length; i++) {
      seed += metadata.title.charCodeAt(i) * (i + 1) * 7 // Increased from 3 to 7
    }
    // Add title length as a significant factor
    seed += metadata.title.length * 1000
  }

  // Use daily_id if available - enhanced weighting
  if (metadata.daily_id) {
    const dailyIdNum = Number(metadata.daily_id)
    if (isFinite(dailyIdNum)) {
      seed += dailyIdNum * 5000 // Increased from 1000 to 5000
    }
  }

  // Use date components - enhanced weighting
  if (metadata.date) {
    try {
      const date = new Date(metadata.date)
      if (!isNaN(date.getTime())) {
        seed += date.getFullYear() * 50000 // Increased from 10000 to 50000
        seed += (date.getMonth() + 1) * 1000 // Increased from 100 to 1000
        seed += date.getDate() * 100 // Increased from 1 to 100
        // Add day of week for more variation
        seed += date.getDay() * 10000
      }
    } catch (error) {
      console.warn('Error parsing date:', metadata.date, error)
    }
  }

  // Use markov text length and content - enhanced weighting
  if (metadata.markovText) {
    seed += metadata.markovText.length * 25 // Increased from 7 to 25
    for (let i = 0; i < Math.min(metadata.markovText.length, 100); i++) {
      // Increased from 50 to 100
      seed += metadata.markovText.charCodeAt(i) * (i + 1) * 3 // Increased from 1 to 3
    }
    // Add word count variation
    const wordCount = metadata.markovText.split(' ').length
    seed += wordCount * 500
  }

  // Use cover art URL if available - enhanced weighting
  if (metadata.cover_art) {
    for (let i = 0; i < Math.min(metadata.cover_art.length, 50); i++) {
      // Increased from 30 to 50
      seed += metadata.cover_art.charCodeAt(i) * (i + 1) * 5 // Increased from 1 to 5
    }
    // Add file extension as a factor
    const extension = metadata.cover_art.split('.').pop() || ''
    seed += extension.length * 2000
  }

  // Add timestamp-based variation for posts created at different times
  seed += Date.now() % 1000000

  const finalSeed = Math.abs(seed) % 10000000 // Increased range from 1000000 to 10000000

  // Ensure the final seed is finite
  if (!isFinite(finalSeed)) {
    console.warn('Invalid blog post seed generated, using fallback')
    return 12345
  }

  return finalSeed
}

// Generate visual style parameters based on blog post metadata
const generateVisualStyle = (seed: number) => {
  const p5 = window.p5

  // Create more sophisticated color relationships
  const baseHue = seed % 360
  const complementaryHue = (baseHue + 180) % 360
  const analogousHue1 = (baseHue + 30) % 360
  const analogousHue2 = (baseHue - 30 + 360) % 360
  const triadicHue1 = (baseHue + 120) % 360
  const triadicHue2 = (baseHue + 240) % 360

  // Create color scheme variations based on seed - expanded to 16 schemes
  const colorScheme = seed % 16 // 16 different color schemes (increased from 8)
  let primaryHue, secondaryHue, accentHue, tertiaryHue

  switch (colorScheme) {
    case 0: // Monochromatic with variations
      primaryHue = baseHue
      secondaryHue = (baseHue + 15) % 360
      accentHue = (baseHue + 30) % 360
      tertiaryHue = (baseHue + 45) % 360
      break
    case 1: // Complementary
      primaryHue = baseHue
      secondaryHue = complementaryHue
      accentHue = (baseHue + 60) % 360
      tertiaryHue = (complementaryHue + 60) % 360
      break
    case 2: // Analogous
      primaryHue = baseHue
      secondaryHue = analogousHue1
      accentHue = analogousHue2
      tertiaryHue = (baseHue + 45) % 360
      break
    case 3: // Triadic
      primaryHue = baseHue
      secondaryHue = triadicHue1
      accentHue = triadicHue2
      tertiaryHue = (baseHue + 90) % 360
      break
    case 4: // Split-complementary
      primaryHue = baseHue
      secondaryHue = (complementaryHue + 30) % 360
      accentHue = (complementaryHue - 30 + 360) % 360
      tertiaryHue = (baseHue + 45) % 360
      break
    case 5: // Tetradic (double complementary)
      primaryHue = baseHue
      secondaryHue = (baseHue + 90) % 360
      accentHue = complementaryHue
      tertiaryHue = (complementaryHue + 90) % 360
      break
    case 6: // Warm vs Cool
      primaryHue = baseHue < 180 ? baseHue : (baseHue + 180) % 360
      secondaryHue = baseHue < 180 ? (baseHue + 180) % 360 : baseHue
      accentHue = (primaryHue + 60) % 360
      tertiaryHue = (secondaryHue + 60) % 360
      break
    case 7: // High contrast
      primaryHue = baseHue
      secondaryHue = (baseHue + 120) % 360
      accentHue = (baseHue + 240) % 360
      tertiaryHue = (baseHue + 60) % 360
      break
    case 8: // Pastel variations
      primaryHue = baseHue
      secondaryHue = (baseHue + 45) % 360
      accentHue = (baseHue + 90) % 360
      tertiaryHue = (baseHue + 135) % 360
      break
    case 9: // Neon/bright
      primaryHue = baseHue
      secondaryHue = (baseHue + 72) % 360
      accentHue = (baseHue + 144) % 360
      tertiaryHue = (baseHue + 216) % 360
      break
    case 10: // Earth tones
      primaryHue = (baseHue + 30) % 360 // Shift toward warmer colors
      secondaryHue = (baseHue + 60) % 360
      accentHue = (baseHue + 120) % 360
      tertiaryHue = (baseHue + 180) % 360
      break
    case 11: // Ocean tones
      primaryHue = (baseHue + 180) % 360 // Shift toward cooler colors
      secondaryHue = (baseHue + 210) % 360
      accentHue = (baseHue + 240) % 360
      tertiaryHue = (baseHue + 270) % 360
      break
    case 12: // Sunset/sunrise
      primaryHue = baseHue < 60 ? baseHue : (baseHue + 300) % 360
      secondaryHue = (primaryHue + 30) % 360
      accentHue = (primaryHue + 60) % 360
      tertiaryHue = (primaryHue + 90) % 360
      break
    case 13: // Forest/nature
      primaryHue = (baseHue + 120) % 360 // Shift toward green
      secondaryHue = (primaryHue + 30) % 360
      accentHue = (primaryHue + 60) % 360
      tertiaryHue = (primaryHue + 90) % 360
      break
    case 14: // Urban/metallic
      primaryHue = (baseHue + 240) % 360 // Shift toward blue-gray
      secondaryHue = (primaryHue + 30) % 360
      accentHue = (primaryHue + 60) % 360
      tertiaryHue = (primaryHue + 90) % 360
      break
    case 15: // Psychedelic
      primaryHue = baseHue
      secondaryHue = (baseHue + 72) % 360
      accentHue = (baseHue + 144) % 360
      tertiaryHue = (baseHue + 216) % 360
      break
    default:
      primaryHue = baseHue
      secondaryHue = (baseHue + 137) % 360
      accentHue = (baseHue + 73) % 360
      tertiaryHue = (baseHue + 200) % 360
  }

  // Add subtle variations to prevent identical colors - increased variation
  const hueVariation = (seed % 40) - 20 // ±20 degree variation (increased from ±10)

  return {
    // Enhanced color palette with more sophisticated relationships
    primaryHue: (primaryHue + hueVariation + 360) % 360,
    secondaryHue: (secondaryHue + hueVariation + 360) % 360,
    accentHue: (accentHue + hueVariation + 360) % 360,
    tertiaryHue: (tertiaryHue + hueVariation + 360) % 360,

    // Color scheme identifier for debugging
    colorScheme,

    // Enhanced saturation and brightness variations - more dramatic ranges
    primarySaturation: 50 + (seed % 50), // 50-100% (increased from 70-100%)
    secondarySaturation: 45 + (seed % 55), // 45-100% (increased from 65-100%)
    accentSaturation: 55 + (seed % 45), // 55-100% (increased from 75-100%)
    tertiarySaturation: 40 + (seed % 60), // 40-100% (increased from 60-100%)

    primaryBrightness: 55 + (seed % 45), // 55-100% (increased from 75-100%)
    secondaryBrightness: 50 + (seed % 50), // 50-100% (increased from 70-100%)
    accentBrightness: 60 + (seed % 40), // 60-100% (increased from 80-100%)
    tertiaryBrightness: 45 + (seed % 55), // 45-100% (increased from 65-100%),

    // Shape and pattern variations - much more dramatic ranges
    shapeDensity: 0.1 + ((seed % 100) / 100) * 4.9, // 0.1 to 5.0 (increased from 0.3 to 3.0)
    particleCount: 25 + (seed % 575), // 25 to 600 (increased from 50 to 400)
    maxParticleSize: 1 + (seed % 24), // 1 to 25 (increased from 2 to 17)

    // Movement and animation variations - much more dramatic ranges
    movementSpeed: 0.1 + ((seed % 100) / 100) * 5.9, // 0.1 to 6.0 (increased from 0.2 to 4.0)
    oscillationStrength: 1 + (seed % 49), // 1 to 50 (increased from 3 to 38)
    rotationSpeed: -1.0 + ((seed % 100) / 100) * 2.0, // -1.0 to 1.0 (increased from -0.5 to 0.5)

    // Audio reactivity variations - much more dramatic ranges
    frequencySensitivity: 0.1 + ((seed % 100) / 100) * 4.9, // 0.1 to 5.0 (increased from 0.3 to 3.0)
    amplitudeScaling: 0.02 + ((seed % 100) / 100) * 0.78, // 0.02 to 0.8 (increased from 0.05 to 0.5)

    // Layout variations - more diverse patterns
    spawnPattern: seed % 8, // 0: random, 1: grid, 2: spiral, 3: wave, 4: radial, 5: chaotic, 6: vortex, 7: fractal
    symmetryLevel: seed % 5, // 0: none, 1: horizontal, 2: vertical, 3: both axes, 4: rotational

    // Special effects - more varied combinations and new effects
    enableTrails: seed % 5 === 0, // 20% chance (reduced from 25%)
    enablePulse: seed % 4 === 0, // 25% chance (reduced from 33%)
    enableRipple: seed % 6 === 0, // 16.7% chance (reduced from 20%)
    enableGlow: seed % 7 === 0, // 14.3% chance (reduced from 16.7%)
    enableSparkle: seed % 8 === 0, // 12.5% chance (reduced from 14.3%)
    enableBlur: seed % 9 === 0, // 11.1% chance (new effect)
    enableDistortion: seed % 10 === 0, // 10% chance (new effect)
    enablePolarDistortion: seed % 11 === 0, // 9.1% chance (new effect)

    // Advanced visual parameters - more dramatic ranges
    colorShiftIntensity: 0.2 + ((seed % 100) / 100) * 4.8, // 0.2 to 5.0 (increased from 0.5 to 3.0)
    trailLength: 1 + (seed % 6), // 1 to 6 trail layers (increased from 1 to 4)
    glowRadius: 1.0 + ((seed % 100) / 100) * 3.0, // 1.0 to 4.0 (increased from 1.2 to 3.0)
    sparkleFrequency: 0.05 + ((seed % 100) / 100) * 1.95, // 0.05 to 2.0 (increased from 0.1 to 1.0)

    // New advanced parameters for more variation
    blurIntensity: 0.1 + ((seed % 100) / 100) * 2.9, // 0.1 to 3.0
    distortionStrength: 0.1 + ((seed % 100) / 100) * 3.9, // 0.1 to 4.0
    polarDistortionRadius: 0.5 + ((seed % 100) / 100) * 2.5, // 0.5 to 3.0
    chromaticAberration: seed % 3 === 0, // 33% chance
    motionBlur: seed % 4 === 0, // 25% chance
    depthOfField: seed % 5 === 0, // 20% chance
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

      // Validate seeds and provide fallbacks
      const validBlogPostSeed = isFinite(blogPostSeed) ? blogPostSeed : 12345
      const validMarkovSeed = isFinite(markovSeed) ? markovSeed : 67890
      const validCombinedSeed = isFinite(combinedSeed)
        ? combinedSeed
        : validBlogPostSeed + validMarkovSeed

      // Generate visual style parameters
      const visualStyle = generateVisualStyle(validCombinedSeed)

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
                if (!isInitialized || !width || !height) {
                  return
                }

                // Regenerate Tat shape positions for new canvas size
                tatShapePositions = generateTatShapePositions(
                  validCombinedSeed,
                  width,
                  height,
                  5
                )

                // Re-add dynamic movement properties to new positions
                // addDynamicMovementToPositions(tatShapePositions, p)

                // Clear existing particles to prevent them from spawning at old positions
                particles.length = 0

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
                  // updateTatShapePositions(tatShapePositions, p)
                }

                // Create the main animation loop using utility (after FFT is initialized)
                p.draw = createAudioReactiveAnimationLoop(
                  p,
                  fft,
                  particles,
                  smoothedData,
                  tatShapePositions,
                  validCombinedSeed,
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
            console.warn('Invalid canvas dimensions detected:', {
              containerWidth,
              containerHeight,
            })
            return
          }

          // Initialize frequency data arrays
          const frequencyDataInit = initializeFrequencyData(8)
          frequencyData = frequencyDataInit.frequencyData
          smoothedData = frequencyDataInit.smoothedData

          // Generate Tat shape positions for particle spawning with visual style
          tatShapePositions = generateTatShapePositions(
            validCombinedSeed,
            containerWidth,
            containerHeight,
            5
          )

          // Add dynamic movement to spawn positions
          // addDynamicMovementToPositions(tatShapePositions, p)

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
            // updateTatShapePositions(tatShapePositions, p)
          }

          // Create the main animation loop using utility (after FFT is initialized)
          p.draw = createAudioReactiveAnimationLoop(
            p,
            fft,
            particles,
            smoothedData,
            tatShapePositions,
            validCombinedSeed,
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
      data-testid="audio-fft-container"
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
