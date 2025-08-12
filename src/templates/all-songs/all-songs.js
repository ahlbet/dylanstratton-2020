import React, { useState, useEffect } from 'react'
import Layout from '../../components/layout/layout'
import SEO from '../../components/seo/seo'
import { rhythm } from '../../utils/typography'
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from '../../contexts/audio-player-context/audio-player-context'
import { FixedAudioPlayer } from '../../components/fixed-audio-player/FixedAudioPlayer'
import AllSongsPlaylist from '../../components/all-songs-playlist/all-songs-playlist'
import DynamicMarkovText from '../../components/dynamic-markov-text/DynamicMarkovText'
import AudioFFT from '../../components/audio-fft/AudioFFT'
import { SUPABASE_PUBLIC_URL_DOMAIN } from '../../utils/supabase-config'
import { isLocalDev } from '../../utils/local-dev-utils'
import {
  removeBucketPrefix,
  extractFilenameFromStoragePath,
  generatePresignedUrlsForAudio,
} from '../../utils/presigned-urls'

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

const AllSongsPage = ({ pageContext, location }) => {
  const { supabaseData } = pageContext
  const [allAudioUrlsWithMetadata, setAllAudioUrlsWithMetadata] = useState([])
  const [allMarkovText, setAllMarkovText] = useState('')

  // Generate audio URLs using useEffect (similar to blog post template)
  useEffect(() => {
    const generateAudioUrls = () => {
      if (supabaseData && supabaseData.audio && supabaseData.daily) {
        // Define variables at the top so they're available in all scopes
        const dailyAudio = supabaseData.audio
        const dailyEntries = supabaseData.daily

        try {
          if (isLocalDev()) {
            // Development mode: use local audio files
            const localAudio = dailyAudio.map((audio) => {
              const dailyEntry = dailyEntries.find(
                (daily) => daily.id === audio.daily_id
              )

              const filename = extractFilenameFromStoragePath(
                audio.storage_path
              )
              const audioUrl = `/local-audio/${filename}.wav`

              return {
                url: audioUrl,
                duration:
                  audio.duration !== null && audio.duration !== undefined
                    ? audio.duration
                    : null,
                title: filename, // Clean title without extension (same as blog posts)
                postTitle: dailyEntry?.title || 'Unknown', // Keep for other uses
                postDate: dailyEntry?.created_at
                  ? new Date(dailyEntry.created_at).toLocaleDateString(
                      'en-US',
                      {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )
                  : 'Unknown Date',
                postSlug: `/${dailyEntry?.title || 'unknown'}`,
              }
            })

            setAllAudioUrlsWithMetadata(localAudio)
            setAllMarkovText(
              dailyEntries.map((entry) => entry.title || '').join(' ')
            )
          } else {
            // Production mode: store storage paths, generate presigned URLs on-demand when played
            const productionAudio = dailyAudio.map((audio) => {
              const dailyEntry = dailyEntries.find(
                (daily) => daily.id === audio.daily_id
              )

              // Use the display filename that was already extracted (same pattern as blog posts)
              const filename =
                audio.displayFilename ||
                extractFilenameFromStoragePath(audio.storage_path)

              return {
                // No initial URL - will be generated on-demand when track is played
                url: null,
                // Store storage path for on-demand presigned URL generation
                storagePath: audio.storage_path,
                duration:
                  audio.duration !== null && audio.duration !== undefined
                    ? audio.duration
                    : null,
                title: filename, // Clean title without extension (same as blog posts)
                postTitle: dailyEntry?.title || 'Unknown', // Keep for other uses
                postDate: dailyEntry?.created_at
                  ? new Date(dailyEntry.created_at).toLocaleDateString(
                      'en-US',
                      {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )
                  : 'Unknown Date',
                postSlug: `/${dailyEntry?.title || 'unknown'}`,
              }
            })

            setAllAudioUrlsWithMetadata(productionAudio)
            setAllMarkovText(
              dailyEntries.map((entry) => entry.title || '').join(' ')
            )
          }
        } catch (error) {
          console.error('Error generating audio URLs:', error)
          // Fall back to public URLs on error
          const fallbackAudio = supabaseData.audio.map((audio) => {
            const dailyEntry = dailyEntries.find(
              (daily) => daily.id === audio.daily_id
            )

            return {
              url: null, // No URL - will be generated on-demand
              storagePath: audio.storage_path, // Keep storage path for on-demand generation
              duration:
                audio.duration !== null && audio.duration !== undefined
                  ? audio.duration
                  : null,
              title: extractFilenameFromStoragePath(audio.storage_path), // Clean title without extension
              postTitle: dailyEntry?.title || 'Unknown', // Keep for other uses
              postDate: dailyEntry?.created_at
                ? new Date(dailyEntry.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Unknown Date',
              postSlug: `/${dailyEntry?.title || 'unknown'}`,
            }
          })

          setAllAudioUrlsWithMetadata(fallbackAudio)
          setAllMarkovText(
            supabaseData.daily.map((entry) => entry.title || '').join(' ')
          )
        }
      } else {
        // No Supabase data available
        setAllAudioUrlsWithMetadata([])
        setAllMarkovText('~~~')
      }
    }

    generateAudioUrls()
  }, [supabaseData])

  return (
    <AudioPlayerProvider>
      <AllSongsAutopilotHandler />
      <Layout location={location} title="All Songs">
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
              {allAudioUrlsWithMetadata.length > 0 ? (
                <div style={{ marginBottom: rhythm(1) }}>
                  <AllSongsPlaylist
                    audioUrlsWithMetadata={allAudioUrlsWithMetadata}
                  />
                </div>
              ) : (
                <div></div>
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
                <AudioFFT markovText={allMarkovText} />
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
