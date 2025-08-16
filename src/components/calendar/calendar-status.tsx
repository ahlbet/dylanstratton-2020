import React from 'react'
import { useCalendarState } from './use-calendar-state'

/**
 * Example component showing how to use calendar state in other parts of the site
 * This could be used in a header, sidebar, or any other component
 */
const CalendarStatus: React.FC = () => {
  const {
    currentView,
    getCurrentDateDisplay,
    getViewDisplayName,
    setCurrentDate,
  } = useCalendarState()

  return (
    <div
      style={{
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '1rem',
        margin: '1rem 0',
        color: '#ffffff',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <h3
        style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1rem',
          fontWeight: '500',
          color: '#999',
        }}
      >
        Calendar Status
      </h3>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.875rem',
        }}
      >
        <div>
          <span style={{ color: '#999' }}>Current Date: </span>
          <span style={{ color: '#ffffff' }}>{getCurrentDateDisplay()}</span>
        </div>

        <div>
          <span style={{ color: '#999' }}>View: </span>
          <span style={{ color: '#007aff' }}>{getViewDisplayName()}</span>
        </div>

        <button
          onClick={setCurrentDate}
          style={{
            background: '#333',
            border: '1px solid #555',
            borderRadius: '4px',
            padding: '0.25rem 0.5rem',
            color: '#ffffff',
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement
            target.style.background = '#444'
            target.style.borderColor = '#666'
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement
            target.style.background = '#333'
            target.style.borderColor = '#555'
          }}
        >
          Go to Today
        </button>
      </div>

      <div
        style={{
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: '#666',
          fontStyle: 'italic',
        }}
      >
        State persists across navigation
      </div>
    </div>
  )
}

export default CalendarStatus
