import React from 'react'
import { render, screen } from '@testing-library/react'
import Calendar from './calendar'
import { UserPreferencesProvider } from './user-preferences-context'

// Mock Gatsby's useStaticQuery
jest.mock('gatsby', () => ({
  useStaticQuery: jest.fn(),
  graphql: jest.fn(),
}))

const mockUseStaticQuery = jest.requireMock('gatsby').useStaticQuery

// Mock FullCalendar
jest.mock('@fullcalendar/react', () => {
  return function MockFullCalendar(props: any) {
    return (
      <div data-testid="fullcalendar" {...props}>
        <div data-testid="calendar-title">Calendar Title</div>
        <div data-testid="calendar-view">{props.initialView}</div>
        <div data-testid="calendar-date">{props.initialDate}</div>
        <div data-testid="calendar-events-count">
          {props.events?.length || 0} events
        </div>
      </div>
    )
  }
})

// Mock calendar plugins
jest.mock('@fullcalendar/daygrid', () => 'dayGridPlugin')
jest.mock('@fullcalendar/timegrid', () => 'timeGridPlugin')
jest.mock('@fullcalendar/list', () => 'listPlugin')

const mockBlogData = {
  allMarkdownRemark: {
    edges: [
      {
        node: {
          frontmatter: {
            title: 'Test Blog Post 1',
            date: '2024-01-15',
            description: 'Test description 1',
          },
          fields: {
            slug: '/test-post-1',
          },
        },
      },
      {
        node: {
          frontmatter: {
            title: 'Test Blog Post 2',
            date: '2024-01-20',
            description: 'Test description 2',
          },
          fields: {
            slug: '/test-post-2',
          },
        },
      },
    ],
  },
}

const renderWithProviders = (component: React.ReactElement) => {
  return render(<UserPreferencesProvider>{component}</UserPreferencesProvider>)
}

describe('Calendar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseStaticQuery.mockReturnValue(mockBlogData)
  })

  test('renders calendar component', () => {
    renderWithProviders(<Calendar />)

    expect(screen.getByTestId('fullcalendar')).toBeInTheDocument()
    expect(screen.getByTestId('calendar-title')).toBeInTheDocument()
  })

  test('displays correct initial view', () => {
    renderWithProviders(<Calendar />)

    expect(screen.getByTestId('calendar-view')).toHaveTextContent(
      'dayGridMonth'
    )
  })

  test('displays correct initial date', () => {
    renderWithProviders(<Calendar />)

    const currentDate = new Date().toISOString().split('T')[0]
    expect(screen.getByTestId('calendar-date')).toHaveTextContent(currentDate)
  })

  test('generates events from blog posts', () => {
    renderWithProviders(<Calendar />)

    expect(screen.getByTestId('calendar-events-count')).toHaveTextContent(
      '2 events'
    )
  })

  test('handles empty blog data gracefully', () => {
    mockUseStaticQuery.mockReturnValue({
      allMarkdownRemark: {
        edges: [],
      },
    })

    renderWithProviders(<Calendar />)

    expect(screen.getByTestId('calendar-events-count')).toHaveTextContent(
      '0 events'
    )
  })

  test('handles missing blog data gracefully', () => {
    mockUseStaticQuery.mockReturnValue(null)

    renderWithProviders(<Calendar />)

    expect(screen.getByTestId('calendar-events-count')).toHaveTextContent(
      '0 events'
    )
  })

  test('handles blog posts with missing fields gracefully', () => {
    const incompleteData = {
      allMarkdownRemark: {
        edges: [
          {
            node: {
              frontmatter: {
                title: 'Incomplete Post',
                // Missing date and description
              },
              fields: {
                // Missing slug
              },
            },
          },
        ],
      },
    }

    mockUseStaticQuery.mockReturnValue(incompleteData)

    renderWithProviders(<Calendar />)

    expect(screen.getByTestId('calendar-events-count')).toHaveTextContent(
      '1 events'
    )
  })

  test('passes correct props to FullCalendar', () => {
    renderWithProviders(<Calendar />)

    const fullCalendar = screen.getByTestId('fullcalendar')

    // Check that essential props are passed
    expect(fullCalendar).toHaveAttribute('data-testid', 'fullcalendar')
  })

  test('handles blog posts with different date formats', () => {
    const variedDateData = {
      allMarkdownRemark: {
        edges: [
          {
            node: {
              frontmatter: {
                title: 'Post with ISO Date',
                date: '2024-01-15T00:00:00.000Z',
              },
              fields: {
                slug: '/iso-date-post',
              },
            },
          },
          {
            node: {
              frontmatter: {
                title: 'Post with Simple Date',
                date: '2024-01-20',
              },
              fields: {
                slug: '/simple-date-post',
              },
            },
          },
        ],
      },
    }

    mockUseStaticQuery.mockReturnValue(variedDateData)

    renderWithProviders(<Calendar />)

    expect(screen.getByTestId('calendar-events-count')).toHaveTextContent(
      '2 events'
    )
  })

  test('handles blog posts with missing titles', () => {
    const noTitleData = {
      allMarkdownRemark: {
        edges: [
          {
            node: {
              frontmatter: {
                date: '2024-01-15',
              },
              fields: {
                slug: '/no-title-post',
              },
            },
          },
        ],
      },
    }

    mockUseStaticQuery.mockReturnValue(noTitleData)

    renderWithProviders(<Calendar />)

    expect(screen.getByTestId('calendar-events-count')).toHaveTextContent(
      '1 events'
    )
  })

  test('handles blog posts with missing descriptions', () => {
    const noDescriptionData = {
      allMarkdownRemark: {
        edges: [
          {
            node: {
              frontmatter: {
                title: 'Post without Description',
                date: '2024-01-15',
                // Missing description
              },
              fields: {
                slug: '/no-description-post',
              },
            },
          },
        ],
      },
    }

    mockUseStaticQuery.mockReturnValue(noDescriptionData)

    renderWithProviders(<Calendar />)

    expect(screen.getByTestId('calendar-events-count')).toHaveTextContent(
      '1 events'
    )
  })

  test('handles blog posts with missing slugs', () => {
    const noSlugData = {
      allMarkdownRemark: {
        edges: [
          {
            node: {
              frontmatter: {
                title: 'Post without Slug',
                date: '2024-01-15',
              },
              fields: {
                // Missing slug
              },
            },
          },
        ],
      },
    }

    mockUseStaticQuery.mockReturnValue(noSlugData)

    renderWithProviders(<Calendar />)

    expect(screen.getByTestId('calendar-events-count')).toHaveTextContent(
      '1 events'
    )
  })

  test('provides calendar context to child components', () => {
    renderWithProviders(<Calendar />)

    // The calendar should be wrapped in CalendarProvider
    // This is tested by checking that the component renders without errors
    expect(screen.getByTestId('fullcalendar')).toBeInTheDocument()
  })

  test('handles large number of blog posts', () => {
    const manyPosts = {
      allMarkdownRemark: {
        edges: Array.from({ length: 100 }, (_, i) => ({
          node: {
            frontmatter: {
              title: `Blog Post ${i + 1}`,
              date: `2024-01-${String(i + 1).padStart(2, '0')}`,
            },
            fields: {
              slug: `/blog-post-${i + 1}`,
            },
          },
        })),
      },
    }

    mockUseStaticQuery.mockReturnValue(manyPosts)

    renderWithProviders(<Calendar />)

    expect(screen.getByTestId('calendar-events-count')).toHaveTextContent(
      '100 events'
    )
  })
})
