import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { HomepagePlaylistToggle } from './HomepagePlaylistToggle'

// Mock data for testing
const mockPosts = [
  {
    node: {
      frontmatter: {
        daily_id: '2024-01-01',
        title: 'First Blog Post',
      },
    },
  },
  {
    node: {
      frontmatter: {
        daily_id: '2024-01-02',
        title: 'Second Blog Post',
      },
    },
  },
  {
    node: {
      frontmatter: {
        daily_id: '2024-01-03',
        title: 'Third Blog Post',
      },
    },
  },
]

describe('HomepagePlaylistToggle', () => {
  it('renders the playlist label', () => {
    render(
      <HomepagePlaylistToggle
        currentBlogPost={null}
        posts={mockPosts}
      />
    )

    expect(screen.getByText('Playlist')).toBeInTheDocument()
  })

  it('displays the current blog post title when a post is selected', () => {
    render(
      <HomepagePlaylistToggle
        currentBlogPost="2024-01-02"
        posts={mockPosts}
      />
    )

    expect(screen.getByText('Second Blog Post')).toBeInTheDocument()
  })

  it('displays the daily_id when post title is not found', () => {
    render(
      <HomepagePlaylistToggle
        currentBlogPost="2024-01-04"
        posts={mockPosts}
      />
    )

    expect(screen.getByText('2024-01-04')).toBeInTheDocument()
  })

  it('does not display current blog post info when no post is selected', () => {
    render(
      <HomepagePlaylistToggle
        currentBlogPost={null}
        posts={mockPosts}
      />
    )

    // Should only show the playlist label
    expect(screen.getByText('Playlist')).toBeInTheDocument()
    
    // Should not show any post titles
    expect(screen.queryByText('First Blog Post')).not.toBeInTheDocument()
    expect(screen.queryByText('Second Blog Post')).not.toBeInTheDocument()
    expect(screen.queryByText('Third Blog Post')).not.toBeInTheDocument()
  })

  it('handles empty posts array', () => {
    render(
      <HomepagePlaylistToggle
        currentBlogPost="2024-01-01"
        posts={[]}
      />
    )

    expect(screen.getByText('Playlist')).toBeInTheDocument()
    expect(screen.getByText('2024-01-01')).toBeInTheDocument()
  })

  it('handles posts with missing frontmatter', () => {
    const postsWithMissingData = [
      {
        node: {
          frontmatter: {
            daily_id: '2024-01-01',
            title: 'Valid Post',
          },
        },
      },
      {
        node: {
          // Missing frontmatter
        },
      },
    ]

    render(
      <HomepagePlaylistToggle
        currentBlogPost="2024-01-01"
        posts={postsWithMissingData}
      />
    )

    expect(screen.getByText('Valid Post')).toBeInTheDocument()
  })

  it('renders with correct CSS classes', () => {
    render(
      <HomepagePlaylistToggle
        currentBlogPost="2024-01-01"
        posts={mockPosts}
      />
    )

    // Test the outer container div
    const outerContainer = screen.getByText('Playlist').closest('div')?.parentElement?.parentElement
    expect(outerContainer).toHaveClass('p-4', 'border-b', 'border-gray-800')

    // Test the playlist label
    const playlistLabel = screen.getByText('Playlist')
    expect(playlistLabel).toHaveClass('text-sm', 'text-gray-400')

    // Test the post title
    const postTitle = screen.getByText('First Blog Post')
    expect(postTitle).toHaveClass('text-xs', 'text-gray-500')
  })

  it('handles multiple posts with same daily_id (should show first match)', () => {
    const postsWithDuplicateIds = [
      {
        node: {
          frontmatter: {
            daily_id: '2024-01-01',
            title: 'First Match',
          },
        },
      },
      {
        node: {
          frontmatter: {
            daily_id: '2024-01-01',
            title: 'Second Match',
          },
        },
      },
    ]

    render(
      <HomepagePlaylistToggle
        currentBlogPost="2024-01-01"
        posts={postsWithDuplicateIds}
      />
    )

    // Should show the first match
    expect(screen.getByText('First Match')).toBeInTheDocument()
    expect(screen.queryByText('Second Match')).not.toBeInTheDocument()
  })
})
