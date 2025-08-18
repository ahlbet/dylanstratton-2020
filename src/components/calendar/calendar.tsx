import React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import { useCalendar, CalendarProvider } from './calendar-context'
import './calendar-dark.css'

// Types
interface BlogPost {
  frontmatter: {
    title: string
    date: string
    description?: string
  }
  fields: {
    slug: string
  }
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  url: string
  extendedProps: {
    description: string
  }
  allDay: boolean
}

interface ViewInfo {
  view: {
    type: string
  }
}

interface DateInfo {
  view: {
    currentStart: Date
  }
}

interface EventInfo {
  event: {
    extendedProps?: {
      description?: string
    }
  }
  el: HTMLElement
}

const CalendarComponent: React.FC = () => {
  const { currentView, currentDate, setView, setDate } = useCalendar()

  const data = useStaticQuery(graphql`
    query {
      allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/content/blog/" } }
        sort: { frontmatter: { date: DESC } }
      ) {
        edges {
          node {
            frontmatter {
              title
              date
            }
            fields {
              slug
            }
          }
        }
      }
    }
  `)

  // Generate events from blog posts
  const events: CalendarEvent[] =
    data?.allMarkdownRemark?.edges?.map(({ node }: { node: BlogPost }) => {
      const { title, date, description } = node.frontmatter || {}
      const slug = node.fields?.slug

      return {
        id: title,
        title: title || 'Untitled',
        start: date ? new Date(date) : new Date(),
        end: date ? new Date(date) : new Date(),
        url: slug || '#',
        extendedProps: {
          description: description || '',
        },
        allDay: true,
      }
    }) || []

  // Handle view change
  const handleViewChange = (viewInfo: ViewInfo): void => {
    setView(viewInfo.view.type as any)
  }

  // Handle date change (navigation) - use the current date from the view
  const handleDateChange = (dateInfo: DateInfo): void => {
    // Use the current date from the view, not the start date
    const currentViewDate = dateInfo.view.currentStart
    if (currentViewDate) {
      // Convert to YYYY-MM-DD format to avoid timezone issues
      const dateString = currentViewDate.toISOString().split('T')[0]
      setDate(dateString)
    }
  }

  return (
    <div className="apple-calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
        initialView={currentView}
        initialDate={currentDate}
        events={events}
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listWeek',
        }}
        buttonText={{
          today: 'Today',
          month: 'Month',
          week: 'Week',
          list: 'List',
          prev: '‹',
          next: '›',
        }}
        dayMaxEvents={3}
        eventClick={(info: EventInfo) => {
          // Event clicked - could add navigation logic here if needed
        }}
        eventDidMount={(info: EventInfo) => {
          if (info.event.extendedProps?.description) {
            info.el.title = info.event.extendedProps.description
          }
        }}
        firstDay={1}
        weekNumbers={false}
        selectable={false}
        editable={false}
        eventDisplay="block"
        aspectRatio={1.35}
        // ariaLabel removed - not supported in this FullCalendar version
        // Event handlers for state management
        datesSet={handleDateChange}
        viewDidMount={handleViewChange}
        // TimeGrid specific options
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        allDaySlot={false}
        // List view options
        listDayFormat={{ month: 'long', day: 'numeric', year: 'numeric' }}
        listDaySideFormat={{ month: 'short', day: 'numeric' }}
      />
    </div>
  )
}

// Main Calendar component that provides the context
const Calendar: React.FC = () => {
  return (
    <CalendarProvider>
      <CalendarComponent />
    </CalendarProvider>
  )
}

export default Calendar
