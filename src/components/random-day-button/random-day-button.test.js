import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import RandomDayButton from './random-day-button'

// Mock Gatsby components and hooks
jest.mock('gatsby', () => ({
  Link: jest
    .fn()
    .mockImplementation(
      ({ children, to, style, onMouseEnter, onMouseLeave, className }) => (
        <a
          href={to}
          style={style}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={className}
        >
          {children}
        </a>
      )
    ),
  useStaticQuery: jest.fn(),
  graphql: jest.fn(),
}))

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Shuffle: jest
    .fn()
    .mockImplementation(() => (
      <div data-testid="shuffle-icon">Shuffle Icon</div>
    )),
}))

describe('RandomDayButton', () => {
  const mockPosts = [
    {
      node: {
        fields: {
          slug: '/blog/25may05',
        },
        frontmatter: {
          title: 'May 5, 2025',
        },
      },
    },
    {
      node: {
        fields: {
          slug: '/blog/24jun19',
        },
        frontmatter: {
          title: 'June 19, 2024',
        },
      },
    },
    {
      node: {
        fields: {
          slug: '/blog/25jul01',
        },
        frontmatter: {
          title: 'July 1, 2025',
        },
      },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock useStaticQuery to return our test data
    const { useStaticQuery } = require('gatsby')
    useStaticQuery.mockReturnValue({
      allMarkdownRemark: {
        edges: mockPosts,
      },
    })
  })

  test('renders random day button with correct styling', () => {
    render(<RandomDayButton />)

    const button = screen.getByRole('link')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('random-day-button')

    // Check that it has the correct styling
    expect(button).toHaveStyle({
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#DE3163',
      color: 'white',
      borderRadius: '6px',
      zIndex: 1000,
    })
  })

  test('renders shuffle icon', () => {
    render(<RandomDayButton />)

    const shuffleIcon = screen.getByTestId('shuffle-icon')
    expect(shuffleIcon).toBeInTheDocument()
    expect(shuffleIcon.textContent).toBe('Shuffle Icon')
  })

  test('links to a random post from the available posts', () => {
    render(<RandomDayButton />)

    const button = screen.getByRole('link')
    const href = button.getAttribute('href')

    // The href should be one of the mock post slugs
    const validSlugs = mockPosts.map((post) => post.node.fields.slug)
    expect(validSlugs).toContain(href)
  })

  test('has correct hover effects', () => {
    render(<RandomDayButton />)

    const button = screen.getByRole('link')

    // Test mouse enter effect using fireEvent
    fireEvent.mouseEnter(button)
    expect(button).toHaveStyle({ backgroundColor: '#c02a56' })

    // Test mouse leave effect
    fireEvent.mouseLeave(button)
    expect(button).toHaveStyle({ backgroundColor: '#DE3163' })
  })

  test('handles empty posts gracefully', () => {
    const { useStaticQuery } = require('gatsby')
    useStaticQuery.mockReturnValue({
      allMarkdownRemark: {
        edges: [], // Empty posts array
      },
    })

    // The component should handle empty posts gracefully by not rendering
    const { container } = render(<RandomDayButton />)
    expect(container.firstChild).toBeNull()
  })

  test('has correct accessibility attributes', () => {
    render(<RandomDayButton />)

    const button = screen.getByRole('link')
    expect(button).toBeInTheDocument()

    // Check that it's properly styled as a button-like element
    expect(button).toHaveStyle({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '16px',
    })
  })

  test('maintains consistent styling across renders', () => {
    const { rerender } = render(<RandomDayButton />)

    const button1 = screen.getByRole('link')
    const initialStyles = button1.style

    // Re-render the component
    rerender(<RandomDayButton />)

    const button2 = screen.getByRole('link')
    const newStyles = button2.style

    // Styles should remain consistent
    expect(button2).toHaveStyle({
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#DE3163',
      color: 'white',
      borderRadius: '6px',
      zIndex: 1000,
    })
  })

  test('random post selection works correctly', () => {
    // Mock Math.random to return predictable values for testing
    const originalRandom = Math.random
    Math.random = jest.fn()

    // Test with different random values
    Math.random.mockReturnValue(0.1) // Should select first post
    const { rerender } = render(<RandomDayButton />)
    let button = screen.getByRole('link')
    expect(button.getAttribute('href')).toBe('/blog/25may05')

    Math.random.mockReturnValue(0.5) // Should select second post
    rerender(<RandomDayButton />)
    button = screen.getByRole('link')
    expect(button.getAttribute('href')).toBe('/blog/24jun19')

    Math.random.mockReturnValue(0.9) // Should select third post
    rerender(<RandomDayButton />)
    button = screen.getByRole('link')
    expect(button.getAttribute('href')).toBe('/blog/25jul01')

    // Restore original Math.random
    Math.random = originalRandom
  })

  test('handles single post correctly', () => {
    const { useStaticQuery } = require('gatsby')
    useStaticQuery.mockReturnValue({
      allMarkdownRemark: {
        edges: [mockPosts[0]], // Only one post
      },
    })

    render(<RandomDayButton />)

    const button = screen.getByRole('link')
    expect(button.getAttribute('href')).toBe('/blog/25may05')
  })

  test('handles undefined posts gracefully', () => {
    const { useStaticQuery } = require('gatsby')
    useStaticQuery.mockReturnValue({
      allMarkdownRemark: {
        edges: undefined, // Undefined posts
      },
    })

    // The component should handle undefined posts gracefully by not rendering
    const { container } = render(<RandomDayButton />)
    expect(container.firstChild).toBeNull()
  })

  test('handles missing slug gracefully', () => {
    const { useStaticQuery } = require('gatsby')
    useStaticQuery.mockReturnValue({
      allMarkdownRemark: {
        edges: [
          {
            node: {
              fields: {
                // Missing slug
              },
              frontmatter: {
                title: 'Test Post',
              },
            },
          },
        ],
      },
    })

    // The component should handle missing slug gracefully by not rendering
    const { container } = render(<RandomDayButton />)
    expect(container.firstChild).toBeNull()
  })
})
