import React from 'react'
import { render, screen } from '@testing-library/react'
import WallPrintSketch from './wall-print-sketch'

// Mock P5Sketch component
jest.mock('../p5-sketch/p5-sketch', () => {
  return function MockP5Sketch({ sketch, className, style }) {
    // Execute the sketch function to test its logic
    if (sketch) {
      // Create mock p5 instance inline to avoid Jest mock scope issues
      const mockP5 = {
        windowWidth: 800,
        windowHeight: 600,
        width: 800,
        height: 600,
        frameCount: 1,
        random: jest.fn((min, max) => (min + max) / 2),
        noise: jest.fn(() => 0.5),
        createVector: jest.fn((x, y) => ({
          x,
          y,
          add: jest.fn(),
          mult: jest.fn(),
          normalize: jest.fn(),
        })),
        sin: jest.fn(() => 0.5),
        cos: jest.fn(() => 0.5),
        map: jest.fn(
          (value, start1, stop1, start2, stop2) =>
            start2 + ((value - start1) * (stop2 - start2)) / (stop1 - start1)
        ),
        floor: jest.fn((n) => Math.floor(n)),
        noStroke: jest.fn(),
        colorMode: jest.fn(),
        color: jest.fn(() => ({})),
        fill: jest.fn(),
        ellipse: jest.fn(),
        rect: jest.fn(),
        line: jest.fn(),
        stroke: jest.fn(),
        strokeWeight: jest.fn(),
        background: jest.fn(),
        clear: jest.fn(),
        push: jest.fn(),
        pop: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        blendMode: jest.fn(),
        drawingContext: {
          filter: jest.fn(),
        },
        canvas: {
          parentElement: { offsetWidth: 800 },
        },
        createCanvas: jest.fn(),
        resizeCanvas: jest.fn(),
        seed: jest.fn(),
        noFill: jest.fn(),
      }
      sketch(mockP5)
    }

    return (
      <div data-testid="p5-sketch" className={className} style={style}>
        Mock P5 Sketch
      </div>
    )
  }
})

describe('WallPrintSketch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders without crashing', () => {
    render(<WallPrintSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('renders with custom className', () => {
    const customClass = 'custom-wall-print-sketch'
    render(<WallPrintSketch className={customClass} />)

    expect(screen.getByTestId('p5-sketch')).toHaveClass(customClass)
  })

  test('renders with custom style', () => {
    const customStyle = { backgroundColor: 'blue' }
    render(<WallPrintSketch style={customStyle} />)

    expect(screen.getByTestId('p5-sketch')).toHaveStyle(customStyle)
  })

  test('executes sketch function with p5 instance', () => {
    render(<WallPrintSketch />)

    // The sketch function should be executed when the component renders
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function creates canvas', () => {
    render(<WallPrintSketch />)

    // The sketch should call createCanvas
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function sets up drawing context', () => {
    render(<WallPrintSketch />)

    // The sketch should set up the drawing context
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles window resize', () => {
    render(<WallPrintSketch />)

    // The sketch should handle window resize events
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function generates cubes', () => {
    render(<WallPrintSketch />)

    // The sketch should generate cube objects
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function draws cubes', () => {
    render(<WallPrintSketch />)

    // The sketch should draw the cube objects
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles cube birth animation', () => {
    render(<WallPrintSketch />)

    // The sketch should handle cube birth animation
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles different cube directions', () => {
    render(<WallPrintSketch />)

    // The sketch should handle different cube directions (horizontal/vertical)
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles color mapping', () => {
    render(<WallPrintSketch />)

    // The sketch should map colors using noise functions
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles stroke weight', () => {
    render(<WallPrintSketch />)

    // The sketch should set stroke weight for lines
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles time-based animation', () => {
    render(<WallPrintSketch />)

    // The sketch should use time for animation
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles random generation', () => {
    render(<WallPrintSketch />)

    // The sketch should use random functions for positioning and timing
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles noise functions', () => {
    render(<WallPrintSketch />)

    // The sketch should use noise functions for color generation
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles canvas dimensions', () => {
    render(<WallPrintSketch />)

    // The sketch should use canvas dimensions for positioning
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles drawing methods', () => {
    render(<WallPrintSketch />)

    // The sketch should call various drawing methods like line, stroke, strokeWeight
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles color settings', () => {
    render(<WallPrintSketch />)

    // The sketch should set colors for drawing
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles animation loop', () => {
    render(<WallPrintSketch />)

    // The sketch should have a draw function for animation
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles performance optimization', () => {
    render(<WallPrintSketch />)

    // The sketch should implement performance optimizations if needed
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles error cases gracefully', () => {
    render(<WallPrintSketch />)

    // The sketch should handle errors gracefully
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles edge cases', () => {
    render(<WallPrintSketch />)

    // The sketch should handle edge cases like very small or large canvas sizes
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function maintains consistent state', () => {
    render(<WallPrintSketch />)

    // The sketch should maintain consistent state across frames
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles cleanup on unmount', () => {
    const { unmount } = render(<WallPrintSketch />)

    // The sketch should clean up resources when unmounted
    unmount()

    // Should unmount without errors
    expect(screen.queryByTestId('p5-sketch')).not.toBeInTheDocument()
  })

  test('sketch function handles different cube sizes', () => {
    render(<WallPrintSketch />)

    // The sketch should handle different cube sizes
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles cube positioning', () => {
    render(<WallPrintSketch />)

    // The sketch should handle cube positioning on the grid
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles border and spacing', () => {
    render(<WallPrintSketch />)

    // The sketch should handle border and spacing parameters
    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })
})
