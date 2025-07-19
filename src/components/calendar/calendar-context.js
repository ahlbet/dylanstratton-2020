import React, { createContext, useContext, useReducer, useEffect } from 'react'

// Calendar state context
const CalendarContext = createContext()

// Action types
const CALENDAR_ACTIONS = {
  SET_VIEW: 'SET_VIEW',
  SET_DATE: 'SET_DATE',
  SET_CURRENT_DATE: 'SET_CURRENT_DATE',
}

// Helper function to get a clean date string (YYYY-MM-DD format)
const getCleanDateString = (date) => {
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
const getInitialState = () => {
  if (typeof window !== 'undefined') {
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
const calendarReducer = (state, action) => {
  let newState

  switch (action.type) {
    case CALENDAR_ACTIONS.SET_VIEW:
      newState = {
        ...state,
        currentView: action.payload,
      }
      break

    case CALENDAR_ACTIONS.SET_DATE:
      newState = {
        ...state,
        currentDate: getCleanDateString(action.payload),
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
  if (typeof window !== 'undefined') {
    localStorage.setItem('calendarState', JSON.stringify(newState))
  }

  return newState
}

// Provider component
export const CalendarProvider = ({ children }) => {
  const [state, dispatch] = useReducer(calendarReducer, getInitialState())

  // Actions
  const setView = (view) => {
    dispatch({ type: CALENDAR_ACTIONS.SET_VIEW, payload: view })
  }

  const setDate = (date) => {
    dispatch({ type: CALENDAR_ACTIONS.SET_DATE, payload: date })
  }

  const setCurrentDate = () => {
    dispatch({ type: CALENDAR_ACTIONS.SET_CURRENT_DATE })
  }

  const value = {
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
export const useCalendar = () => {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }
  return context
}

// Export action types for reference
export { CALENDAR_ACTIONS }
