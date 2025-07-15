import React from 'react'
import { render, screen } from '@testing-library/react'
import AudioPlayerRenderer from './audio-player-renderer'

// Mock the CustomAudioPlayer component
jest.mock('../custom-audio-player/custom-audio-player', () => {
  return function MockCustomAudioPlayer({ src }) {
    return (
      <div data-testid="custom-audio-player" data-src={src}>
        Custom Audio Player
      </div>
    )
  }
})

// Mock ReactDOM
jest.mock('react-dom', () => ({
  render: jest.fn(),
  unmountComponentAtNode: jest.fn(),
}))

describe('AudioPlayerRenderer', () => {
  const mockHtmlContent = `
    <div>
      <p>Some content</p>
      <div class="custom-audio-wrapper" data-audio-src="https://example.com/audio1.wav"></div>
      <p>More content</p>
      <div class="custom-audio-wrapper" data-audio-src="https://example.com/audio2.wav"></div>
    </div>
  `

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<AudioPlayerRenderer htmlContent={mockHtmlContent} />)
    expect(screen.getByText('Custom Audio Player')).toBeInTheDocument()
  })

  it('finds audio wrapper elements', () => {
    render(<AudioPlayerRenderer htmlContent={mockHtmlContent} />)
    const audioPlayers = screen.getAllByTestId('custom-audio-player')
    expect(audioPlayers).toHaveLength(2)
  })

  it('passes correct src to audio players', () => {
    render(<AudioPlayerRenderer htmlContent={mockHtmlContent} />)
    const audioPlayers = screen.getAllByTestId('custom-audio-player')

    expect(audioPlayers[0]).toHaveAttribute(
      'data-src',
      'https://example.com/audio1.wav'
    )
    expect(audioPlayers[1]).toHaveAttribute(
      'data-src',
      'https://example.com/audio2.wav'
    )
  })

  it('handles empty html content', () => {
    render(<AudioPlayerRenderer htmlContent="" />)
    expect(screen.queryByTestId('custom-audio-player')).not.toBeInTheDocument()
  })

  it('handles html content without audio wrappers', () => {
    const htmlWithoutAudio = '<div><p>Just text content</p></div>'
    render(<AudioPlayerRenderer htmlContent={htmlWithoutAudio} />)
    expect(screen.queryByTestId('custom-audio-player')).not.toBeInTheDocument()
  })
})
