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
  if (typeof window !== 'undefined') {
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

  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('userPreferences', JSON.stringify(newState))
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
    throw new Error(
      'useUserPreferences must be used within a UserPreferencesProvider'
    )
  }
  return context
}

// Export action types for reference
export { USER_PREFERENCES_ACTIONS }
