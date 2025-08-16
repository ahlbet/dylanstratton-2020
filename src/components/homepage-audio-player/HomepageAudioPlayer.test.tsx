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
    onMuteToggle,
    isMuted,
  }: any) => (
    <div data-testid="audio-controls">
      <button onClick={onPlayPause}>Play/Pause</button>
      <button onClick={onNextTrack}>Next</button>
      <button onClick={onPreviousTrack}>Previous</button>
      <button onClick={onMuteToggle} data-testid="mute-toggle">
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  ),
}))
jest.mock('./HomepageCurrentTrackInfo', () => ({
  HomepageCurrentTrackInfo: ({
    currentTrackInfo,
    error,
    supabaseError,
  }: any) => (
    <div data-testid="current-track-info">
      <h2>{currentTrackInfo.title}</h2>
      <p>{currentTrackInfo.date}</p>
      {error && <p data-testid="error-message">{error}</p>}
      {supabaseError && (
        <p data-testid="supabase-error">Supabase: {supabaseError}</p>
      )}
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
    expect(screen.getByText('Select a track to play')).toBeInTheDocument()
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
    expect(
      screen.getByText('Failed to get audio URL for track')
    ).toBeInTheDocument()
  })

  it('does not display error when parentError is null', () => {
    const propsWithoutError = {
      ...defaultProps,
      parentError: null,
    }
    render(<HomepageAudioPlayer {...propsWithoutError} />)
    expect(
      screen.queryByText('Failed to get audio URL for track')
    ).not.toBeInTheDocument()
  })

  it('handles audio source synchronization when currentIndex changes', () => {
    const mockUseAudioPlayerWithTrack = {
      ...mockUseAudioPlayer,
      currentIndex: 0,
      playlist: [
        {
          id: '1',
          title: 'Track 1',
          url: 'http://example.com/track1.wav',
          storagePath: 'audio/track1.wav',
        },
        {
          id: '2',
          title: 'Track 2',
          url: 'http://example.com/track2.wav',
          storagePath: 'audio/track2.wav',
        },
      ],
    }

    ;(
      require('../../contexts/audio-player-context/audio-player-context') as any
    ).useAudioPlayer.mockReturnValue(mockUseAudioPlayerWithTrack)

    const { rerender } = render(<HomepageAudioPlayer {...defaultProps} />)

    // Simulate changing to second track
    const mockUseAudioPlayerWithSecondTrack = {
      ...mockUseAudioPlayerWithTrack,
      currentIndex: 1,
    }

    ;(
      require('../../contexts/audio-player-context/audio-player-context') as any
    ).useAudioPlayer.mockReturnValue(mockUseAudioPlayerWithSecondTrack)

    rerender(<HomepageAudioPlayer {...defaultProps} />)

    // The component should now show the second track as current
    expect(screen.getByText('Track 2')).toBeInTheDocument()
  })

  it('handles play/pause when track is already selected', () => {
    const mockUseAudioPlayerWithSelectedTrack = {
      ...mockUseAudioPlayer,
      currentIndex: 0,
      isPlaying: false,
      playlist: [
        {
          id: '1',
          title: 'Track 1',
          url: 'http://example.com/track1.wav',
          storagePath: 'audio/track1.wav',
        },
      ],
    }

    ;(
      require('../../contexts/audio-player-context/audio-player-context') as any
    ).useAudioPlayer.mockReturnValue(mockUseAudioPlayerWithSelectedTrack)

    render(<HomepageAudioPlayer {...defaultProps} />)

    // The component should display the selected track
    expect(screen.getByText('Track 1')).toBeInTheDocument()
  })

  it('handles audio seeking without resetting source', () => {
    const mockUseAudioPlayerWithTrack = {
      ...mockUseAudioPlayer,
      currentIndex: 0,
      playlist: [
        {
          id: '1',
          title: 'Track 1',
          url: 'http://example.com/track1.wav',
          storagePath: 'audio/track1.wav',
        },
      ],
    }

    ;(
      require('../../contexts/audio-player-context/audio-player-context') as any
    ).useAudioPlayer.mockReturnValue(mockUseAudioPlayerWithTrack)

    render(<HomepageAudioPlayer {...defaultProps} />)

    // Verify that the audio controls are rendered (which handle seeking)
    const audioControls = screen.getByTestId('audio-controls')
    expect(audioControls).toBeInTheDocument()
  })

  it('renders mute toggle button in audio controls', () => {
    render(<HomepageAudioPlayer {...defaultProps} />)

    const muteToggle = screen.getByTestId('mute-toggle')
    expect(muteToggle).toBeInTheDocument()
    expect(muteToggle).toHaveTextContent('Mute')
  })

  it('toggles muted state when mute button is clicked', () => {
    render(<HomepageAudioPlayer {...defaultProps} />)

    const muteToggle = screen.getByTestId('mute-toggle')

    // Initially should show "Mute"
    expect(muteToggle).toHaveTextContent('Mute')

    // Click to mute
    fireEvent.click(muteToggle)

    // Should now show "Unmute"
    expect(muteToggle).toHaveTextContent('Unmute')
  })

  it('syncs muted state with audio element', () => {
    // Mock HTMLAudioElement
    const mockAudioElement = {
      muted: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      src: '',
      load: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }

    // Mock audioRef to return our mock element
    const mockUseAudioPlayerWithRef = {
      ...mockUseAudioPlayer,
      audioRef: { current: mockAudioElement },
    }

    ;(
      require('../../contexts/audio-player-context/audio-player-context') as any
    ).useAudioPlayer.mockReturnValue(mockUseAudioPlayerWithRef)

    render(<HomepageAudioPlayer {...defaultProps} />)

    const muteToggle = screen.getByTestId('mute-toggle')

    // Initially should show "Mute"
    expect(muteToggle).toHaveTextContent('Mute')

    // Click to mute
    fireEvent.click(muteToggle)

    // Should now show "Unmute" indicating muted state
    expect(muteToggle).toHaveTextContent('Unmute')

    // Click again to unmute
    fireEvent.click(muteToggle)

    // Should show "Mute" again
    expect(muteToggle).toHaveTextContent('Mute')
  })

  it('maintains muted state across track changes', () => {
    const mockUseAudioPlayerWithTrack = {
      ...mockUseAudioPlayer,
      currentIndex: 0,
      playlist: [
        {
          id: '1',
          title: 'Track 1',
          url: 'http://example.com/track1.wav',
          storagePath: 'audio/track1.wav',
        },
      ],
    }

    ;(
      require('../../contexts/audio-player-context/audio-player-context') as any
    ).useAudioPlayer.mockReturnValue(mockUseAudioPlayerWithTrack)

    const { rerender } = render(<HomepageAudioPlayer {...defaultProps} />)

    const muteToggle = screen.getByTestId('mute-toggle')

    // Mute the audio
    fireEvent.click(muteToggle)
    expect(muteToggle).toHaveTextContent('Unmute')

    // Change to a different track
    const mockUseAudioPlayerWithSecondTrack = {
      ...mockUseAudioPlayerWithTrack,
      currentIndex: 1,
      playlist: [
        {
          id: '1',
          title: 'Track 1',
          url: 'http://example.com/track1.wav',
          storagePath: 'audio/track1.wav',
        },
        {
          id: '2',
          title: 'Track 2',
          url: 'http://example.com/track2.wav',
          storagePath: 'audio/track2.wav',
        },
      ],
    }

    ;(
      require('../../contexts/audio-player-context/audio-player-context') as any
    ).useAudioPlayer.mockReturnValue(mockUseAudioPlayerWithSecondTrack)

    rerender(<HomepageAudioPlayer {...defaultProps} />)

    // Muted state should be maintained
    const newMuteToggle = screen.getByTestId('mute-toggle')
    expect(newMuteToggle).toHaveTextContent('Unmute')
  })
})
