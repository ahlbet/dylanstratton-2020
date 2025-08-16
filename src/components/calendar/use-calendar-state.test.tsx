import React from 'react'
import { renderHook } from '@testing-library/react'
import { useCalendarState } from './use-calendar-state'
import { CalendarProvider } from './calendar-context'
import { UserPreferencesProvider } from './user-preferences-context'

// Mock the calendar context
const mockCalendarContext = {
  currentView: 'dayGridMonth' as const,
  currentDate: '2024-01-15',
  viewOptions: ['dayGridMonth', 'timeGridWeek', 'listWeek'] as const,
  setView: jest.fn(),
  setDate: jest.fn(),
  setCurrentDate: jest.fn(),
}

jest.mock('./calendar-context', () => ({
  ...jest.requireActual('./calendar-context'),
  useCalendar: () => mockCalendarContext,
}))

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UserPreferencesProvider>
    <CalendarProvider>{children}</CalendarProvider>
  </UserPreferencesProvider>
)

describe('useCalendarState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock to default state
    mockCalendarContext.currentView = 'dayGridMonth'
    mockCalendarContext.currentDate = '2024-01-15'
  })

  test('returns calendar state and actions', () => {
    const { result } = renderHook(() => useCalendarState(), { wrapper })

    expect(result.current.currentView).toBe('dayGridMonth')
    expect(result.current.currentDate).toBe('2024-01-15')
    expect(result.current.viewOptions).toEqual([
      'dayGridMonth',
      'timeGridWeek',
      'listWeek',
    ])
    expect(result.current.setView).toBe(mockCalendarContext.setView)
    expect(result.current.setDate).toBe(mockCalendarContext.setDate)
    expect(result.current.setCurrentDate).toBe(
      mockCalendarContext.setCurrentDate
    )
  })

  test('provides convenience methods for view checking', () => {
    const { result } = renderHook(() => useCalendarState(), { wrapper })

    expect(result.current.isMonthView).toBe(true)
    expect(result.current.isWeekView).toBe(false)
    expect(result.current.isListView).toBe(false)
  })

  test('updates convenience methods when view changes', () => {
    // Change the mock to week view
    mockCalendarContext.currentView = 'timeGridWeek'

    const { result } = renderHook(() => useCalendarState(), { wrapper })

    expect(result.current.isMonthView).toBe(false)
    expect(result.current.isWeekView).toBe(true)
    expect(result.current.isListView).toBe(false)
  })

  test('updates convenience methods when view changes to list view', () => {
    // Change the mock to list view
    mockCalendarContext.currentView = 'listWeek'

    const { result } = renderHook(() => useCalendarState(), { wrapper })

    expect(result.current.isMonthView).toBe(false)
    expect(result.current.isWeekView).toBe(false)
    expect(result.current.isListView).toBe(true)
  })

  test('formats current date for display', () => {
    const { result } = renderHook(() => useCalendarState(), { wrapper })

    const formattedDate = result.current.getCurrentDateDisplay()

    // Should format the date as "January 2024"
    expect(formattedDate).toBe('January 2024')
  })

  test('handles different date formats', () => {
    // Change the mock date
    mockCalendarContext.currentDate = '2024-12-25'

    const { result } = renderHook(() => useCalendarState(), { wrapper })

    const formattedDate = result.current.getCurrentDateDisplay()

    // Should format the date as "December 2024"
    expect(formattedDate).toBe('December 2024')
  })

  test('provides view display names', () => {
    const { result } = renderHook(() => useCalendarState(), { wrapper })

    expect(result.current.getViewDisplayName()).toBe('Month')
  })

  test('provides correct view display names for all views', () => {
    const viewTests = [
      { view: 'dayGridMonth' as const, expected: 'Month' },
      { view: 'timeGridWeek' as const, expected: 'Week' },
      { view: 'listWeek' as const, expected: 'List' },
    ]

    viewTests.forEach(({ view, expected }) => {
      mockCalendarContext.currentView = view

      const { result } = renderHook(() => useCalendarState(), { wrapper })
      expect(result.current.getViewDisplayName()).toBe(expected)
    })
  })

  test('handles unknown view gracefully', () => {
    // Set an unknown view
    mockCalendarContext.currentView = 'unknown' as any

    const { result } = renderHook(() => useCalendarState(), { wrapper })

    // Should fall back to 'Month'
    expect(result.current.getViewDisplayName()).toBe('Month')
  })

  test('maintains reference equality for stable functions', () => {
    const { result, rerender } = renderHook(() => useCalendarState(), {
      wrapper,
    })

    const firstResult = result.current

    rerender()

    const secondResult = result.current

    // Functions should maintain reference equality
    expect(firstResult.setView).toBe(secondResult.setView)
    expect(firstResult.setDate).toBe(secondResult.setDate)
    expect(firstResult.setCurrentDate).toBe(secondResult.setCurrentDate)
  })

  test('updates convenience methods on rerender', () => {
    const { result, rerender } = renderHook(() => useCalendarState(), {
      wrapper,
    })

    expect(result.current.isMonthView).toBe(true)

    // Change the mock view
    mockCalendarContext.currentView = 'timeGridWeek'

    rerender()

    expect(result.current.isMonthView).toBe(false)
    expect(result.current.isWeekView).toBe(true)
  })

  test('handles edge case dates', () => {
    // Test with edge case dates
    const edgeDates = [
      '2024-01-01', // New Year
      '2024-02-29', // Leap year
      '2024-12-31', // Year end
    ]

    edgeDates.forEach((date) => {
      mockCalendarContext.currentDate = date

      const { result } = renderHook(() => useCalendarState(), { wrapper })

      const formattedDate = result.current.getCurrentDateDisplay()
      expect(typeof formattedDate).toBe('string')
      expect(formattedDate.length).toBeGreaterThan(0)
    })
  })

  test('provides all expected properties', () => {
    const { result } = renderHook(() => useCalendarState(), { wrapper })

    const expectedProperties = [
      'currentView',
      'currentDate',
      'viewOptions',
      'setView',
      'setDate',
      'setCurrentDate',
      'isMonthView',
      'isWeekView',
      'isListView',
      'getCurrentDateDisplay',
      'getViewDisplayName',
    ]

    expectedProperties.forEach((prop) => {
      expect(result.current).toHaveProperty(prop)
    })
  })

  test('maintains type safety for view options', () => {
    const { result } = renderHook(() => useCalendarState(), { wrapper })

    // TypeScript should ensure these are the correct view types
    expect(result.current.viewOptions).toContain('dayGridMonth')
    expect(result.current.viewOptions).toContain('timeGridWeek')
    expect(result.current.viewOptions).toContain('listWeek')

    // Should not contain invalid views
    expect(result.current.viewOptions).not.toContain('invalidView')
  })
})
