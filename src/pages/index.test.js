import React from 'react'
import { render, screen } from '@testing-library/react'
import BlogIndex from './index'
import { useStaticQuery } from 'gatsby'

// Mock the gatsby dependencies
jest.mock('gatsby', () => ({
  Link: jest.fn().mockImplementation(({ to, children, ...rest }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  )),
  graphql: jest.fn(),
  useStaticQuery: jest.fn(),
}))

// Mock the components
jest.mock('../components/bio/bio', () => () => (
  <div data-testid="bio">Bio Component</div>
))
jest.mock('../components/layout/layout', () => ({ children, ...props }) => (
  <div data-testid="layout" {...props}>
    {children}
  </div>
))
jest.mock('../components/seo/seo', () => ({ title }) => (
  <div data-testid="seo" data-title={title}>
    SEO Component
  </div>
))

// Mock the calendar component
jest.mock('../components/calendar/calendar', () => () => (
  <div data-testid="calendar">Calendar Component</div>
))

jest.mock('../utils/typography', () => ({
  rhythm: jest.fn().mockImplementation((n) => n * 16),
}))

describe('BlogIndex', () => {
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
              description: 'Test post description',
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
              description: '',
            },
          },
        },
      ],
    },
  }

  const mockLocation = {
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

  // Note: Blog posts are currently commented out in the actual page
  // These tests are kept for when the posts are uncommented
  test.skip('renders correct number of blog posts', () => {
    render(<BlogIndex data={mockData} location={mockLocation} />)
    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(2)
  })

  test.skip('renders post titles with correct links', () => {
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

  test.skip('displays post dates', () => {
    render(<BlogIndex data={mockData} location={mockLocation} />)
    expect(screen.getByText('January 1, 2020')).toBeInTheDocument()
    expect(screen.getByText('January 2, 2020')).toBeInTheDocument()
  })

  test.skip('renders post description when available', () => {
    render(<BlogIndex data={mockData} location={mockLocation} />)
    expect(screen.getByText('Test post description')).toBeInTheDocument()
  })

  test.skip('falls back to excerpt when description is not available', () => {
    render(<BlogIndex data={mockData} location={mockLocation} />)
    expect(screen.getByText('Another excerpt')).toBeInTheDocument()
  })
})
