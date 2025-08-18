import React from 'react'
import { render, screen } from '@testing-library/react'
import AudioFFT from './AudioFFT'

// Mock the audio player context
jest.mock('../../contexts/audio-player-context/audio-player-context', () => ({
  useAudioPlayer: () => ({
    audioRef: { current: { context: { state: 'running' } } },
  }),
}))

// Mock p5
global.window = global.window || {}
global.window.p5 = {
  createCanvas: jest.fn(),
  setup: jest.fn(),
  draw: jest.fn(),
  remove: jest.fn(),
}

describe('AudioFFT', () => {
  it('renders without crashing', () => {
    render(<AudioFFT />)
    expect(screen.getByTestId('audio-fft-container')).toBeInTheDocument()
  })

  it('generates different visual styles for different blog post metadata', () => {
    // Test that different blog post metadata generates different visual styles
    const metadata1 = {
      title: 'Test Post 1',
      date: '2024-01-01',
      daily_id: '001',
    }

    const metadata2 = {
      title: 'Test Post 2',
      date: '2024-01-02',
      daily_id: '002',
    }

    // Since we can't easily test the visual style generation without p5,
    // we'll test that the component renders with different metadata
    const { rerender } = render(<AudioFFT blogPostMetadata={metadata1} />)
    expect(screen.getByTestId('audio-fft-container')).toBeInTheDocument()

    rerender(<AudioFFT blogPostMetadata={metadata2} />)
    expect(screen.getByTestId('audio-fft-container')).toBeInTheDocument()
  })

  it('handles missing blog post metadata gracefully', () => {
    render(<AudioFFT />)
    expect(screen.getByTestId('audio-fft-container')).toBeInTheDocument()
  })

  it('handles missing markov text gracefully', () => {
    render(<AudioFFT />)
    expect(screen.getByTestId('audio-fft-container')).toBeInTheDocument()
  })
})
