import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeToggler } from 'gatsby-plugin-dark-mode'
import Layout from './layout'

// Mock the Link component from gatsby
jest.mock('gatsby', () => ({
  Link: jest.fn(({ to, style, children }) => (
    <a href={to} style={style} data-testid="gatsby-link">
      {children}
    </a>
  )),
}))

// Mock the ThemeToggler component
jest.mock('gatsby-plugin-dark-mode', () => ({
  ThemeToggler: jest.fn(({ children }) =>
    children({ theme: 'light', toggleTheme: jest.fn() })
  ),
}))

// Mock the global variable
global.__PATH_PREFIX__ = ''

describe('Layout component', () => {
  const mockTitle = 'Test Title'
  const mockChildren = <div data-testid="mock-children">Test Children</div>

  test('renders h1 header on homepage', () => {
    render(
      <Layout
        location={{ pathname: '/' }}
        title={mockTitle}
        children={mockChildren}
      />
    )

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(screen.getByText(mockTitle)).toBeInTheDocument()
  })

  test('renders h3 header on subpages', () => {
    render(
      <Layout
        location={{ pathname: '/blog/test-post' }}
        title={mockTitle}
        children={mockChildren}
      />
    )

    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toBeInTheDocument()
    expect(screen.getByText(mockTitle)).toBeInTheDocument()
  })

  test('renders children content', () => {
    render(
      <Layout
        location={{ pathname: '/' }}
        title={mockTitle}
        children={mockChildren}
      />
    )

    expect(screen.getByTestId('mock-children')).toBeInTheDocument()
  })

  test('renders footer with current year', () => {
    render(
      <Layout
        location={{ pathname: '/' }}
        title={mockTitle}
        children={mockChildren}
      />
    )

    const currentYear = new Date().getFullYear().toString()
    expect(screen.getByText(currentYear)).toBeInTheDocument()
  })

  test('links back to homepage', () => {
    render(
      <Layout
        location={{ pathname: '/blog/test-post' }}
        title={mockTitle}
        children={mockChildren}
      />
    )

    const link = screen.getByTestId('gatsby-link')
    expect(link).toHaveAttribute('href', '/')
  })
})
