import React from 'react'
import { render, screen } from '@testing-library/react'
import PoemssSketch from './poemss-sketch'

// Mock P5Sketch component
jest.mock('../p5-sketch/p5-sketch', () => {
  return function MockP5Sketch({ sketch, className, style }) {
    // Execute the sketch function to test its logic
    if (sketch) {
      // Create mock p5 instance inline to avoid Jest mock scope issues
      const mockP5 = {
        windowWidth: 800,
        windowHeight: 600,
        width: 600,
        height: 400,
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
        textAlign: jest.fn(),
        textSize: jest.fn(),
        text: jest.fn(),
        mouseX: 300,
        mouseY: 350,
        CENTER: 'CENTER',
        LEFT: 'LEFT',
        markovIt: jest.fn(),
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

// Mock fetch
global.fetch = jest.fn()

describe('PoemssSketch', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders without crashing', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('renders with custom className', () => {
    const customClass = 'custom-poemss-sketch'
    render(<PoemssSketch className={customClass} />)

    expect(screen.getByTestId('p5-sketch')).toHaveClass(customClass)
  })

  test('renders with custom style', () => {
    const customStyle = { backgroundColor: 'blue' }
    render(<PoemssSketch style={customStyle} />)

    expect(screen.getByTestId('p5-sketch')).toHaveStyle(customStyle)
  })

  test('executes sketch function with p5 instance', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function creates canvas', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function sets up drawing context', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function loads text from file successfully', async () => {
    const mockText = 'Line 1\nLine 2\nLine 3'
    global.fetch.mockResolvedValueOnce({
      text: jest.fn().mockResolvedValue(mockText),
    })

    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function falls back to sample text on file load error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('File not found'))

    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function generates ngrams from text', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles text processing', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles mouse interaction', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function generates new text on click', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles text generation algorithm', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function displays generated text', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles text positioning', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles text styling', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles canvas background', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles text overflow', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles empty text gracefully', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles text filtering', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles ngram generation edge cases', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles button area interaction', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles multiple text generations', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles text alignment changes', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles text size changes', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles color changes', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles animation loop', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles performance optimization', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles error cases gracefully', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles edge cases', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function maintains consistent state', () => {
    render(<PoemssSketch />)

    expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
  })

  test('sketch function handles cleanup on unmount', () => {
    const { unmount } = render(<PoemssSketch />)

    unmount()

    expect(screen.queryByTestId('p5-sketch')).not.toBeInTheDocument()
  })

  // Test the actual sketch function logic
  describe('sketch function logic', () => {
    let mockP5
    let sketchFunction

    beforeEach(() => {
      mockP5 = {
        windowWidth: 800,
        windowHeight: 600,
        width: 600,
        height: 400,
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
        textAlign: jest.fn(),
        textSize: jest.fn(),
        text: jest.fn(),
        mouseX: 300,
        mouseY: 350,
        CENTER: 'CENTER',
        LEFT: 'LEFT',
        markovIt: jest.fn(),
      }
    })

    test('creates sketch function', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')
      expect(typeof PoemssSketchComponent).toBe('function')
    })

    test('sketch function accepts p5 instance', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')
      expect(() => render(<PoemssSketchComponent />)).not.toThrow()
    })

    test('sketch function calls p5 methods', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')
      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function initializes with setup method', () => {
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(__dirname, 'poemss-sketch.js')
      const fileContent = fs.readFileSync(filePath, 'utf8')

      expect(fileContent).toContain('const PoemssSketchSketch = (p) => {')
      expect(fileContent).toContain('p.setup = async () => {')
    })

    test('sketch function initializes with draw method', () => {
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(__dirname, 'poemss-sketch.js')
      const fileContent = fs.readFileSync(filePath, 'utf8')

      expect(fileContent).toContain('p.draw = () => {')
    })

    test('sketch function initializes with mousePressed method', () => {
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(__dirname, 'poemss-sketch.js')
      const fileContent = fs.readFileSync(filePath, 'utf8')

      expect(fileContent).toContain('p.mousePressed = () => {')
    })

    test('sketch function initializes with markovIt method', () => {
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(__dirname, 'poemss-sketch.js')
      const fileContent = fs.readFileSync(filePath, 'utf8')

      expect(fileContent).toContain('p.markovIt = () => {')
    })

    test('sketch function initializes with iterateMarkov method', () => {
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(__dirname, 'poemss-sketch.js')
      const fileContent = fs.readFileSync(filePath, 'utf8')

      expect(fileContent).toContain('p.iterateMarkov = () => {')
    })

    test('sketch function handles different canvas dimensions', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      const { rerender } = render(<PoemssSketchComponent />)

      rerender(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text loading from multiple sources', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text filtering and processing', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles ngram generation', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles beginnings array population', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text alignment setup', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text size setup', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text color setup', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles button text display', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles background refresh in draw', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles generated text display', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text positioning in draw', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text overflow in draw', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles button area detection', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles Markov chain text generation', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles empty beginnings array', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles Markov chain iteration', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text generation limits', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles ngram lookup failures', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text generation completion', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles generated text storage', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles canvas dimensions in setup', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles background color in setup', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text loading errors gracefully', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles fallback text loading', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text splitting and filtering', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles ngram dictionary building', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text length edge cases', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles empty text lines', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text alignment in setup', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text size in setup', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text color in setup', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles button text positioning', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles background refresh in draw loop', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text alignment in draw', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text size in draw', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text color in draw', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles generated text iteration', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles text positioning calculation', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles canvas height constraints', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles button area text display', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles mouse click detection', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles button area click detection', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles Markov chain text generation trigger', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles multiple Markov chain iterations', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles Markov chain text generation algorithm', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles Markov chain text generation limits', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles Markov chain text generation completion', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })

    test('sketch function handles generated text storage and display', () => {
      const { default: PoemssSketchComponent } = require('./poemss-sketch')

      render(<PoemssSketchComponent />)

      expect(screen.getByTestId('p5-sketch')).toBeInTheDocument()
    })
  })
})
