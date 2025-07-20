import React from 'react'
import { render, screen } from '@testing-library/react'
import P5Sketch from './p5-sketch'

// Mock p5.js
jest.mock('p5', () => {
  return jest.fn().mockImplementation((sketch, container) => {
    // Mock p5 instance
    const mockInstance = {
      remove: jest.fn(),
    }

    // Call setup if it exists
    if (sketch.setup) {
      sketch.setup.call(mockInstance)
    }

    return mockInstance
  })
})

describe('P5Sketch', () => {
  const mockSketch = {
    setup: jest.fn(),
    draw: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
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
  })

  it('creates p5 instance with sketch', () => {
    const p5 = require('p5')
    render(<P5Sketch sketch={mockSketch} />)
    expect(p5).toHaveBeenCalledWith(mockSketch, expect.any(HTMLElement))
  })

  it('handles null sketch gracefully', () => {
    const p5 = require('p5')
    render(<P5Sketch sketch={null} />)
    expect(p5).not.toHaveBeenCalled()
  })
})
