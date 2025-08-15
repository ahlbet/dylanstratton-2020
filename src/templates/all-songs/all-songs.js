import React, { useState, useEffect } from 'react'
import Layout from '../../components/layout/layout'
import SEO from '../../components/seo/seo'
import { rhythm } from '../../utils/typography'
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from '../../contexts/audio-player-context/audio-player-context'
import { FixedAudioPlayer } from '../../components/fixed-audio-player/FixedAudioPlayer'
import SongsTable from '../../components/songs-table/SongsTable'
import { SUPABASE_PUBLIC_URL_DOMAIN } from '../../utils/supabase-config'
import './all-songs.css'
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
                postDate: dailyEntry?.date
                  ? new Date(dailyEntry.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
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
                postDate: dailyEntry?.date
                  ? new Date(dailyEntry.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
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
      <Layout location={location} title="degreesminutesseconds">
        <SEO title="All Songs" description="Complete collection of all songs" />

        {/* Full-width table layout */}
        <div className="all-songs-container">
          {allAudioUrlsWithMetadata.length > 0 ? (
            <SongsTable audioUrlsWithMetadata={allAudioUrlsWithMetadata} />
          ) : (
            <div className="no-songs-available">No songs available</div>
          )}
        </div>

        <FixedAudioPlayer />
      </Layout>
    </AudioPlayerProvider>
  )
}

export default AllSongsPage
