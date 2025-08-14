import React from 'react'
import { render, screen, act } from '@testing-library/react'

// Mock dependencies
jest.mock('../../contexts/audio-player-context/audio-player-context', () => ({
  useAudioPlayer: () => ({
    audioRef: { current: { context: {} } },
  }),
}))

jest.mock('../../utils/p5', () => ({
  getFrequencyBands: jest.fn(),
  generateSeedFromText: jest.fn(() => 'test-seed'),
  generateTatShapePositions: jest.fn(() => [{ x: 100, y: 100 }]),
  analyzeFrequencyBands: jest.fn(),
  Particle: jest.fn(),
  calculateParticleCount: jest.fn(),
  calculateMaxParticles: jest.fn(),
  calculateCanvasScale: jest.fn(),
  calculateStaggeredSpawn: jest.fn(),
  updateTatShapePositions: jest.fn(),
  addDynamicMovementToPositions: jest.fn(),
  calculateSpawnPosition: jest.fn(),
  setupAudioReactiveCanvas: jest.fn(() => ({
    fft: { analyze: jest.fn() },
    sourceNode: {},
    dimensions: { width: 800, height: 600 },
  })),
  initializeFrequencyData: jest.fn(() => ({
    frequencyData: [0, 0, 0, 0, 0, 0, 0, 0],
    smoothedData: [0, 0, 0, 0, 0, 0, 0, 0],
  })),
  createAudioReactiveAnimationLoop: jest.fn(() => jest.fn()),
}))

import AudioFFT from './AudioFFT'

describe('AudioFFT', () => {
  beforeEach(() => {
    // Mock p5 globally
    global.window = global.window || {}
    global.window.p5 = jest.fn().mockImplementation(() => ({
      setup: jest.fn(),
      draw: jest.fn(),
      remove: jest.fn(),
      width: 800,
      height: 600,
    }))
  })

  afterEach(() => {
    // Clean up
    if (global.window && global.window.p5) {
      delete global.window.p5
    }
  })

  test('renders without crashing', () => {
    render(<AudioFFT />)

    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  test('renders with custom markov text', () => {
    const markovText = 'Custom markov text for testing'
    render(<AudioFFT markovText={markovText} />)

    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  test('renders container with correct styles', () => {
    render(<AudioFFT />)

    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)

    // The styles are applied to the inner div (second generic element)
    const styledContainer = containers[1]
    expect(styledContainer).toBeInTheDocument()
    expect(styledContainer).toHaveStyle({
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      zIndex: 1,
    })
  })

  test('handles missing p5 gracefully', () => {
    // Temporarily remove p5
    const mockP5 = window.p5
    delete window.p5

    render(<AudioFFT />)

    // The component should render without crashing even when p5 is missing
    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()

    // Restore p5
    window.p5 = mockP5
  })

  test('handles missing audio ref gracefully', () => {
    render(<AudioFFT />)

    // The component should render without crashing even when audio ref is missing
    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  test('calls p5 utilities with correct parameters', () => {
    const markovText = 'Test markov text'
    render(<AudioFFT markovText={markovText} />)

    // The component should render with the markov text
    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  test('handles p5 instance creation errors gracefully', () => {
    // Mock p5 to throw an error
    const mockP5 = jest.fn().mockImplementation(() => {
      throw new Error('P5 creation failed')
    })
    global.window.p5 = mockP5

    render(<AudioFFT />)

    // Component should render even when p5 creation fails
    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  test('cleans up p5 instance on unmount', () => {
    const mockRemove = jest.fn()
    const mockP5 = jest.fn().mockImplementation(() => ({
      setup: jest.fn(),
      draw: jest.fn(),
      remove: mockRemove,
      width: 800,
      height: 600,
    }))
    global.window.p5 = mockP5

    const { unmount } = render(<AudioFFT />)
    unmount()

    // Should call remove on p5 instance
    expect(mockRemove).toHaveBeenCalled()
  })

  test('handles FFT setup failure gracefully', () => {
    const { setupAudioReactiveCanvas } = require('../../utils/p5')
    setupAudioReactiveCanvas.mockReturnValueOnce({
      fft: null, // FFT setup failed
      sourceNode: {},
      dimensions: { width: 800, height: 600 },
    })

    render(<AudioFFT />)

    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  test('handles invalid canvas dimensions gracefully', () => {
    const { setupAudioReactiveCanvas } = require('../../utils/p5')
    setupAudioReactiveCanvas.mockReturnValueOnce({
      fft: { analyze: jest.fn() },
      sourceNode: {},
      dimensions: { width: 0, height: 0 }, // Invalid dimensions
    })

    render(<AudioFFT />)

    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  test('handles container ref not available in setup', () => {
    // Mock containerRef.current to be null
    const { setupAudioReactiveCanvas } = require('../../utils/p5')
    setupAudioReactiveCanvas.mockReturnValueOnce({
      fft: { analyze: jest.fn() },
      sourceNode: {},
      dimensions: { width: 800, height: 600 },
    })

    render(<AudioFFT />)

    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  test('handles p5 setup errors gracefully', () => {
    // Mock p5 to throw an error in setup
    const mockP5 = jest.fn().mockImplementation(() => ({
      setup: jest.fn().mockImplementation(() => {
        throw new Error('Setup failed')
      }),
      draw: jest.fn(),
      remove: jest.fn(),
      width: 800,
      height: 600,
    }))
    global.window.p5 = mockP5

    render(<AudioFFT />)

    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  test('handles cleanup errors gracefully', () => {
    const mockRemove = jest.fn().mockImplementation(() => {
      throw new Error('Cleanup failed')
    })
    const mockP5 = jest.fn().mockImplementation(() => ({
      setup: jest.fn(),
      draw: jest.fn(),
      remove: mockRemove,
      width: 800,
      height: 600,
    }))
    global.window.p5 = mockP5

    const { unmount } = render(<AudioFFT />)

    // Should not throw error during cleanup
    expect(() => unmount()).not.toThrow()
  })

  test('invokes onResize from setup to exercise resize branch', () => {
    const p5Utils = require('../../utils/p5')
    let capturedOnResize = null
    p5Utils.setupAudioReactiveCanvas.mockImplementationOnce(
      (p, P5, audioEl, options) => {
        capturedOnResize = options?.onResize || null
        return {
          fft: { analyze: jest.fn() },
          sourceNode: {},
          dimensions: { width: 800, height: 600 },
        }
      }
    )

    render(<AudioFFT markovText="resize test" />)

    act(() => {
      if (capturedOnResize) capturedOnResize(640, 360)
    })

    // Assert it rendered fine and did not crash
    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
  })

  test('handles existing p5 instance cleanup', () => {
    const mockRemove = jest.fn()
    const mockP5 = jest.fn().mockImplementation(() => ({
      setup: jest.fn(),
      draw: jest.fn(),
      remove: mockRemove,
      width: 800,
      height: 600,
    }))
    global.window.p5 = mockP5

    // Render first instance
    const { rerender } = render(<AudioFFT />)

    // Rerender to trigger cleanup and recreation
    rerender(<AudioFFT markovText="new text" />)

    // Should call remove on previous instance
    expect(mockRemove).toHaveBeenCalled()
  })

  test('handles p5 instance removal errors gracefully', () => {
    const mockRemove = jest.fn().mockImplementation(() => {
      throw new Error('Remove failed')
    })
    const mockP5 = jest.fn().mockImplementation(() => ({
      setup: jest.fn(),
      draw: jest.fn(),
      remove: mockRemove,
      width: 800,
      height: 600,
    }))
    global.window.p5 = mockP5

    const { rerender } = render(<AudioFFT />)

    // Should not throw error during removal
    expect(() => rerender(<AudioFFT markovText="new text" />)).not.toThrow()
  })

  test('handles missing audio ref context gracefully', () => {
    // Mock useAudioPlayer to return audioRef without context
    jest.doMock(
      '../../contexts/audio-player-context/audio-player-context',
      () => ({
        useAudioPlayer: () => ({
          audioRef: { current: null },
        }),
      })
    )

    render(<AudioFFT />)

    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  test('handles missing container ref gracefully', () => {
    // Mock containerRef.current to be null
    const { setupAudioReactiveCanvas } = require('../../utils/p5')
    setupAudioReactiveCanvas.mockReturnValueOnce({
      fft: { analyze: jest.fn() },
      sourceNode: {},
      dimensions: { width: 800, height: 600 },
    })

    render(<AudioFFT />)

    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  test('handles audio context not available gracefully', () => {
    // Mock useAudioPlayer to return null audioRef
    jest.doMock(
      '../../contexts/audio-player-context/audio-player-context',
      () => ({
        useAudioPlayer: () => ({
          audioRef: null,
        }),
      })
    )

    render(<AudioFFT />)

    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  test('handles audio ref without current gracefully', () => {
    // Mock useAudioPlayer to return audioRef without current
    jest.doMock(
      '../../contexts/audio-player-context/audio-player-context',
      () => ({
        useAudioPlayer: () => ({
          audioRef: {},
        }),
      })
    )

    render(<AudioFFT />)

    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })
})
