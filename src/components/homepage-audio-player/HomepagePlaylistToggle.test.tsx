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

const mockBlogPost = {
  id: '2024-01-01',
  title: 'First Blog Post',
  date: '2024-01-01',
  cover_art: '',
  audio: [],
  markovTexts: [],
  content: '',
  daily_id: '2024-01-01',
}

const defaultProps = {
  currentBlogPost: mockBlogPost,
}

describe('HomepagePlaylistToggle', () => {
  it('renders the playlist label', () => {
    render(<HomepagePlaylistToggle {...defaultProps} />)

    expect(screen.getByText('Playlist')).toBeInTheDocument()
  })

  it('displays the current blog post title when a post is selected', () => {
    render(<HomepagePlaylistToggle {...defaultProps} />)

    expect(screen.getByText('First Blog Post')).toBeInTheDocument()
  })

  it('does not display current blog post info when no post is selected', () => {
    render(<HomepagePlaylistToggle {...defaultProps} currentBlogPost={null} />)

    // Should only show the playlist label
    expect(screen.getByText('Playlist')).toBeInTheDocument()

    // Should not show any post titles
    expect(screen.queryByText('First Blog Post')).not.toBeInTheDocument()
    expect(screen.queryByText('Second Blog Post')).not.toBeInTheDocument()
    expect(screen.queryByText('Third Blog Post')).not.toBeInTheDocument()
  })

  it('renders with correct CSS classes', () => {
    render(<HomepagePlaylistToggle {...defaultProps} />)

    // Test the outer container div
    const outerContainer = screen.getByText('Playlist').closest('div')
      ?.parentElement?.parentElement
    expect(outerContainer).toHaveClass('p-4', 'border-b', 'border-gray-800')

    // Test the playlist label
    const playlistLabel = screen.getByText('Playlist')
    expect(playlistLabel).toHaveClass('text-sm', 'text-gray-400')

    // Test the post title
    const postTitle = screen.getByText('First Blog Post')
    expect(postTitle).toHaveClass('text-xs', 'text-gray-500')
  })
})
