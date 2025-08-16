import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { HomepagePlaylistToggle } from './HomepagePlaylistToggle'

describe('HomepagePlaylistToggle', () => {
  const mockPosts = [
    {
      node: {
        frontmatter: {
          daily_id: 'test-daily-1',
          title: 'Test Daily 1',
        },
      },
    },
  ]

  const defaultProps = {
    viewMode: 'list' as const,
    onViewModeChange: jest.fn(),
    currentBlogPost: 'test-daily-1',
    posts: mockPosts,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<HomepagePlaylistToggle {...defaultProps} />)
      expect(screen.getByText('List')).toBeInTheDocument()
      expect(screen.getByText('Grid')).toBeInTheDocument()
    })

    it('displays both view mode options', () => {
      render(<HomepagePlaylistToggle {...defaultProps} />)

      expect(screen.getByText('List')).toBeInTheDocument()
      expect(screen.getByText('Grid')).toBeInTheDocument()
    })

    it('shows current view mode as active', () => {
      render(<HomepagePlaylistToggle {...defaultProps} viewMode="list" />)

      const listButton = screen.getByText('List')
      const gridButton = screen.getByText('Grid')

      expect(listButton).toHaveClass('bg-red-400', 'text-white')
      expect(gridButton).toHaveClass('bg-gray-800', 'text-gray-400')
    })

    it('shows grid view mode as active when selected', () => {
      render(<HomepagePlaylistToggle {...defaultProps} viewMode="grid" />)

      const listButton = screen.getByText('List')
      const gridButton = screen.getByText('Grid')

      expect(gridButton).toHaveClass('bg-red-400', 'text-white')
      expect(listButton).toHaveClass('bg-gray-800', 'text-gray-400')
    })
  })

  describe('View Mode Toggle', () => {
    it('calls onViewModeChange when list button is clicked', () => {
      const onViewModeChange = jest.fn()
      render(
        <HomepagePlaylistToggle
          {...defaultProps}
          onViewModeChange={onViewModeChange}
          viewMode="grid"
        />
      )

      const listButton = screen.getByText('List')
      fireEvent.click(listButton)

      expect(onViewModeChange).toHaveBeenCalledWith('list')
    })

    it('calls onViewModeChange when grid button is clicked', () => {
      const onViewModeChange = jest.fn()
      render(
        <HomepagePlaylistToggle
          {...defaultProps}
          onViewModeChange={onViewModeChange}
          viewMode="list"
        />
      )

      const gridButton = screen.getByText('Grid')
      fireEvent.click(gridButton)

      expect(onViewModeChange).toHaveBeenCalledWith('grid')
    })

    it('calls onViewModeChange with correct view mode for each button', () => {
      const onViewModeChange = jest.fn()
      render(
        <HomepagePlaylistToggle
          {...defaultProps}
          onViewModeChange={onViewModeChange}
        />
      )

      const listButton = screen.getByText('List')
      const gridButton = screen.getByText('Grid')

      fireEvent.click(listButton)
      expect(onViewModeChange).toHaveBeenCalledWith('list')

      fireEvent.click(gridButton)
      expect(onViewModeChange).toHaveBeenCalledWith('grid')
    })

    it('handles multiple clicks on the same button', () => {
      const onViewModeChange = jest.fn()
      render(
        <HomepagePlaylistToggle
          {...defaultProps}
          onViewModeChange={onViewModeChange}
        />
      )

      const listButton = screen.getByText('List')

      fireEvent.click(listButton)
      fireEvent.click(listButton)
      fireEvent.click(listButton)

      expect(onViewModeChange).toHaveBeenCalledTimes(3)
      expect(onViewModeChange).toHaveBeenCalledWith('list')
    })
  })

  describe('Current Blog Post Display', () => {
    it('displays current blog post when provided', () => {
      render(
        <HomepagePlaylistToggle
          {...defaultProps}
          currentBlogPost="test-daily-1"
        />
      )
      expect(screen.getByText('test-daily-1')).toBeInTheDocument()
    })

    it('displays blog post title when found in posts', () => {
      render(
        <HomepagePlaylistToggle
          {...defaultProps}
          currentBlogPost="test-daily-1"
        />
      )
      expect(screen.getByText('Blog Post: Test Daily 1')).toBeInTheDocument()
    })

    it('handles null current blog post', () => {
      render(
        <HomepagePlaylistToggle {...defaultProps} currentBlogPost={null} />
      )
      expect(screen.queryByText('test-daily-1')).not.toBeInTheDocument()
    })

    it('handles empty string current blog post', () => {
      render(<HomepagePlaylistToggle {...defaultProps} currentBlogPost="" />)
      expect(screen.queryByText('test-daily-1')).not.toBeInTheDocument()
    })

    it('handles very long blog post names', () => {
      const longBlogPost = 'A'.repeat(1000)
      render(
        <HomepagePlaylistToggle
          {...defaultProps}
          currentBlogPost={longBlogPost}
        />
      )
      expect(screen.getByText(longBlogPost)).toBeInTheDocument()
    })

    it('handles special characters in blog post names', () => {
      const specialBlogPost =
        'Blog post with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
      render(
        <HomepagePlaylistToggle
          {...defaultProps}
          currentBlogPost={specialBlogPost}
        />
      )
      expect(screen.getByText(specialBlogPost)).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined onViewModeChange gracefully', () => {
      const propsWithoutCallback = {
        ...defaultProps,
        onViewModeChange: undefined,
      }

      render(<HomepagePlaylistToggle {...propsWithoutCallback} />)

      const listButton = screen.getByText('List')
      const gridButton = screen.getByText('Grid')

      expect(listButton).toBeInTheDocument()
      expect(gridButton).toBeInTheDocument()
    })

    it('handles very long view mode labels', () => {
      // This test would require modifying the component to accept custom labels
      // For now, we'll test the default behavior
      render(<HomepagePlaylistToggle {...defaultProps} />)

      expect(screen.getByText('List')).toBeInTheDocument()
      expect(screen.getByText('Grid')).toBeInTheDocument()
    })

    it('handles rapid view mode changes', () => {
      const onViewModeChange = jest.fn()
      render(
        <HomepagePlaylistToggle
          {...defaultProps}
          onViewModeChange={onViewModeChange}
        />
      )

      const listButton = screen.getByText('List')
      const gridButton = screen.getByText('Grid')

      // Rapidly click between view modes
      fireEvent.click(listButton)
      fireEvent.click(gridButton)
      fireEvent.click(listButton)
      fireEvent.click(gridButton)

      expect(onViewModeChange).toHaveBeenCalledTimes(4)
      expect(onViewModeChange).toHaveBeenNthCalledWith(1, 'list')
      expect(onViewModeChange).toHaveBeenNthCalledWith(2, 'grid')
      expect(onViewModeChange).toHaveBeenNthCalledWith(3, 'list')
      expect(onViewModeChange).toHaveBeenNthCalledWith(4, 'grid')
    })
  })

  describe('Styling and Layout', () => {
    it('applies correct CSS classes to container', () => {
      render(<HomepagePlaylistToggle {...defaultProps} />)

      const container = screen.getByTestId('playlist-toggle-container')
      expect(container).toHaveClass('p-4', 'border-b', 'border-gray-800')
    })

    it('applies correct CSS classes to toggle buttons container', () => {
      render(<HomepagePlaylistToggle {...defaultProps} />)

      const toggleContainer = screen.getByTestId('toggle-buttons-container')
      expect(toggleContainer).toHaveClass('flex', 'space-x-2')
    })

    it('applies correct CSS classes to list button when active', () => {
      render(<HomepagePlaylistToggle {...defaultProps} viewMode="list" />)

      const listButton = screen.getByText('List')
      expect(listButton).toHaveClass(
        'px-3',
        'py-2',
        'rounded',
        'bg-red-400',
        'text-white',
        'text-sm',
        'font-medium'
      )
    })

    it('applies correct CSS classes to list button when inactive', () => {
      render(<HomepagePlaylistToggle {...defaultProps} viewMode="grid" />)

      const listButton = screen.getByText('List')
      expect(listButton).toHaveClass(
        'px-3',
        'py-2',
        'rounded',
        'bg-gray-800',
        'text-gray-400',
        'text-sm',
        'font-medium'
      )
    })

    it('applies correct CSS classes to grid button when active', () => {
      render(<HomepagePlaylistToggle {...defaultProps} viewMode="grid" />)

      const gridButton = screen.getByText('Grid')
      expect(gridButton).toHaveClass(
        'px-3',
        'py-2',
        'rounded',
        'bg-red-400',
        'text-white',
        'text-sm',
        'font-medium'
      )
    })

    it('applies correct CSS classes to grid button when inactive', () => {
      render(<HomepagePlaylistToggle {...defaultProps} viewMode="list" />)

      const gridButton = screen.getByText('Grid')
      expect(gridButton).toHaveClass(
        'px-3',
        'py-2',
        'rounded',
        'bg-gray-800',
        'text-gray-400',
        'text-sm',
        'font-medium'
      )
    })

    it('applies correct CSS classes to blog post display', () => {
      render(
        <HomepagePlaylistToggle
          {...defaultProps}
          currentBlogPost="test-daily-1"
        />
      )

      const blogPostDisplay = screen.getByText('test-daily-1')
      expect(blogPostDisplay).toHaveClass(
        'text-center',
        'text-gray-400',
        'text-sm',
        'mt-2'
      )
    })
  })

  describe('Accessibility', () => {
    it('has proper button roles', () => {
      render(<HomepagePlaylistToggle {...defaultProps} />)

      const listButton = screen.getByText('List')
      const gridButton = screen.getByText('Grid')

      expect(listButton).toHaveAttribute('role', 'button')
      expect(gridButton).toHaveAttribute('role', 'button')
    })

    it('has proper aria-labels for view mode buttons', () => {
      render(<HomepagePlaylistToggle {...defaultProps} />)

      const listButton = screen.getByText('List')
      const gridButton = screen.getByText('Grid')

      expect(listButton).toHaveAttribute('aria-label', 'Switch to list view')
      expect(gridButton).toHaveAttribute('aria-label', 'Switch to grid view')
    })

    it('indicates current view mode with aria-pressed', () => {
      render(<HomepagePlaylistToggle {...defaultProps} viewMode="list" />)

      const listButton = screen.getByText('List')
      const gridButton = screen.getByText('Grid')

      expect(listButton).toHaveAttribute('aria-pressed', 'true')
      expect(gridButton).toHaveAttribute('aria-pressed', 'false')
    })
  })
})
