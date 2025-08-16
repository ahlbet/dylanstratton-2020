import React, { createContext, useContext, useReducer, useEffect } from 'react'

// User preferences context
const UserPreferencesContext = createContext()

// Action types
const USER_PREFERENCES_ACTIONS = {
  TOGGLE_CALENDAR: 'TOGGLE_CALENDAR',
  SET_CALENDAR_VISIBLE: 'SET_CALENDAR_VISIBLE',
}

// Initial state
const getInitialState = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('userPreferences')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.warn('Failed to parse saved user preferences:', e)
      }
    }
  }

  return {
    calendarVisible: false,
  }
}

// Reducer function
const userPreferencesReducer = (state, action) => {
  let newState

  switch (action.type) {
    case USER_PREFERENCES_ACTIONS.TOGGLE_CALENDAR:
      newState = {
        ...state,
        calendarVisible: !state.calendarVisible,
      }
      break

    case USER_PREFERENCES_ACTIONS.SET_CALENDAR_VISIBLE:
      newState = {
        ...state,
        calendarVisible: action.payload,
      }
      break

    default:
      return state
  }

  // Save to localStorage only in browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(newState))
    } catch (e) {
      console.warn('Failed to save user preferences to localStorage:', e)
    }
  }

  return newState
}

// Provider component
export const UserPreferencesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    userPreferencesReducer,
    getInitialState()
  )

  // Actions
  const toggleCalendar = () => {
    dispatch({ type: USER_PREFERENCES_ACTIONS.TOGGLE_CALENDAR })
  }

  const setCalendarVisible = (visible) => {
    dispatch({
      type: USER_PREFERENCES_ACTIONS.SET_CALENDAR_VISIBLE,
      payload: visible,
    })
  }

  const value = {
    ...state,
    toggleCalendar,
    setCalendarVisible,
  }

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  )
}

// Custom hook to use user preferences context
export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext)
  if (!context) {
    // Provide a fallback for SSR or when context is not available
    return {
      calendarVisible: false,
      toggleCalendar: () => {
        // No-op during SSR
        if (typeof window !== 'undefined') {
          console.warn('toggleCalendar called outside provider')
        }
      },
      setCalendarVisible: () => {
        // No-op during SSR
        if (typeof window !== 'undefined') {
          console.warn('setCalendarVisible called outside provider')
        }
      },
    }
  }
  return context
}

// Export action types for reference
export { USER_PREFERENCES_ACTIONS }
