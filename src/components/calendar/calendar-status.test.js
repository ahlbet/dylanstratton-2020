import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import CalendarStatus from './calendar-status'
import { CalendarProvider } from './calendar-context'
import { UserPreferencesProvider } from './user-preferences-context'

// Mock the useCalendarState hook
jest.mock('./use-calendar-state', () => ({
  useCalendarState: jest.fn(),
}))

const mockUseCalendarState = require('./use-calendar-state').useCalendarState

describe('CalendarStatus', () => {
  const defaultMockState = {
    currentView: 'dayGridMonth',
    getCurrentDateDisplay: jest.fn(() => 'January 2024'),
    getViewDisplayName: jest.fn(() => 'Month'),
    setCurrentDate: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCalendarState.mockReturnValue(defaultMockState)
  })

  test('renders without crashing', () => {
    render(
      <UserPreferencesProvider>
        <CalendarProvider>
          <CalendarStatus />
        </CalendarProvider>
      </UserPreferencesProvider>
    )

    expect(screen.getByText('Calendar Status')).toBeInTheDocument()
  })

  test('displays current date from hook', () => {
    mockUseCalendarState.mockReturnValue({
      ...defaultMockState,
      getCurrentDateDisplay: jest.fn(() => 'March 2024'),
    })

    render(
      <UserPreferencesProvider>
        <CalendarProvider>
          <CalendarStatus />
        </CalendarProvider>
      </UserPreferencesProvider>
    )

    // Check that both parts of the text are present
    expect(screen.getByText('Current Date:')).toBeInTheDocument()
    expect(screen.getByText('March 2024')).toBeInTheDocument()
  })

  test('displays current view from hook', () => {
    mockUseCalendarState.mockReturnValue({
      ...defaultMockState,
      getViewDisplayName: jest.fn(() => 'Week'),
    })

    render(
      <UserPreferencesProvider>
        <CalendarProvider>
          <CalendarStatus />
        </CalendarProvider>
      </UserPreferencesProvider>
    )

    // Check that both parts of the text are present
    expect(screen.getByText('View:')).toBeInTheDocument()
    expect(screen.getByText('Week')).toBeInTheDocument()
  })

  test('calls setCurrentDate when "Go to Today" button is clicked', () => {
    const mockSetCurrentDate = jest.fn()
    mockUseCalendarState.mockReturnValue({
      ...defaultMockState,
      setCurrentDate: mockSetCurrentDate,
    })

    render(
      <UserPreferencesProvider>
        <CalendarProvider>
          <CalendarStatus />
        </CalendarProvider>
      </UserPreferencesProvider>
    )

    const todayButton = screen.getByText('Go to Today')
    fireEvent.click(todayButton)

    expect(mockSetCurrentDate).toHaveBeenCalledTimes(1)
  })

  test('displays correct button text based on calendar visibility', () => {
    render(
      <UserPreferencesProvider>
        <CalendarProvider>
          <CalendarStatus />
        </CalendarProvider>
      </UserPreferencesProvider>
    )

    const todayButton = screen.getByText('Go to Today')
    expect(todayButton).toBeInTheDocument()
  })

  test('applies correct styling to container', () => {
    render(
      <UserPreferencesProvider>
        <CalendarProvider>
          <CalendarStatus />
        </CalendarProvider>
      </UserPreferencesProvider>
    )

    const container = screen.getByText('Calendar Status').closest('div')
    expect(container).toHaveStyle({
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '1rem',
      margin: '1rem 0',
      color: '#ffffff',
    })
  })

  test('applies correct styling to title', () => {
    render(
      <UserPreferencesProvider>
        <CalendarProvider>
          <CalendarStatus />
        </CalendarProvider>
      </UserPreferencesProvider>
    )

    const title = screen.getByText('Calendar Status')
    expect(title).toHaveStyle({
      margin: '0 0 0.5rem 0',
      fontSize: '1rem',
      fontWeight: '500',
      color: '#999',
    })
  })

  test('applies correct styling to button', () => {
    render(
      <UserPreferencesProvider>
        <CalendarProvider>
          <CalendarStatus />
        </CalendarProvider>
      </UserPreferencesProvider>
    )

    const button = screen.getByText('Go to Today')
    expect(button).toHaveStyle({
      background: '#333',
      border: '1px solid #555',
      borderRadius: '4px',
      padding: '0.25rem 0.5rem',
      color: '#ffffff',
      fontSize: '0.75rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    })
  })

  test('displays state persistence message', () => {
    render(
      <UserPreferencesProvider>
        <CalendarProvider>
          <CalendarStatus />
        </CalendarProvider>
      </UserPreferencesProvider>
    )

    expect(
      screen.getByText('State persists across navigation')
    ).toBeInTheDocument()
  })

  test('handles different view types correctly', () => {
    const viewTypes = [
      { view: 'dayGridMonth', display: 'Month' },
      { view: 'timeGridWeek', display: 'Week' },
      { view: 'listWeek', display: 'List' },
    ]

    viewTypes.forEach(({ view, display }) => {
      mockUseCalendarState.mockReturnValue({
        ...defaultMockState,
        currentView: view,
        getViewDisplayName: jest.fn(() => display),
      })

      const { unmount } = render(
        <UserPreferencesProvider>
          <CalendarProvider>
            <CalendarStatus />
          </CalendarProvider>
        </UserPreferencesProvider>
      )

      // Check that both parts of the text are present
      expect(screen.getByText('View:')).toBeInTheDocument()
      expect(screen.getByText(display)).toBeInTheDocument()
      unmount()
    })
  })

  test('handles different date formats correctly', () => {
    const dateFormats = [
      { date: '2024-01-15', display: 'January 2024' },
      { date: '2024-06-20', display: 'June 2024' },
      { date: '2024-12-31', display: 'December 2024' },
    ]

    dateFormats.forEach(({ date, display }) => {
      mockUseCalendarState.mockReturnValue({
        ...defaultMockState,
        currentDate: date,
        getCurrentDateDisplay: jest.fn(() => display),
      })

      const { unmount } = render(
        <UserPreferencesProvider>
          <CalendarProvider>
            <CalendarStatus />
          </CalendarProvider>
        </UserPreferencesProvider>
      )

      // Check that both parts of the text are present
      expect(screen.getByText('Current Date:')).toBeInTheDocument()
      expect(screen.getByText(display)).toBeInTheDocument()
      unmount()
    })
  })

  test('maintains accessibility with proper button attributes', () => {
    render(
      <UserPreferencesProvider>
        <CalendarProvider>
          <CalendarStatus />
        </CalendarProvider>
      </UserPreferencesProvider>
    )

    const button = screen.getByText('Go to Today')
    expect(button).toBeInTheDocument()
    expect(button.tagName).toBe('BUTTON')
  })

  test('renders with different calendar states', () => {
    const calendarStates = [
      {
        currentView: 'dayGridMonth',
        currentDate: '2024-01-15',
        getCurrentDateDisplay: () => 'January 2024',
        getViewDisplayName: () => 'Month',
      },
      {
        currentView: 'timeGridWeek',
        currentDate: '2024-06-20',
        getCurrentDateDisplay: () => 'June 2024',
        getViewDisplayName: () => 'Week',
      },
    ]

    calendarStates.forEach((state) => {
      mockUseCalendarState.mockReturnValue({
        ...defaultMockState,
        ...state,
      })

      const { unmount } = render(
        <UserPreferencesProvider>
          <CalendarProvider>
            <CalendarStatus />
          </CalendarProvider>
        </UserPreferencesProvider>
      )

      // Check that both parts of the text are present
      expect(screen.getByText('Current Date:')).toBeInTheDocument()
      expect(
        screen.getByText(state.getCurrentDateDisplay())
      ).toBeInTheDocument()
      expect(screen.getByText('View:')).toBeInTheDocument()
      expect(screen.getByText(state.getViewDisplayName())).toBeInTheDocument()
      unmount()
    })
  })
})
