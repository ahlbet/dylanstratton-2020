import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AllSongsPlaylist from './all-songs-playlist'

// Mock dependencies
jest.mock('../../contexts/audio-player-context/audio-player-context', () => ({
  useAudioPlayer: () => ({
    playlist: [],
    currentIndex: 0,
    isPlaying: false,
    setIsPlaying: jest.fn(),
    playTrack: jest.fn(),
    setPlaylist: jest.fn(),
    updateTotalPlaylistDuration: jest.fn(),
  }),
}))

jest.mock('../../utils/plausible-analytics', () => ({
  trackAudioEvent: jest.fn(),
}))

describe('AllSongsPlaylist', () => {
  const mockAudioUrlsWithMetadata = [
    {
      title: 'Test Song 1',
      postTitle: 'Test Post 1',
      postDate: '2024-01-01',
      duration: 120,
      url: 'http://example.com/song1.mp3',
      storagePath: 'songs/song1.mp3',
    },
    {
      title: 'Test Song 2',
      postTitle: 'Test Post 2',
      postDate: '2024-01-02',
      duration: 180,
      url: 'http://example.com/song2.mp3',
      storagePath: 'songs/song2.mp3',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders without crashing', () => {
    render(
      <AllSongsPlaylist audioUrlsWithMetadata={mockAudioUrlsWithMetadata} />
    )

    expect(screen.getByText('Test Song 1')).toBeInTheDocument()
  })

  test('renders with custom className', () => {
    const customClass = 'custom-audio-player'
    render(
      <AllSongsPlaylist
        audioUrlsWithMetadata={mockAudioUrlsWithMetadata}
        className={customClass}
      />
    )

    const container = screen.getByText('Test Song 1').closest('div')
    expect(container).toBeInTheDocument()
  })

  test('renders with custom style', () => {
    const customStyle = { backgroundColor: 'blue' }
    render(
      <AllSongsPlaylist
        audioUrlsWithMetadata={mockAudioUrlsWithMetadata}
        style={customStyle}
      />
    )

    const container = screen.getByText('Test Song 1').closest('div')
    expect(container).toBeInTheDocument()
  })

  test('renders playlist with tracks', () => {
    render(
      <AllSongsPlaylist audioUrlsWithMetadata={mockAudioUrlsWithMetadata} />
    )

    expect(screen.getByText('Test Song 1')).toBeInTheDocument()
    expect(screen.getByText('Test Song 2')).toBeInTheDocument()
    // The post titles are displayed in a combined format with dates
    expect(screen.getByText(/Test Post 1/)).toBeInTheDocument()
    expect(screen.getByText(/Test Post 2/)).toBeInTheDocument()
  })

  test('formats duration correctly', () => {
    render(
      <AllSongsPlaylist audioUrlsWithMetadata={mockAudioUrlsWithMetadata} />
    )

    // 120 seconds = 2:00
    expect(screen.getByText('2:00')).toBeInTheDocument()
    // 180 seconds = 3:00
    expect(screen.getByText('3:00')).toBeInTheDocument()
  })

  test('formats long duration correctly', () => {
    const longDurationTracks = [
      {
        title: 'Long Song',
        postTitle: 'Long Post',
        postDate: '2024-01-01',
        duration: 3661, // 1:01:01
        url: 'http://example.com/long.mp3',
        storagePath: 'songs/long.mp3',
      },
    ]

    render(<AllSongsPlaylist audioUrlsWithMetadata={longDurationTracks} />)

    expect(screen.getByText('1:01:01')).toBeInTheDocument()
  })

  test('handles missing duration gracefully', () => {
    const tracksWithoutDuration = [
      {
        title: 'No Duration Song',
        postTitle: 'No Duration Post',
        postDate: '2024-01-01',
        url: 'http://example.com/noduration.mp3',
        storagePath: 'songs/noduration.mp3',
      },
    ]

    render(<AllSongsPlaylist audioUrlsWithMetadata={tracksWithoutDuration} />)

    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  test('handles empty audioUrlsWithMetadata', () => {
    render(<AllSongsPlaylist audioUrlsWithMetadata={[]} />)

    expect(screen.queryByText('Test Song 1')).not.toBeInTheDocument()
  })

  test('handles null audioUrlsWithMetadata', () => {
    render(<AllSongsPlaylist audioUrlsWithMetadata={null} />)

    expect(screen.queryByText('Test Song 1')).not.toBeInTheDocument()
  })

  test('handles undefined audioUrlsWithMetadata', () => {
    render(<AllSongsPlaylist audioUrlsWithMetadata={undefined} />)

    expect(screen.queryByText('Test Song 1')).not.toBeInTheDocument()
  })

  test('handles tracks with only storagePath (new format)', () => {
    const newFormatTracks = [
      {
        title: 'Storage Path Song',
        postTitle: 'Storage Path Post',
        postDate: '2024-01-01',
        duration: 150,
        storagePath: 'songs/storagepath.mp3',
      },
    ]

    render(<AllSongsPlaylist audioUrlsWithMetadata={newFormatTracks} />)

    expect(screen.getByText('Storage Path Song')).toBeInTheDocument()
    expect(screen.getByText('2:30')).toBeInTheDocument()
  })

  test('handles tracks with only url (old format)', () => {
    const oldFormatTracks = [
      {
        title: 'URL Song',
        postTitle: 'URL Post',
        postDate: '2024-01-01',
        duration: 90,
        url: 'http://example.com/url.mp3',
      },
    ]

    render(<AllSongsPlaylist audioUrlsWithMetadata={oldFormatTracks} />)

    expect(screen.getByText('URL Song')).toBeInTheDocument()
    expect(screen.getByText('1:30')).toBeInTheDocument()
  })

  test('handles tracks with missing title', () => {
    const tracksWithoutTitle = [
      {
        postTitle: 'No Title Post',
        postDate: '2024-01-01',
        duration: 120,
        url: 'http://example.com/notitle.mp3',
        storagePath: 'songs/notitle.mp3',
      },
    ]

    render(<AllSongsPlaylist audioUrlsWithMetadata={tracksWithoutTitle} />)

    // Should extract title from filename
    expect(screen.getByText('notitle')).toBeInTheDocument()
  })

  test('handles tracks with missing postTitle', () => {
    const tracksWithoutPostTitle = [
      {
        title: 'No Post Title Song',
        postDate: '2024-01-01',
        duration: 120,
        url: 'http://example.com/noposttitle.mp3',
        storagePath: 'songs/noposttitle.mp3',
      },
    ]

    render(<AllSongsPlaylist audioUrlsWithMetadata={tracksWithoutPostTitle} />)

    expect(screen.getByText(/Unknown Artist/)).toBeInTheDocument()
  })

  test('handles tracks with missing postDate', () => {
    const tracksWithoutPostDate = [
      {
        title: 'No Post Date Song',
        postTitle: 'No Post Date Post',
        duration: 120,
        url: 'http://example.com/nopostdate.mp3',
        storagePath: 'songs/nopostdate.mp3',
      },
    ]

    render(<AllSongsPlaylist audioUrlsWithMetadata={tracksWithoutPostDate} />)

    expect(screen.getByText(/Unknown Album/)).toBeInTheDocument()
  })

  test('filters out null/undefined items', () => {
    const tracksWithNulls = [
      null,
      undefined,
      {
        title: 'Valid Song',
        postTitle: 'Valid Post',
        postDate: '2024-01-01',
        duration: 120,
        url: 'http://example.com/valid.mp3',
        storagePath: 'songs/valid.mp3',
      },
      null,
    ]

    render(<AllSongsPlaylist audioUrlsWithMetadata={tracksWithNulls} />)

    expect(screen.getByText('Valid Song')).toBeInTheDocument()
    expect(screen.queryByText('null')).not.toBeInTheDocument()
  })

  test('handles tracks with invalid duration', () => {
    const tracksWithInvalidDuration = [
      {
        title: 'Invalid Duration Song',
        postTitle: 'Invalid Duration Post',
        postDate: '2024-01-01',
        duration: 'invalid',
        url: 'http://example.com/invalid.mp3',
        storagePath: 'songs/invalid.mp3',
      },
    ]

    render(
      <AllSongsPlaylist audioUrlsWithMetadata={tracksWithInvalidDuration} />
    )

    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  test('handles tracks with zero duration', () => {
    const tracksWithZeroDuration = [
      {
        title: 'Zero Duration Song',
        postTitle: 'Zero Duration Post',
        postDate: '2024-01-01',
        duration: 0,
        url: 'http://example.com/zero.mp3',
        storagePath: 'songs/zero.mp3',
      },
    ]

    render(<AllSongsPlaylist audioUrlsWithMetadata={tracksWithZeroDuration} />)

    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  test('handles tracks with negative duration', () => {
    const tracksWithNegativeDuration = [
      {
        title: 'Negative Duration Song',
        postTitle: 'Negative Duration Post',
        postDate: '2024-01-01',
        duration: -120,
        url: 'http://example.com/negative.mp3',
        storagePath: 'songs/negative.mp3',
      },
    ]

    render(
      <AllSongsPlaylist audioUrlsWithMetadata={tracksWithNegativeDuration} />
    )

    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  test('calculates total playlist duration correctly', () => {
    render(
      <AllSongsPlaylist audioUrlsWithMetadata={mockAudioUrlsWithMetadata} />
    )

    // Total duration: 120 + 180 = 300 seconds = 5:00
    // This would be displayed somewhere in the component
    expect(screen.getByText(/5:00/)).toBeInTheDocument()
  })
})
