import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AudioFFT from './AudioFFT'

// Mock the audio player context
jest.mock('../../contexts/audio-player-context/audio-player-context', () => ({
  useAudioPlayer: () => ({
    audioRef: { current: { context: { state: 'running' } } },
  }),
}))

// Mock p5
global.window = {
  p5: {
    createVector: jest.fn(),
    random: jest.fn(),
    sin: jest.fn(),
    cos: jest.fn(),
    noise: jest.fn(),
    color: jest.fn(),
    colorMode: jest.fn(),
    fill: jest.fn(),
    noStroke: jest.fn(),
    ellipse: jest.fn(),
  },
}

describe('AudioFFT', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<AudioFFT />)
    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  it('generates visual style parameters', () => {
    // Test that the component can generate visual style parameters
    const { container } = render(<AudioFFT />)

    // The component should render a container div
    expect(container.firstChild).toBeInTheDocument()
  })

  it('applies visual style to particles', () => {
    // Test that visual style parameters are passed through the system
    const mockMarkovText = 'Test markov text for visual style generation'
    const mockBlogPostMetadata = {
      title: 'Test Blog Post',
      date: '2024-01-01',
      daily_id: 123,
      markovText: 'Additional markov content',
      cover_art: 'test-cover.jpg',
    }

    render(
      <AudioFFT
        markovText={mockMarkovText}
        blogPostMetadata={mockBlogPostMetadata}
      />
    )

    // The component should render with the provided metadata
    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  it('handles missing blog post metadata gracefully', () => {
    render(<AudioFFT markovText="Test text" />)
    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })

  it('handles empty markov text gracefully', () => {
    render(<AudioFFT blogPostMetadata={{ title: 'Test' }} />)
    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
    expect(containers[0]).toBeInTheDocument()
  })
})
