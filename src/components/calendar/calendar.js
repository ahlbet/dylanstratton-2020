import React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import './calendar-dark.css'

const Calendar = () => {
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
              description
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
  const events = data.allMarkdownRemark.edges.map(({ node }) => {
    const { title, date, description } = node.frontmatter
    const slug = node.fields.slug

    return {
      id: title,
      title: `${title}`,
      start: date,
      url: slug,
      extendedProps: {
        description: description || '',
      },
    }
  })

  return (
    <div className="apple-calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
        initialView="dayGridMonth"
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
        }}
        dayMaxEvents={3}
        eventClick={(info) => {
          console.log('Event clicked:', info.event.title)
        }}
        eventDidMount={(info) => {
          if (info.event.extendedProps.description) {
            info.el.title = info.event.extendedProps.description
          }
        }}
        firstDay={1}
        weekNumbers={false}
        selectable={false}
        editable={false}
        eventDisplay="block"
        aspectRatio={1.35}
        ariaLabel="Blog posts calendar"
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

export default Calendar
