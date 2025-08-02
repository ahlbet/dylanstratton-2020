import React, { useEffect } from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/layout/layout'
import SEO from '../components/seo/seo'
import { rhythm } from '../utils/typography'
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from '../contexts/audio-player-context/audio-player-context'
import { FixedAudioPlayer } from '../components/fixed-audio-player/FixedAudioPlayer'
import AllSongsPlaylist from '../components/all-songs-playlist/all-songs-playlist'
import DynamicMarkovText from '../components/dynamic-markov-text/DynamicMarkovText'
import { extractAudioUrls } from '../utils/extractAudioUrls'

// Lazy load the audio reactive grid sketch to prevent SSR issues
const AudioReactiveGridSketch = React.lazy(
  () =>
    import(
      '../components/audio-reactive-grid-sketch/audio-reactive-grid-sketch'
    )
)

// Component to handle autopilot state on /all page
const AllSongsAutopilotHandler = () => {
  const { isAutopilotOn, toggleAutopilot } = useAudioPlayer()

  useEffect(() => {
    // Turn off autopilot when /all page loads
    if (isAutopilotOn) {
      toggleAutopilot()
    }
  }, []) // Only run once on mount

  return null
}

const AllSongsPage = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata.title
  const posts = data.allMarkdownRemark.edges

  // Extract all audio URLs from all posts with their source post info
  const allAudioUrlsWithMetadata = posts.reduce((urls, { node }) => {
    const postAudioUrls = extractAudioUrls(node.html)
    // Add source post info to each URL
    const urlsWithSource = postAudioUrls.map((url) => ({
      url,
      postTitle: node.frontmatter.title,
      postDate: node.frontmatter.date,
      postSlug: node.fields.slug,
    }))
    return [...urls, ...urlsWithSource]
  }, [])

  // Create a combined markov text from all posts
  const allMarkovText = posts
    .map(({ node }) => {
      // Extract text content from HTML (simplified)
      return node.excerpt || ''
    })
    .join(' ')

  return (
    <AudioPlayerProvider>
      <AllSongsAutopilotHandler />
      <Layout location={location} title={siteTitle}>
        <SEO title="All" description="Complete" />

        {/* 2-Column Layout Container */}
        <div className="blog-layout-container">
          {/* Left Column - Content */}
          <div className="left-column">
            {/* Header */}

            {/* Audio Player Section */}
            <div
              className="audio-player-section"
              style={{ marginTop: rhythm(1) }}
            >
              {allAudioUrlsWithMetadata.length > 0 && (
                <div style={{ marginBottom: rhythm(1) }}>
                  <AllSongsPlaylist
                    audioUrlsWithMetadata={allAudioUrlsWithMetadata}
                  />
                </div>
              )}
            </div>

            {/* Markov Generator Section */}
            <div className="post-content-section">
              <article>
                <section style={{ marginBottom: rhythm(2) }}>
                  <DynamicMarkovText maxLines={200} />
                </section>
              </article>
            </div>
          </div>

          {/* Right Column - Audio Reactive Grid Sketch */}
          <div className="right-column">
            {typeof window !== 'undefined' && (
              <React.Suspense
                fallback={
                  <div
                    style={{
                      width: '100%',
                      height: 'calc(100% - 300px)',
                      backgroundColor: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                    }}
                  ></div>
                }
              >
                <AudioReactiveGridSketch
                  markovText={allMarkovText}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
              </React.Suspense>
            )}
          </div>
        </div>
        <FixedAudioPlayer />
      </Layout>
    </AudioPlayerProvider>
  )
}

export default AllSongsPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: ASC }) {
      edges {
        node {
          excerpt
          html
          fields {
            slug
          }
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
          }
        }
      }
    }
  }
`
