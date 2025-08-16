import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HomepageAudioPlayer } from './HomepageAudioPlayer'

// Mock the hooks and components
jest.mock('../../contexts/audio-player-context/audio-player-context')
jest.mock('../../hooks/use-presigned-url')
jest.mock('./HomepageAudioControls', () => ({
  HomepageAudioControls: ({
    onPlayPause,
    onNextTrack,
    onPreviousTrack,
  }: any) => (
    <div data-testid="audio-controls">
      <button onClick={onPlayPause}>Play/Pause</button>
      <button onClick={onNextTrack}>Next</button>
      <button onClick={onPreviousTrack}>Previous</button>
    </div>
  ),
}))
jest.mock('./HomepageCurrentTrackInfo', () => ({
  HomepageCurrentTrackInfo: ({ currentTrackInfo, error, supabaseError }: any) => (
    <div data-testid="current-track-info">
      <h2>{currentTrackInfo.title}</h2>
      <p>{currentTrackInfo.date}</p>
      {error && <p data-testid="error-message">{error}</p>}
      {supabaseError && <p data-testid="supabase-error">Supabase: {supabaseError}</p>}
    </div>
  ),
}))
jest.mock('./HomepagePlaylistToggle', () => ({
  HomepagePlaylistToggle: () => <div data-testid="playlist-toggle">Toggle</div>,
}))
jest.mock('./HomepagePlaylist', () => ({
  HomepagePlaylist: ({ tracks, onTrackSelect }: any) => (
    <div data-testid="playlist">
      {tracks.map((track: any) => (
        <div key={track.id} onClick={() => onTrackSelect(track)}>
          {track.title}
        </div>
      ))}
    </div>
  ),
}))

const mockUseAudioPlayer = {
  playlist: [],
  setPlaylist: jest.fn(),
  currentIndex: null,
  isPlaying: false,
  setIsPlaying: jest.fn(),
  playTrack: jest.fn(),
  audioRef: { current: null },
  volume: 1,
  updateVolume: jest.fn(),
  isShuffleOn: false,
  toggleShuffle: jest.fn(),
  isLoopOn: false,
  toggleLoop: jest.fn(),
  isAutopilotOn: false,
  toggleAutopilot: jest.fn(),
  shouldNavigateToRandomPost: jest.fn(),
  shuffledPlaylist: [],
}

const mockUsePresignedUrl = {
  getAudioUrl: jest.fn(),
}

describe('HomepageAudioPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(
      require('../../contexts/audio-player-context/audio-player-context') as any
    ).useAudioPlayer.mockReturnValue(mockUseAudioPlayer)
    ;(
      require('../../hooks/use-presigned-url') as any
    ).usePresignedUrl.mockReturnValue(mockUsePresignedUrl)
  })

  const defaultProps = {
    currentBlogPostTracks: [
      {
        id: '1',
        title: 'Test Track 1',
        date: '2025-01-01',
        duration: '2:00',
        storage_path: 'audio/test1.wav',
        daily_id: 'test-daily-1',
      },
    ],
    currentBlogPost: 'test-daily-1',
    posts: [],
    supabaseLoading: false,
    supabaseError: null,
    onTrackSelect: jest.fn(),
  }

  it('renders without crashing', () => {
    render(<HomepageAudioPlayer {...defaultProps} />)
    expect(screen.getByTestId('current-track-info')).toBeInTheDocument()
    expect(screen.getByTestId('audio-controls')).toBeInTheDocument()
    expect(screen.getByTestId('playlist-toggle')).toBeInTheDocument()
    expect(screen.getByTestId('playlist')).toBeInTheDocument()
  })

  it('displays current track info', () => {
    render(<HomepageAudioPlayer {...defaultProps} />)
    expect(screen.getByText('No track selected')).toBeInTheDocument()
  })

  it('handles track selection', () => {
    const onTrackSelect = jest.fn()
    render(
      <HomepageAudioPlayer {...defaultProps} onTrackSelect={onTrackSelect} />
    )

    const trackElement = screen.getByText('Test Track 1')
    fireEvent.click(trackElement)

    expect(onTrackSelect).toHaveBeenCalledWith(
      defaultProps.currentBlogPostTracks[0]
    )
  })

  it('renders audio controls', () => {
    render(<HomepageAudioPlayer {...defaultProps} />)
    expect(screen.getByText('Play/Pause')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText('Previous')).toBeInTheDocument()
  })

  it('displays parent error when provided', () => {
    const propsWithError = {
      ...defaultProps,
      parentError: 'Failed to get audio URL for track',
    }
    render(<HomepageAudioPlayer {...propsWithError} />)
    expect(screen.getByTestId('error-message')).toBeInTheDocument()
    expect(screen.getByText('Failed to get audio URL for track')).toBeInTheDocument()
  })

  it('does not display error when parentError is null', () => {
    const propsWithoutError = {
      ...defaultProps,
      parentError: null,
    }
    render(<HomepageAudioPlayer {...propsWithoutError} />)
    expect(screen.queryByText('Failed to get audio URL for track')).not.toBeInTheDocument()
  })
})
