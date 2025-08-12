import React, { useEffect } from 'react'
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
import { convertAudioUrlsToLocal } from '../../utils/local-audio-urls'
import { SUPABASE_PUBLIC_URL_DOMAIN } from '../../utils/supabase-config'

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

  // Use Supabase data if available, otherwise fall back to markdown
  let allAudioUrlsWithMetadata = []
  let allMarkovText = ''

  if (supabaseData && supabaseData.audio && supabaseData.daily) {
    // Use Supabase data with proper integer IDs (same pattern as blog posts)
    const dailyAudio = supabaseData.audio
    const dailyEntries = supabaseData.daily

    allAudioUrlsWithMetadata = dailyAudio.map((audio) => {
      // Find the corresponding daily entry (both IDs are integers)
      const dailyEntry = dailyEntries.find(
        (daily) => daily.id === audio.daily_id
      )

      const fullUrl = `https://${SUPABASE_PUBLIC_URL_DOMAIN}/storage/v1/object/public/${audio.storage_path}`

      return {
        url: convertAudioUrlsToLocal([fullUrl])[0],
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

    // Create markov text from daily entries
    allMarkovText = dailyEntries.map((entry) => entry.title || '').join(' ')
  } else {
    // Fall back to markdown data (legacy support)
    // For now, show a message that no data is available
    allAudioUrlsWithMetadata = []
    allMarkovText = 'No audio data available'
  }

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
                <div style={{ marginBottom: rhythm(1), color: '#ff6b6b' }}>
                  No audio data available. Please check the build process.
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
