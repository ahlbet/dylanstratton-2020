import React from 'react'
import { useUserPreferences } from './user-preferences-context'

interface CalendarToggleProps {
  className?: string
  style?: React.CSSProperties
}

const CalendarToggle: React.FC<CalendarToggleProps> = ({
  className,
  style,
}) => {
  const { calendarVisible, toggleCalendar } = useUserPreferences()

  return (
    <button
      onClick={toggleCalendar}
      className={className}
      style={{
        background: '#111',
        border: '1px solid #222',
        borderRadius: '6px',
        padding: '0.5rem',
        color: '#ffffff',
        fontSize: '0.875rem',
        fontWeight: '400',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        ...style,
      }}
      onMouseEnter={(e) => {
        const target = e.target as HTMLButtonElement
        target.style.background = '#222'
        target.style.borderColor = '#333'
      }}
      onMouseLeave={(e) => {
        const target = e.target as HTMLButtonElement
        target.style.background = '#111'
        target.style.borderColor = '#222'
      }}
      title={calendarVisible ? 'Hide Calendar' : 'Show Calendar'}
    >
      {calendarVisible ? (
        // Hide calendar icon (eye with slash)
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        // Show calendar icon (calendar)
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )}
    </button>
  )
}

export default CalendarToggle
