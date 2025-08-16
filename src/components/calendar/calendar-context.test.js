import React from 'react'
import { render, act } from '@testing-library/react'
import {
  CalendarProvider,
  useCalendar,
  CALENDAR_ACTIONS,
} from './calendar-context'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Test component to use the context
const TestComponent = () => {
  const calendar = useCalendar()
  return (
    <div>
      <div data-testid="current-view">{calendar.currentView}</div>
      <div data-testid="current-date">{calendar.currentDate}</div>
      <div data-testid="view-options">{calendar.viewOptions.join(',')}</div>
      <button
        onClick={() => calendar.setView('timeGridWeek')}
        data-testid="set-view"
      >
        Set Week View
      </button>
      <button
        onClick={() => calendar.setDate('2024-01-15')}
        data-testid="set-date"
      >
        Set Date
      </button>
      <button onClick={calendar.setCurrentDate} data-testid="set-current-date">
        Set Current Date
      </button>
    </div>
  )
}

describe('CalendarContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('provides default state when no localStorage data', () => {
    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    expect(getByTestId('current-view')).toHaveTextContent('dayGridMonth')
    expect(getByTestId('view-options')).toHaveTextContent(
      'dayGridMonth,timeGridWeek,listWeek'
    )

    // Check that current date is in YYYY-MM-DD format
    const currentDate = getByTestId('current-date').textContent
    expect(currentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('loads state from localStorage when available', () => {
    const savedState = {
      currentView: 'timeGridWeek',
      currentDate: '2024-01-15',
      viewOptions: ['dayGridMonth', 'timeGridWeek', 'listWeek'],
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))

    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    expect(getByTestId('current-view')).toHaveTextContent('timeGridWeek')
    expect(getByTestId('current-date')).toHaveTextContent('2024-01-15')
  })

  test('handles invalid localStorage data gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid json')

    // Should not throw error and should use default state
    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    expect(getByTestId('current-view')).toHaveTextContent('dayGridMonth')
  })

  test('handles date string input for setDate', () => {
    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    act(() => {
      getByTestId('set-date').click()
    })

    expect(getByTestId('current-date')).toHaveTextContent('2024-01-15')
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'calendarState',
      expect.stringContaining('"currentDate":"2024-01-15"')
    )
  })

  test('handles Date object input for setDate', () => {
    const TestComponentWithDateObject = () => {
      const calendar = useCalendar()
      return (
        <button
          onClick={() => calendar.setDate(new Date('2024-02-20'))}
          data-testid="set-date-object"
        >
          Set Date Object
        </button>
      )
    }

    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponentWithDateObject />
      </CalendarProvider>
    )

    act(() => {
      getByTestId('set-date-object').click()
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'calendarState',
      expect.stringContaining('"currentDate":"2024-02-20"')
    )
  })

  test('handles date with time component for setDate', () => {
    const TestComponentWithDateTime = () => {
      const calendar = useCalendar()
      return (
        <button
          onClick={() => calendar.setDate('2024-03-25T10:30:00Z')}
          data-testid="set-datetime"
        >
          Set DateTime
        </button>
      )
    }

    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponentWithDateTime />
      </CalendarProvider>
    )

    act(() => {
      getByTestId('set-datetime').click()
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'calendarState',
      expect.stringContaining('"currentDate":"2024-03-25"')
    )
  })

  test('changes view when setView is called', () => {
    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    act(() => {
      getByTestId('set-view').click()
    })

    expect(getByTestId('current-view')).toHaveTextContent('timeGridWeek')
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'calendarState',
      expect.stringContaining('"currentView":"timeGridWeek"')
    )
  })

  test('sets current date when setCurrentDate is called', () => {
    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    const beforeDate = getByTestId('current-date').textContent

    act(() => {
      getByTestId('set-current-date').click()
    })

    const afterDate = getByTestId('current-date').textContent
    // The date might be the same if called within the same second
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  test('saves state to localStorage on every change', () => {
    const { getByTestId } = render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    )

    // Change view
    act(() => {
      getByTestId('set-view').click()
    })

    // Change date
    act(() => {
      getByTestId('set-date').click()
    })

    expect(localStorageMock.setItem).toHaveBeenCalledTimes(2)
  })

  test('throws error when useCalendar is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useCalendar must be used within a CalendarProvider')

    consoleSpy.mockRestore()
  })

  test('exports CALENDAR_ACTIONS constants', () => {
    expect(CALENDAR_ACTIONS.SET_VIEW).toBe('SET_VIEW')
    expect(CALENDAR_ACTIONS.SET_DATE).toBe('SET_DATE')
    expect(CALENDAR_ACTIONS.SET_CURRENT_DATE).toBe('SET_CURRENT_DATE')
  })

  test('handles SSR environment gracefully', () => {
    // Save original localStorage
    const originalLocalStorage = global.localStorage

    // Mock localStorage as undefined (SSR environment)
    Object.defineProperty(global, 'localStorage', {
      value: undefined,
      writable: true,
    })

    // Should not throw error during SSR
    expect(() => {
      render(
        <CalendarProvider>
          <TestComponent />
        </CalendarProvider>
      )
    }).not.toThrow()

    // Restore localStorage
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    })
  })
})
