import React, { createContext, useContext, useReducer, ReactNode } from 'react'

// Types
export interface UserPreferencesState {
  calendarVisible: boolean
}

export interface UserPreferencesContextType extends UserPreferencesState {
  toggleCalendar: () => void
  setCalendarVisible: (visible: boolean) => void
}

interface UserPreferencesProviderProps {
  children: ReactNode
}

// Action types
export const USER_PREFERENCES_ACTIONS = {
  TOGGLE_CALENDAR: 'TOGGLE_CALENDAR',
  SET_CALENDAR_VISIBLE: 'SET_CALENDAR_VISIBLE',
} as const

type UserPreferencesActionType =
  (typeof USER_PREFERENCES_ACTIONS)[keyof typeof USER_PREFERENCES_ACTIONS]

interface UserPreferencesAction {
  type: UserPreferencesActionType
  payload?: boolean
}

// User preferences context
const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined)

// Initial state
const getInitialState = (): UserPreferencesState => {
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
const userPreferencesReducer = (
  state: UserPreferencesState,
  action: UserPreferencesAction
): UserPreferencesState => {
  let newState: UserPreferencesState

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
        calendarVisible: action.payload!,
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
export const UserPreferencesProvider: React.FC<
  UserPreferencesProviderProps
> = ({ children }) => {
  const [state, dispatch] = useReducer(
    userPreferencesReducer,
    getInitialState()
  )

  // Actions
  const toggleCalendar = (): void => {
    dispatch({ type: USER_PREFERENCES_ACTIONS.TOGGLE_CALENDAR })
  }

  const setCalendarVisible = (visible: boolean): void => {
    dispatch({
      type: USER_PREFERENCES_ACTIONS.SET_CALENDAR_VISIBLE,
      payload: visible,
    })
  }

  const value: UserPreferencesContextType = {
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
export const useUserPreferences = (): UserPreferencesContextType => {
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
