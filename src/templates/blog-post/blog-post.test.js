import React from 'react'
import { render, screen } from '@testing-library/react'
import BlogPostTemplate from './blog-post'

// Mock ALL components to avoid complex rendering issues
jest.mock('../../components/bio/bio', () => () => (
  <div data-testid="bio">Bio Component</div>
))
jest.mock('../../components/layout/layout', () => ({ children, title }) => (
  <div data-testid="layout" title={title}>
    {children}
  </div>
))
jest.mock('../../components/seo/seo', () => ({ title, description }) => (
  <div data-testid="seo" title={title} description={description}>
    SEO Component
  </div>
))
jest.mock('../../components/calendar/calendar', () => () => (
  <div data-testid="calendar">Calendar Component</div>
))
jest.mock('../../components/calendar/calendar-toggle', () => () => (
  <button data-testid="calendar-toggle">Toggle Calendar</button>
))
jest.mock('../../components/calendar/user-preferences-context', () => ({
  useUserPreferences: () => ({
    calendarVisible: false,
    toggleCalendar: jest.fn(),
    setCalendarVisible: jest.fn(),
  }),
}))

// Mock the audio player context
jest.mock('../../contexts/audio-player-context/audio-player-context', () => ({
  AudioPlayerProvider: ({ children }) => (
    <div data-testid="audio-provider">{children}</div>
  ),
  useAudioPlayer: () => ({
    setPlaylist: jest.fn(),
    playlist: [],
    playTrack: jest.fn(),
  }),
}))

// Mock the fixed audio player component
jest.mock('../../components/fixed-audio-player/FixedAudioPlayer', () => ({
  FixedAudioPlayer: () => (
    <div data-testid="fixed-audio-player">Fixed Audio Player</div>
  ),
}))

// Mock the blog audio player component
jest.mock('../../components/blog-audio-player/BlogAudioPlayer', () => () => (
  <div data-testid="blog-audio-player">Blog Audio Player</div>
))

// Mock the dynamic markov text component
jest.mock(
  '../../components/dynamic-markov-text/DynamicMarkovText',
  () => () => <div data-testid="dynamic-markov-text">Dynamic Markov Text</div>
)

// Mock the audio FFT component
jest.mock('../../components/audio-fft/AudioFFT', () => () => (
  <div data-testid="audio-fft">Audio FFT</div>
))

// Mock utility functions
jest.mock('../../utils/extractAudioUrls', () => ({
  extractAudioUrls: jest.fn(() => []),
  removeAudioFromHtml: jest.fn((html) => html),
}))

jest.mock('../../utils/local-audio-urls', () => ({
  convertAudioUrlsToLocal: jest.fn(() => []),
  convertCoverArtUrlToLocal: jest.fn(() => ''),
  getCoverArtUrl: jest.fn(() => ''),
}))

jest.mock('../../utils/presigned-urls', () => ({
  generatePresignedUrlsForAudio: jest.fn(() => []),
  removeBucketPrefix: jest.fn((path) => path),
  extractFilenameFromStoragePath: jest.fn((path) => 'test-file'),
}))

jest.mock('../../utils/local-dev-utils', () => ({
  isLocalDev: jest.fn(() => false),
}))

// Mock CSS imports
jest.mock('../../utils/audio-player.css', () => ({}), { virtual: true })
jest.mock('./blog-post.css', () => ({}), { virtual: true })

// Mock gatsby
jest.mock('gatsby', () => ({
  Link: jest
    .fn()
    .mockImplementation(({ children, to }) => <a href={to}>{children}</a>),
  graphql: jest.fn(),
  useStaticQuery: jest.fn(),
}))

// Mock typography
jest.mock('../../utils/typography', () => ({
  rhythm: jest.fn((n) => n * 10),
  scale: jest.fn(() => ({ fontSize: '0.8rem' })),
}))

describe('BlogPostTemplate', () => {
  const mockData = {
    site: {
      siteMetadata: {
        title: 'Test Site Title',
      },
    },
    markdownRemark: {
      id: '123',
      excerpt: 'Test excerpt',
      html: '<p>Test content</p>',
      frontmatter: {
        title: 'Test Blog Post',
        date: 'January 1, 2023',
        description: 'Test description',
      },
    },
  }

  const mockPageContext = {
    previous: {
      fields: { slug: '/previous-post/' },
      frontmatter: { title: 'Previous Post' },
    },
    next: {
      fields: { slug: '/next-post/' },
      frontmatter: { title: 'Next Post' },
    },
    markdownData: null,
    supabaseData: null,
  }

  const mockLocation = {
    pathname: '/blog/test-post/',
  }

  test('renders blog post with correct title and date', () => {
    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={mockPageContext}
        location={mockLocation}
      />
    )

    expect(screen.getByText('Test Blog Post')).toBeInTheDocument()
    expect(screen.getByText('January 1, 2023')).toBeInTheDocument()
  })

  test('renders blog post content correctly', () => {
    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={mockPageContext}
        location={mockLocation}
      />
    )

    expect(screen.getByTestId('layout')).toHaveAttribute(
      'title',
      'Test Site Title'
    )
    expect(screen.getByTestId('seo')).toHaveAttribute('title', 'Test Blog Post')
    expect(screen.getByTestId('seo')).toHaveAttribute(
      'description',
      'Test description'
    )
    expect(screen.getByTestId('bio')).toBeInTheDocument()
  })

  test('renders navigation links to previous and next posts', () => {
    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={mockPageContext}
        location={mockLocation}
      />
    )

    expect(screen.getAllByText('← Previous Post')).toHaveLength(2)
    expect(screen.getAllByText('Next Post →')).toHaveLength(2)
  })

  test('does not render previous link when there is no previous post', () => {
    const contextWithoutPrevious = { ...mockPageContext, previous: null }

    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={contextWithoutPrevious}
        location={mockLocation}
      />
    )

    expect(screen.queryByText(/← Previous Post/)).not.toBeInTheDocument()
    expect(screen.getAllByText('Next Post →')).toHaveLength(2)
  })

  test('does not render next link when there is no next post', () => {
    const contextWithoutNext = { ...mockPageContext, next: null }

    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={contextWithoutNext}
        location={mockLocation}
      />
    )

    expect(screen.getAllByText('← Previous Post')).toHaveLength(2)
    expect(screen.queryByText(/Next Post →/)).not.toBeInTheDocument()
  })
})
