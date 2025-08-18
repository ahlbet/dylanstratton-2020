/**
 * Canvas and Audio Setup Utilities
 * Reusable functions for setting up p5.js canvas and audio context
 */

// Define types for p5 instance and canvas
interface P5Instance {
  createCanvas: (width: number, height: number) => void
  canvas: HTMLCanvasElement
  resizeCanvas: (width: number, height: number) => void
  windowResized: () => void
  getAudioContext: () => AudioContext
}

interface GlobalP5 {
  FFT: new (smoothing: number, fftSize: number) => any
}

interface ContainerDimensions {
  width: number
  height: number
}

interface AudioSetupResult {
  audioCtx: AudioContext
  sourceNode: MediaElementAudioSourceNode
}

interface FFTSetupResult {
  setInput: (source: MediaElementAudioSourceNode) => void
  analyze: () => number[]
  [key: string]: any
}

interface AudioReactiveCanvasOptions {
  defaultWidth?: number
  defaultHeight?: number
  fftSmoothing?: number
  fftSize?: number
  onResize?: ((width: number, height: number) => void) | null
}

interface AudioReactiveCanvasResult {
  canvas: HTMLCanvasElement
  audioCtx: AudioContext
  sourceNode: MediaElementAudioSourceNode
  fft: FFTSetupResult | null
  dimensions: ContainerDimensions
}

interface FrequencyDataResult {
  frequencyData: number[]
  smoothedData: number[]
}

// Extend Window interface for global FFT
declare global {
  interface Window {
    __globalFFTInstance?: FFTSetupResult
  }
}

/**
 * Get container dimensions for canvas creation
 * @param canvas - p5 canvas element
 * @param defaultWidth - Default width if container not found
 * @param defaultHeight - Default height if container not found
 * @returns Object with width and height
 */
export const getContainerDimensions = (
  canvas: HTMLCanvasElement | null,
  defaultWidth = 800,
  defaultHeight = 400
): ContainerDimensions => {
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
 * @param p - p5 instance
 * @param width - Canvas width
 * @param height - Canvas height
 */
export const setupCanvas = (p: P5Instance, width: number, height: number): void => {
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
 * @param p - p5 instance
 * @param audioElement - Audio element to connect
 * @returns Object containing audio context and source node
 */
export const setupAudioContext = (p: P5Instance, audioElement: HTMLAudioElement): AudioSetupResult => {
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
  let sourceNode: MediaElementAudioSourceNode
  if (!(audioElement as any).__p5AudioSource) {
    sourceNode = audioCtx.createMediaElementSource(audioElement)
    sourceNode.connect(audioCtx.destination)
    ;(audioElement as any).__p5AudioSource = sourceNode
  } else {
    sourceNode = (audioElement as any).__p5AudioSource
  }

  return { audioCtx, sourceNode }
}

/**
 * Setup FFT analyzer with custom settings
 * @param P5 - Global p5 object
 * @param sourceNode - Audio source node
 * @param smoothing - FFT smoothing factor (0-1)
 * @param fftSize - FFT size (power of 2)
 * @returns Configured FFT analyzer
 */
export const setupFFT = (
  P5: GlobalP5,
  sourceNode: MediaElementAudioSourceNode,
  smoothing = 0.9,
  fftSize = 2048
): FFTSetupResult | null => {
  // Validate inputs
  if (!sourceNode) {
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
    throw error
  }
}

/**
 * Handle window resize for responsive canvas
 * @param p - p5 instance
 * @param onResize - Callback function to run after resize
 */
export const handleWindowResize = (
  p: P5Instance,
  onResize: ((width: number, height: number) => void) | null = null
): void => {
  const dimensions = getContainerDimensions(p.canvas)
  p.resizeCanvas(dimensions.width, dimensions.height)

  if (onResize) {
    onResize(dimensions.width, dimensions.height)
  }
}

/**
 * Complete canvas and audio setup for audio-reactive sketches
 * @param p - p5 instance
 * @param P5 - Global p5 object
 * @param audioElement - Audio element to connect
 * @param options - Setup options
 * @returns Object containing all setup components
 */
export const setupAudioReactiveCanvas = (
  p: P5Instance,
  P5: GlobalP5,
  audioElement: HTMLAudioElement,
  options: AudioReactiveCanvasOptions = {}
): AudioReactiveCanvasResult => {
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
 * @param bandCount - Number of frequency bands
 * @returns Object containing frequency and smoothed data arrays
 */
export const initializeFrequencyData = (bandCount = 8): FrequencyDataResult => {
  const frequencyData = new Array(bandCount).fill(0)
  const smoothedData = new Array(bandCount).fill(0)

  return { frequencyData, smoothedData }
}
