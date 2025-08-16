import React from 'react'
import { render, screen } from '@testing-library/react'
import BlogIndex from './index'
import { useStaticQuery } from 'gatsby'

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
  useStaticQuery: jest.fn(),
}))

// Mock the components
jest.mock('../components/bio/bio', () => () => (
  <div data-testid="bio">Bio Component</div>
))
jest.mock(
  '../components/layout/layout',
  () =>
    ({
      children,
      ...props
    }: {
      children: React.ReactNode
      [key: string]: any
    }) => (
      <div data-testid="layout" {...props}>
        {children}
      </div>
    )
)
jest.mock('../components/seo/seo', () => ({ title }: { title: string }) => (
  <div data-testid="seo" data-title={title}>
    SEO Component
  </div>
))

// Mock the calendar component
jest.mock('../components/calendar/calendar', () => () => (
  <div data-testid="calendar">Calendar Component</div>
))

jest.mock('../utils/typography', () => ({
  rhythm: jest.fn().mockImplementation((n: number) => n * 16),
}))

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

describe('BlogIndex', () => {
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

  test('renders the layout with correct title', () => {
    render(<BlogIndex data={mockData} location={mockLocation} />)
    const layout = screen.getByTestId('layout')
    expect(layout).toBeInTheDocument()
    expect(layout).toHaveAttribute('title', 'Test Site Title')
  })

  test('renders SEO component with correct title', () => {
    render(<BlogIndex data={mockData} location={mockLocation} />)
    const seo = screen.getByTestId('seo')
    expect(seo).toBeInTheDocument()
    expect(seo).toHaveAttribute('data-title', 'All posts')
  })

  test('renders Bio component', () => {
    render(<BlogIndex data={mockData} location={mockLocation} />)
    expect(screen.getByTestId('bio')).toBeInTheDocument()
  })

  test('renders Calendar component', () => {
    render(<BlogIndex data={mockData} location={mockLocation} />)
    expect(screen.getByTestId('calendar')).toBeInTheDocument()
  })

  // Blog posts are implemented and rendered on the page
  // These tests verify the blog post functionality
  test('renders correct number of blog posts', () => {
    render(<BlogIndex data={mockData} location={mockLocation} />)
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(2)
  })

  test('renders post titles with correct links', () => {
    render(<BlogIndex data={mockData} location={mockLocation} />)

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
    render(<BlogIndex data={mockData} location={mockLocation} />)
    expect(screen.getByText('January 1, 2020')).toBeInTheDocument()
    expect(screen.getByText('January 2, 2020')).toBeInTheDocument()
  })

  test('renders post excerpt when available', () => {
    render(<BlogIndex data={mockData} location={mockLocation} />)
    expect(screen.getByText('Test excerpt')).toBeInTheDocument()
  })

  test('renders post excerpt for all posts', () => {
    render(<BlogIndex data={mockData} location={mockLocation} />)
    expect(screen.getByText('Test excerpt')).toBeInTheDocument()
    expect(screen.getByText('Another excerpt')).toBeInTheDocument()
  })
})
