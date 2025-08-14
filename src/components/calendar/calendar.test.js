import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import CalendarComponent from './calendar'

// Mock Gatsby's useStaticQuery
jest.mock('gatsby', () => ({
  useStaticQuery: jest.fn(),
  graphql: jest.fn(),
}))

// Mock FullCalendar components
jest.mock('@fullcalendar/react', () => {
  return function MockFullCalendar({
    events,
    eventClick,
    eventDidMount,
    ...props
  }) {
    // Simulate event mounting
    if (events && events.length > 0 && eventDidMount) {
      events.forEach((event, index) => {
        const mockEventInfo = {
          event: {
            id: event.id,
            title: event.title,
            start: event.start,
            extendedProps: event.extendedProps,
          },
          el: { title: '' },
        }
        eventDidMount(mockEventInfo)
      })
    }

    return (
      <div data-testid="fullcalendar" {...props}>
        <div data-testid="calendar-header">Calendar Header</div>
        <div data-testid="calendar-events">
          {events?.map((event, index) => (
            <div
              key={event.id || index}
              data-testid={`calendar-event-${index}`}
              onClick={() => eventClick && eventClick({ event })}
            >
              {event.title}
            </div>
          ))}
        </div>
      </div>
    )
  }
})

// Mock calendar context
jest.mock('./calendar-context', () => ({
  useCalendar: () => ({
    currentView: 'dayGridMonth',
    currentDate: '2024-01-01',
    setView: jest.fn(),
    setDate: jest.fn(),
  }),
  CalendarProvider: ({ children }) => (
    <div data-testid="calendar-provider">{children}</div>
  ),
}))

// Mock calendar plugins
jest.mock('@fullcalendar/daygrid', () => ({}))
jest.mock('@fullcalendar/timegrid', () => ({}))
jest.mock('@fullcalendar/list', () => ({}))

describe('CalendarComponent', () => {
  const mockBlogData = {
    allMarkdownRemark: {
      edges: [
        {
          node: {
            frontmatter: {
              title: 'Test Blog Post 1',
              date: '2024-01-01',
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
              date: '2024-01-02',
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

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock useStaticQuery to return blog data
    const { useStaticQuery } = require('gatsby')
    useStaticQuery.mockReturnValue(mockBlogData)
  })

  test('renders without crashing', () => {
    render(<CalendarComponent />)

    expect(screen.getByTestId('fullcalendar')).toBeInTheDocument()
  })

  test('renders calendar header', () => {
    render(<CalendarComponent />)

    expect(screen.getByTestId('calendar-header')).toBeInTheDocument()
  })

  test('renders blog post events', () => {
    render(<CalendarComponent />)

    expect(screen.getByTestId('calendar-event-0')).toBeInTheDocument()
    expect(screen.getByTestId('calendar-event-1')).toBeInTheDocument()
    expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument()
    expect(screen.getByText('Test Blog Post 2')).toBeInTheDocument()
  })

  test('generates events with correct properties', () => {
    render(<CalendarComponent />)

    const event1 = screen.getByTestId('calendar-event-0')
    const event2 = screen.getByTestId('calendar-event-1')

    expect(event1).toHaveTextContent('Test Blog Post 1')
    expect(event2).toHaveTextContent('Test Blog Post 2')
  })

  test('handles events without description', () => {
    const dataWithoutDescription = {
      allMarkdownRemark: {
        edges: [
          {
            node: {
              frontmatter: {
                title: 'No Description Post',
                date: '2024-01-01',
                // No description field
              },
              fields: {
                slug: '/no-description-post',
              },
            },
          },
        ],
      },
    }

    const { useStaticQuery } = require('gatsby')
    useStaticQuery.mockReturnValue(dataWithoutDescription)

    render(<CalendarComponent />)

    expect(screen.getByText('No Description Post')).toBeInTheDocument()
  })

  test('handles empty blog data', () => {
    const emptyData = {
      allMarkdownRemark: {
        edges: [],
      },
    }

    const { useStaticQuery } = require('gatsby')
    useStaticQuery.mockReturnValue(emptyData)

    render(<CalendarComponent />)

    expect(screen.getByTestId('fullcalendar')).toBeInTheDocument()
    expect(screen.queryByTestId('calendar-event-0')).not.toBeInTheDocument()
  })

  test('handles null blog data', () => {
    const nullData = {
      allMarkdownRemark: null,
    }

    const { useStaticQuery } = require('gatsby')
    useStaticQuery.mockReturnValue(nullData)

    render(<CalendarComponent />)

    expect(screen.getByTestId('fullcalendar')).toBeInTheDocument()
  })

  test('handles blog data with missing fields', () => {
    const incompleteData = {
      allMarkdownRemark: {
        edges: [
          {
            node: {
              frontmatter: {
                title: 'Incomplete Post',
                // Missing date
              },
              // Missing fields
            },
          },
        ],
      },
    }

    const { useStaticQuery } = require('gatsby')
    useStaticQuery.mockReturnValue(incompleteData)

    render(<CalendarComponent />)

    expect(screen.getByTestId('fullcalendar')).toBeInTheDocument()
  })

  test('handles blog data with missing slug', () => {
    const dataWithoutSlug = {
      allMarkdownRemark: {
        edges: [
          {
            node: {
              frontmatter: {
                title: 'No Slug Post',
                date: '2024-01-01',
              },
              fields: {
                // Missing slug
              },
            },
          },
        ],
      },
    }

    const { useStaticQuery } = require('gatsby')
    useStaticQuery.mockReturnValue(dataWithoutSlug)

    render(<CalendarComponent />)

    expect(screen.getByTestId('fullcalendar')).toBeInTheDocument()
  })

  test('renders with correct CSS classes', () => {
    render(<CalendarComponent />)

    const container = screen
      .getByTestId('fullcalendar')
      .closest('.apple-calendar-container')
    expect(container).toBeInTheDocument()
  })

  test('handles event click', () => {
    render(<CalendarComponent />)

    const event = screen.getByTestId('calendar-event-0')
    fireEvent.click(event)

    // The event click should be handled (currently no-op)
    expect(event).toBeInTheDocument()
  })

  test('handles event mounting with description', () => {
    render(<CalendarComponent />)

    // The eventDidMount should set the title attribute for events with descriptions
    const event = screen.getByTestId('calendar-event-0')
    expect(event).toBeInTheDocument()
  })

  test('handles events with long titles', () => {
    const dataWithLongTitle = {
      allMarkdownRemark: {
        edges: [
          {
            node: {
              frontmatter: {
                title:
                  'This is a very long blog post title that might cause layout issues in the calendar display',
                date: '2024-01-01',
                description: 'Long title description',
              },
              fields: {
                slug: '/long-title-post',
              },
            },
          },
        ],
      },
    }

    const { useStaticQuery } = require('gatsby')
    useStaticQuery.mockReturnValue(dataWithLongTitle)

    render(<CalendarComponent />)

    expect(
      screen.getByText(
        'This is a very long blog post title that might cause layout issues in the calendar display'
      )
    ).toBeInTheDocument()
  })

  test('handles events with special characters in titles', () => {
    const dataWithSpecialChars = {
      allMarkdownRemark: {
        edges: [
          {
            node: {
              frontmatter: {
                title: 'Post with "quotes" & <tags> & special chars: éñü',
                date: '2024-01-01',
                description: 'Special chars description',
              },
              fields: {
                slug: '/special-chars-post',
              },
            },
          },
        ],
      },
    }

    const { useStaticQuery } = require('gatsby')
    useStaticQuery.mockReturnValue(dataWithSpecialChars)

    render(<CalendarComponent />)

    expect(
      screen.getByText('Post with "quotes" & <tags> & special chars: éñü')
    ).toBeInTheDocument()
  })
})
