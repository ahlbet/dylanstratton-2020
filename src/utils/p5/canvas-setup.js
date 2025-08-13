/**
 * Canvas and Audio Setup Utilities
 * Reusable functions for setting up p5.js canvas and audio context
 */

/**
 * Get container dimensions for canvas creation
 * @param {Object} canvas - p5 canvas element
 * @param {number} defaultWidth - Default width if container not found
 * @param {number} defaultHeight - Default height if container not found
 * @returns {Object} Object with width and height
 */
export const getContainerDimensions = (
  canvas,
  defaultWidth = 800,
  defaultHeight = 400
) => {
  const containerWidth =
    canvas && canvas.parentElement && canvas.parentElement.offsetWidth
      ? canvas.parentElement.offsetWidth
      : defaultWidth
  const containerHeight =
    canvas && canvas.parentElement && canvas.parentElement.offsetHeight
      ? canvas.parentElement.offsetHeight
      : defaultHeight

  return { width: containerWidth, height: containerHeight }
}

/**
 * Setup canvas with proper positioning and dimensions
 * @param {Object} p - p5 instance
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
export const setupCanvas = (p, width, height) => {
  p.createCanvas(width, height)

  // Ensure canvas is properly positioned within container
  if (p.canvas) {
    p.canvas.style.position = 'absolute'
    p.canvas.style.top = '0'
    p.canvas.style.left = '0'
    p.canvas.style.zIndex = '1'
  }
}

/**
 * Setup audio context and connect audio element
 * @param {Object} p - p5 instance
 * @param {HTMLAudioElement} audioElement - Audio element to connect
 * @returns {Object} Object containing audio context and source node
 */
export const setupAudioContext = (p, audioElement) => {
  // Get p5.sound's AudioContext
  const audioCtx = p.getAudioContext()

  // Ensure CORS so the context can read samples
  audioElement.crossOrigin = 'anonymous'

  // Resume on user "play" gesture
  audioElement.addEventListener('play', () => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
  })

  // Guard: only create once per element
  let sourceNode
  if (!audioElement.__p5AudioSource) {
    sourceNode = audioCtx.createMediaElementSource(audioElement)
    sourceNode.connect(audioCtx.destination)
    audioElement.__p5AudioSource = sourceNode
  } else {
    sourceNode = audioElement.__p5AudioSource
  }

  return { audioCtx, sourceNode }
}

/**
 * Setup FFT analyzer with custom settings
 * @param {Object} P5 - Global p5 object
 * @param {Object} sourceNode - Audio source node
 * @param {number} smoothing - FFT smoothing factor (0-1)
 * @param {number} fftSize - FFT size (power of 2)
 * @returns {Object} Configured FFT analyzer
 */
export const setupFFT = (P5, sourceNode, smoothing = 0.9, fftSize = 2048) => {
  // Validate inputs
  if (!sourceNode) {
    console.warn('🎵 No source node provided for FFT setup')
    return null
  }

  // Use global FFT instance if available
  if (window.__globalFFTInstance) {
    const globalFFT = window.__globalFFTInstance

    try {
      // Update the input to the current audio source
      globalFFT.setInput(sourceNode)

      return globalFFT
    } catch (error) {
      console.warn(
        '🎵 Failed to set input on global FFT, creating new instance:',
        error
      )
      // Clear the problematic global instance
      window.__globalFFTInstance = null
    }
  }

  // Fallback: create new FFT instance if global one doesn't exist
  try {
    const fft = new P5.FFT(smoothing, fftSize)
    fft.setInput(sourceNode)
    return fft
  } catch (error) {
    console.error('Failed to create FFT instance:', error)
    throw error
  }
}

/**
 * Handle window resize for responsive canvas
 * @param {Object} p - p5 instance
 * @param {Function} onResize - Callback function to run after resize
 */
export const handleWindowResize = (p, onResize = null) => {
  const dimensions = getContainerDimensions(p.canvas)
  p.resizeCanvas(dimensions.width, dimensions.height)

  if (onResize) {
    onResize(dimensions.width, dimensions.height)
  }
}

/**
 * Complete canvas and audio setup for audio-reactive sketches
 * @param {Object} p - p5 instance
 * @param {Object} P5 - Global p5 object
 * @param {HTMLAudioElement} audioElement - Audio element to connect
 * @param {Object} options - Setup options
 * @returns {Object} Object containing all setup components
 */
export const setupAudioReactiveCanvas = (p, P5, audioElement, options = {}) => {
  const {
    defaultWidth = 800,
    defaultHeight = 400,
    fftSmoothing = 0.9,
    fftSize = 2048,
    onResize = null,
  } = options

  // Setup canvas
  const dimensions = getContainerDimensions(
    p.canvas,
    defaultWidth,
    defaultHeight
  )
  setupCanvas(p, dimensions.width, dimensions.height)

  // Setup audio context
  const { audioCtx, sourceNode } = setupAudioContext(p, audioElement)

  // Setup FFT
  const fft = setupFFT(P5, sourceNode, fftSmoothing, fftSize)

  // Setup window resize handler
  p.windowResized = () => {
    handleWindowResize(p, onResize)
  }

  return {
    canvas: p.canvas,
    audioCtx,
    sourceNode,
    fft,
    dimensions,
  }
}

/**
 * Initialize frequency data arrays
 * @param {number} bandCount - Number of frequency bands
 * @returns {Object} Object containing frequency and smoothed data arrays
 */
export const initializeFrequencyData = (bandCount = 8) => {
  const frequencyData = new Array(bandCount).fill(0)
  const smoothedData = new Array(bandCount).fill(0)

  return { frequencyData, smoothedData }
}
