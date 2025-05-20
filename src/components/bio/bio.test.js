import React from 'react'
import { render } from '@testing-library/react'
import Bio from './bio'

// Mock the Gatsby's graphql useStaticQuery hook
jest.mock('gatsby', () => ({
  graphql: jest.fn(),
  useStaticQuery: jest.fn().mockReturnValue({
    avatar: {
      childImageSharp: {
        fixed: {
          base64: 'test-base64',
          width: 50,
          height: 50,
          src: 'test-src',
          srcSet: 'test-srcSet',
        },
      },
    },
    site: {
      siteMetadata: {
        author: 'Test Author',
      },
    },
  }),
}))

// Mock the gatsby-plugin-image component
jest.mock('gatsby-plugin-image', () => ({
  GatsbyImage: (props) => (
    <img
      data-testid="gatsby-image"
      alt={props.alt}
      style={props.style}
      {...props}
    />
  ),
  getImage: jest.fn(() => ({
    images: { sources: [] },
    layout: 'fixed',
    width: 50,
    height: 50,
  })),
}))

// Mock the typography utility
jest.mock('../../utils/typography', () => ({
  rhythm: jest.fn().mockImplementation((value) => `${value}rem`),
}))

describe('Bio component', () => {
  it('renders correctly', () => {
    const { container } = render(<Bio />)
    expect(container).toBeTruthy()
  })

  it('contains an image with the author as alt text', () => {
    const { getByTestId } = render(<Bio />)
    const image = getByTestId('gatsby-image')
    expect(image).toHaveAttribute('alt', 'Test Author')
  })

  it('has the correct styling', () => {
    const { container } = render(<Bio />)
    const bioDiv = container.firstChild

    // Check that the Bio div has the expected styling
    expect(bioDiv).toHaveStyle({
      display: 'flex',
      marginBottom: '2.5rem',
    })
  })

  it('renders the image with correct style properties', () => {
    const { getByTestId } = render(<Bio />)
    const image = getByTestId('gatsby-image')

    expect(image).toHaveStyle({
      marginRight: '0.5rem',
      marginBottom: '0px',
      width: '50px',
      height: '50px',
      borderRadius: '100%',
    })
  })
})
