import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import CalendarToggle from './calendar-toggle'
import { UserPreferencesProvider } from './user-preferences-context'

// Mock the useUserPreferences hook
jest.mock('./user-preferences-context', () => ({
  ...jest.requireActual('./user-preferences-context'),
  useUserPreferences: jest.fn(),
}))

const mockUseUserPreferences =
  require('./user-preferences-context').useUserPreferences

describe('CalendarToggle', () => {
  const defaultMockState = {
    calendarVisible: false,
    toggleCalendar: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseUserPreferences.mockReturnValue(defaultMockState)
  })

  test('renders without crashing', () => {
    render(
      <UserPreferencesProvider>
        <CalendarToggle />
      </UserPreferencesProvider>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  test('renders with custom className', () => {
    const customClass = 'custom-toggle'
    render(
      <UserPreferencesProvider>
        <CalendarToggle className={customClass} />
      </UserPreferencesProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass(customClass)
  })

  test('renders with custom style', () => {
    const customStyle = { backgroundColor: 'red' }
    render(
      <UserPreferencesProvider>
        <CalendarToggle style={customStyle} />
      </UserPreferencesProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveStyle(customStyle)
  })

  test('calls toggleCalendar when clicked', () => {
    const mockToggleCalendar = jest.fn()
    mockUseUserPreferences.mockReturnValue({
      ...defaultMockState,
      toggleCalendar: mockToggleCalendar,
    })

    render(
      <UserPreferencesProvider>
        <CalendarToggle />
      </UserPreferencesProvider>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockToggleCalendar).toHaveBeenCalledTimes(1)
  })

  test('shows calendar icon when calendar is hidden', () => {
    mockUseUserPreferences.mockReturnValue({
      ...defaultMockState,
      calendarVisible: false,
    })

    render(
      <UserPreferencesProvider>
        <CalendarToggle />
      </UserPreferencesProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Show Calendar')

    // Check for calendar icon (SVG with rect and lines)
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()

    // Check for calendar icon elements
    const rect = svg.querySelector('rect')
    expect(rect).toBeInTheDocument()
  })

  test('shows hide icon when calendar is visible', () => {
    mockUseUserPreferences.mockReturnValue({
      ...defaultMockState,
      calendarVisible: true,
    })

    render(
      <UserPreferencesProvider>
        <CalendarToggle />
      </UserPreferencesProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Hide Calendar')

    // Check for hide icon (SVG with eye-slash)
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()

    // Check for eye-slash icon elements
    const path = svg.querySelector('path')
    expect(path).toBeInTheDocument()
  })

  test('applies correct default styling', () => {
    render(
      <UserPreferencesProvider>
        <CalendarToggle />
      </UserPreferencesProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveStyle({
      background: '#111',
      border: '1px solid #222',
      borderRadius: '6px',
      padding: '0.5rem',
      color: '#ffffff',
      fontSize: '0.875rem',
      fontWeight: '400',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
    })
  })

  test('applies custom style over default style', () => {
    const customStyle = { backgroundColor: 'blue', width: '60px' }
    render(
      <UserPreferencesProvider>
        <CalendarToggle style={customStyle} />
      </UserPreferencesProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveStyle({
      backgroundColor: 'blue',
      width: '60px',
      height: '40px', // Default should still apply
    })
  })

  test('handles mouse enter and leave events', () => {
    render(
      <UserPreferencesProvider>
        <CalendarToggle />
      </UserPreferencesProvider>
    )

    const button = screen.getByRole('button')

    // Initial state
    expect(button).toHaveStyle({ background: '#111', borderColor: '#222' })

    // Mouse enter
    fireEvent.mouseEnter(button)
    expect(button).toHaveStyle({ background: '#222', borderColor: '#333' })

    // Mouse leave
    fireEvent.mouseLeave(button)
    expect(button).toHaveStyle({ background: '#111', borderColor: '#222' })
  })

  test('maintains accessibility attributes', () => {
    render(
      <UserPreferencesProvider>
        <CalendarToggle />
      </UserPreferencesProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title')
    expect(button.tagName).toBe('BUTTON')
  })

  test('renders SVG icons with correct dimensions', () => {
    render(
      <UserPreferencesProvider>
        <CalendarToggle />
      </UserPreferencesProvider>
    )

    const svg = screen.getByRole('button').querySelector('svg')
    expect(svg).toHaveAttribute('width', '16')
    expect(svg).toHaveAttribute('height', '16')
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
  })

  test('handles different calendar visibility states', () => {
    const testCases = [
      { visible: false, expectedTitle: 'Show Calendar' },
      { visible: true, expectedTitle: 'Hide Calendar' },
    ]

    testCases.forEach(({ visible, expectedTitle }) => {
      mockUseUserPreferences.mockReturnValue({
        ...defaultMockState,
        calendarVisible: visible,
      })

      const { unmount } = render(
        <UserPreferencesProvider>
          <CalendarToggle />
        </UserPreferencesProvider>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', expectedTitle)
      unmount()
    })
  })

  test('combines custom and default styles correctly', () => {
    const customStyle = {
      backgroundColor: 'green',
      border: '2px solid red',
      margin: '10px',
    }

    render(
      <UserPreferencesProvider>
        <CalendarToggle style={customStyle} />
      </UserPreferencesProvider>
    )

    const button = screen.getByRole('button')

    // Custom styles should override defaults
    expect(button).toHaveStyle({
      backgroundColor: 'green',
      border: '2px solid red',
      margin: '10px',
    })

    // Default styles should still apply where not overridden
    expect(button).toHaveStyle({
      borderRadius: '6px',
      padding: '0.5rem',
      color: '#ffffff',
    })
  })
})
