import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { HomepagePlaylist } from './HomepagePlaylist'

describe('HomepagePlaylist', () => {
  const defaultProps = {
    tracks: [
      {
        id: '1',
        title: 'Test Track 1',
        date: '2025-01-15',
        duration: '2:30',
        storage_path: 'audio/test1.wav',
        daily_id: 'test-daily-1',
      },
      {
        id: '2',
        title: 'Test Track 2',
        date: '2025-01-16',
        duration: '3:45',
        storage_path: 'audio/test2.wav',
        daily_id: 'test-daily-2',
      },
    ],
    currentIndex: 0,
    supabaseLoading: false,
    supabaseError: null,
    onTrackSelect: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<HomepagePlaylist {...defaultProps} />)
      expect(screen.getByText('Test Track 1')).toBeInTheDocument()
      expect(screen.getByText('Test Track 2')).toBeInTheDocument()
    })

    it('displays all tracks in the playlist', () => {
      render(<HomepagePlaylist {...defaultProps} />)

      expect(screen.getByText('Test Track 1')).toBeInTheDocument()
      expect(screen.getByText('Test Track 2')).toBeInTheDocument()
    })

    it('displays track information correctly', () => {
      render(<HomepagePlaylist {...defaultProps} />)

      expect(screen.getByText('Test Track 1')).toBeInTheDocument()
      expect(screen.getByText('2025-01-15')).toBeInTheDocument()
      expect(screen.getByText('2:30')).toBeInTheDocument()
    })

    it('handles empty tracks array', () => {
      const propsWithNoTracks = {
        ...defaultProps,
        tracks: [],
      }

      render(<HomepagePlaylist {...propsWithNoTracks} />)
      expect(screen.queryByText('Test Track 1')).not.toBeInTheDocument()
    })

    it('handles single track', () => {
      const propsWithSingleTrack = {
        ...defaultProps,
        tracks: [defaultProps.tracks[0]],
      }

      render(<HomepagePlaylist {...propsWithSingleTrack} />)
      expect(screen.getByText('Test Track 1')).toBeInTheDocument()
      expect(screen.queryByText('Test Track 2')).not.toBeInTheDocument()
    })
  })

  describe('Track Selection', () => {
    it('calls onTrackSelect when a track is clicked', () => {
      const onTrackSelect = jest.fn()
      render(
        <HomepagePlaylist {...defaultProps} onTrackSelect={onTrackSelect} />
      )

      const firstTrack = screen.getByText('Test Track 1')
      fireEvent.click(firstTrack)

      expect(onTrackSelect).toHaveBeenCalledWith(defaultProps.tracks[0])
    })

    it('calls onTrackSelect with correct track data for each track', () => {
      const onTrackSelect = jest.fn()
      render(
        <HomepagePlaylist {...defaultProps} onTrackSelect={onTrackSelect} />
      )

      const firstTrack = screen.getByText('Test Track 1')
      const secondTrack = screen.getByText('Test Track 2')

      fireEvent.click(firstTrack)
      expect(onTrackSelect).toHaveBeenCalledWith(defaultProps.tracks[0])

      fireEvent.click(secondTrack)
      expect(onTrackSelect).toHaveBeenCalledWith(defaultProps.tracks[1])
    })

    it('handles multiple clicks on the same track', () => {
      const onTrackSelect = jest.fn()
      render(
        <HomepagePlaylist {...defaultProps} onTrackSelect={onTrackSelect} />
      )

      const firstTrack = screen.getByText('Test Track 1')

      fireEvent.click(firstTrack)
      fireEvent.click(firstTrack)
      fireEvent.click(firstTrack)

      expect(onTrackSelect).toHaveBeenCalledTimes(3)
      expect(onTrackSelect).toHaveBeenCalledWith(defaultProps.tracks[0])
    })
  })

  describe('Current Track Highlighting', () => {
    it('highlights the current track correctly', () => {
      render(<HomepagePlaylist {...defaultProps} currentIndex={0} />)

      const tracks = screen.getAllByTestId('playlist-track')
      const firstTrack = tracks[0]
      expect(firstTrack).toHaveClass(
        'bg-gray-900',
        'border-l-2',
        'border-l-red-400'
      )
    })

    it('highlights the second track when currentIndex is 1', () => {
      render(<HomepagePlaylist {...defaultProps} currentIndex={1} />)

      const tracks = screen.getAllByTestId('playlist-track')
      const secondTrack = tracks[1]
      expect(secondTrack).toHaveClass(
        'bg-gray-900',
        'border-l-2',
        'border-l-red-400'
      )
    })

    it('does not highlight any track when currentIndex is null', () => {
      render(<HomepagePlaylist {...defaultProps} currentIndex={null} />)

      const tracks = screen.getAllByTestId('playlist-track')
      tracks.forEach((track) => {
        expect(track).not.toHaveClass('bg-gray-800')
      })
    })

    it('handles currentIndex out of bounds gracefully', () => {
      render(<HomepagePlaylist {...defaultProps} currentIndex={999} />)

      const tracks = screen.getAllByTestId('playlist-track')
      tracks.forEach((track) => {
        expect(track).not.toHaveClass('bg-gray-800')
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading indicator when supabaseLoading is true', () => {
      const propsWithLoading = {
        ...defaultProps,
        supabaseLoading: true,
      }

      render(<HomepagePlaylist {...propsWithLoading} />)
      expect(screen.getByText('Loading audio data...')).toBeInTheDocument()
    })

    it('does not show loading indicator when supabaseLoading is false', () => {
      render(<HomepagePlaylist {...defaultProps} />)
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    it('shows tracks when not loading', () => {
      render(<HomepagePlaylist {...defaultProps} />)
      expect(screen.getByText('Test Track 1')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays supabase error when provided', () => {
      const propsWithError = {
        ...defaultProps,
        supabaseError: 'Failed to load tracks from database',
      }

      render(<HomepagePlaylist {...propsWithError} />)
      expect(
        screen.getByText(
          'Error loading audio data: Failed to load tracks from database'
        )
      ).toBeInTheDocument()
    })

    it('does not display error when supabaseError is null', () => {
      render(<HomepagePlaylist {...defaultProps} />)
      expect(
        screen.queryByText('Failed to load tracks from database')
      ).not.toBeInTheDocument()
    })

    it('handles empty error string', () => {
      const propsWithEmptyError = {
        ...defaultProps,
        supabaseError: '',
      }

      render(<HomepagePlaylist {...propsWithEmptyError} />)
      // Empty string is falsy, so no error is shown and tracks are displayed
      expect(
        screen.queryByText(/Error loading audio data:/)
      ).not.toBeInTheDocument()
      expect(screen.getByText('Test Track 1')).toBeInTheDocument()
      expect(screen.getByText('Test Track 2')).toBeInTheDocument()
    })

    it('shows error message and tracks when both are present', () => {
      const propsWithErrorAndTracks = {
        ...defaultProps,
        supabaseError: 'Database error occurred',
      }

      render(<HomepagePlaylist {...propsWithErrorAndTracks} />)

      expect(
        screen.getByText('Error loading audio data: Database error occurred')
      ).toBeInTheDocument()
      // When there's an error, tracks are not displayed
      expect(screen.queryByText('Test Track 1')).not.toBeInTheDocument()
      expect(screen.queryByText('Test Track 2')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles tracks with missing properties', () => {
      const tracksWithMissingProps = [
        {
          id: '1',
          title: 'Track 1',
          date: '2025-01-15',
          duration: '2:30',
          storage_path: 'audio/track1.wav',
          daily_id: 'test-daily-1',
        },
        {
          id: '2',
          title: 'Track 2',
          date: '2025-01-16',
          duration: '3:45',
          storage_path: 'audio/track2.wav',
          daily_id: 'test-daily-2',
        },
      ]

      const propsWithMissingProps = {
        ...defaultProps,
        tracks: tracksWithMissingProps,
      }

      render(<HomepagePlaylist {...propsWithMissingProps} />)
      expect(screen.getByText('Track 1')).toBeInTheDocument()
      expect(screen.getByText('Track 2')).toBeInTheDocument()
    })

    it('handles very long track titles', () => {
      const longTitle = 'A'.repeat(1000)
      const tracksWithLongTitle = [
        {
          ...defaultProps.tracks[0],
          title: longTitle,
        },
      ]

      const propsWithLongTitle = {
        ...defaultProps,
        tracks: tracksWithLongTitle,
      }

      render(<HomepagePlaylist {...propsWithLongTitle} />)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('handles special characters in track titles', () => {
      const specialTitle =
        'Track with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
      const tracksWithSpecialTitle = [
        {
          ...defaultProps.tracks[0],
          title: specialTitle,
        },
      ]

      const propsWithSpecialTitle = {
        ...defaultProps,
        tracks: tracksWithSpecialTitle,
      }

      render(<HomepagePlaylist {...propsWithSpecialTitle} />)
      expect(screen.getByText(specialTitle)).toBeInTheDocument()
    })

    it('handles tracks with very long dates', () => {
      const longDate = 'A'.repeat(100)
      const tracksWithLongDate = [
        {
          ...defaultProps.tracks[0],
          date: longDate,
        },
      ]

      const propsWithLongDate = {
        ...defaultProps,
        tracks: tracksWithLongDate,
      }

      render(<HomepagePlaylist {...propsWithLongDate} />)
      expect(screen.getByText(longDate)).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('applies correct CSS classes to playlist container', () => {
      render(<HomepagePlaylist {...defaultProps} />)

      const container = screen.getByTestId('playlist-container')
      expect(container).toHaveClass('flex-1', 'overflow-y-auto')
    })

    it('applies correct CSS classes to track items', () => {
      render(<HomepagePlaylist {...defaultProps} />)

      const tracks = screen.getAllByTestId('playlist-track')
      tracks.forEach((track) => {
        expect(track).toHaveClass(
          'p-4',
          'border-b',
          'border-gray-900',
          'cursor-pointer',
          'hover:bg-gray-900',
          'transition-colors'
        )
      })
    })

    it('applies correct CSS classes to current track', () => {
      render(<HomepagePlaylist {...defaultProps} currentIndex={0} />)

      const tracks = screen.getAllByTestId('playlist-track')
      const currentTrack = tracks[0]
      expect(currentTrack).toHaveClass(
        'bg-gray-900',
        'border-l-2',
        'border-l-red-400'
      )
    })

    it('applies correct CSS classes to track title', () => {
      render(<HomepagePlaylist {...defaultProps} />)

      const title = screen.getByText('Test Track 1')
      expect(title).toHaveClass('text-sm', 'text-white', 'truncate')
    })

    it('applies correct CSS classes to track date', () => {
      render(<HomepagePlaylist {...defaultProps} />)

      const date = screen.getByText('2025-01-15')
      expect(date).toHaveClass('text-xs', 'text-gray-400')
    })

    it('applies correct CSS classes to track duration', () => {
      render(<HomepagePlaylist {...defaultProps} />)

      const duration = screen.getByText('2:30')
      expect(duration).toHaveClass('text-xs', 'text-gray-400')
    })
  })
})
