import React from 'react'
import { render, screen } from '@testing-library/react'
import Bio from './bio'

// Mock Gatsby components and hooks
jest.mock('gatsby', () => ({
  useStaticQuery: jest.fn(),
  graphql: jest.fn(),
}))

jest.mock('gatsby-plugin-image', () => ({
  GatsbyImage: ({ image, alt, style, children }) => (
    <img
      data-testid="gatsby-image"
      alt={alt}
      style={style}
      src={image?.src || 'mock-src'}
    >
      {children}
    </img>
  ),
  getImage: jest.fn(),
}))

describe('Bio', () => {
  const mockUseStaticQuery = require('gatsby').useStaticQuery
  const mockGetImage = require('gatsby-plugin-image').getImage

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders bio with avatar and author', () => {
    const mockData = {
      avatar: {
        childImageSharp: {
          gatsbyImageData: {
            width: 50,
            height: 50,
            layout: 'FIXED',
            src: 'mock-avatar-src',
          },
        },
      },
      site: {
        siteMetadata: {
          author: 'Test Author',
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue({
      src: 'mock-avatar-src',
      width: 50,
      height: 50,
    })

    render(<Bio />)

    const avatar = screen.getByTestId('gatsby-image')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('alt', 'Test Author')
  })

  test('renders bio with custom author name', () => {
    const mockData = {
      avatar: {
        childImageSharp: {
          gatsbyImageData: {
            width: 50,
            height: 50,
            layout: 'FIXED',
            src: 'mock-avatar-src',
          },
        },
      },
      site: {
        siteMetadata: {
          author: 'John Doe',
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue({
      src: 'mock-avatar-src',
      width: 50,
      height: 50,
    })

    render(<Bio />)

    const avatar = screen.getByTestId('gatsby-image')
    expect(avatar).toHaveAttribute('alt', 'John Doe')
  })

  test('renders bio with different avatar dimensions', () => {
    const mockData = {
      avatar: {
        childImageSharp: {
          gatsbyImageData: {
            width: 100,
            height: 100,
            layout: 'FIXED',
            src: 'mock-avatar-src',
          },
        },
      },
      site: {
        siteMetadata: {
          author: 'Test Author',
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue({
      src: 'mock-avatar-src',
      width: 100,
      height: 100,
    })

    render(<Bio />)

    const avatar = screen.getByTestId('gatsby-image')
    expect(avatar).toBeInTheDocument()
  })

  test('renders bio with different layout types', () => {
    const mockData = {
      avatar: {
        childImageSharp: {
          gatsbyImageData: {
            width: 50,
            height: 50,
            layout: 'CONSTRAINED',
            src: 'mock-avatar-src',
          },
        },
      },
      site: {
        siteMetadata: {
          author: 'Test Author',
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue({
      src: 'mock-avatar-src',
      width: 50,
      height: 50,
    })

    render(<Bio />)

    const avatar = screen.getByTestId('gatsby-image')
    expect(avatar).toBeInTheDocument()
  })

  test('renders bio with long author name', () => {
    const longAuthorName =
      'This is a very long author name that might cause layout issues'
    const mockData = {
      avatar: {
        childImageSharp: {
          gatsbyImageData: {
            width: 50,
            height: 50,
            layout: 'FIXED',
            src: 'mock-avatar-src',
          },
        },
      },
      site: {
        siteMetadata: {
          author: longAuthorName,
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue({
      src: 'mock-avatar-src',
      width: 50,
      height: 50,
    })

    render(<Bio />)

    const avatar = screen.getByTestId('gatsby-image')
    expect(avatar).toHaveAttribute('alt', longAuthorName)
  })

  test('renders bio with special characters in author name', () => {
    const specialAuthorName = "José María O'Connor-Smith"
    const mockData = {
      avatar: {
        childImageSharp: {
          gatsbyImageData: {
            width: 50,
            height: 50,
            layout: 'FIXED',
            src: 'mock-avatar-src',
          },
        },
      },
      site: {
        siteMetadata: {
          author: specialAuthorName,
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue({
      src: 'mock-avatar-src',
      width: 50,
      height: 50,
    })

    render(<Bio />)

    const avatar = screen.getByTestId('gatsby-image')
    expect(avatar).toHaveAttribute('alt', specialAuthorName)
  })

  test('renders bio with unicode characters in author name', () => {
    const unicodeAuthorName = 'José María 张伟 田中太郎'
    const mockData = {
      avatar: {
        childImageSharp: {
          gatsbyImageData: {
            width: 50,
            height: 50,
            layout: 'FIXED',
            src: 'mock-avatar-src',
          },
        },
      },
      site: {
        siteMetadata: {
          author: unicodeAuthorName,
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue({
      src: 'mock-avatar-src',
      width: 50,
      height: 50,
    })

    render(<Bio />)

    const avatar = screen.getByTestId('gatsby-image')
    expect(avatar).toHaveAttribute('alt', unicodeAuthorName)
  })

  test('renders bio with empty author name', () => {
    const mockData = {
      avatar: {
        childImageSharp: {
          gatsbyImageData: {
            width: 50,
            height: 50,
            layout: 'FIXED',
            src: 'mock-avatar-src',
          },
        },
      },
      site: {
        siteMetadata: {
          author: '',
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue({
      src: 'mock-avatar-src',
      width: 50,
      height: 50,
    })

    render(<Bio />)

    const avatar = screen.getByTestId('gatsby-image')
    expect(avatar).toHaveAttribute('alt', '')
  })

  test('renders bio with null author name', () => {
    const mockData = {
      avatar: {
        childImageSharp: {
          gatsbyImageData: {
            width: 50,
            height: 50,
            layout: 'FIXED',
            src: 'mock-avatar-src',
          },
        },
      },
      site: {
        siteMetadata: {
          author: null,
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue({
      src: 'mock-avatar-src',
      width: 50,
      height: 50,
    })

    render(<Bio />)

    const avatar = screen.getByTestId('gatsby-image')
    // When author is null, React doesn't set the alt attribute
    expect(avatar.getAttribute('alt')).toBeNull()
  })

  test('renders bio with undefined author name', () => {
    const mockData = {
      avatar: {
        childImageSharp: {
          gatsbyImageData: {
            width: 50,
            height: 50,
            layout: 'FIXED',
            src: 'mock-avatar-src',
          },
        },
      },
      site: {
        siteMetadata: {
          author: undefined,
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue({
      src: 'mock-avatar-src',
      width: 50,
      height: 50,
    })

    render(<Bio />)

    const avatar = screen.getByTestId('gatsby-image')
    // When author is undefined, React doesn't set the alt attribute
    expect(avatar.getAttribute('alt')).toBeNull()
  })

  test('renders bio with missing site metadata', () => {
    const mockData = {
      avatar: {
        childImageSharp: {
          gatsbyImageData: {
            width: 50,
            height: 50,
            layout: 'FIXED',
            src: 'mock-avatar-src',
          },
        },
      },
      site: {
        siteMetadata: {},
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue({
      src: 'mock-avatar-src',
      width: 50,
      height: 50,
    })

    render(<Bio />)

    const avatar = screen.getByTestId('gatsby-image')
    // When author is undefined, React doesn't set the alt attribute
    expect(avatar.getAttribute('alt')).toBeNull()
  })

  test('renders bio with missing site', () => {
    const mockData = {
      avatar: {
        childImageSharp: {
          gatsbyImageData: {
            width: 50,
            height: 50,
            layout: 'FIXED',
            src: 'mock-avatar-src',
          },
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue({
      src: 'mock-avatar-src',
      width: 50,
      height: 50,
    })

    // This should throw an error since site is missing
    expect(() => render(<Bio />)).toThrow(
      "Cannot read properties of undefined (reading 'siteMetadata')"
    )
  })

  test('renders bio with different avatar file paths', () => {
    const mockData = {
      avatar: {
        childImageSharp: {
          gatsbyImageData: {
            width: 50,
            height: 50,
            layout: 'FIXED',
            src: '/custom/path/to/profile-pic.jpg',
          },
        },
      },
      site: {
        siteMetadata: {
          author: 'Test Author',
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue({
      src: '/custom/path/to/profile-pic.jpg',
      width: 50,
      height: 50,
    })

    render(<Bio />)

    const avatar = screen.getByTestId('gatsby-image')
    expect(avatar).toBeInTheDocument()
  })

  test('renders bio with missing avatar', () => {
    const mockData = {
      site: {
        siteMetadata: {
          author: 'Test Author',
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue(null)

    const { container } = render(<Bio />)

    // Should return null when no avatar
    expect(container.firstChild).toBeNull()
  })

  test('renders bio with null avatar', () => {
    const mockData = {
      avatar: null,
      site: {
        siteMetadata: {
          author: 'Test Author',
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue(null)

    const { container } = render(<Bio />)

    // Should return null when no avatar
    expect(container.firstChild).toBeNull()
  })

  test('renders bio with undefined avatar', () => {
    const mockData = {
      avatar: undefined,
      site: {
        siteMetadata: {
          author: 'Test Author',
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue(null)

    const { container } = render(<Bio />)

    // Should return null when no avatar
    expect(container.firstChild).toBeNull()
  })

  test('renders bio with missing childImageSharp', () => {
    const mockData = {
      avatar: {},
      site: {
        siteMetadata: {
          author: 'Test Author',
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue(null)

    const { container } = render(<Bio />)

    // Should return null when no childImageSharp
    expect(container.firstChild).toBeNull()
  })

  test('renders bio with missing gatsbyImageData', () => {
    const mockData = {
      avatar: {
        childImageSharp: {},
      },
      site: {
        siteMetadata: {
          author: 'Test Author',
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue(null)

    const { container } = render(<Bio />)

    // Should return null when no gatsbyImageData
    expect(container.firstChild).toBeNull()
  })

  test('renders bio with complete data structure', () => {
    const mockData = {
      avatar: {
        childImageSharp: {
          gatsbyImageData: {
            width: 50,
            height: 50,
            layout: 'FIXED',
            src: 'mock-avatar-src',
            placeholder: 'mock-placeholder',
            aspectRatio: 1,
            sizes: '50px',
            formats: ['webp', 'jpg'],
          },
        },
      },
      site: {
        siteMetadata: {
          author: 'Test Author',
          title: 'Test Site',
          description: 'Test Description',
        },
      },
    }

    mockUseStaticQuery.mockReturnValue(mockData)
    mockGetImage.mockReturnValue({
      src: 'mock-avatar-src',
      width: 50,
      height: 50,
      placeholder: 'mock-placeholder',
      aspectRatio: 1,
      sizes: '50px',
      formats: ['webp', 'jpg'],
    })

    render(<Bio />)

    const avatar = screen.getByTestId('gatsby-image')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('alt', 'Test Author')
  })
})
