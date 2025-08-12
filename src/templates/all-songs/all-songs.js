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
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)

  // Generate audio URLs using useEffect (similar to blog post template)
  useEffect(() => {
    const generateAudioUrls = async () => {
      if (supabaseData && supabaseData.audio && supabaseData.daily) {
        setIsLoadingAudio(true)

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
                // Use clean filename as title (without extension)
                postTitle: filename || dailyEntry?.title || 'Unknown',
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
            // Production mode: generate presigned URLs
            const audioWithUrls = await generatePresignedUrlsForAudio(
              dailyAudio,
              3600 // 1 hour expiry
            )

            const presignedAudio = audioWithUrls.map((audio) => {
              const dailyEntry = dailyEntries.find(
                (daily) => daily.id === audio.daily_id
              )

              // Use displayFilename from presigned URL generation (clean filename without extension)
              const cleanTitle =
                audio.displayFilename || dailyEntry?.title || 'Unknown'

              return {
                url: audio.url, // Use presigned URL directly
                duration:
                  audio.duration !== null && audio.duration !== undefined
                    ? audio.duration
                    : null,
                postTitle: cleanTitle,
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

            setAllAudioUrlsWithMetadata(presignedAudio)
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
              url: `https://${SUPABASE_PUBLIC_URL_DOMAIN}/storage/v1/object/public/${audio.storage_path}`,
              duration:
                audio.duration !== null && audio.duration !== undefined
                  ? audio.duration
                  : null,
              postTitle: dailyEntry?.title || 'Unknown',
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
        } finally {
          setIsLoadingAudio(false)
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
              {isLoadingAudio ? (
                <div style={{ marginBottom: rhythm(1), color: '#666' }}>
                  ~~~
                </div>
              ) : allAudioUrlsWithMetadata.length > 0 ? (
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
