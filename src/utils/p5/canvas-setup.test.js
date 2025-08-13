import {
  getContainerDimensions,
  setupCanvas,
  setupAudioContext,
  setupFFT,
  handleWindowResize,
  setupAudioReactiveCanvas,
  initializeFrequencyData,
} from './canvas-setup'

// Mock p5 instance
const createMockP5 = () => {
  const mockSourceNode = {
    connect: jest.fn(),
  }

  const mockAudioCtx = {
    state: 'running',
    resume: jest.fn(),
    createMediaElementSource: jest.fn(() => mockSourceNode),
    destination: {},
  }

  return {
    createCanvas: jest.fn(),
    canvas: {
      style: {
        position: '',
        top: '',
        left: '',
        zIndex: '',
      },
    },
    getAudioContext: jest.fn(() => mockAudioCtx),
    resizeCanvas: jest.fn(),
    windowResized: null,
  }
}

// Mock audio element
const createMockAudioElement = () => ({
  crossOrigin: '',
  addEventListener: jest.fn(),
  __p5AudioSource: undefined,
})

// Mock global P5 object
const createMockGlobalP5 = () => ({
  FFT: jest.fn(() => ({
    setInput: jest.fn(),
  })),
})

describe('Canvas Setup Utilities', () => {
  beforeEach(() => {
    // Clear global FFT instance before each test
    if (window.__globalFFTInstance) {
      delete window.__globalFFTInstance
    }
    jest.clearAllMocks()
  })

  describe('getContainerDimensions', () => {
    test('should return container dimensions when canvas has parent', () => {
      const mockCanvas = {
        parentElement: {
          offsetWidth: 1200,
          offsetHeight: 800,
        },
      }

      const dimensions = getContainerDimensions(mockCanvas, 800, 400)
      expect(dimensions).toEqual({ width: 1200, height: 800 })
    })

    test('should return default dimensions when canvas has no parent', () => {
      const mockCanvas = null
      const dimensions = getContainerDimensions(mockCanvas, 800, 400)
      expect(dimensions).toEqual({ width: 800, height: 400 })
    })

    test('should return default dimensions when parent has no offset dimensions', () => {
      const mockCanvas = {
        parentElement: {},
      }
      const dimensions = getContainerDimensions(mockCanvas, 800, 400)
      expect(dimensions).toEqual({ width: 800, height: 400 })
    })

    test('should use custom default dimensions', () => {
      const mockCanvas = null
      const dimensions = getContainerDimensions(mockCanvas, 1920, 1080)
      expect(dimensions).toEqual({ width: 1920, height: 1080 })
    })
  })

  describe('setupCanvas', () => {
    test('should create canvas with specified dimensions', () => {
      const mockP5 = createMockP5()
      setupCanvas(mockP5, 1200, 800)

      expect(mockP5.createCanvas).toHaveBeenCalledWith(1200, 800)
    })

    test('should set canvas styles when canvas exists', () => {
      const mockP5 = createMockP5()
      setupCanvas(mockP5, 1200, 800)

      expect(mockP5.canvas.style.position).toBe('absolute')
      expect(mockP5.canvas.style.top).toBe('0')
      expect(mockP5.canvas.style.left).toBe('0')
      expect(mockP5.canvas.style.zIndex).toBe('1')
    })

    test('should handle missing canvas gracefully', () => {
      const mockP5 = createMockP5()
      mockP5.canvas = null

      expect(() => setupCanvas(mockP5, 1200, 800)).not.toThrow()
      expect(mockP5.createCanvas).toHaveBeenCalledWith(1200, 800)
    })
  })

  describe('setupAudioContext', () => {
    test('should setup audio context and connect source node', () => {
      const mockP5 = createMockP5()
      const mockAudioElement = createMockAudioElement()
      const mockAudioCtx = mockP5.getAudioContext()
      const mockSourceNode =
        mockAudioCtx.createMediaElementSource(mockAudioElement)

      const result = setupAudioContext(mockP5, mockAudioElement)

      expect(mockAudioElement.crossOrigin).toBe('anonymous')
      expect(mockAudioElement.addEventListener).toHaveBeenCalledWith(
        'play',
        expect.any(Function)
      )
      expect(mockAudioCtx.createMediaElementSource).toHaveBeenCalledWith(
        mockAudioElement
      )
      expect(mockSourceNode.connect).toHaveBeenCalledWith(
        mockAudioCtx.destination
      )
      expect(result.audioCtx).toBe(mockAudioCtx)
      expect(result.sourceNode).toBe(mockSourceNode)
      expect(mockAudioElement.__p5AudioSource).toBe(mockSourceNode)
    })

    test('should reuse existing source node if already created', () => {
      const mockP5 = createMockP5()
      const mockAudioElement = createMockAudioElement()
      const existingSourceNode = { id: 'existing' }
      mockAudioElement.__p5AudioSource = existingSourceNode

      const result = setupAudioContext(mockP5, mockAudioElement)

      expect(result.sourceNode).toBe(existingSourceNode)
      expect(
        mockP5.getAudioContext().createMediaElementSource
      ).not.toHaveBeenCalled()
    })

    test('should handle audio context resume on play', () => {
      const mockP5 = createMockP5()
      const mockAudioElement = createMockAudioElement()
      const mockAudioCtx = mockP5.getAudioContext()
      mockAudioCtx.state = 'suspended'

      setupAudioContext(mockP5, mockAudioElement)

      // Simulate play event
      const playHandler = mockAudioElement.addEventListener.mock.calls[0][1]
      playHandler()

      expect(mockAudioCtx.resume).toHaveBeenCalled()
    })
  })

  describe('setupFFT', () => {
    test('should return null when no source node provided', async () => {
      const mockGlobalP5 = createMockGlobalP5()

      const result = await setupFFT(mockGlobalP5, null)

      expect(result).toBeNull()
    })

    test('should use global FFT instance if available', async () => {
      const mockGlobalP5 = createMockGlobalP5()
      const mockSourceNode = {
        id: 'source',
        context: { state: 'running' },
        mediaElement: createMockAudioElement(),
      }
      const mockGlobalFFT = {
        setInput: jest.fn(),
        input: null,
        _input: null,
        analyzer: null,
      }
      mockGlobalFFT.setInput.mockImplementation((input) => {
        mockGlobalFFT.input = input
        mockGlobalFFT._input = input
      })
      window.__globalFFTInstance = mockGlobalFFT

      const result = await setupFFT(mockGlobalP5, mockSourceNode)

      expect(result).toBe(mockGlobalFFT)
      expect(mockGlobalFFT.setInput).toHaveBeenCalledWith(mockSourceNode)
    })

    test('should create new FFT instance if global one fails', async () => {
      const mockGlobalP5 = createMockGlobalP5()
      const mockSourceNode = {
        id: 'source',
        context: { state: 'running' },
        mediaElement: createMockAudioElement(),
      }
      const mockGlobalFFT = {
        setInput: jest.fn(() => {
          throw new Error('Failed')
        }),
      }
      window.__globalFFTInstance = mockGlobalFFT

      const result = await setupFFT(mockGlobalP5, mockSourceNode)

      expect(result).toBeDefined()
      expect(mockGlobalP5.FFT).toHaveBeenCalledWith(0.9, 2048)
      expect(window.__globalFFTInstance).toBeNull()
    })

    test('should create new FFT instance when no global instance exists', async () => {
      const mockGlobalP5 = createMockGlobalP5()
      const mockSourceNode = {
        id: 'source',
        context: { state: 'running' },
        mediaElement: createMockAudioElement(),
      }
      const mockFFT = {
        setInput: jest.fn(),
        input: null,
        _input: null,
        analyzer: null,
      }
      mockFFT.setInput.mockImplementation((input) => {
        mockFFT.input = input
        mockFFT._input = input
      })
      mockGlobalP5.FFT.mockReturnValue(mockFFT)

      const result = await setupFFT(mockGlobalP5, mockSourceNode)

      expect(result).toBe(mockFFT)
      expect(mockGlobalP5.FFT).toHaveBeenCalledWith(0.9, 2048)
      expect(mockFFT.setInput).toHaveBeenCalledWith(mockSourceNode)
    })

    test('should use custom smoothing and fft size', async () => {
      const mockGlobalP5 = createMockGlobalP5()
      const mockSourceNode = {
        id: 'source',
        context: { state: 'running' },
        mediaElement: createMockAudioElement(),
      }
      const mockFFT = {
        setInput: jest.fn(),
        input: null,
        _input: null,
        analyzer: null,
      }
      mockFFT.setInput.mockImplementation((input) => {
        mockFFT.input = input
        mockFFT._input = input
      })
      mockGlobalP5.FFT.mockReturnValue(mockFFT)

      await setupFFT(mockGlobalP5, mockSourceNode, 0.5, 1024)

      expect(mockGlobalP5.FFT).toHaveBeenCalledWith(0.5, 1024)
    })

    test('should handle FFT creation errors', () => {
      const mockGlobalP5 = createMockGlobalP5()
      const mockSourceNode = {
        id: 'source',
        context: { state: 'running' },
        mediaElement: createMockAudioElement(),
      }
      mockGlobalP5.FFT.mockImplementation(() => {
        throw new Error('FFT creation failed')
      })

      expect(() => setupFFT(mockGlobalP5, mockSourceNode)).toThrow(
        'FFT creation failed'
      )
    })
  })

  describe('handleWindowResize', () => {
    test('should resize canvas and call onResize callback', () => {
      const mockP5 = createMockP5()
      const mockCanvas = {
        parentElement: {
          offsetWidth: 1200,
          offsetHeight: 800,
        },
      }
      mockP5.canvas = mockCanvas
      const onResize = jest.fn()

      handleWindowResize(mockP5, onResize)

      expect(mockP5.resizeCanvas).toHaveBeenCalledWith(1200, 800)
      expect(onResize).toHaveBeenCalledWith(1200, 800)
    })

    test('should handle resize without callback', () => {
      const mockP5 = createMockP5()
      const mockCanvas = {
        parentElement: {
          offsetWidth: 1200,
          offsetHeight: 800,
        },
      }
      mockP5.canvas = mockCanvas

      expect(() => handleWindowResize(mockP5)).not.toThrow()
      expect(mockP5.resizeCanvas).toHaveBeenCalledWith(1200, 800)
    })
  })

  describe('setupAudioReactiveCanvas', () => {
    test('should setup complete audio reactive canvas', () => {
      const mockP5 = createMockP5()
      const mockGlobalP5 = createMockGlobalP5()
      const mockAudioElement = createMockAudioElement()
      const mockFFT = { setInput: jest.fn() }
      mockGlobalP5.FFT.mockReturnValue(mockFFT)
      const mockCanvas = {
        parentElement: {
          offsetWidth: 1200,
          offsetHeight: 800,
        },
        style: {
          position: '',
          top: '',
          left: '',
          zIndex: '',
        },
      }
      mockP5.canvas = mockCanvas
      const onResize = jest.fn()

      const result = setupAudioReactiveCanvas(
        mockP5,
        mockGlobalP5,
        mockAudioElement,
        {
          defaultWidth: 1000,
          defaultHeight: 600,
          fftSmoothing: 0.8,
          fftSize: 1024,
          onResize,
        }
      )

      expect(mockP5.createCanvas).toHaveBeenCalledWith(1200, 800)
      expect(result.canvas).toBe(mockP5.canvas)
      expect(result.audioCtx).toBeDefined()
      expect(result.sourceNode).toBeDefined()
      expect(result.fft).toBe(mockFFT)
      expect(result.dimensions).toEqual({ width: 1200, height: 800 })
      expect(mockP5.windowResized).toBeDefined()
    })

    test('should use default options when none provided', () => {
      const mockP5 = createMockP5()
      const mockGlobalP5 = createMockGlobalP5()
      const mockAudioElement = createMockAudioElement()
      const mockFFT = { setInput: jest.fn() }
      mockGlobalP5.FFT.mockReturnValue(mockFFT)
      const mockCanvas = {
        parentElement: {
          offsetWidth: 1200,
          offsetHeight: 800,
        },
        style: {
          position: '',
          top: '',
          left: '',
          zIndex: '',
        },
      }
      mockP5.canvas = mockCanvas

      const result = setupAudioReactiveCanvas(
        mockP5,
        mockGlobalP5,
        mockAudioElement
      )

      expect(mockP5.createCanvas).toHaveBeenCalledWith(1200, 800)
      expect(result.dimensions).toEqual({ width: 1200, height: 800 })
    })

    test('should handle window resize events', () => {
      const mockP5 = createMockP5()
      const mockGlobalP5 = createMockGlobalP5()
      const mockAudioElement = createMockAudioElement()
      const mockFFT = { setInput: jest.fn() }
      mockGlobalP5.FFT.mockReturnValue(mockFFT)
      const mockCanvas = {
        parentElement: {
          offsetWidth: 1200,
          offsetHeight: 800,
        },
        style: {
          position: '',
          top: '',
          left: '',
          zIndex: '',
        },
      }
      mockP5.canvas = mockCanvas
      const onResize = jest.fn()

      setupAudioReactiveCanvas(mockP5, mockGlobalP5, mockAudioElement, {
        onResize,
      })

      // Simulate window resize
      mockP5.windowResized()
      expect(mockP5.resizeCanvas).toHaveBeenCalledWith(1200, 800)
      expect(onResize).toHaveBeenCalledWith(1200, 800)
    })
  })

  describe('initializeFrequencyData', () => {
    test('should initialize arrays with default band count', () => {
      const result = initializeFrequencyData()

      expect(result.frequencyData).toHaveLength(8)
      expect(result.smoothedData).toHaveLength(8)
      expect(result.frequencyData.every((val) => val === 0)).toBe(true)
      expect(result.smoothedData.every((val) => val === 0)).toBe(true)
    })

    test('should initialize arrays with custom band count', () => {
      const result = initializeFrequencyData(16)

      expect(result.frequencyData).toHaveLength(16)
      expect(result.smoothedData).toHaveLength(16)
      expect(result.frequencyData.every((val) => val === 0)).toBe(true)
      expect(result.smoothedData.every((val) => val === 0)).toBe(true)
    })

    test('should handle zero band count', () => {
      const result = initializeFrequencyData(0)

      expect(result.frequencyData).toHaveLength(0)
      expect(result.smoothedData).toHaveLength(0)
    })
  })
})
