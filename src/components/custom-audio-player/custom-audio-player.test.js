import React from 'react'
import { render, screen } from '@testing-library/react'
import CustomAudioPlayer from './custom-audio-player'

// Mock react-h5-audio-player
jest.mock('react-h5-audio-player', () => {
  return function MockAudioPlayer({ src, title, ...props }) {
    return (
      <div data-testid="react-h5-audio-player" data-src={src}>
        <div data-testid="audio-player-title">{title}</div>
        <button data-testid="play-button">Play</button>
        <div data-testid="progress-bar">Progress Bar</div>
        <div data-testid="volume-control">Volume Control</div>
      </div>
    )
  }
})

// Mock the rhythm function
jest.mock('../../utils/typography', () => ({
  rhythm: jest.fn((value) => `${value * 16}px`),
}))

describe('CustomAudioPlayer', () => {
  const mockSrc = 'https://example.com/audio.wav'
  const mockTitle = 'Test Audio'

  it('renders with title', () => {
    render(<CustomAudioPlayer src={mockSrc} title={mockTitle} />)
    expect(screen.getByText(mockTitle)).toBeInTheDocument()
  })

  it('renders without title', () => {
    render(<CustomAudioPlayer src={mockSrc} />)
    expect(screen.queryByText(mockTitle)).not.toBeInTheDocument()
  })

  it('passes src to react-h5-audio-player', () => {
    render(<CustomAudioPlayer src={mockSrc} />)
    const audioPlayer = screen.getByTestId('react-h5-audio-player')
    expect(audioPlayer).toHaveAttribute('data-src', mockSrc)
  })

  it('renders audio player controls', () => {
    render(<CustomAudioPlayer src={mockSrc} />)
    expect(screen.getByTestId('play-button')).toBeInTheDocument()
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
    expect(screen.getByTestId('volume-control')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const customClass = 'custom-audio-player-test'
    render(<CustomAudioPlayer src={mockSrc} className={customClass} />)
    const playerElement = screen
      .getByTestId('react-h5-audio-player')
      .closest('.custom-audio-player')
    expect(playerElement).toHaveClass(customClass)
  })

  it('has proper styling classes', () => {
    render(<CustomAudioPlayer src={mockSrc} />)
    const playerElement = screen
      .getByTestId('react-h5-audio-player')
      .closest('.custom-audio-player')
    expect(playerElement).toBeInTheDocument()
  })
})
