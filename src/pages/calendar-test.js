import React from 'react'
import Layout from '../components/layout/layout'
import Calendar from '../components/calendar/calendar'
import SEO from '../components/seo/seo'

const CalendarTestPage = () => {
  return (
    <Layout>
      <SEO
        title="Calendar Test"
        description="Minimal dark mode calendar design"
      />
      <div
        style={{
          padding: '2rem',
          maxWidth: '1200px',
          margin: '0 auto',
          background: '#0a0a0a',
          minHeight: '100vh',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            marginBottom: '2rem',
            fontSize: '2rem',
            fontWeight: '400',
            color: '#ffffff',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Calendar
        </h1>
        <p
          style={{
            textAlign: 'center',
            marginBottom: '3rem',
            fontSize: '1rem',
            color: '#999',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Minimal dark mode design
        </p>
        <Calendar />
      </div>
    </Layout>
  )
}

export default CalendarTestPage
