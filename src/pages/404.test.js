import React from 'react'
import { render, screen } from '@testing-library/react'
import NotFoundPage from './404'
import { useStaticQuery } from 'gatsby'

// Mock the gatsby graphql query
beforeEach(() => {
  useStaticQuery.mockImplementation(() => ({
    site: {
      siteMetadata: {
        title: 'Test Site Title',
      },
    },
  }))
})

// Mock the Layout component
jest.mock('../components/layout/layout', () => {
  return ({ children }) => <div data-testid="layout">{children}</div>
})

// Mock the SEO component
jest.mock('../components/seo/seo', () => {
  return ({ title }) => <div data-testid="seo">{title}</div>
})

describe('NotFoundPage', () => {
  const mockData = {
    site: {
      siteMetadata: {
        title: 'Test Site Title',
      },
    },
  }

  const mockLocation = {
    pathname: '/404',
  }

  test('renders 404 page correctly', () => {
    render(<NotFoundPage data={mockData} location={mockLocation} />)

    // Check for heading
    expect(
      screen.getByRole('heading', { name: /not found/i })
    ).toBeInTheDocument()

    // Check for error message
    expect(
      screen.getByText(/you just hit a route that doesn't exist/i)
    ).toBeInTheDocument()
  })

  test('passes correct title to SEO component', () => {
    render(<NotFoundPage data={mockData} location={mockLocation} />)
    const seoElement = screen.getByTestId('seo')
    expect(seoElement).toHaveTextContent('404: Not Found')
  })

  test('passes correct props to Layout component', () => {
    render(<NotFoundPage data={mockData} location={mockLocation} />)
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})
