import React from 'react'
import { Link, graphql } from 'gatsby'

import Bio from '../../components/bio/bio'
import Layout from '../../components/layout/layout'
import SEO from '../../components/seo/seo'
import Calendar from '../../components/calendar/calendar'
import CalendarToggle from '../../components/calendar/calendar-toggle'
import { useUserPreferences } from '../../components/calendar/user-preferences-context'
import AudioReactiveGridSketch from '../../components/audio-reactive-grid-sketch/audio-reactive-grid-sketch'
import GridSketch from '../../components/grid-sketch/grid-sketch'
import { rhythm, scale } from '../../utils/typography'
import '../../utils/audio-player.css'

const BlogPostTemplate = ({ data, pageContext, location }) => {
  const post = data.markdownRemark
  const siteTitle = data.site.siteMetadata.title
  const { previous, next } = pageContext
  const { calendarVisible } = useUserPreferences()

  // Extract Markov text from the post content
  const extractMarkovText = (html) => {
    // Find all blockquote elements in the HTML
    const blockquoteRegex = /<blockquote[^>]*>(.*?)<\/blockquote>/gs
    const matches = html.match(blockquoteRegex)

    if (!matches) return ''

    // Extract text content from blockquotes and join them
    const markovText = matches
      .map((blockquote) => {
        // Remove HTML tags and get just the text
        return blockquote.replace(/<[^>]*>/g, '').trim()
      })
      .filter((text) => text.length > 0)
      .join(' ')

    return markovText
  }

  const markovText = extractMarkovText(post.html)

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
        </header>

        {/* Audio-Reactive Grid Sketch at the top of each blog post */}
        <div
          style={{
            marginBottom: rhythm(2),
            width: '100%',
          }}
        >
          <AudioReactiveGridSketch
            markovText={markovText}
            style={{
              width: '100%',
              height: '400px',
            }}
          />
        </div>

        {/* <div
          style={{
            marginBottom: rhythm(2),
            width: '100%',
          }}
        >
          <GridSketch
            style={{
              width: '100%',
              height: '400px',
            }}
          />
        </div> */}
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
