import React from 'react'
import { Link, graphql } from 'gatsby'

import Bio from '../../components/bio/bio'
import Layout from '../../components/layout/layout'
import SEO from '../../components/seo/seo'
import Calendar from '../../components/calendar/calendar'
import CalendarToggle from '../../components/calendar/calendar-toggle'
import { useUserPreferences } from '../../components/calendar/user-preferences-context'
import { rhythm, scale } from '../../utils/typography'
import '../../utils/audio-player.css'

const BlogPostTemplate = ({ data, pageContext, location }) => {
  const post = data.markdownRemark
  const siteTitle = data.site.siteMetadata.title
  const { previous, next } = pageContext
  const { calendarVisible } = useUserPreferences()

  return (
    <Layout location={location} title={siteTitle}>
      <SEO
        title={post.frontmatter.title}
        description={post.frontmatter.description || post.excerpt}
      />

      {/* Calendar - Conditionally Rendered */}

      <article>
        <header>
          <h1
            style={{
              marginTop: rhythm(1),
              marginBottom: 0,
              color: '#DE3163',
            }}
          >
            {post.frontmatter.title}
          </h1>
          <p
            style={{
              ...scale(-1 / 5),
              display: `block`,
              marginBottom: rhythm(1),
            }}
          >
            {post.frontmatter.date}
          </p>
        </header>
        {/* Calendar Toggle Button */}
        <div
          style={{
            marginBottom: '1rem',
            // display: 'flex',
            // justifyContent: 'center',
          }}
        >
          <CalendarToggle />
        </div>
        {calendarVisible && <Calendar />}
        <section dangerouslySetInnerHTML={{ __html: post.html }} />
        <footer>
          <Bio />
        </footer>
      </article>

      <nav>
        <ul
          style={{
            display: `flex`,
            flexWrap: `wrap`,
            justifyContent: `space-between`,
            listStyle: `none`,
            padding: 0,
          }}
        >
          <li>
            {previous && (
              <Link to={previous.fields.slug} rel="prev">
                ← {previous.frontmatter.title}
              </Link>
            )}
          </li>
          <li>
            {next && (
              <Link to={next.fields.slug} rel="next">
                {next.frontmatter.title} →
              </Link>
            )}
          </li>
        </ul>
      </nav>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `,
        }}
      />
    </Layout>
  )
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        description
      }
      fields {
        slug
      }
    }
  }
`
