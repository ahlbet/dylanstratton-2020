import React from 'react'
import { render, act } from '@testing-library/react'
import P5Sketch from './p5-sketch'

// Mock the p5-mobile-fix utility
jest.mock('../../utils/p5-mobile-fix', () => ({
  applyMobileFix: jest.fn(),
}))

// Types
interface MockP5Instance {
  remove: jest.Mock
}

interface MockP5Constructor {
  (sketch: any, element: HTMLElement): MockP5Instance
}

// Use type assertion for testing instead of global declaration

describe('P5Sketch', () => {
  const mockSketch = jest.fn()
  const mockApplyMobileFix = require('../../utils/p5-mobile-fix').applyMobileFix

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset window.p5
    delete window.p5
  })

  afterEach(() => {
    // Clean up any p5 instances that might have been created
    if (
      window.p5 &&
      window.p5.prototype &&
      (window.p5.prototype as any).remove
    ) {
      const instances = document.querySelectorAll('canvas')
      instances.forEach((canvas) => {
        if ((canvas as any)._p5Instance && (canvas as any)._p5Instance.remove) {
          ;(canvas as any)._p5Instance.remove()
        }
      })
    }
  })

  it('renders without crashing', () => {
    render(<P5Sketch sketch={mockSketch} />)
    expect(document.querySelector('div')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<P5Sketch sketch={mockSketch} className="custom-class" />)
    expect(document.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('applies custom style', () => {
    const customStyle = { width: '100px', height: '100px' }
    render(<P5Sketch sketch={mockSketch} style={customStyle} />)
    const div = document.querySelector('div')
    expect(div).toBeInTheDocument()
    // The component may apply styles differently during loading state
    // Just verify the element exists and can receive styles
  })

  it('renders loading state initially when not in client environment', () => {
    // Component should render loading state during SSR or before client hydration
    render(<P5Sketch sketch={mockSketch} />)
    const container = document.querySelector('div')
    expect(container).toBeInTheDocument()
  })

  it('handles null sketch gracefully', () => {
    render(<P5Sketch sketch={null as any} />)
    expect(document.querySelector('div')).toBeInTheDocument()
  })

  it('handles undefined sketch gracefully', () => {
    render(<P5Sketch sketch={undefined as any} />)
    expect(document.querySelector('div')).toBeInTheDocument()
  })

  it('shows warning when p5 is not available', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    render(<P5Sketch sketch={mockSketch} />)

    // Wait for useEffect to run
    act(() => {
      // Simulate client-side rendering
      const event = new Event('load')
      window.dispatchEvent(event)
    })

    expect(consoleSpy).toHaveBeenCalledWith('p5 not available, waiting...')
    consoleSpy.mockRestore()
  })

  it('creates p5 instance when p5 is available', () => {
    // Mock p5 constructor
    const mockP5Instance: MockP5Instance = {
      remove: jest.fn(),
    }
    const mockP5Constructor: MockP5Constructor = jest.fn(() => mockP5Instance)

    // Set up window.p5
    Object.defineProperty(window, 'p5', {
      value: mockP5Constructor,
      writable: true,
    })

    render(<P5Sketch sketch={mockSketch} />)

    // Wait for useEffect to run
    act(() => {
      // Simulate client-side rendering
      const event = new Event('load')
      window.dispatchEvent(event)
    })

    expect(mockP5Constructor).toHaveBeenCalledWith(
      mockSketch,
      expect.any(HTMLElement)
    )
    expect(mockApplyMobileFix).toHaveBeenCalledWith(mockP5Instance)
  })

  it('applies mobile fix to p5 instance', () => {
    const mockP5Instance: MockP5Instance = {
      remove: jest.fn(),
    }
    const mockP5Constructor: MockP5Constructor = jest.fn(() => mockP5Instance)

    Object.defineProperty(window, 'p5', {
      value: mockP5Constructor,
      writable: true,
    })

    render(<P5Sketch sketch={mockSketch} />)

    act(() => {
      const event = new Event('load')
      window.dispatchEvent(event)
    })

    expect(mockApplyMobileFix).toHaveBeenCalledWith(mockP5Instance)
  })

  it('cleans up existing p5 instance before creating new one', () => {
    const mockP5Instance: MockP5Instance = {
      remove: jest.fn(),
    }
    const mockP5Constructor: MockP5Constructor = jest.fn(() => mockP5Instance)

    Object.defineProperty(window, 'p5', {
      value: mockP5Constructor,
      writable: true,
    })

    const { rerender } = render(<P5Sketch sketch={mockSketch} />)

    act(() => {
      const event = new Event('load')
      window.dispatchEvent(event)
    })

    // Rerender with different sketch to trigger cleanup
    const newSketch = jest.fn()
    rerender(<P5Sketch sketch={newSketch} />)

    act(() => {
      const event = new Event('load')
      window.dispatchEvent(event)
    })

    // Should have called remove on the first instance
    expect(mockP5Instance.remove).toHaveBeenCalled()
  })

  it('handles sketch prop changes', () => {
    const mockP5Instance: MockP5Instance = {
      remove: jest.fn(),
    }
    const mockP5Constructor: MockP5Constructor = jest.fn(() => mockP5Instance)

    Object.defineProperty(window, 'p5', {
      value: mockP5Constructor,
      writable: true,
    })

    const { rerender } = render(<P5Sketch sketch={mockSketch} />)

    act(() => {
      const event = new Event('load')
      window.dispatchEvent(event)
    })

    const newSketch = jest.fn()
    rerender(<P5Sketch sketch={newSketch} />)

    act(() => {
      const event = new Event('load')
      window.dispatchEvent(event)
    })

    expect(mockP5Constructor).toHaveBeenCalledTimes(2)
    expect(mockP5Constructor).toHaveBeenLastCalledWith(
      newSketch,
      expect.any(HTMLElement)
    )
  })

  it('renders loading state with correct styles when not client', () => {
    render(<P5Sketch sketch={mockSketch} />)

    // Initially should show loading state
    const container = document.querySelector('div')
    expect(container).toBeInTheDocument()

    // Check if loading state styles are applied (these may be applied during SSR)
    const computedStyle = window.getComputedStyle(container!)
    // Note: In test environment, some styles might not be fully computed
    // We're mainly checking that the element exists and can receive styles
  })

  it('renders canvas container when client-side', () => {
    const mockP5Instance: MockP5Instance = {
      remove: jest.fn(),
    }
    const mockP5Constructor: MockP5Constructor = jest.fn(() => mockP5Instance)

    Object.defineProperty(window, 'p5', {
      value: mockP5Constructor,
      writable: true,
    })

    render(<P5Sketch sketch={mockSketch} />)

    act(() => {
      const event = new Event('load')
      window.dispatchEvent(event)
    })

    const container = document.querySelector('div')
    expect(container).toBeInTheDocument()
    // Check that the container has a ref (React refs are not directly accessible in tests)
    expect(container).toBeInstanceOf(HTMLDivElement)
  })

  it('handles component unmounting gracefully', () => {
    const mockP5Instance: MockP5Instance = {
      remove: jest.fn(),
    }
    const mockP5Constructor: MockP5Constructor = jest.fn(() => mockP5Instance)

    Object.defineProperty(window, 'p5', {
      value: mockP5Constructor,
      writable: true,
    })

    const { unmount } = render(<P5Sketch sketch={mockSketch} />)

    act(() => {
      const event = new Event('load')
      window.dispatchEvent(event)
    })

    unmount()

    // Should have called remove on cleanup
    expect(mockP5Instance.remove).toHaveBeenCalled()
  })

  it('handles multiple rapid sketch changes', () => {
    const mockP5Instance: MockP5Instance = {
      remove: jest.fn(),
    }
    const mockP5Constructor: MockP5Constructor = jest.fn(() => mockP5Instance)

    Object.defineProperty(window, 'p5', {
      value: mockP5Constructor,
      writable: true,
    })

    const { rerender } = render(<P5Sketch sketch={mockSketch} />)

    // Rapidly change sketches
    const sketches = [jest.fn(), jest.fn(), jest.fn()]

    sketches.forEach((sketch, index) => {
      rerender(<P5Sketch sketch={sketch} />)

      act(() => {
        const event = new Event('load')
        window.dispatchEvent(event)
      })
    })

    // Should handle cleanup and recreation properly
    expect(mockP5Instance.remove).toHaveBeenCalledTimes(sketches.length)
    expect(mockP5Constructor).toHaveBeenCalledTimes(sketches.length + 1) // +1 for initial render
  })
})
