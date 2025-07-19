import React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'

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
    <div className="myCustomHeight">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        eventClick={(info) => {
          // Handle event click - FullCalendar will handle navigation via url property
          console.log('Event clicked:', info.event.title)
        }}
        eventDidMount={(info) => {
          // Optional: Add tooltips or other enhancements
          if (info.event.extendedProps.description) {
            info.el.title = info.event.extendedProps.description
          }
        }}
      />
    </div>
  )
}

export default Calendar
