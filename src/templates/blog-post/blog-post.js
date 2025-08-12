import React, { useEffect, useState } from 'react'
import { Link, graphql } from 'gatsby'

import Bio from '../../components/bio/bio'
import Layout from '../../components/layout/layout'
import SEO from '../../components/seo/seo'
import Calendar from '../../components/calendar/calendar'
import CalendarToggle from '../../components/calendar/calendar-toggle'
import { useUserPreferences } from '../../components/calendar/user-preferences-context'
import BlogAudioPlayer from '../../components/blog-audio-player/BlogAudioPlayer'
import DynamicMarkovText from '../../components/dynamic-markov-text/DynamicMarkovText'
import {
  extractAudioUrls,
  removeAudioFromHtml,
} from '../../utils/extractAudioUrls'
import {
  convertAudioUrlsToLocal,
  convertCoverArtUrlToLocal,
  getCoverArtUrl,
} from '../../utils/local-audio-urls'
import {
  generatePresignedUrlsForAudio,
  removeBucketPrefix,
  extractFilenameFromStoragePath,
} from '../../utils/presigned-urls'
import { SUPABASE_PUBLIC_URL_DOMAIN } from '../../utils/supabase-config'
import { isLocalDev } from '../../utils/local-dev-utils'
import './blog-post.css'
import { rhythm, scale } from '../../utils/typography'
import '../../utils/audio-player.css'
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from '../../contexts/audio-player-context/audio-player-context'
import { FixedAudioPlayer } from '../../components/fixed-audio-player/FixedAudioPlayer'
import AudioFFT from '../../components/audio-fft/AudioFFT' // Add this import for the audio FFT component

// Component to handle autopilot auto-play and playlist setup
const AutopilotAutoPlay = ({ audioData }) => {
  const { setPlaylist, playlist, playTrack } = useAudioPlayer()

  useEffect(() => {
    // Always set up the playlist for this page's audio tracks
    if (audioData.length > 0) {
      const tracks = audioData.map((audioItem, index) => {
        const url = typeof audioItem === 'string' ? audioItem : audioItem.url
        const filename = url
          .split('/')
          .pop()
          .replace(/\.[^/.]+$/, '')
        return {
          title: filename || 'Unknown Track',
          artist: 'degreesminutesseconds',
          album: 'Unknown Album',
          duration: '0:00',
          url: url, // Use 'url' to match what FixedAudioPlayer expects
          src: url,
          downloadUrl: url,
          downloadFilename: filename,
        }
      })

      // Only set playlist if it's different from current playlist
      const currentUrls = playlist.map((track) => track.url)
      const newUrls = audioData.map((item) =>
        typeof item === 'string' ? item : item.url
      )

      if (JSON.stringify(currentUrls) !== JSON.stringify(newUrls)) {
        setPlaylist(tracks)
      }

      // Check if we navigated here via autopilot
      const isAutopilotNavigation =
        localStorage.getItem('autopilotNavigation') === 'true'

      if (isAutopilotNavigation) {
        // Clear the flag
        localStorage.removeItem('autopilotNavigation')

        // Play a random track with a small delay
        const randomIndex = Math.floor(Math.random() * tracks.length)

        // Small delay to ensure the audio element is ready
        setTimeout(() => {
          try {
            playTrack(randomIndex, tracks)
          } catch (error) {
            console.warn('Autopilot auto-play failed:', error)
          }
        }, 100)
      } else {
        // Check if we should auto-play (e.g., when navigating back to a page with audio)
        // Only auto-play if audio was playing when navigation occurred
        const wasAudioPlaying =
          localStorage.getItem('audioWasPlaying') === 'true'

        if (wasAudioPlaying) {
          // Clear the flag
          localStorage.removeItem('audioWasPlaying')

          // Play a random track with a small delay
          const randomIndex = Math.floor(Math.random() * tracks.length)

          // Small delay to ensure the audio element is ready
          setTimeout(() => {
            try {
              playTrack(randomIndex, tracks)
            } catch (error) {
              console.warn('Auto-play failed:', error)
            }
          }, 100)
        }
      }
    } else {
      // If no audio URLs, clear the playlist
      setPlaylist([])
    }
  }, [audioData, setPlaylist, playTrack, playlist])

  return null
}

// Main component that wraps everything in AudioPlayerProvider
const BlogPostTemplate = ({ data, pageContext, location }) => {
  const post = data.markdownRemark
  const siteTitle = data.site.siteMetadata.title
  const { previous, next, markdownData, supabaseData } = pageContext
  const { calendarVisible } = useUserPreferences()

  // State for audio data with pre-signed URLs
  const [audioData, setAudioData] = useState([])
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)

  let markovText = ''
  let cleanedHtml = post.html

  // Generate audio URLs (local or presigned based on environment)
  useEffect(() => {
    const generateAudioUrls = async () => {
      if (supabaseData && supabaseData.audio && supabaseData.audio.length > 0) {
        setIsLoadingAudio(true)
        try {
          // Check if we should use local audio files
          const isLocalDevMode = isLocalDev()

          let processedAudio

          if (isLocalDevMode) {
            // Use local audio files for development
            processedAudio = supabaseData.audio.map((audio) => {
              // Extract clean filename from storage_path
              const filename = extractFilenameFromStoragePath(
                audio.storage_path
              )

              // Convert to local audio URL
              const localUrl = `/local-audio/${filename}.wav`

              return {
                ...audio,
                url: localUrl,
                duration: audio.duration || null,
                format: audio.format || 'audio/wav',
                title: filename, // Clean title without extension
                artist: 'Daily Audio',
                album: post.frontmatter.title,
              }
            })
          } else {
            // Generate pre-signed URLs for production
            const audioWithUrls = await generatePresignedUrlsForAudio(
              supabaseData.audio,
              3600
            ) // 1 hour expiry

            processedAudio = audioWithUrls.map((audio) => {
              // Use the display filename that was already extracted
              const filename =
                audio.displayFilename ||
                extractFilenameFromStoragePath(audio.storage_path)

              return {
                ...audio,
                url: audio.url, // Use pre-signed URL directly
                duration: audio.duration || null,
                format: audio.format || 'audio/wav',
                title: filename, // Clean title without extension
                artist: 'Daily Audio',
                album: post.frontmatter.title,
              }
            })
          }

          setAudioData(processedAudio)
        } catch (error) {
          console.error('Error generating audio URLs:', error)
          // Fall back to public URLs on error
          const fallbackAudio = supabaseData.audio.map((audio) => {
            const fullUrl = `https://${SUPABASE_PUBLIC_URL_DOMAIN}/storage/v1/object/public/${audio.storage_path}`
            // Extract clean filename from storage_path
            const filename = extractFilenameFromStoragePath(audio.storage_path)

            return {
              ...audio,
              url: fullUrl, // Use public URL directly (no local conversion needed)
              duration: audio.duration || null,
              format: audio.format || 'audio/wav',
              title: filename, // Clean title without extension
              artist: 'Daily Audio',
              album: post.frontmatter.title,
            }
          })
          setAudioData(fallbackAudio)
        } finally {
          setIsLoadingAudio(false)
        }
      } else {
        // Fall back to extracting from markdown HTML
        const extractedUrls = convertAudioUrlsToLocal(
          extractAudioUrls(post.html)
        )
        const fallbackAudio = extractedUrls.map((url) => {
          // Extract filename from URL
          const urlParts = url.split('/')
          const filename = urlParts[urlParts.length - 1].replace(/\.wav$/, '')

          return {
            url,
            duration: null,
            format: 'audio/wav',
            title: filename, // Clean title without extension
            artist: 'Daily Audio',
            album: post.frontmatter.title,
          }
        })
        setAudioData(fallbackAudio)
      }
    }

    generateAudioUrls()
  }, [supabaseData, post.html])

  if (
    supabaseData &&
    supabaseData.markovTexts &&
    supabaseData.markovTexts.length > 0
  ) {
    // Use Supabase markov texts
    markovText = supabaseData.markovTexts
      .map((markov) => markov.text_content)
      .join(' ')
  } else {
    // Fall back to extracting from markdown HTML
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
    markovText = extractMarkovText(post.html)
  }

  // Remove audio elements from HTML to prevent duplicates (only if we're using Supabase audio)
  if (supabaseData && supabaseData.audio && supabaseData.audio.length > 0) {
    cleanedHtml = removeAudioFromHtml(post.html)
  }

  return (
    <AudioPlayerProvider>
      <AutopilotAutoPlay audioData={audioData} />
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
                    {supabaseData?.daily?.coherency_level && (
                      <span style={{ fontSize: '0.8em', opacity: 0.8 }}>
                        {' '}
                        {supabaseData.daily.coherency_level}
                      </span>
                    )}
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

                {/* Calendar Toggle Button
                <div
                  style={{
                    marginBottom: '1rem',
                  }}
                >
                  <CalendarToggle />
                </div>

                {/* Calendar */}
                {/*{calendarVisible && (
                  <div style={{ marginBottom: rhythm(1) }}>
                    <Calendar />
                  </div>
                //)}
                */}
              </article>
            </div>

            {/* Canvas - Shows on mobile between calendar and audio player */}

            {/* Audio Player - After canvas on mobile */}
            <div className="audio-player-section">
              {audioData.length > 0 && !isLoadingAudio && (
                <div style={{ marginBottom: rhythm(1) }}>
                  <BlogAudioPlayer
                    audioData={audioData}
                    postTitle={post.frontmatter.title}
                    postDate={post.frontmatter.date}
                    coverArtUrl={(() => {
                      const coverArtSource = supabaseData?.daily?.cover_art
                        ? getCoverArtUrl(supabaseData.daily.cover_art)
                        : post.frontmatter.cover_art

                      // Only convert to local URLs in development mode
                      if (isLocalDev()) {
                        return convertCoverArtUrlToLocal(
                          coverArtSource,
                          post.frontmatter.title
                        )
                      }

                      // In production, return the original URL unchanged
                      return coverArtSource
                    })()}
                  />
                </div>
              )}
            </div>

            {/* Post Content and Footer */}
            <div className="post-content-section">
              <article>
                {/* Markov Text (Post Content) */}
                {/* Markov Texts from Supabase */}
                {supabaseData &&
                  supabaseData.markovTexts &&
                  supabaseData.markovTexts.length > 0 && (
                    <section style={{ marginBottom: rhythm(2) }}>
                      {supabaseData.markovTexts.map((markov, index) => (
                        <blockquote
                          key={markov.id}
                          style={{
                            borderLeft: '4px solid #DE3163',
                            margin: '1rem 0',
                            padding: '0.5rem 1rem',
                            fontStyle: 'italic',
                            backgroundColor: 'rgba(222, 49, 99, 0.05)',
                          }}
                        >
                          {markov.coherency_level && (
                            <span
                              style={{
                                fontSize: '0.9em',
                                opacity: 0.7,
                                fontWeight: 'bold',
                              }}
                            >
                              {markov.coherency_level}{' '}
                            </span>
                          )}
                          {markov.text_content}
                        </blockquote>
                      ))}
                    </section>
                  )}

                {/* Dynamic Markov Text Generator */}
                <div style={{ marginBottom: rhythm(2) }}>
                  <DynamicMarkovText />
                </div>

                <footer style={{ marginTop: '25px' }}>
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
                  ></div>
                }
              >
                {/* Single AudioFFT instance - positioned responsively */}
                <div className="responsive-audio-fft">
                  <AudioFFT markovText={markovText} />
                </div>
              </React.Suspense>
            )}
          </div>
        </div>
        <FixedAudioPlayer />
      </Layout>
    </AudioPlayerProvider>
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
        cover_art
        daily_id
      }
      fields {
        slug
      }
    }
  }
`
