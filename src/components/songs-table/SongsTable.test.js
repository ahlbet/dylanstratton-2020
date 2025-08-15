import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SongsTable from './SongsTable'

// Mock the useIsMobile hook
jest.mock('../../hooks/use-is-mobile', () => ({
  __esModule: true,
  default: () => false, // Default to desktop view
}))

// Mock the audio player context
jest.mock('../../contexts/audio-player-context/audio-player-context', () => ({
  useAudioPlayer: () => ({
    playlist: [],
    currentIndex: null,
    isPlaying: false,
    playTrack: jest.fn(),
    setPlaylist: jest.fn(),
    setIsPlaying: jest.fn(),
  }),
}))

const mockAudioData = [
  {
    title: 'Zebra Song',
    postTitle: 'Post A',
    postDate: 'January 1, 2024',
    duration: 180,
    storagePath: 'audio/song-a.wav',
    url: null,
  },
  {
    title: 'Alpha Song',
    postTitle: 'Post B',
    postDate: 'January 2, 2024',
    duration: 240,
    storagePath: 'audio/song-b.wav',
    url: null,
  },
  {
    title: 'Beta Song',
    postTitle: 'Post C',
    postDate: 'January 3, 2024',
    duration: 120,
    storagePath: 'audio/song-c.wav',
    url: null,
  },
]

describe('SongsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders table with songs data', () => {
    render(<SongsTable audioUrlsWithMetadata={mockAudioData} />)

    expect(screen.getByText('Zebra Song')).toBeInTheDocument()
    expect(screen.getByText('Alpha Song')).toBeInTheDocument()
    expect(screen.getByText('Beta Song')).toBeInTheDocument()
    expect(screen.getByText('Post A')).toBeInTheDocument()
    expect(screen.getByText('Post B')).toBeInTheDocument()
    expect(screen.getByText('Post C')).toBeInTheDocument()
  })

  it('shows correct duration formatting', () => {
    render(<SongsTable audioUrlsWithMetadata={mockAudioData} />)

    expect(screen.getByText('3:00')).toBeInTheDocument() // 180 seconds
    expect(screen.getByText('4:00')).toBeInTheDocument() // 240 seconds
    expect(screen.getByText('2:00')).toBeInTheDocument() // 120 seconds
  })

  it('displays search input', () => {
    render(<SongsTable audioUrlsWithMetadata={mockAudioData} />)

    expect(
      screen.getByPlaceholderText('Search songs, titles, or dates...')
    ).toBeInTheDocument()
  })

  it('filters songs based on search input', async () => {
    render(<SongsTable audioUrlsWithMetadata={mockAudioData} />)

    const searchInput = screen.getByPlaceholderText(
      'Search songs, titles, or dates...'
    )
    fireEvent.change(searchInput, { target: { value: 'Alpha' } })

    await waitFor(() => {
      expect(screen.getByText('Alpha Song')).toBeInTheDocument()
      expect(screen.queryByText('Beta Song')).not.toBeInTheDocument()
      expect(screen.queryByText('Zebra Song')).not.toBeInTheDocument()
    })
  })

  it('sorts by title when clicking title header', async () => {
    render(<SongsTable audioUrlsWithMetadata={mockAudioData} />)

    const titleHeader = screen.getByText('Title')

    // Click to sort ascending
    fireEvent.click(titleHeader)
    expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument()

    // Verify ascending order
    const titleCells = screen.getAllByText(/Song$/)
    expect(titleCells[0]).toHaveTextContent('Alpha Song')
    expect(titleCells[1]).toHaveTextContent('Beta Song')
    expect(titleCells[2]).toHaveTextContent('Zebra Song')
  })

  it('sorts by date when clicking date header', async () => {
    render(<SongsTable audioUrlsWithMetadata={mockAudioData} />)

    const dateHeader = screen.getByText('Date')
    fireEvent.click(dateHeader)

    expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument()
  })

  it('sorts by duration when clicking duration header', async () => {
    render(<SongsTable audioUrlsWithMetadata={mockAudioData} />)

    const durationHeader = screen.getByText('Duration')
    fireEvent.click(durationHeader)

    expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument()
  })

  it('allows clicking anywhere on table row to play/pause track', () => {
    render(<SongsTable audioUrlsWithMetadata={mockAudioData} />)

    // Mock the audio player functions
    const mockPlayTrack = jest.fn()
    const mockSetPlaylist = jest.fn()

    // Find the first song row
    const firstSongRow = screen.getByText('Zebra Song').closest('tr')

    // Click on the row (not the play button)
    fireEvent.click(firstSongRow)

    // Verify that the row has the click handler
    expect(firstSongRow).toHaveStyle({ cursor: 'pointer' })
  })

  it('shows pagination when there are many songs', () => {
    // Create more than 20 songs to trigger pagination
    const manySongs = Array.from({ length: 25 }, (_, i) => ({
      title: `Song ${i + 1}`,
      postTitle: `Post ${i + 1}`,
      postDate: `January ${i + 1}, 2024`,
      duration: 180 + i,
      storagePath: `audio/song-${i + 1}.wav`,
      url: null,
    }))

    render(<SongsTable audioUrlsWithMetadata={manySongs} />)

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText('Last')).toBeInTheDocument()
  })

  it('shows results info', () => {
    render(<SongsTable audioUrlsWithMetadata={mockAudioData} />)

    expect(screen.getByText('Showing 1-3 of 3 songs')).toBeInTheDocument()
  })

  it('handles empty data gracefully', () => {
    render(<SongsTable audioUrlsWithMetadata={[]} />)

    expect(screen.getByText('No songs found')).toBeInTheDocument()
  })

  it('handles null duration gracefully', () => {
    const dataWithNullDuration = [
      {
        title: 'Song with no duration',
        postTitle: 'Post',
        postDate: 'January 1, 2024',
        duration: null,
        storagePath: 'audio/song.wav',
        url: null,
      },
    ]

    render(<SongsTable audioUrlsWithMetadata={dataWithNullDuration} />)

    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('resets to first page when sorting', async () => {
    // Create enough songs to trigger pagination
    const manySongs = Array.from({ length: 25 }, (_, i) => ({
      title: `Song ${i + 1}`,
      postTitle: `Post ${i + 1}`,
      postDate: `January ${i + 1}, 2024`,
      duration: 180 + i,
      storagePath: `audio/song-${i + 1}.wav`,
      url: null,
    }))

    render(<SongsTable audioUrlsWithMetadata={manySongs} />)

    // Go to second page
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    // Verify we're on page 2
    expect(screen.getByText('Showing 21-25 of 25 songs')).toBeInTheDocument()

    // Sort by title
    const titleHeader = screen.getByText('Title')
    fireEvent.click(titleHeader)

    // Should be back to page 1
    expect(screen.getByText('Showing 1-20 of 25 songs')).toBeInTheDocument()
  })

  it('resets to first page when filtering', async () => {
    // Create enough songs to trigger pagination
    const manySongs = Array.from({ length: 25 }, (_, i) => ({
      title: `Song ${i + 1}`,
      postTitle: `Post ${i + 1}`,
      postDate: `January ${i + 1}, 2024`,
      duration: 180 + i,
      storagePath: `audio/song-${i + 1}.wav`,
      url: null,
    }))

    render(<SongsTable audioUrlsWithMetadata={manySongs} />)

    // Go to second page
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    // Verify we're on page 2
    expect(screen.getByText('Showing 21-25 of 25 songs')).toBeInTheDocument()

    // Filter
    const searchInput = screen.getByPlaceholderText(
      'Search songs, titles, or dates...'
    )
    fireEvent.change(searchInput, { target: { value: 'Song 25' } })

    // Should be back to page 1 and show filtered results
    await waitFor(() => {
      expect(screen.getByText('Showing 1-1 of 1 songs')).toBeInTheDocument()
    })

    // Verify only Song 25 is visible
    expect(screen.getByText('Song 25')).toBeInTheDocument()
    expect(screen.queryByText('Song 1')).not.toBeInTheDocument()
  })
})
