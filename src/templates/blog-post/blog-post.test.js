import React from 'react'
import { render, screen } from '@testing-library/react'
import BlogPostTemplate from './blog-post'
import { useStaticQuery } from 'gatsby'

// Mock the gatsby dependencies
jest.mock('gatsby', () => ({
  Link: jest
    .fn()
    .mockImplementation(({ children, to }) => <a href={to}>{children}</a>),
  graphql: jest.fn(),
  useStaticQuery: jest.fn(),
}))

// Mock the components
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

// Mock the calendar components
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

// Mock the typography utils
jest.mock('../../utils/typography', () => ({
  rhythm: jest.fn((n) => n * 10),
  scale: jest.fn(() => ({ fontSize: '0.8rem' })),
}))

// Mock CSS imports
jest.mock('../../utils/audio-player.css', () => ({}), { virtual: true })

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

    expect(screen.getByText('← Previous Post')).toBeInTheDocument()
    expect(screen.getByText('Next Post →')).toBeInTheDocument()
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
    expect(screen.getByText('Next Post →')).toBeInTheDocument()
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

    expect(screen.getByText('← Previous Post')).toBeInTheDocument()
    expect(screen.queryByText(/Next Post →/)).not.toBeInTheDocument()
  })

  test('renders calendar toggle button', () => {
    render(
      <BlogPostTemplate
        data={mockData}
        pageContext={mockPageContext}
        location={mockLocation}
      />
    )

    expect(screen.getByTestId('calendar-toggle')).toBeInTheDocument()
  })
})
