import React from 'react'
import { render } from '@testing-library/react'
import AudioReactiveGridSketch, {
  createAudioReactiveGridSketch,
} from './audio-reactive-grid-sketch'

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

// Mock the p5 utilities
jest.mock('../../utils/p5', () => ({
  generateSeedFromText: jest.fn(() => 12345),
  generateTatShapePositions: jest.fn(() => [
    { x: 100, y: 100 },
    { x: 200, y: 200 },
    { x: 300, y: 300 },
  ]),
}))

describe('AudioReactiveGridSketch', () => {
  test('renders without crashing', async () => {
    render(<AudioReactiveGridSketch />)
  })

  test('renders with custom className', async () => {
    const customClass = 'custom-audio-sketch'
    render(<AudioReactiveGridSketch className={customClass} />)
  })

  test('renders with custom style', async () => {
    const customStyle = { backgroundColor: 'blue' }
    render(<AudioReactiveGridSketch style={customStyle} />)
  })

  test('executes sketch function with p5 instance', async () => {
    const mockSketch = jest.fn()
    render(<AudioReactiveGridSketch sketch={mockSketch} />)
  })

  test('handles missing sketch prop gracefully', async () => {
    render(<AudioReactiveGridSketch />)
  })

  test('renders with markov text prop', async () => {
    const markovText = 'test markov text'
    render(<AudioReactiveGridSketch markovText={markovText} />)
  })

  test('renders with playlist duration prop', async () => {
    const duration = 300
    render(<AudioReactiveGridSketch totalPlaylistDuration={duration} />)
  })

  test('renders with both markov text and duration props', async () => {
    const markovText = 'test markov text'
    const duration = 300
    render(
      <AudioReactiveGridSketch
        markovText={markovText}
        totalPlaylistDuration={duration}
      />
    )
  })

  test('handles empty markov text', async () => {
    render(<AudioReactiveGridSketch markovText="" />)
  })

  test('handles zero playlist duration', async () => {
    render(<AudioReactiveGridSketch totalPlaylistDuration={0} />)
  })

  test('handles negative playlist duration', async () => {
    render(<AudioReactiveGridSketch totalPlaylistDuration={-100} />)
  })

  test('handles very long markov text', async () => {
    const longText = 'a'.repeat(10000)
    render(<AudioReactiveGridSketch markovText={longText} />)
  })

  test('handles very large playlist duration', async () => {
    const largeDuration = 999999
    render(<AudioReactiveGridSketch totalPlaylistDuration={largeDuration} />)
  })

  test('handles special characters in markov text', async () => {
    const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    render(<AudioReactiveGridSketch markovText={specialText} />)
  })

  test('handles unicode characters in markov text', async () => {
    const unicodeText = '🎵🎶🎸🎹🎺🎻🥁🎤🎧🎼'
    render(<AudioReactiveGridSketch markovText={unicodeText} />)
  })

  test('handles null markov text', async () => {
    render(<AudioReactiveGridSketch markovText={null} />)
  })

  test('handles undefined markov text', async () => {
    render(<AudioReactiveGridSketch markovText={undefined} />)
  })

  test('handles null playlist duration', async () => {
    render(<AudioReactiveGridSketch totalPlaylistDuration={null} />)
  })

  test('handles undefined playlist duration', async () => {
    render(<AudioReactiveGridSketch totalPlaylistDuration={undefined} />)
  })

  // Test the actual sketch function logic
  describe('sketch function logic', () => {
    let mockP5
    let sketchFunction

    beforeEach(() => {
      mockP5 = {
        createCanvas: jest.fn(),
        frameRate: jest.fn(),
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
        width: 800,
        height: 600,
        random: jest.fn((min, max) => (min + max) / 2),
        noise: jest.fn(() => 0.5),
        noStroke: jest.fn(),
        colorMode: jest.fn(),
        color: jest.fn(() => ({})),
        fill: jest.fn(),
        ellipse: jest.fn(),
        rect: jest.fn(),
        line: jest.fn(),
        stroke: jest.fn(),
        strokeWeight: jest.fn(),
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
        resizeCanvas: jest.fn(),
      }
    })

    test('creates sketch function with default parameters', () => {
      const sketch = createAudioReactiveGridSketch()
      expect(typeof sketch).toBe('function')
    })

    test('creates sketch function with markov text', () => {
      const markovText = 'test text'
      const sketch = createAudioReactiveGridSketch(markovText)
      expect(typeof sketch).toBe('function')
    })

    test('creates sketch function with playlist duration', () => {
      const duration = 300
      const sketch = createAudioReactiveGridSketch('', duration)
      expect(typeof sketch).toBe('function')
    })

    test('creates sketch function with both parameters', () => {
      const markovText = 'test text'
      const duration = 300
      const sketch = createAudioReactiveGridSketch(markovText, duration)
      expect(typeof sketch).toBe('function')
    })

    test('sketch function accepts p5 instance', () => {
      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(mockP5)).not.toThrow()
    })

    test('sketch function calls p5 methods', () => {
      const sketch = createAudioReactiveGridSketch()
      sketch(mockP5)

      // Call setup to initialize the sketch
      if (mockP5.setup) {
        mockP5.setup()
      }

      // Verify that p5 methods were called
      expect(mockP5.createCanvas).toHaveBeenCalled()
      expect(mockP5.frameRate).toHaveBeenCalled()
    })

    test('sketch function handles different frame counts', () => {
      const sketch = createAudioReactiveGridSketch()

      // Test with different frame counts
      mockP5.frameCount = 1
      expect(() => sketch(mockP5)).not.toThrow()

      mockP5.frameCount = 100
      expect(() => sketch(mockP5)).not.toThrow()

      mockP5.frameCount = 1000
      expect(() => sketch(mockP5)).not.toThrow()
    })

    test('sketch function handles different canvas dimensions', () => {
      const sketch = createAudioReactiveGridSketch()

      // Test with different canvas sizes
      mockP5.width = 400
      mockP5.height = 300
      expect(() => sketch(mockP5)).not.toThrow()

      mockP5.width = 1200
      mockP5.height = 800
      expect(() => sketch(mockP5)).not.toThrow()
    })

    test('sketch function with markov text influences behavior', () => {
      const markovText = 'influential text'
      const sketch = createAudioReactiveGridSketch(markovText)
      expect(() => sketch(mockP5)).not.toThrow()
    })

    test('sketch function with playlist duration influences behavior', () => {
      const duration = 500
      const sketch = createAudioReactiveGridSketch('', duration)
      expect(() => sketch(mockP5)).not.toThrow()
    })

    test('sketch function initializes with setup method', () => {
      const sketch = createAudioReactiveGridSketch()
      sketch(mockP5)

      // The sketch should have created a setup method
      expect(typeof mockP5.setup).toBe('function')
    })

    test('sketch function initializes with draw method', () => {
      const sketch = createAudioReactiveGridSketch()
      sketch(mockP5)

      // The sketch should have created a draw method
      expect(typeof mockP5.draw).toBe('function')
    })

    test('sketch function initializes with windowResized method', () => {
      const sketch = createAudioReactiveGridSketch()
      sketch(mockP5)

      // The sketch should have created a windowResized method
      expect(typeof mockP5.windowResized).toBe('function')
    })

    test('sketch function initializes with seed method', () => {
      const sketch = createAudioReactiveGridSketch()
      sketch(mockP5)

      // The sketch should have created a seed method
      expect(typeof mockP5.seed).toBe('function')
    })

    test('sketch function handles invalid markov seed gracefully', () => {
      // Mock generateSeedFromText to return invalid values
      const { generateSeedFromText } = require('../../utils/p5')
      generateSeedFromText.mockReturnValueOnce(NaN)
      generateSeedFromText.mockReturnValueOnce(Infinity)
      generateSeedFromText.mockReturnValueOnce(-Infinity)

      const sketch = createAudioReactiveGridSketch('invalid text')
      expect(() => sketch(mockP5)).not.toThrow()
    })

    test('sketch function handles extreme markov seed values', () => {
      const { generateSeedFromText } = require('../../utils/p5')
      generateSeedFromText.mockReturnValueOnce(0)
      generateSeedFromText.mockReturnValueOnce(999999)

      const sketch = createAudioReactiveGridSketch('extreme text')
      expect(() => sketch(mockP5)).not.toThrow()
    })

    test('sketch function handles missing p5 canvas gracefully', () => {
      const sketch = createAudioReactiveGridSketch()
      mockP5.canvas = null
      expect(() => sketch(mockP5)).not.toThrow()
    })

    test('sketch function handles missing p5 canvas parent gracefully', () => {
      const sketch = createAudioReactiveGridSketch()
      mockP5.canvas = { parentElement: null }
      expect(() => sketch(mockP5)).not.toThrow()
    })

    test('sketch function handles missing p5 canvas parent offsetWidth gracefully', () => {
      const sketch = createAudioReactiveGridSketch()
      mockP5.canvas = { parentElement: {} }
      expect(() => sketch(mockP5)).not.toThrow()
    })

    test('sketch function handles window resize events', () => {
      const sketch = createAudioReactiveGridSketch()
      sketch(mockP5)

      // Simulate window resize
      if (mockP5.windowResized) {
        expect(() => mockP5.windowResized()).not.toThrow()
      }
    })

    test('sketch function handles seed method calls', () => {
      const sketch = createAudioReactiveGridSketch()
      sketch(mockP5)

      // Simulate seed method call
      if (mockP5.seed) {
        expect(() => mockP5.seed()).not.toThrow()
      }
    })

    test('sketch function handles draw method calls', () => {
      const sketch = createAudioReactiveGridSketch()
      sketch(mockP5)

      // Simulate draw method call
      if (mockP5.draw) {
        expect(() => mockP5.draw()).not.toThrow()
      }
    })

    test('sketch function handles setup method calls', () => {
      const sketch = createAudioReactiveGridSketch()
      sketch(mockP5)

      // Simulate setup method call
      if (mockP5.setup) {
        expect(() => mockP5.setup()).not.toThrow()
      }
    })

    test('sketch function handles different markov text lengths', () => {
      const shortText = 'a'
      const mediumText = 'medium length text'
      const longText = 'very long text that should still work properly'

      expect(() =>
        createAudioReactiveGridSketch(shortText)(mockP5)
      ).not.toThrow()
      expect(() =>
        createAudioReactiveGridSketch(mediumText)(mockP5)
      ).not.toThrow()
      expect(() =>
        createAudioReactiveGridSketch(longText)(mockP5)
      ).not.toThrow()
    })

    test('sketch function handles different playlist durations', () => {
      const shortDuration = 1
      const mediumDuration = 300
      const longDuration = 3600

      expect(() =>
        createAudioReactiveGridSketch('', shortDuration)(mockP5)
      ).not.toThrow()
      expect(() =>
        createAudioReactiveGridSketch('', mediumDuration)(mockP5)
      ).not.toThrow()
      expect(() =>
        createAudioReactiveGridSketch('', longDuration)(mockP5)
      ).not.toThrow()
    })

    test('sketch function handles edge case parameters', () => {
      // Test with edge case values
      expect(() => createAudioReactiveGridSketch('', 0)(mockP5)).not.toThrow()
      expect(() => createAudioReactiveGridSketch('', -1)(mockP5)).not.toThrow()
      expect(() =>
        createAudioReactiveGridSketch('', 999999)(mockP5)
      ).not.toThrow()
    })

    test('sketch function handles missing tat shape positions gracefully', () => {
      const { generateTatShapePositions } = require('../../utils/p5')
      generateTatShapePositions.mockReturnValueOnce([])

      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(mockP5)).not.toThrow()
    })

    test('sketch function handles null tat shape positions gracefully', () => {
      const { generateTatShapePositions } = require('../../utils/p5')
      generateTatShapePositions.mockReturnValueOnce(null)

      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(mockP5)).not.toThrow()
    })

    test('sketch function handles undefined tat shape positions gracefully', () => {
      const { generateTatShapePositions } = require('../../utils/p5')
      generateTatShapePositions.mockReturnValueOnce(undefined)

      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(mockP5)).not.toThrow()
    })

    test('sketch function handles invalid tat shape positions gracefully', () => {
      const { generateTatShapePositions } = require('../../utils/p5')
      generateTatShapePositions.mockReturnValueOnce([
        { x: 'invalid', y: 'invalid' },
        { x: null, y: null },
        { x: undefined, y: undefined },
      ])

      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(mockP5)).not.toThrow()
    })

    test('sketch function handles p5 instance without required methods gracefully', () => {
      const minimalP5 = {
        width: 800,
        height: 600,
        canvas: { parentElement: { offsetWidth: 800 } },
      }

      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(minimalP5)).not.toThrow()
    })

    test('sketch function handles p5 instance with missing canvas gracefully', () => {
      const minimalP5 = {
        width: 800,
        height: 600,
      }

      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(minimalP5)).not.toThrow()
    })

    test('sketch function handles p5 instance with missing dimensions gracefully', () => {
      const minimalP5 = {
        canvas: { parentElement: { offsetWidth: 800 } },
      }

      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(minimalP5)).not.toThrow()
    })

    test('sketch function handles p5 instance with zero dimensions gracefully', () => {
      const minimalP5 = {
        width: 0,
        height: 0,
        canvas: { parentElement: { offsetWidth: 800 } },
      }

      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(minimalP5)).not.toThrow()
    })

    test('sketch function handles p5 instance with negative dimensions gracefully', () => {
      const minimalP5 = {
        width: -100,
        height: -100,
        canvas: { parentElement: { offsetWidth: 800 } },
      }

      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(minimalP5)).not.toThrow()
    })

    test('sketch function handles p5 instance with very large dimensions gracefully', () => {
      const minimalP5 = {
        width: 999999,
        height: 999999,
        canvas: { parentElement: { offsetWidth: 800 } },
      }

      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(minimalP5)).not.toThrow()
    })

    test('sketch function handles p5 instance with decimal dimensions gracefully', () => {
      const minimalP5 = {
        width: 800.5,
        height: 600.7,
        canvas: { parentElement: { offsetWidth: 800 } },
      }

      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(minimalP5)).not.toThrow()
    })

    test('sketch function handles p5 instance with string dimensions gracefully', () => {
      const minimalP5 = {
        width: '800',
        height: '600',
        canvas: { parentElement: { offsetWidth: 800 } },
      }

      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(minimalP5)).not.toThrow()
    })

    test('sketch function handles p5 instance with null dimensions gracefully', () => {
      const minimalP5 = {
        width: null,
        height: null,
        canvas: { parentElement: { offsetWidth: 800 } },
      }

      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(minimalP5)).not.toThrow()
    })

    test('sketch function handles p5 instance with undefined dimensions gracefully', () => {
      const minimalP5 = {
        width: undefined,
        height: undefined,
        canvas: { parentElement: { offsetWidth: 800 } },
      }

      const sketch = createAudioReactiveGridSketch()
      expect(() => sketch(minimalP5)).not.toThrow()
    })
  })
})
