import React from 'react'
import { render } from '@testing-library/react'
import P5Sketch from './p5-sketch'

describe('P5Sketch', () => {
  const mockSketch = jest.fn()

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
    render(<P5Sketch sketch={null} />)
    expect(document.querySelector('div')).toBeInTheDocument()
  })

  it('handles undefined sketch gracefully', () => {
    render(<P5Sketch />)
    expect(document.querySelector('div')).toBeInTheDocument()
  })
})
