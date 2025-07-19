import { useCalendar } from './calendar-context'

/**
 * Custom hook for easy access to calendar state and actions
 * @returns {Object} Calendar state and actions
 */
export const useCalendarState = () => {
  const calendar = useCalendar()

  return {
    // State
    currentView: calendar.currentView,
    currentDate: calendar.currentDate,
    viewOptions: calendar.viewOptions,

    // Actions
    setView: calendar.setView,
    setDate: calendar.setDate,
    setCurrentDate: calendar.setCurrentDate,

    // Convenience methods
    isMonthView: calendar.currentView === 'dayGridMonth',
    isWeekView: calendar.currentView === 'timeGridWeek',
    isListView: calendar.currentView === 'listWeek',

    // Format current date for display
    getCurrentDateDisplay: () => {
      const date = new Date(calendar.currentDate)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    },

    // Get view display name
    getViewDisplayName: () => {
      const viewMap = {
        dayGridMonth: 'Month',
        timeGridWeek: 'Week',
        listWeek: 'List',
      }
      return viewMap[calendar.currentView] || 'Month'
    },
  }
}
