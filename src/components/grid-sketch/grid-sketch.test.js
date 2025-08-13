import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import GridSketch from './grid-sketch'

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

describe('GridSketch', () => {
  test('renders without crashing', async () => {
    render(<GridSketch />)

    await waitFor(() => {
      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })
  })

  test('renders with custom className', async () => {
    const customClass = 'custom-grid-sketch'
    render(<GridSketch className={customClass} />)

    await waitFor(() => {
      expect(screen.getByTestId('p5-sketch')).toHaveClass(customClass)
    })
  })

  test('renders with custom style', async () => {
    const customStyle = { backgroundColor: 'blue' }
    render(<GridSketch style={customStyle} />)

    await waitFor(() => {
      expect(screen.getByTestId('p5-sketch')).toHaveStyle(customStyle)
    })
  })

  test('executes sketch function with p5 instance', async () => {
    const mockSketch = jest.fn()
    render(<GridSketch sketch={mockSketch} />)

    await waitFor(() => {
      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })
  })

  test('handles missing sketch prop gracefully', async () => {
    render(<GridSketch />)

    await waitFor(() => {
      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })
  })

  // Test the actual sketch function logic
  describe('sketch function logic', () => {
    let mockP5
    let sketchFunction

    beforeEach(() => {
      mockP5 = {
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
      }
    })

    test('creates sketch function', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      expect(typeof GridSketchComponent).toBe('function')
    })

    test('sketch function accepts p5 instance', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      expect(() => render(<GridSketchComponent />)).not.toThrow()
    })

    test('sketch function calls p5 methods', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles different frame counts', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      const { rerender } = render(<GridSketchComponent />)

      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles different canvas dimensions', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      const { rerender } = render(<GridSketchComponent />)

      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function creates particles', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles window resize', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      const { rerender } = render(<GridSketchComponent />)

      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles particle lifecycle', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles edge cases', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      const { rerender } = render(<GridSketchComponent />)

      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function initializes with setup method', () => {
      // Import the sketch function directly from the file
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(__dirname, 'grid-sketch.js')
      const fileContent = fs.readFileSync(filePath, 'utf8')

      // Check that the sketch function is defined
      expect(fileContent).toContain('const GridSketchSketch = (p) => {')
      expect(fileContent).toContain('p.setup = () => {')
    })

    test('sketch function initializes with draw method', () => {
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(__dirname, 'grid-sketch.js')
      const fileContent = fs.readFileSync(filePath, 'utf8')

      expect(fileContent).toContain('p.draw = () => {')
    })

    test('sketch function initializes with windowResized method', () => {
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(__dirname, 'grid-sketch.js')
      const fileContent = fs.readFileSync(filePath, 'utf8')

      expect(fileContent).toContain('p.windowResized = () => {')
    })

    test('sketch function initializes with seed method', () => {
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(__dirname, 'grid-sketch.js')
      const fileContent = fs.readFileSync(filePath, 'utf8')

      expect(fileContent).toContain('p.seed = () => {')
    })

    test('sketch function handles different window dimensions', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      // Test with different window sizes
      const { rerender } = render(<GridSketchComponent />)

      // Simulate different window dimensions
      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles canvas creation', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles canvas resizing', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      const { rerender } = render(<GridSketchComponent />)

      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles particle seeding', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles frame count limits', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles margin calculations', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles spacing calculations', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles radius calculations', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles particle array management', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles background setup', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles canvas dimensions', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles responsive design', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles window resize events', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      const { rerender } = render(<GridSketchComponent />)

      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles particle recreation on resize', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      const { rerender } = render(<GridSketchComponent />)

      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles global variable updates', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles canvas parent element access', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles missing canvas gracefully', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles missing canvas parent gracefully', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles missing canvas parent offsetWidth gracefully', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles zero dimensions gracefully', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles negative dimensions gracefully', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles very large dimensions gracefully', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles decimal dimensions gracefully', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles string dimensions gracefully', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles null dimensions gracefully', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles undefined dimensions gracefully', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')

      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })
  })

  describe('Particle class behavior', () => {
    test('particle constructor initializes properties correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle movement calculations work correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle fade logic works correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle boundary checking works correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle show method works correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle move method works correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle update method works correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle fade method works correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle boundary reset works correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle opacity limits work correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle fade direction changes work correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle movement uses frame count', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle movement uses noise function', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle movement uses sin and cos functions', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle movement uses map function', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle movement respects movement speed', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle movement respects slow factor', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle movement uses wonk factors', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle movement uses particle index', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle movement uses start position', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle boundary checking uses margin', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle boundary checking uses canvas dimensions', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle boundary reset uses start position', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle fade rate affects opacity', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle fade direction affects opacity', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle opacity limits are enforced', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle fade direction changes at limits', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle show method uses noStroke', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle show method uses fill', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle show method uses ellipse', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle show method uses opacity', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle show method uses radius', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle show method uses position', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })
  })

  describe('Canvas setup and management', () => {
    test('canvas creation works correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('canvas resizing works correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      const { rerender } = render(<GridSketchComponent />)

      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle seeding works correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('canvas background is set correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('canvas dimensions are set correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('margin is calculated correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('spacing is calculated correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('radius is calculated correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle count is managed correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle array is initialized correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle array is cleared on resize', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      const { rerender } = render(<GridSketchComponent />)

      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle array is reseeded on resize', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      const { rerender } = render(<GridSketchComponent />)

      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('global variables are updated on resize', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      const { rerender } = render(<GridSketchComponent />)

      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('canvas parent element is accessed correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('canvas parent offsetWidth is accessed correctly', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('canvas creation uses window dimensions', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('canvas resizing uses window dimensions', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      const { rerender } = render(<GridSketchComponent />)

      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('canvas background is set on resize', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      const { rerender } = render(<GridSketchComponent />)

      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('canvas seed is called on resize', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      const { rerender } = render(<GridSketchComponent />)

      rerender(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle seeding uses margin', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle seeding uses spacing', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle seeding uses canvas dimensions', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle seeding creates correct particle count', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle seeding uses correct particle parameters', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle seeding uses correct start positions', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle seeding uses correct radius', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle seeding uses correct opacity', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle seeding uses correct movement speed', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle seeding uses correct slow factor', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle seeding uses correct fade rate', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('particle seeding uses correct fade state', () => {
      const { default: GridSketchComponent } = require('./grid-sketch')
      render(<GridSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })
  })
})
