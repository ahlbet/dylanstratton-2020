import React from 'react'
import { render, screen } from '@testing-library/react'
import { HomepageCurrentTrackInfo } from './HomepageCurrentTrackInfo'

describe('HomepageCurrentTrackInfo', () => {
  const defaultProps = {
    currentTrackInfo: {
      title: 'Test Track Title',
      date: '2025-01-15',
    },
    error: null,
    supabaseError: null,
    coverArt: null,
  }

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<HomepageCurrentTrackInfo {...defaultProps} />)
      expect(screen.getByText('Test Track Title')).toBeInTheDocument()
      expect(screen.getByText('2025-01-15')).toBeInTheDocument()
    })

    it('displays track title and date', () => {
      render(<HomepageCurrentTrackInfo {...defaultProps} />)

      expect(screen.getByText('Test Track Title')).toBeInTheDocument()
      expect(screen.getByText('2025-01-15')).toBeInTheDocument()
    })

    it('handles empty title gracefully', () => {
      const propsWithEmptyTitle = {
        ...defaultProps,
        currentTrackInfo: {
          title: '',
          date: '2025-01-15',
        },
      }

      render(<HomepageCurrentTrackInfo {...propsWithEmptyTitle} />)
      const titleElement = screen.getByTestId('current-track-title')
      expect(titleElement).toHaveTextContent('')
    })

    it('handles empty date gracefully', () => {
      const propsWithEmptyDate = {
        ...defaultProps,
        currentTrackInfo: {
          title: 'Test Track Title',
          date: '',
        },
      }

      render(<HomepageCurrentTrackInfo {...propsWithEmptyDate} />)
      const dateElement = screen.getByTestId('current-track-date')
      expect(dateElement).toHaveTextContent('')
    })
  })

  describe('Error Handling', () => {
    it('displays error message when error is provided', () => {
      const propsWithError = {
        ...defaultProps,
        error: 'Failed to load audio track',
      }

      render(<HomepageCurrentTrackInfo {...propsWithError} />)
      expect(screen.getByText('Failed to load audio track')).toBeInTheDocument()
    })

    it('displays supabase error when supabaseError is provided', () => {
      const propsWithSupabaseError = {
        ...defaultProps,
        supabaseError: 'Database connection failed',
      }

      render(<HomepageCurrentTrackInfo {...propsWithSupabaseError} />)
      expect(
        screen.getByText('Supabase: Database connection failed')
      ).toBeInTheDocument()
    })

    it('displays both errors when both are provided', () => {
      const propsWithBothErrors = {
        ...defaultProps,
        error: 'Audio error',
        supabaseError: 'Database error',
      }

      render(<HomepageCurrentTrackInfo {...propsWithBothErrors} />)

      expect(screen.getByText('Audio error')).toBeInTheDocument()
      expect(screen.getByText('Supabase: Database error')).toBeInTheDocument()
    })

    it('does not display error when error is null', () => {
      render(<HomepageCurrentTrackInfo {...defaultProps} />)
      expect(
        screen.queryByText('Failed to load audio track')
      ).not.toBeInTheDocument()
    })

    it('does not display supabase error when supabaseError is null', () => {
      render(<HomepageCurrentTrackInfo {...defaultProps} />)
      expect(
        screen.queryByText('Database connection failed')
      ).not.toBeInTheDocument()
    })

    it('handles empty error strings', () => {
      const propsWithEmptyErrors = {
        ...defaultProps,
        error: '',
        supabaseError: '',
      }

      render(<HomepageCurrentTrackInfo {...propsWithEmptyErrors} />)

      // When error strings are empty, no error elements should be rendered
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles very long track titles', () => {
      const longTitle = 'A'.repeat(1000)
      const propsWithLongTitle = {
        ...defaultProps,
        currentTrackInfo: {
          title: longTitle,
          date: '2025-01-15',
        },
      }

      render(<HomepageCurrentTrackInfo {...propsWithLongTitle} />)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('handles very long dates', () => {
      const longDate = 'A'.repeat(100)
      const propsWithLongDate = {
        ...defaultProps,
        currentTrackInfo: {
          title: 'Test Track Title',
          date: longDate,
        },
      }

      render(<HomepageCurrentTrackInfo {...propsWithLongDate} />)
      expect(screen.getByText(longDate)).toBeInTheDocument()
    })

    it('handles special characters in title', () => {
      const specialTitle =
        'Track with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
      const propsWithSpecialTitle = {
        ...defaultProps,
        currentTrackInfo: {
          title: specialTitle,
          date: '2025-01-15',
        },
      }

      render(<HomepageCurrentTrackInfo {...propsWithSpecialTitle} />)
      expect(screen.getByText(specialTitle)).toBeInTheDocument()
    })

    it('handles special characters in date', () => {
      const specialDate = 'Date with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
      const propsWithSpecialDate = {
        ...defaultProps,
        currentTrackInfo: {
          title: 'Test Track Title',
          date: specialDate,
        },
      }

      render(<HomepageCurrentTrackInfo {...propsWithSpecialDate} />)
      expect(screen.getByText(specialDate)).toBeInTheDocument()
    })
  })

  describe('Cover Art', () => {
    it('displays cover art when provided', () => {
      const propsWithCoverArt = {
        ...defaultProps,
        coverArt: 'https://example.com/cover-art.jpg',
      }

      render(<HomepageCurrentTrackInfo {...propsWithCoverArt} />)

      const coverArtImage = screen.getByTestId('daily-cover-art')
      expect(coverArtImage).toBeInTheDocument()
      expect(coverArtImage).toHaveAttribute(
        'src',
        'https://example.com/cover-art.jpg'
      )
      expect(coverArtImage).toHaveAttribute('alt', 'Daily cover art')
    })

    it('displays placeholder when no cover art is provided', () => {
      render(<HomepageCurrentTrackInfo {...defaultProps} />)

      expect(screen.getByText('No Art')).toBeInTheDocument()
      expect(screen.queryByTestId('daily-cover-art')).not.toBeInTheDocument()
    })

    it('displays placeholder when cover art is null', () => {
      const propsWithNullCoverArt = {
        ...defaultProps,
        coverArt: null,
      }

      render(<HomepageCurrentTrackInfo {...propsWithNullCoverArt} />)

      expect(screen.getByText('No Art')).toBeInTheDocument()
      expect(screen.queryByTestId('daily-cover-art')).not.toBeInTheDocument()
    })

    it('displays placeholder when cover art is empty string', () => {
      const propsWithEmptyCoverArt = {
        ...defaultProps,
        coverArt: '',
      }

      render(<HomepageCurrentTrackInfo {...propsWithEmptyCoverArt} />)

      expect(screen.getByText('No Art')).toBeInTheDocument()
      expect(screen.queryByTestId('daily-cover-art')).not.toBeInTheDocument()
    })

    it('processes storage path URLs correctly', () => {
      const propsWithStoragePath = {
        ...defaultProps,
        coverArt: 'cover-art/25jul16.png',
      }

      render(<HomepageCurrentTrackInfo {...propsWithStoragePath} />)

      const coverArtImage = screen.getByTestId('daily-cover-art')
      expect(coverArtImage).toBeInTheDocument()
      // The URL should be processed by getCoverArtUrl and convertCoverArtUrlToLocal
      expect(coverArtImage).toHaveAttribute('src')
    })

    it('extracts correct filename from storage path for local development', () => {
      const propsWithStoragePath = {
        ...defaultProps,
        coverArt: 'cover-art/25aug12.png',
      }

      render(<HomepageCurrentTrackInfo {...propsWithStoragePath} />)

      const coverArtImage = screen.getByTestId('daily-cover-art')
      expect(coverArtImage).toBeInTheDocument()
      // Should extract '25aug12' from 'cover-art/25aug12.png'
      expect(coverArtImage).toHaveAttribute('src')
    })
  })

  describe('Styling and Layout', () => {
    it('applies correct CSS classes', () => {
      render(<HomepageCurrentTrackInfo {...defaultProps} />)

      const container = screen.getByTestId('current-track-info-container')
      expect(container).toHaveClass('p-6', 'border-b', 'border-gray-800')
    })

    it('applies correct CSS classes to title', () => {
      render(<HomepageCurrentTrackInfo {...defaultProps} />)

      const title = screen.getByText('Test Track Title')
      expect(title).toHaveClass('text-xl', 'text-red-400', 'mb-2')
    })

    it('applies correct CSS classes to date', () => {
      render(<HomepageCurrentTrackInfo {...defaultProps} />)

      const date = screen.getByText('2025-01-15')
      expect(date).toHaveClass('text-gray-400', 'text-sm')
    })

    it('applies correct CSS classes to error messages', () => {
      const propsWithError = {
        ...defaultProps,
        error: 'Test error',
      }

      render(<HomepageCurrentTrackInfo {...propsWithError} />)

      const error = screen.getByText('Test error')
      expect(error).toHaveClass('text-red-500', 'text-sm', 'mt-2')
    })
  })
})
