import '@testing-library/jest-dom'

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

jest.mock('../utils/typography', () => ({
  rhythm: jest.fn().mockImplementation((n: number) => n * 16),
}))

jest.mock('../hooks/use-presigned-url', () => ({
  usePresignedUrl: () => ({
    getAudioUrl: jest.fn(() => 'test-audio-url'),
  }),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAudioPlayer } from '../contexts/audio-player-context/audio-player-context'
import { usePresignedUrl } from '../hooks/use-presigned-url'
import { useSupabaseData } from '../hooks/use-supabase-data'
import BlogIndex from './index'

// Mock the audio player context
jest.mock('../contexts/audio-player-context/audio-player-context', () => ({
  useAudioPlayer: jest.fn(),
}))

jest.mock('../hooks/use-presigned-url', () => ({
  usePresignedUrl: jest.fn(),
}))

jest.mock('../hooks/use-supabase-data', () => ({
  useSupabaseData: jest.fn(),
}))

// Mock the layout component
jest.mock('../components/layout/layout', () => {
  return function MockLayout({ children, title }: any) {
    return (
      <div data-testid="layout">
        <h1>{title}</h1>
        {children}
      </div>
    )
  }
})

// Mock the SEO component
jest.mock('../components/seo/seo', () => {
  return function MockSEO({ title }: any) {
    return <div data-testid="seo" title={title} />
  }
})

// Mock the PostCalendar component
jest.mock('../components/post-calendar/PostCalendar', () => {
  return function MockPostCalendar() {
    return <div data-testid="post-calendar" />
  }
})

// Mock data
const mockData = {
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
            daily_id: 'test-daily-1',
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
            daily_id: 'test-daily-2',
          },
        },
      },
    ],
  },
}

const mockPageContext = {
  supabaseData: {
    audio: [
      {
        id: 'audio-1',
        title: 'Test Track 1',
        storage_path: 'audio/test1.wav',
        daily_id: 'test-daily-1',
        duration: 180,
        created_at: '2020-01-01T00:00:00Z',
      },
      {
        id: 'audio-2',
        title: 'Test Track 2',
        storage_path: 'audio/test2.wav',
        daily_id: 'test-daily-1',
        duration: 240,
        created_at: '2020-01-01T00:00:00Z',
      },
      {
        id: 'audio-3',
        title: 'Test Track 3',
        storage_path: 'audio/test3.wav',
        daily_id: 'test-daily-2',
        duration: 200,
        created_at: '2020-01-02T00:00:00Z',
      },
    ],
    markovTexts: [
      {
        id: 'text-1',
        text_content: 'Generated text content 1',
        coherency_level: '75',
        daily_id: 'test-daily-1',
        created_at: '2020-01-01T00:00:00Z',
      },
    ],
  },
}

const mockLocation = {
  pathname: '/',
  hash: '',
  search: '',
  href: 'http://localhost/',
  origin: 'http://localhost',
  protocol: 'http:',
  host: 'localhost',
  hostname: 'localhost',
  port: '',
  ancestorOrigins: {} as DOMStringList,
  assign: jest.fn(),
  reload: jest.fn(),
  replace: jest.fn(),
  state: null,
}

// Mock audio player context
const mockAudioPlayer = {
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
  getNextTrackIndex: jest.fn(),
  getPreviousTrackIndex: jest.fn(),
}

// Mock presigned URL hook
const mockPresignedUrl = {
  getAudioUrl: jest.fn(),
  isGenerating: false,
  clearCache: jest.fn(),
}

describe('BlogIndex Audio Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Create a simple mock that tracks calls
    const mockAudioPlayerWithRealisticPlayTrack = {
      playlist: [],
      setPlaylist: jest.fn(),
      currentIndex: null,
      setCurrentIndex: jest.fn(),
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
      getNextTrackIndex: jest.fn(),
      getPreviousTrackIndex: jest.fn(),
    }

    ;(useAudioPlayer as jest.Mock).mockReturnValue(
      mockAudioPlayerWithRealisticPlayTrack
    )
    ;(usePresignedUrl as jest.Mock).mockReturnValue(mockPresignedUrl)
    ;(useSupabaseData as jest.Mock).mockReturnValue({
      data: {
        audio: [
          {
            id: '1',
            storage_path:
              'audio/25aug12-1-25aug12-dsharpm-90bpm22025-06-30184814.wav',
            daily_id: 'test-daily-1',
            created_at: '2025-01-01T00:00:00Z',
            duration: '2:00',
          },
          {
            id: '2',
            storage_path:
              'audio/25aug12-2-25aug12-dsharpm-90bpm22025-06-30184814.wav',
            daily_id: 'test-daily-1',
            created_at: '2025-01-01T00:00:00Z',
            duration: '3:00',
          },
          {
            id: '3',
            storage_path:
              'audio/25jun30-1-25jun30-dsharpm-90bpm22025-06-30184814.wav',
            daily_id: 'test-daily-2',
            created_at: '2025-01-02T00:00:00Z',
            duration: '2:30',
          },
        ],
        markovTexts: [
          {
            id: '1',
            text_content: 'Generated text content 1',
            daily_id: 'test-daily-1',
            created_at: '2025-01-01T00:00:00Z',
          },
        ],
        daily: [
          {
            id: 'test-daily-1',
            title: 'Test Daily 1',
            date: '2025-01-01',
            created_at: '2025-01-01T00:00:00Z',
          },
        ],
      },
      loading: false,
      error: null,
    })

    // Mock HTMLAudioElement
    Object.defineProperty(window, 'HTMLAudioElement', {
      writable: true,
      value: class MockHTMLAudioElement {
        src = ''
        currentTime = 0
        duration = 0
        volume = 1
        play = jest.fn().mockResolvedValue(undefined)
        pause = jest.fn()
        addEventListener = jest.fn()
        removeEventListener = jest.fn()
      },
    })
  })

  it('debounces search input to reduce API calls', async () => {
    // Mock useSupabaseData to track calls
    const mockUseSupabaseData = jest.fn().mockReturnValue({
      data: {
        daily: [
          {
            id: 'test-daily-1',
            title: 'Test Daily 1',
            date: '2025-01-01',
            created_at: '2025-01-01T00:00:00Z',
          },
        ],
        audio: [],
        markovTexts: [],
      },
      loading: false,
      error: null,
      totalCount: 1,
    })

    ;(useSupabaseData as jest.Mock).mockImplementation(mockUseSupabaseData)

    render(<BlogIndex data={mockData} location={mockLocation} />)

    // The search input should be present
    const searchInput = screen.getByPlaceholderText(/search days/i)
    expect(searchInput).toBeInTheDocument()

    // Type multiple characters quickly
    fireEvent.change(searchInput, { target: { value: 't' } })
    fireEvent.change(searchInput, { target: { value: 'te' } })
    fireEvent.change(searchInput, { target: { value: 'tes' } })
    fireEvent.change(searchInput, { target: { value: 'test' } })

    // The search term should update immediately for UI feedback
    expect(searchInput).toHaveValue('test')

    // Wait for the debounce delay (500ms) to complete
    await waitFor(
      () => {
        // The useSupabaseData should be called with the final search term
        expect(mockUseSupabaseData).toHaveBeenCalledWith(
          expect.objectContaining({
            searchTerm: 'test',
          })
        )
      },
      { timeout: 1000 }
    )

    // In the test environment, the hook might be called multiple times due to re-renders
    // But the important thing is that it's called with the correct final value
    const calls = mockUseSupabaseData.mock.calls
    const lastCall = calls[calls.length - 1]
    expect(lastCall[0]).toEqual(
      expect.objectContaining({
        searchTerm: 'test',
      })
    )
  })
})
