import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeToggler } from 'gatsby-plugin-dark-mode'
import Layout from './layout'

// Mock the Link component from gatsby
jest.mock('gatsby', () => ({
  Link: jest.fn(({ to, style, children }: any) => (
    <a href={to} style={style} data-testid="gatsby-link">
      {children}
    </a>
  )),
}))

// Mock the ThemeToggler component
jest.mock('gatsby-plugin-dark-mode', () => ({
  ThemeToggler: jest.fn(({ children }: any) =>
    children({ theme: 'light', toggleTheme: jest.fn() })
  ),
}))

// Mock the global variable
declare global {
  var __PATH_PREFIX__: string
}
global.__PATH_PREFIX__ = ''

// TODO: re-enable this test when we have a proper homepage
describe.skip('Layout component', () => {
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

  test('links back to homepage', () => {
    render(
      <Layout
        location={{ pathname: '/blog/test-post' }}
        title={mockTitle}
        children={mockChildren}
      />
    )

    const links = screen.getAllByTestId('gatsby-link')
    const titleLink = links.find((link) => link.getAttribute('href') === '/')
    expect(titleLink).toBeInTheDocument()
    expect(titleLink).toHaveAttribute('href', '/')
  })
})
