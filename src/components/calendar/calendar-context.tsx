import React, { createContext, useContext, useReducer, ReactNode } from 'react'

// Types
export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'listWeek'

export interface CalendarState {
  currentView: CalendarView
  currentDate: string
  viewOptions: CalendarView[]
}

export interface CalendarContextType extends CalendarState {
  setView: (view: CalendarView) => void
  setDate: (date: Date | string) => void
  setCurrentDate: () => void
}

interface CalendarProviderProps {
  children: ReactNode
}

// Action types
export const CALENDAR_ACTIONS = {
  SET_VIEW: 'SET_VIEW',
  SET_DATE: 'SET_DATE',
  SET_CURRENT_DATE: 'SET_CURRENT_DATE',
} as const

type CalendarActionType =
  (typeof CALENDAR_ACTIONS)[keyof typeof CALENDAR_ACTIONS]

interface CalendarAction {
  type: CalendarActionType
  payload?: CalendarView | Date | string
}

// Calendar state context
const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
)

// Helper function to get a clean date string (YYYY-MM-DD format)
const getCleanDateString = (date: Date | string): string => {
  if (typeof date === 'string') {
    // If it's already a date string, extract just the date part
    return date.split('T')[0]
  }
  if (date instanceof Date) {
    return date.toISOString().split('T')[0]
  }
  return new Date().toISOString().split('T')[0]
}

// Initial state
const getInitialState = (): CalendarState => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('calendarState')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Ensure the date is in the correct format
        return {
          ...parsed,
          currentDate: getCleanDateString(parsed.currentDate),
        }
      } catch (e) {
        console.warn('Failed to parse saved calendar state:', e)
      }
    }
  }

  return {
    currentView: 'dayGridMonth',
    currentDate: getCleanDateString(new Date()),
    viewOptions: ['dayGridMonth', 'timeGridWeek', 'listWeek'],
  }
}

// Reducer function
const calendarReducer = (
  state: CalendarState,
  action: CalendarAction
): CalendarState => {
  let newState: CalendarState

  switch (action.type) {
    case CALENDAR_ACTIONS.SET_VIEW:
      newState = {
        ...state,
        currentView: action.payload as CalendarView,
      }
      break

    case CALENDAR_ACTIONS.SET_DATE:
      newState = {
        ...state,
        currentDate: getCleanDateString(action.payload as Date | string),
      }
      break

    case CALENDAR_ACTIONS.SET_CURRENT_DATE:
      newState = {
        ...state,
        currentDate: getCleanDateString(new Date()),
      }
      break

    default:
      return state
  }

  // Save to localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('calendarState', JSON.stringify(newState))
  }

  return newState
}

// Provider component
export const CalendarProvider: React.FC<CalendarProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(calendarReducer, getInitialState())

  // Actions
  const setView = (view: CalendarView): void => {
    dispatch({ type: CALENDAR_ACTIONS.SET_VIEW, payload: view })
  }

  const setDate = (date: Date | string): void => {
    dispatch({ type: CALENDAR_ACTIONS.SET_DATE, payload: date })
  }

  const setCurrentDate = (): void => {
    dispatch({ type: CALENDAR_ACTIONS.SET_CURRENT_DATE })
  }

  const value: CalendarContextType = {
    ...state,
    setView,
    setDate,
    setCurrentDate,
  }

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  )
}

// Custom hook to use calendar context
export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }
  return context
}
