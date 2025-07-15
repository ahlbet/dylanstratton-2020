import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AudioPlayer from './audio-player'

// Mock the rhythm function
jest.mock('../../utils/typography', () => ({
  rhythm: jest.fn((value) => `${value * 16}px`),
}))

describe('AudioPlayer', () => {
  const mockSrc = 'https://example.com/audio.wav'
  const mockTitle = 'Test Audio'

  beforeEach(() => {
    // Mock HTML5 Audio API
    global.HTMLAudioElement.prototype.play = jest.fn()
    global.HTMLAudioElement.prototype.pause = jest.fn()
    global.HTMLAudioElement.prototype.addEventListener = jest.fn()
    global.HTMLAudioElement.prototype.removeEventListener = jest.fn()
  })

  it('renders with title', () => {
    render(<AudioPlayer src={mockSrc} title={mockTitle} />)
    expect(screen.getByText(mockTitle)).toBeInTheDocument()
  })

  it('renders without title', () => {
    render(<AudioPlayer src={mockSrc} />)
    expect(screen.queryByText(mockTitle)).not.toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<AudioPlayer src={mockSrc} />)
    const playButton = screen.getByRole('button', { name: /play/i })
    expect(playButton).toBeDisabled()
  })

  it('handles play/pause toggle', async () => {
    render(<AudioPlayer src={mockSrc} />)
    const playButton = screen.getByRole('button', { name: /play/i })

    // Mock audio loaded state
    const audioElement = document.querySelector('audio')
    Object.defineProperty(audioElement, 'duration', { value: 120 })

    // Simulate audio loaded
    fireEvent.loadedData(audioElement)

    await waitFor(() => {
      expect(playButton).not.toBeDisabled()
    })

    fireEvent.click(playButton)
    expect(global.HTMLAudioElement.prototype.play).toHaveBeenCalled()
  })

  it('handles volume change', () => {
    render(<AudioPlayer src={mockSrc} />)
    const volumeSlider = screen.getByRole('slider', { name: /volume/i })

    fireEvent.change(volumeSlider, { target: { value: '0.5' } })
    expect(volumeSlider.value).toBe('0.5')
  })

  it('formats time correctly', () => {
    render(<AudioPlayer src={mockSrc} />)
    const timeElements = screen.getAllByText(/^\d+:\d{2}$/)
    expect(timeElements.length).toBeGreaterThan(0)
  })

  it('applies custom className', () => {
    const customClass = 'custom-audio-player'
    render(<AudioPlayer src={mockSrc} className={customClass} />)
    const playerElement = screen
      .getByRole('button', { name: /play/i })
      .closest('.audio-player')
    expect(playerElement).toHaveClass(customClass)
  })

  it('handles error state', () => {
    render(<AudioPlayer src="invalid-url" />)
    const audioElement = document.querySelector('audio')

    fireEvent.error(audioElement)

    expect(screen.getByText(/error/i)).toBeInTheDocument()
    expect(screen.getByText(/failed to load audio file/i)).toBeInTheDocument()
  })
})
