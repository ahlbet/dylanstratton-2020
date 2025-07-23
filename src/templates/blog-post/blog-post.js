import React from 'react'
import { Link, graphql } from 'gatsby'

import Bio from '../../components/bio/bio'
import Layout from '../../components/layout/layout'
import SEO from '../../components/seo/seo'
import Calendar from '../../components/calendar/calendar'
import CalendarToggle from '../../components/calendar/calendar-toggle'
import { useUserPreferences } from '../../components/calendar/user-preferences-context'
import GridSketch from '../../components/grid-sketch/grid-sketch'
import BlogAudioPlayer from '../../components/blog-audio-player/BlogAudioPlayer'
import {
  extractAudioUrls,
  removeAudioFromHtml,
} from '../../utils/extractAudioUrls'
import './blog-post.css'
import { rhythm, scale } from '../../utils/typography'
import '../../utils/audio-player.css'

// Lazy load the audio reactive grid sketch to prevent SSR issues
const AudioReactiveGridSketch = React.lazy(
  () =>
    import(
      '../../components/audio-reactive-grid-sketch/audio-reactive-grid-sketch'
    )
)

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

  // Extract audio URLs from the post content
  const audioUrls = extractAudioUrls(post.html)

  // Remove audio elements from HTML to prevent duplicates
  const cleanedHtml = removeAudioFromHtml(post.html)

  return (
    <Layout location={location} title={siteTitle}>
      <SEO
        title={post.frontmatter.title}
        description={post.frontmatter.description || post.excerpt}
      />

      {/* 2-Column Layout Container */}
      <div className="blog-layout-container">
        {/* Left Column - Content */}
        <div className="left-column">
          {/* Header, Navigation, Calendar - Always first */}
          <div className="content-section">
            <article>
              <header>
                {/* Title */}
                <h1
                  style={{
                    marginTop: rhythm(1),
                    marginBottom: 0,
                    color: '#DE3163',
                  }}
                >
                  {post.frontmatter.title}
                </h1>

                {/* Date */}
                <p
                  style={{
                    ...scale(-1 / 5),
                    display: `block`,
                    marginBottom: rhythm(1),
                  }}
                >
                  {post.frontmatter.date}
                </p>

                {/* Top Navigation */}
                <nav>
                  <ul
                    style={{
                      display: `flex`,
                      flexWrap: `wrap`,
                      justifyContent: `space-between`,
                      listStyle: `none`,
                      padding: 0,
                      marginLeft: 0,
                      marginBottom: rhythm(1),
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

              {/* Calendar Toggle Button */}
              <div
                style={{
                  marginBottom: '1rem',
                }}
              >
                <CalendarToggle />
              </div>

              {/* Calendar */}
              {calendarVisible && (
                <div style={{ marginBottom: rhythm(1) }}>
                  <Calendar />
                </div>
              )}
            </article>
          </div>

          {/* Canvas - Shows on mobile between calendar and audio player */}
          <div className="canvas-section">
            {typeof window !== 'undefined' && (
              <React.Suspense
                fallback={
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                    }}
                  >
                    Loading visual...
                  </div>
                }
              >
                <AudioReactiveGridSketch
                  markovText={markovText}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
              </React.Suspense>
            )}
          </div>

          {/* Audio Player - After canvas on mobile */}
          <div className="audio-player-section">
            {audioUrls.length > 0 && (
              <div style={{ marginBottom: rhythm(1) }}>
                <BlogAudioPlayer
                  audioUrls={audioUrls}
                  postTitle={post.frontmatter.title}
                  postDate={post.frontmatter.date}
                />
              </div>
            )}
          </div>

          {/* Post Content and Footer */}
          <div className="post-content-section">
            <article>
              {/* Markov Text (Post Content) */}
              <section
                style={{ marginBottom: rhythm(2) }}
                dangerouslySetInnerHTML={{ __html: cleanedHtml }}
              />

              <footer>
                <Bio />
              </footer>
            </article>

            {/* Bottom Navigation */}
            <nav style={{ marginTop: rhythm(2) }}>
              <ul
                style={{
                  display: `flex`,
                  flexWrap: `wrap`,
                  justifyContent: `space-between`,
                  listStyle: `none`,
                  padding: 0,
                  marginLeft: 0,
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
          </div>
        </div>

        {/* Right Column - Audio Reactive Grid Sketch (Desktop only) */}
        <div className="right-column">
          {typeof window !== 'undefined' && (
            <React.Suspense
              fallback={
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  Loading visual...
                </div>
              }
            >
              <AudioReactiveGridSketch
                markovText={markovText}
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
            </React.Suspense>
          )}
        </div>
      </div>
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
      }
      fields {
        slug
      }
    }
  }
`
