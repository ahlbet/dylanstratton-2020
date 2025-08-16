import React from 'react'
import { render, act } from '@testing-library/react'
import {
  UserPreferencesProvider,
  useUserPreferences,
  USER_PREFERENCES_ACTIONS,
} from './user-preferences-context'
import { renderHook } from '@testing-library/react'

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
  const preferences = useUserPreferences()
  return (
    <div>
      <div data-testid="calendar-visible">
        {preferences.calendarVisible.toString()}
      </div>
      <button
        onClick={preferences.toggleCalendar}
        data-testid="toggle-calendar"
      >
        Toggle Calendar
      </button>
      <button
        onClick={() => preferences.setCalendarVisible(true)}
        data-testid="show-calendar"
      >
        Show Calendar
      </button>
      <button
        onClick={() => preferences.setCalendarVisible(false)}
        data-testid="hide-calendar"
      >
        Hide Calendar
      </button>
    </div>
  )
}

describe('UserPreferencesContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('provides default state when no localStorage data', () => {
    const { getByTestId } = render(
      <UserPreferencesProvider>
        <TestComponent />
      </UserPreferencesProvider>
    )

    expect(getByTestId('calendar-visible')).toHaveTextContent('false')
  })

  test('loads state from localStorage when available', () => {
    const savedState = { calendarVisible: true }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))

    const { getByTestId } = render(
      <UserPreferencesProvider>
        <TestComponent />
      </UserPreferencesProvider>
    )

    expect(getByTestId('calendar-visible')).toHaveTextContent('true')
  })

  test('handles invalid localStorage data gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid json')

    // Should not throw error and should use default state
    const { getByTestId } = render(
      <UserPreferencesProvider>
        <TestComponent />
      </UserPreferencesProvider>
    )

    expect(getByTestId('calendar-visible')).toHaveTextContent('false')
  })

  test('toggles calendar visibility when toggleCalendar is called', () => {
    const { getByTestId } = render(
      <UserPreferencesProvider>
        <TestComponent />
      </UserPreferencesProvider>
    )

    // Initially false
    expect(getByTestId('calendar-visible')).toHaveTextContent('false')

    // Toggle to true
    act(() => {
      getByTestId('toggle-calendar').click()
    })

    expect(getByTestId('calendar-visible')).toHaveTextContent('true')
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'userPreferences',
      JSON.stringify({ calendarVisible: true })
    )

    // Toggle back to false
    act(() => {
      getByTestId('toggle-calendar').click()
    })

    expect(getByTestId('calendar-visible')).toHaveTextContent('false')
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'userPreferences',
      JSON.stringify({ calendarVisible: false })
    )
  })

  test('sets calendar visibility to true when setCalendarVisible(true) is called', () => {
    const { getByTestId } = render(
      <UserPreferencesProvider>
        <TestComponent />
      </UserPreferencesProvider>
    )

    act(() => {
      getByTestId('show-calendar').click()
    })

    expect(getByTestId('calendar-visible')).toHaveTextContent('true')
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'userPreferences',
      JSON.stringify({ calendarVisible: true })
    )
  })

  test('sets calendar visibility to false when setCalendarVisible(false) is called', () => {
    // Start with calendar visible
    const savedState = { calendarVisible: true }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))

    const { getByTestId } = render(
      <UserPreferencesProvider>
        <TestComponent />
      </UserPreferencesProvider>
    )

    act(() => {
      getByTestId('hide-calendar').click()
    })

    expect(getByTestId('calendar-visible')).toHaveTextContent('false')
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'userPreferences',
      JSON.stringify({ calendarVisible: false })
    )
  })

  test('saves state to localStorage on every change', () => {
    const { getByTestId } = render(
      <UserPreferencesProvider>
        <TestComponent />
      </UserPreferencesProvider>
    )

    // Toggle calendar
    act(() => {
      getByTestId('toggle-calendar').click()
    })

    // Set to false
    act(() => {
      getByTestId('hide-calendar').click()
    })

    expect(localStorageMock.setItem).toHaveBeenCalledTimes(2)
  })

  test('exports USER_PREFERENCES_ACTIONS constants', () => {
    expect(USER_PREFERENCES_ACTIONS.TOGGLE_CALENDAR).toBe('TOGGLE_CALENDAR')
    expect(USER_PREFERENCES_ACTIONS.SET_CALENDAR_VISIBLE).toBe(
      'SET_CALENDAR_VISIBLE'
    )
  })

  test('provides fallback when used outside provider', () => {
    // Test that the hook provides fallback values when used outside provider
    // This simulates what happens when the context is not available
    const { result } = renderHook(() => useUserPreferences(), {
      wrapper: ({ children }) => <div>{children}</div>,
    })

    // Should provide fallback values
    expect(result.current.calendarVisible).toBe(false)
    expect(typeof result.current.toggleCalendar).toBe('function')
    expect(typeof result.current.setCalendarVisible).toBe('function')
  })
})
