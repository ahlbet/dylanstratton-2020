// Mock the gatsby dependencies
jest.mock('gatsby', () => ({
  Link: jest
    .fn()
    .mockImplementation(
      ({
        to,
        children,
        ...rest
      }: {
        to: string
        children: React.ReactNode
        [key: string]: any
      }) => (
        <a href={to} {...rest}>
          {children}
        </a>
      )
    ),
  graphql: jest.fn(),
  useStaticQuery: jest.fn(() => ({
    site: {
      siteMetadata: {
        title: 'Test Site Title',
        description: 'Test site description',
        author: 'Test Author',
      },
    },
  })),
}))

// Mock the audio player context
jest.mock('../contexts/audio-player-context/audio-player-context', () => ({
  AudioPlayerProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="audio-provider">{children}</div>
  ),
  useAudioPlayer: () => ({
    setPlaylist: jest.fn(),
    playlist: [],
    playTrack: jest.fn(),
    currentIndex: null,
    isPlaying: false,
    setIsPlaying: jest.fn(),
    audioRef: { current: null },
    totalPlaylistDuration: 0,
    updateTotalPlaylistDuration: jest.fn(),
    volume: 1,
    updateVolume: jest.fn(),
    isShuffleOn: false,
    toggleShuffle: jest.fn(),
    isLoopOn: false,
    toggleLoop: jest.fn(),
    isAutopilotOn: false,
    toggleAutopilot: jest.fn(),
    shouldNavigateToRandomPost: jest.fn(() => false),
    shuffledPlaylist: [],
    getNextTrackIndex: jest.fn(() => 0),
    getPreviousTrackIndex: jest.fn(() => 0),
  }),
}))

jest.mock('../utils/typography', () => ({
  rhythm: jest.fn().mockImplementation((n: number) => n * 16),
}))

jest.mock('../hooks/use-presigned-url', () => ({
  usePresignedUrl: () => ({
    getAudioUrl: jest.fn(() => 'test-audio-url'),
  }),
}))

import React from 'react'
import { render, screen } from '@testing-library/react'
import BlogIndex from './index'
import { useStaticQuery } from 'gatsby'

// Types
interface MockData {
  site: {
    siteMetadata: {
      title: string
    }
  }
  allMarkdownRemark: {
    edges: Array<{
      node: {
        excerpt: string
        fields: {
          slug: string
        }
        frontmatter: {
          date: string
          title: string
        }
      }
    }>
  }
}

interface MockLocation {
  pathname: string
}

// Helper function to render with AudioPlayerProvider
const renderWithAudioProvider = (ui: React.ReactElement) => {
  const {
    AudioPlayerProvider,
  } = require('../contexts/audio-player-context/audio-player-context')
  return render(<AudioPlayerProvider>{ui}</AudioPlayerProvider>)
}

describe('BlogIndex with AudioPlayerProvider', () => {
  const mockData: MockData = {
    site: {
      siteMetadata: {
        title: 'Test Site Title',
      },
    },
    allMarkdownRemark: {
      edges: [
        {
          node: {
            excerpt: 'Test excerpt',
            fields: {
              slug: '/test-slug/',
            },
            frontmatter: {
              date: 'January 1, 2020',
              title: 'Test Post Title',
            },
          },
        },
        {
          node: {
            excerpt: 'Another excerpt',
            fields: {
              slug: '/another-slug/',
            },
            frontmatter: {
              date: 'January 2, 2020',
              title: 'Another Post Title',
            },
          },
        },
      ],
    },
  }

  const mockLocation: MockLocation = {
    pathname: '/',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders wrapped in AudioPlayerProvider', () => {
    renderWithAudioProvider(
      <BlogIndex data={mockData} location={mockLocation} />
    )

    // Verify the AudioPlayerProvider wrapper is present
    const audioProvider = screen.getByTestId('audio-provider')
    expect(audioProvider).toBeInTheDocument()

    // Verify the component renders (we can see the actual content)
    expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    expect(screen.getByText('Another Post Title')).toBeInTheDocument()
  })

  test('renders blog post content correctly', () => {
    renderWithAudioProvider(
      <BlogIndex data={mockData} location={mockLocation} />
    )

    // Test that the blog posts are rendered with correct content
    expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    expect(screen.getByText('Another Post Title')).toBeInTheDocument()
    expect(screen.getByText('Test excerpt')).toBeInTheDocument()
    expect(screen.getByText('Another excerpt')).toBeInTheDocument()
  })

  test('renders post links correctly', () => {
    renderWithAudioProvider(
      <BlogIndex data={mockData} location={mockLocation} />
    )

    const firstPostLink = screen.getByText('Test Post Title')
    expect(firstPostLink).toBeInTheDocument()
    expect(firstPostLink.closest('a')).toHaveAttribute('href', '/test-slug/')

    const secondPostLink = screen.getByText('Another Post Title')
    expect(secondPostLink).toBeInTheDocument()
    expect(secondPostLink.closest('a')).toHaveAttribute(
      'href',
      '/another-slug/'
    )
  })

  test('displays post dates', () => {
    renderWithAudioProvider(
      <BlogIndex data={mockData} location={mockLocation} />
    )
    expect(screen.getByText('January 1, 2020')).toBeInTheDocument()
    expect(screen.getByText('January 2, 2020')).toBeInTheDocument()
  })
})
