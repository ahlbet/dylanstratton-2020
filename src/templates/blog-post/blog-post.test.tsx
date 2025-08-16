import React from 'react'
import { render, screen } from '@testing-library/react'
import BlogPostTemplate from './blog-post'

// Mock ALL components to avoid complex rendering issues
jest.mock('../../components/bio/bio', () => () => (
  <div data-testid="bio">Bio Component</div>
))
jest.mock(
  '../../components/layout/layout',
  () =>
    ({ children, title }: { children: React.ReactNode; title: string }) => (
      <div data-testid="layout" title={title}>
        {children}
      </div>
    )
)
jest.mock(
  '../../components/seo/seo',
  () =>
    ({ title, description }: { title: string; description?: string }) => (
      <div data-testid="seo" title={title} description={description}>
        SEO Component
      </div>
    )
)
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
  AudioPlayerProvider: ({ children }: { children: React.ReactNode }) => (
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
  removeAudioFromHtml: jest.fn((html: string) => html),
}))

jest.mock('../../utils/local-audio-urls', () => ({
  convertAudioUrlsToLocal: jest.fn(() => []),
  convertCoverArtUrlToLocal: jest.fn(() => ''),
  getCoverArtUrl: jest.fn(() => ''),
}))

jest.mock('../../utils/presigned-urls', () => ({
  generatePresignedUrlsForAudio: jest.fn(() => []),
  removeBucketPrefix: jest.fn((path: string) => path),
  extractFilenameFromStoragePath: jest.fn((path: string) => 'test-file'),
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
    .mockImplementation(
      ({ children, to }: { children: React.ReactNode; to: string }) => (
        <a href={to}>{children}</a>
      )
    ),
  graphql: jest.fn(),
  useStaticQuery: jest.fn(),
}))

// Mock typography
jest.mock('../../utils/typography', () => ({
  rhythm: jest.fn((n: number) => n * 10),
  scale: jest.fn(() => ({ fontSize: '0.8rem' })),
}))

// Types
interface MockData {
  site: {
    siteMetadata: {
      title: string
    }
  }
  markdownRemark: {
    id: string
    excerpt: string
    html: string
    frontmatter: {
      title: string
      date: string
      description: string
    }
  }
}

interface MockPageContext {
  previous?: {
    fields: { slug: string }
    frontmatter: { title: string }
  }
  next?: {
    fields: { slug: string }
    frontmatter: { title: string }
  }
  markdownData?: any
  supabaseData?: any
}

interface MockLocation {
  pathname: string
}

describe('BlogPostTemplate', () => {
  const mockData: MockData = {
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

  const mockPageContext: MockPageContext = {
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

  const mockLocation: MockLocation = {
    pathname: '/blog/test-post/',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

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
      'Test excerpt'
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
    const contextWithoutPrevious: MockPageContext = {
      ...mockPageContext,
      previous: undefined,
    }

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
    const contextWithoutNext: MockPageContext = {
      ...mockPageContext,
      next: undefined,
    }

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

  test('renders with markov data when available', () => {
    const contextWithMarkov: MockPageContext = {
      ...mockPageContext,
      markdownData: {
        markovText: 'Sample markov text content',
        markovTextId: 'test-123',
      },
    }

    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={contextWithMarkov}
        location={mockLocation}
      />
    )

    expect(screen.getByTestId('dynamic-markov-text')).toBeInTheDocument()
  })

  test('renders with supabase data when available', () => {
    const contextWithSupabase: MockPageContext = {
      ...mockPageContext,
      supabaseData: {
        audio: [
          { storage_path: 'audio/test1.wav', displayFilename: 'Test Audio 1' },
          { storage_path: 'audio/test2.wav', displayFilename: 'Test Audio 2' },
        ],
        daily: { cover_art: 'cover/test-cover.jpg' },
      },
    }

    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={contextWithSupabase}
        location={mockLocation}
      />
    )

    expect(screen.getByTestId('blog-audio-player')).toBeInTheDocument()
  })

  test('renders with both markov and supabase data', () => {
    const contextWithBoth: MockPageContext = {
      ...mockPageContext,
      supabaseData: {
        audio: [
          { storage_path: 'audio/test1.wav', displayFilename: 'Test Audio 1' },
        ],
        daily: { cover_art: 'cover/test-cover.jpg' },
        markovTexts: [
          {
            id: '1',
            text_content: 'Sample markov text content',
            coherency_level: 'high',
          },
        ],
      },
    }

    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={contextWithBoth}
        location={mockLocation}
      />
    )

    // DynamicMarkovText is always rendered
    expect(screen.getByTestId('dynamic-markov-text')).toBeInTheDocument()
    expect(screen.getByTestId('blog-audio-player')).toBeInTheDocument()
  })

  test('renders without markov or supabase data', () => {
    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={mockPageContext}
        location={mockLocation}
      />
    )

    // Should still render basic components
    expect(screen.getByTestId('layout')).toBeInTheDocument()
    expect(screen.getByTestId('seo')).toBeInTheDocument()
    expect(screen.getByTestId('bio')).toBeInTheDocument()
    // DynamicMarkovText is always rendered
    expect(screen.getByTestId('dynamic-markov-text')).toBeInTheDocument()
  })

  test('renders with empty markov data', () => {
    const contextWithEmptyMarkov: MockPageContext = {
      ...mockPageContext,
      supabaseData: {
        markovTexts: [],
      },
    }

    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={contextWithEmptyMarkov}
        location={mockLocation}
      />
    )

    // DynamicMarkovText is always rendered
    expect(screen.getByTestId('dynamic-markov-text')).toBeInTheDocument()
  })

  test('renders with empty supabase data', () => {
    const contextWithEmptySupabase: MockPageContext = {
      ...mockPageContext,
      supabaseData: {
        audio: [],
        daily: {},
      },
    }

    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={contextWithEmptySupabase}
        location={mockLocation}
      />
    )

    // BlogAudioPlayer is only rendered when there's audio data
    expect(screen.queryByTestId('blog-audio-player')).not.toBeInTheDocument()
  })

  test('renders with null markov data', () => {
    const contextWithNullMarkov: MockPageContext = {
      ...mockPageContext,
      supabaseData: {
        markovTexts: null,
      },
    }

    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={contextWithNullMarkov}
        location={mockLocation}
      />
    )

    // DynamicMarkovText is always rendered
    expect(screen.getByTestId('dynamic-markov-text')).toBeInTheDocument()
  })

  test('renders with null supabase data', () => {
    const contextWithNullSupabase: MockPageContext = {
      ...mockPageContext,
      supabaseData: null,
    }

    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={contextWithNullSupabase}
        location={mockLocation}
      />
    )

    // Should not render audio player component when no supabase data
    expect(screen.queryByTestId('blog-audio-player')).not.toBeInTheDocument()
  })

  test('renders with undefined markov data', () => {
    const contextWithUndefinedMarkov: MockPageContext = {
      ...mockPageContext,
      supabaseData: {
        markovTexts: undefined,
      },
    }

    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={contextWithUndefinedMarkov}
        location={mockLocation}
      />
    )

    // DynamicMarkovText is always rendered
    expect(screen.getByTestId('dynamic-markov-text')).toBeInTheDocument()
  })

  test('renders with undefined supabase data', () => {
    const contextWithUndefinedSupabase: MockPageContext = {
      ...mockPageContext,
      supabaseData: undefined,
    }

    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={contextWithUndefinedSupabase}
        location={mockLocation}
      />
    )

    // Should not render audio player component when no supabase data
    expect(screen.queryByTestId('blog-audio-player')).not.toBeInTheDocument()
  })

  test('renders with missing site metadata', () => {
    const dataWithoutSite = {
      markdownRemark: mockData.markdownRemark,
    }

    // This should crash the component, so we expect an error
    expect(() => {
      render(
        <BlogPostTemplate
          data={dataWithoutSite as any}
          pageContext={mockPageContext}
          location={mockLocation}
        />
      )
    }).toThrow("Cannot read properties of undefined (reading 'siteMetadata')")
  })

  test('renders with missing markdown data', () => {
    const dataWithoutMarkdown = {
      site: mockData.site,
    }

    // This should crash the component, so we expect an error
    expect(() => {
      render(
        <BlogPostTemplate
          data={dataWithoutMarkdown as any}
          pageContext={mockPageContext}
          location={mockLocation}
        />
      )
    }).toThrow("Cannot read properties of undefined (reading 'html')")
  })

  test('renders with complex HTML content', () => {
    const dataWithComplexHtml: MockData = {
      ...mockData,
      markdownRemark: {
        ...mockData.markdownRemark,
        html: `
          <h1>Complex HTML</h1>
          <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
          <blockquote>Blockquote content</blockquote>
        `,
      },
    }

    render(
      <BlogPostTemplate
        data={dataWithComplexHtml}
        pageContext={mockPageContext}
        location={mockLocation}
      />
    )

    // The HTML content is not directly rendered in the component
    // It's processed for markov text extraction and audio URL extraction
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })

  test('renders with long content', () => {
    const longContent = '<p>' + 'A'.repeat(1000) + '</p>'
    const dataWithLongContent: MockData = {
      ...mockData,
      markdownRemark: {
        ...mockData.markdownRemark,
        html: longContent,
      },
    }

    render(
      <BlogPostTemplate
        data={dataWithLongContent}
        pageContext={mockPageContext}
        location={mockLocation}
      />
    )

    // Should render without crashing
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })

  test('renders with special characters in title', () => {
    const dataWithSpecialChars: MockData = {
      ...mockData,
      markdownRemark: {
        ...mockData.markdownRemark,
        frontmatter: {
          ...mockData.markdownRemark.frontmatter,
          title: 'Special Characters: !@#$%^&*()_+-=[]{}|;:,.<>?',
        },
      },
    }

    render(
      <BlogPostTemplate
        data={dataWithSpecialChars}
        pageContext={mockPageContext}
        location={mockLocation}
      />
    )

    expect(
      screen.getByText('Special Characters: !@#$%^&*()_+-=[]{}|;:,.<>?')
    ).toBeInTheDocument()
  })

  test('renders with unicode characters in title', () => {
    const dataWithUnicode: MockData = {
      ...mockData,
      markdownRemark: {
        ...mockData.markdownRemark,
        frontmatter: {
          ...mockData.markdownRemark.frontmatter,
          title: 'Unicode: 🎵🎶🎼🎹🎸🎷🎺🎻🥁',
        },
      },
    }

    render(
      <BlogPostTemplate
        data={dataWithUnicode}
        pageContext={mockPageContext}
        location={mockLocation}
      />
    )

    expect(screen.getByText('Unicode: 🎵🎶🎼🎹🎸🎷🎺🎻🥁')).toBeInTheDocument()
  })
})
