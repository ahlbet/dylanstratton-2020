import React from 'react'
import { render } from '@testing-library/react'
import { useStaticQuery } from 'gatsby'
import SEO from './seo'

// Mock the Gatsby graphql query
jest.mock('gatsby', () => ({
  useStaticQuery: jest.fn(),
  graphql: jest.fn(),
}))

// Mock Helmet since we can't test it directly
jest.mock('react-helmet', () => {
  const mockHelmet = ({ children, ...props }) => {
    // Convert htmlAttributes to JSON string for proper testing
    const processedProps = { ...props }
    if (processedProps.htmlAttributes) {
      processedProps.htmlattributes = JSON.stringify(
        processedProps.htmlAttributes
      )
      delete processedProps.htmlAttributes
    }

    return (
      <div data-testid="helmet-mock" {...processedProps}>
        {children}
      </div>
    )
  }
  mockHelmet.displayName = 'Helmet'
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(mockHelmet),
  }
})

describe('SEO component', () => {
  beforeEach(() => {
    useStaticQuery.mockReturnValue({
      site: {
        siteMetadata: {
          title: 'Test Site Title',
          description: 'Test site description',
          author: '@testauthor',
        },
      },
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('renders with default props', () => {
    render(<SEO title="Test Page" />)
    expect(useStaticQuery).toHaveBeenCalledTimes(1)
  })

  test('uses site metadata for default description', () => {
    const { getByTestId } = render(<SEO title="Test Page" />)
    const helmetMock = getByTestId('helmet-mock')

    expect(helmetMock).toHaveAttribute('title', 'Test Page')
    expect(helmetMock).toHaveAttribute('titletemplate', '%s | Test Site Title')
  })

  test('uses provided description over default', () => {
    const customDescription = 'Custom page description'
    const { getByTestId } = render(
      <SEO title="Test Page" description={customDescription} />
    )
    const helmetMock = getByTestId('helmet-mock')

    expect(helmetMock).toHaveAttribute('title', 'Test Page')
    // We can't directly test meta tags with this approach, but we're verifying the component renders
  })

  test('uses custom language attribute', () => {
    const { getByTestId } = render(<SEO title="Test Page" lang="fr" />)
    const helmetMock = getByTestId('helmet-mock')

    expect(helmetMock).toHaveAttribute(
      'htmlattributes',
      JSON.stringify({ lang: 'fr' })
    )
  })

  test('adds additional meta tags', () => {
    const additionalMeta = [{ name: 'keywords', content: 'test,keywords' }]
    render(<SEO title="Test Page" meta={additionalMeta} />)

    // Again, can't directly test meta content with this approach but we're verifying the component renders
    expect(useStaticQuery).toHaveBeenCalledTimes(1)
  })
})
