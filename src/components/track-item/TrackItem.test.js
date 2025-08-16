import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import TrackItem from './TrackItem'

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Play: ({ size, color }) => (
    <span data-testid="play-icon" style={{ fontSize: size, color }}>
      ▶
    </span>
  ),
  Pause: ({ size, color }) => (
    <span data-testid="pause-icon" style={{ fontSize: size, color }}>
      ⏸
    </span>
  ),
}))

describe('TrackItem', () => {
  const mockTrack = {
    title: 'Test Track',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: '3:45',
    downloadUrl: 'https://example.com/test.wav',
    downloadFilename: 'test.wav',
  }

  const defaultProps = {
    track: mockTrack,
    index: 0,
    isCurrentTrack: false,
    isPlayingCurrent: false,
    onTrackClick: jest.fn(),
    onTrackRef: jest.fn(),
    showDownloadButton: false,
    onDownload: jest.fn(),
    isMobile: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders track information correctly', () => {
    render(<TrackItem {...defaultProps} />)

    expect(screen.getByText('Test Track')).toBeInTheDocument()
    expect(screen.getByText('Test Artist • Test Album')).toBeInTheDocument()
    expect(screen.getByText('3:45')).toBeInTheDocument()
  })

  it('shows play icon when not current track', () => {
    render(<TrackItem {...defaultProps} />)

    expect(screen.getByTestId('play-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('pause-icon')).not.toBeInTheDocument()
  })

  it('shows pause icon when current track is playing', () => {
    render(
      <TrackItem
        {...defaultProps}
        isCurrentTrack={true}
        isPlayingCurrent={true}
      />
    )

    expect(screen.getByTestId('pause-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('play-icon')).not.toBeInTheDocument()
  })

  it('calls onTrackClick when clicked', () => {
    const mockOnTrackClick = jest.fn()
    render(<TrackItem {...defaultProps} onTrackClick={mockOnTrackClick} />)

    const trackItem = screen.getByText('Test Track').closest('.track-item')
    fireEvent.click(trackItem)

    expect(mockOnTrackClick).toHaveBeenCalledWith(0)
  })

  it('applies current-track class when isCurrentTrack is true', () => {
    render(<TrackItem {...defaultProps} isCurrentTrack={true} />)

    const trackItem = screen.getByText('Test Track').closest('.track-item')
    expect(trackItem).toHaveClass('current-track')
  })

  it('does not show download button by default', () => {
    render(<TrackItem {...defaultProps} />)

    expect(screen.queryByTitle('Download audio file')).not.toBeInTheDocument()
  })

  it('shows download button when showDownloadButton is true and not mobile', () => {
    render(<TrackItem {...defaultProps} showDownloadButton={true} />)

    expect(screen.getByTitle('Download audio file')).toBeInTheDocument()
  })

  it('does not show download button on mobile even when showDownloadButton is true', () => {
    render(
      <TrackItem {...defaultProps} showDownloadButton={true} isMobile={true} />
    )

    expect(screen.queryByTitle('Download audio file')).not.toBeInTheDocument()
  })

  it('calls onDownload when download button is clicked', () => {
    const mockOnDownload = jest.fn()
    render(
      <TrackItem
        {...defaultProps}
        showDownloadButton={true}
        onDownload={mockOnDownload}
      />
    )

    const downloadButton = screen.getByTitle('Download audio file')
    fireEvent.click(downloadButton)

    expect(mockOnDownload).toHaveBeenCalledWith(
      'https://example.com/test.wav',
      'test.wav'
    )
  })

  it('calls onTrackRef when ref is set', () => {
    const mockOnTrackRef = jest.fn()
    render(<TrackItem {...defaultProps} onTrackRef={mockOnTrackRef} />)

    // The ref callback should be called during render
    expect(mockOnTrackRef).toHaveBeenCalledWith(0, expect.any(HTMLDivElement))
  })

  it('does not call onTrackRef when onTrackRef is not provided', () => {
    const { onTrackRef, ...propsWithoutRef } = defaultProps
    render(<TrackItem {...propsWithoutRef} />)

    // Should render without errors
    expect(screen.getByText('Test Track')).toBeInTheDocument()
  })
})
