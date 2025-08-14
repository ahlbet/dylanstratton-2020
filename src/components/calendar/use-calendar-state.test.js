import React from 'react'
import { render, act } from '@testing-library/react'
import { useCalendarState } from './use-calendar-state'
import { CalendarProvider } from './calendar-context'

// Mock the useCalendar hook
jest.mock('./calendar-context', () => ({
  ...jest.requireActual('./calendar-context'),
  useCalendar: jest.fn(),
}))

const mockUseCalendar = require('./calendar-context').useCalendar

// Test component to use the hook
const TestComponent = () => {
  const calendarState = useCalendarState()
  return (
    <div>
      <div data-testid="current-view">{calendarState.currentView}</div>
      <div data-testid="current-date">{calendarState.currentDate}</div>
      <div data-testid="view-options">
        {calendarState.viewOptions.join(',')}
      </div>
      <div data-testid="is-month-view">
        {calendarState.isMonthView.toString()}
      </div>
      <div data-testid="is-week-view">
        {calendarState.isWeekView.toString()}
      </div>
      <div data-testid="is-list-view">
        {calendarState.isListView.toString()}
      </div>
      <div data-testid="current-date-display">
        {calendarState.getCurrentDateDisplay()}
      </div>
      <div data-testid="view-display-name">
        {calendarState.getViewDisplayName()}
      </div>
      <button
        onClick={() => calendarState.setView('timeGridWeek')}
        data-testid="set-view"
      >
        Set Week View
      </button>
      <button
        onClick={() => calendarState.setDate('2024-01-15')}
        data-testid="set-date"
      >
        Set Date
      </button>
      <button
        onClick={calendarState.setCurrentDate}
        data-testid="set-current-date"
      >
        Set Current Date
      </button>
    </div>
  )
}

describe('useCalendarState', () => {
  const defaultMockCalendar = {
    currentView: 'dayGridMonth',
    currentDate: '2024-01-15',
    viewOptions: ['dayGridMonth', 'timeGridWeek', 'listWeek'],
    setView: jest.fn(),
    setDate: jest.fn(),
    setCurrentDate: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCalendar.mockReturnValue(defaultMockCalendar)
  })

  test('provides calendar state and actions', () => {
    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    expect(getByTestId('current-view')).toHaveTextContent('dayGridMonth')
    expect(getByTestId('current-date')).toHaveTextContent('2024-01-15')
    expect(getByTestId('view-options')).toHaveTextContent(
      'dayGridMonth,timeGridWeek,listWeek'
    )
  })

  test('provides convenience boolean properties for view types', () => {
    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    expect(getByTestId('is-month-view')).toHaveTextContent('true')
    expect(getByTestId('is-week-view')).toHaveTextContent('false')
    expect(getByTestId('is-list-view')).toHaveTextContent('false')
  })

  test('provides convenience boolean properties for week view', () => {
    mockUseCalendar.mockReturnValue({
      ...defaultMockCalendar,
      currentView: 'timeGridWeek',
    })

    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    expect(getByTestId('is-month-view')).toHaveTextContent('false')
    expect(getByTestId('is-week-view')).toHaveTextContent('true')
    expect(getByTestId('is-list-view')).toHaveTextContent('false')
  })

  test('provides convenience boolean properties for list view', () => {
    mockUseCalendar.mockReturnValue({
      ...defaultMockCalendar,
      currentView: 'listWeek',
    })

    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    expect(getByTestId('is-month-view')).toHaveTextContent('false')
    expect(getByTestId('is-week-view')).toHaveTextContent('false')
    expect(getByTestId('is-list-view')).toHaveTextContent('true')
  })

  test('formats current date for display', () => {
    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    const dateDisplay = getByTestId('current-date-display').textContent
    expect(dateDisplay).toMatch(/^[A-Za-z]+ \d{4}$/)
  })

  test('provides view display names', () => {
    const testCases = [
      { view: 'dayGridMonth', expected: 'Month' },
      { view: 'timeGridWeek', expected: 'Week' },
      { view: 'listWeek', expected: 'List' },
    ]

    testCases.forEach(({ view, expected }) => {
      mockUseCalendar.mockReturnValue({
        ...defaultMockCalendar,
        currentView: view,
      })

      const { getByTestId, unmount } = render(
        <CalendarProvider>
          <TestComponent />
        </CalendarProvider>
      )

      expect(getByTestId('view-display-name')).toHaveTextContent(expected)
      unmount()
    })
  })

  test('provides fallback view display name for unknown views', () => {
    mockUseCalendar.mockReturnValue({
      ...defaultMockCalendar,
      currentView: 'unknownView',
    })

    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    expect(getByTestId('view-display-name')).toHaveTextContent('Month')
  })

  test('calls setView when setView action is used', () => {
    const mockSetView = jest.fn()
    mockUseCalendar.mockReturnValue({
      ...defaultMockCalendar,
      setView: mockSetView,
    })

    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    act(() => {
      getByTestId('set-view').click()
    })

    expect(mockSetView).toHaveBeenCalledWith('timeGridWeek')
  })

  test('calls setDate when setDate action is used', () => {
    const mockSetDate = jest.fn()
    mockUseCalendar.mockReturnValue({
      ...defaultMockCalendar,
      setDate: mockSetDate,
    })

    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    act(() => {
      getByTestId('set-date').click()
    })

    expect(mockSetDate).toHaveBeenCalledWith('2024-01-15')
  })

  test('calls setCurrentDate when setCurrentDate action is used', () => {
    const mockSetCurrentDate = jest.fn()
    mockUseCalendar.mockReturnValue({
      ...defaultMockCalendar,
      setCurrentDate: mockSetCurrentDate,
    })

    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    act(() => {
      getByTestId('set-current-date').click()
    })

    expect(mockSetCurrentDate).toHaveBeenCalledTimes(1)
  })

  test('handles different date formats in getCurrentDateDisplay', () => {
    const testCases = ['2024-01-15', '2024-12-31', '2023-06-01']

    testCases.forEach((date) => {
      mockUseCalendar.mockReturnValue({
        ...defaultMockCalendar,
        currentDate: date,
      })

      const { getByTestId, unmount } = render(
        <CalendarProvider>
          <TestComponent />
        </CalendarProvider>
      )

      const dateDisplay = getByTestId('current-date-display').textContent
      expect(dateDisplay).toMatch(/^[A-Za-z]+ \d{4}$/)
      unmount()
    })
  })

  test('handles edge case dates in getCurrentDateDisplay', () => {
    const edgeCases = [
      '2024-02-29', // Leap year
      '2023-02-28', // Non-leap year
      '2024-01-01', // New Year
      '2024-12-31', // Year end
    ]

    edgeCases.forEach((date) => {
      mockUseCalendar.mockReturnValue({
        ...defaultMockCalendar,
        currentDate: date,
      })

      const { getByTestId, unmount } = render(
        <CalendarProvider>
          <TestComponent />
        </CalendarProvider>
      )

      const dateDisplay = getByTestId('current-date-display').textContent
      expect(dateDisplay).toMatch(/^[A-Za-z]+ \d{4}$/)
      unmount()
    })
  })

  test('provides consistent view options', () => {
    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    const viewOptions = getByTestId('view-options').textContent.split(',')
    expect(viewOptions).toEqual(['dayGridMonth', 'timeGridWeek', 'listWeek'])
  })

  test('maintains reference equality for stable functions', () => {
    let renderCount = 0
    const TestComponentWithRef = () => {
      const calendarState = useCalendarState()
      renderCount++

      return (
        <div>
          <div data-testid="render-count">{renderCount}</div>
          <div data-testid="set-view-ref">
            {calendarState.setView.toString()}
          </div>
        </div>
      )
    }

    const { getByTestId, rerender } = render(
      <CalendarProvider>
        <TestComponentWithRef />
      </CalendarProvider>
    )

    const firstRef = getByTestId('set-view-ref').textContent

    // Re-render the component
    rerender(
      <CalendarProvider>
        <TestComponentWithRef />
      </CalendarProvider>
    )

    const secondRef = getByTestId('set-view-ref').textContent

    // Functions should maintain reference equality
    expect(firstRef).toBe(secondRef)
  })

  test('handles empty view options gracefully', () => {
    mockUseCalendar.mockReturnValue({
      ...defaultMockCalendar,
      viewOptions: [],
    })

    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    expect(getByTestId('view-options')).toHaveTextContent('')
  })

  test('handles single view option', () => {
    mockUseCalendar.mockReturnValue({
      ...defaultMockCalendar,
      viewOptions: ['dayGridMonth'],
    })

    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    expect(getByTestId('view-options')).toHaveTextContent('dayGridMonth')
  })
})
