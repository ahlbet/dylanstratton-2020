import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import CalendarStatus from './calendar-status'
import { CalendarProvider } from './calendar-context'
import { UserPreferencesProvider } from './user-preferences-context'

// Mock the useCalendarState hook
const mockUseCalendarState = {
  currentView: 'dayGridMonth',
  getCurrentDateDisplay: jest.fn(() => 'January 15, 2024'),
  getViewDisplayName: jest.fn(() => 'Month'),
  setCurrentDate: jest.fn(),
}

jest.mock('./use-calendar-state', () => ({
  useCalendarState: () => mockUseCalendarState,
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <UserPreferencesProvider>
      <CalendarProvider>{component}</CalendarProvider>
    </UserPreferencesProvider>
  )
}

describe('CalendarStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders calendar status component', () => {
    renderWithProviders(<CalendarStatus />)

    expect(screen.getByText('Calendar Status')).toBeInTheDocument()
    expect(screen.getByText('Current Date:')).toBeInTheDocument()
    expect(screen.getByText('View:')).toBeInTheDocument()
    expect(screen.getByText('Go to Today')).toBeInTheDocument()
  })

  test('displays current date from hook', () => {
    mockUseCalendarState.getCurrentDateDisplay.mockReturnValue('March 20, 2024')

    renderWithProviders(<CalendarStatus />)

    expect(screen.getByText('March 20, 2024')).toBeInTheDocument()
    expect(mockUseCalendarState.getCurrentDateDisplay).toHaveBeenCalled()
  })

  test('displays current view from hook', () => {
    mockUseCalendarState.getViewDisplayName.mockReturnValue('Week')

    renderWithProviders(<CalendarStatus />)

    expect(screen.getByText('Week')).toBeInTheDocument()
    expect(mockUseCalendarState.getViewDisplayName).toHaveBeenCalled()
  })

  test('calls setCurrentDate when button is clicked', () => {
    renderWithProviders(<CalendarStatus />)

    const button = screen.getByText('Go to Today')
    fireEvent.click(button)

    expect(mockUseCalendarState.setCurrentDate).toHaveBeenCalledTimes(1)
  })

  test('applies hover styles on mouse enter', () => {
    renderWithProviders(<CalendarStatus />)

    const button = screen.getByText('Go to Today')
    fireEvent.mouseEnter(button)

    expect(button).toHaveStyle({ background: '#444', borderColor: '#666' })
  })

  test('removes hover styles on mouse leave', () => {
    renderWithProviders(<CalendarStatus />)

    const button = screen.getByText('Go to Today')
    fireEvent.mouseEnter(button)
    fireEvent.mouseLeave(button)

    expect(button).toHaveStyle({ background: '#333', borderColor: '#555' })
  })

  test('has correct default styles', () => {
    renderWithProviders(<CalendarStatus />)

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

  test('has correct button styles', () => {
    renderWithProviders(<CalendarStatus />)

    const button = screen.getByText('Go to Today')
    expect(button).toHaveStyle({
      background: '#333',
      border: '1px solid #555',
      borderRadius: '4px',
      padding: '0.25rem 0.5rem',
      color: '#ffffff',
      fontSize: '0.75rem',
      cursor: 'pointer',
    })
  })

  test('displays informative text about state persistence', () => {
    renderWithProviders(<CalendarStatus />)

    expect(
      screen.getByText('State persists across navigation')
    ).toBeInTheDocument()
  })

  test('has correct heading styles', () => {
    renderWithProviders(<CalendarStatus />)

    const heading = screen.getByText('Calendar Status')
    expect(heading).toHaveStyle({
      margin: '0 0 0.5rem 0',
      fontSize: '1rem',
      fontWeight: '500',
      color: '#999',
    })
  })

  test('has correct layout structure', () => {
    renderWithProviders(<CalendarStatus />)

    const statusContainer = screen.getByText('Calendar Status').closest('div')
    const infoContainer = statusContainer?.querySelector('div')

    expect(infoContainer).toHaveStyle({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '0.875rem',
    })
  })

  test('handles multiple button clicks', () => {
    renderWithProviders(<CalendarStatus />)

    const button = screen.getByText('Go to Today')

    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    expect(mockUseCalendarState.setCurrentDate).toHaveBeenCalledTimes(3)
  })

  test('maintains button state after interactions', () => {
    renderWithProviders(<CalendarStatus />)

    const button = screen.getByText('Go to Today')

    // Hover and click
    fireEvent.mouseEnter(button)
    fireEvent.click(button)
    fireEvent.mouseLeave(button)

    // Button should return to default state
    expect(button).toHaveStyle({ background: '#333', borderColor: '#555' })
  })

  test('has correct color scheme', () => {
    renderWithProviders(<CalendarStatus />)

    // Check various color elements
    expect(screen.getByText('Current Date:')).toHaveStyle({ color: '#999' })
    expect(screen.getByText('View:')).toHaveStyle({ color: '#999' })
    expect(screen.getByText('State persists across navigation')).toHaveStyle({
      color: '#666',
    })
  })

  test('has correct font family', () => {
    renderWithProviders(<CalendarStatus />)

    const container = screen.getByText('Calendar Status').closest('div')
    expect(container).toHaveStyle({
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    })
  })
})
