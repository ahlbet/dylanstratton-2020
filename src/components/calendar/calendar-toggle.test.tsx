import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import CalendarToggle from './calendar-toggle'
import { UserPreferencesProvider } from './user-preferences-context'

// Mock the user preferences context
const mockToggleCalendar = jest.fn()
const mockUseUserPreferences = {
  calendarVisible: false,
  toggleCalendar: mockToggleCalendar,
}

jest.mock('./user-preferences-context', () => ({
  ...jest.requireActual('./user-preferences-context'),
  useUserPreferences: () => mockUseUserPreferences,
}))

const renderWithProvider = (component: React.ReactElement) => {
  return render(<UserPreferencesProvider>{component}</UserPreferencesProvider>)
}

describe('CalendarToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders with default props', () => {
    renderWithProvider(<CalendarToggle />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', 'Show Calendar')
  })

  test('renders with custom className', () => {
    renderWithProvider(<CalendarToggle className="custom-class" />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  test('renders with custom style', () => {
    const customStyle = { backgroundColor: 'red' }
    renderWithProvider(<CalendarToggle style={customStyle} />)

    const button = screen.getByRole('button')
    expect(button).toHaveStyle({ backgroundColor: 'red' })
  })

  test('calls toggleCalendar when clicked', () => {
    renderWithProvider(<CalendarToggle />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockToggleCalendar).toHaveBeenCalledTimes(1)
  })

  test('shows calendar icon when calendar is hidden', () => {
    mockUseUserPreferences.calendarVisible = false
    renderWithProvider(<CalendarToggle />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Show Calendar')

    // Check for calendar icon (rect element)
    const calendarIcon = button.querySelector('rect')
    expect(calendarIcon).toBeInTheDocument()
  })

  test('shows hide icon when calendar is visible', () => {
    mockUseUserPreferences.calendarVisible = true
    renderWithProvider(<CalendarToggle />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Hide Calendar')

    // Check for hide icon (path element)
    const hideIcon = button.querySelector('path')
    expect(hideIcon).toBeInTheDocument()
  })

  test('applies hover styles on mouse enter', () => {
    renderWithProvider(<CalendarToggle />)

    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)

    expect(button).toHaveStyle({ background: '#222', borderColor: '#333' })
  })

  test('removes hover styles on mouse leave', () => {
    renderWithProvider(<CalendarToggle />)

    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)
    fireEvent.mouseLeave(button)

    expect(button).toHaveStyle({ background: '#111', borderColor: '#222' })
  })

  test('has correct default styles', () => {
    renderWithProvider(<CalendarToggle />)

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
      width: '40px',
      height: '40px',
    })
  })

  test('has correct accessibility attributes', () => {
    renderWithProvider(<CalendarToggle />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title')
    // Note: HTML buttons don't have a default type attribute in the DOM
    // The type is only set when explicitly specified
  })

  test('handles multiple clicks correctly', () => {
    renderWithProvider(<CalendarToggle />)

    const button = screen.getByRole('button')

    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    expect(mockToggleCalendar).toHaveBeenCalledTimes(3)
  })

  test('maintains custom styles when combined with default styles', () => {
    const customStyle = {
      backgroundColor: 'blue',
      fontSize: '20px',
    }
    renderWithProvider(<CalendarToggle style={customStyle} />)

    const button = screen.getByRole('button')
    expect(button).toHaveStyle({
      backgroundColor: 'blue',
      fontSize: '20px',
      // Default styles should still be applied
      color: '#ffffff',
      width: '40px',
      height: '40px',
    })
  })
})
