import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import JSZip from 'jszip'
import { useAudioPlayer } from '../../contexts/audio-player-context/audio-player-context'
import { trackAudioEvent } from '../../utils/plausible-analytics'
import { useScrollToTrack } from '../../hooks/use-scroll-to-track'
import TrackItem from '../track-item/TrackItem'
import './BlogAudioPlayer.css'

// Custom playlist component
const CustomPlaylist = ({
  tracks,
  currentIndex,
  isPlaying,
  handleTrackClick,
  coverArtUrl,
  postTitle,
  totalDuration,
  trackListRef,
  setTrackItemRef,
  isMobile,
}) => {
  return (
    <div className="custom-playlist">
      {/* Playlist Header */}
      <div
        className="playlist-header"
        style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          // backgroundColor: 'rgba(42, 42, 42, 0.9)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          color: '#fff',
        }}
      >
        {/* Cover Art */}
        {coverArtUrl && (
          <div
            style={{
              maxWidth: '100px',
              maxHeight: '100px',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <img
              src={coverArtUrl}
              alt={`Cover art for ${postTitle}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Playlist Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              color: '#fff',
              fontSize: '18px',
              fontWeight: '600',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {postTitle}
          </h3>
          <p
            style={{
              margin: '4px 0 0 0',
              color: '#fff',
              fontSize: '14px',
            }}
          >
            {tracks.length} • {totalDuration}
          </p>
        </div>
      </div>

      {/* Track List */}
      <div className="track-list" ref={trackListRef}>
        {tracks.map((track, index) => {
          const isCurrentTrack = currentIndex === index
          const isPlayingCurrent = isCurrentTrack && isPlaying

          return (
            <TrackItem
              key={index}
              track={track}
              index={index}
              isCurrentTrack={isCurrentTrack}
              isPlayingCurrent={isPlayingCurrent}
              onTrackClick={handleTrackClick}
              onTrackRef={setTrackItemRef}
              showDownloadButton={false}
              isMobile={isMobile}
            />
          )
        })}
      </div>
    </div>
  )
}

const BlogAudioPlayer = ({ audioData, postTitle, postDate, coverArtUrl }) => {
  const [isMuted, setIsMuted] = useState(false)
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  // Normalize audioData to handle both string URLs and objects with metadata
  const normalizedAudioData = useMemo(() => {
    return audioData.map((item) => {
      if (typeof item === 'string') {
        return { url: item, postTitle, postDate }
      }
      return item
    })
  }, [audioData, postTitle, postDate])

  // Extract just the URLs for the audio player context
  const audioUrlStrings = useMemo(() => {
    return normalizedAudioData.map((item) => item.url)
  }, [normalizedAudioData])

  // Get audio player context
  const {
    playlist,
    currentIndex,
    isPlaying,
    setIsPlaying,
    audioRef,
    playTrack,
    totalPlaylistDuration,
    updateTotalPlaylistDuration,
    isShuffleOn,
  } = useAudioPlayer()

  // Use shared hook for scroll to track
  const { trackListRef, setTrackItemRef } = useScrollToTrack(
    currentIndex,
    isShuffleOn
  )

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Download function for audio files
  const downloadAudio = useCallback(
    async (url, filename) => {
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Clean up the object URL
        window.URL.revokeObjectURL(downloadUrl)

        // Track download event with Plausible Analytics
        trackAudioEvent.audioDownload(filename, postTitle)
      } catch (error) {
        console.error('Download failed:', error)
        // Fallback: open in new tab
        window.open(url, '_blank')

        // Track failed download
        trackAudioEvent.audioDownloadFailed(
          filename,
          postTitle,
          'network_error'
        )
      }
    },
    [postTitle]
  )

  // Disable auto-scroll behavior
  useEffect(() => {
    const disableAutoScroll = () => {
      // Override scrollIntoView on all elements within the player
      const elements = document.querySelectorAll('.blog-audio-player *')
      elements.forEach((element) => {
        const originalScrollIntoView = element.scrollIntoView
        element.scrollIntoView = () => {
          // Do nothing - prevent scrolling
        }
      })
    }

    // Run after component mounts
    const timer = setTimeout(disableAutoScroll, 100)

    return () => clearTimeout(timer)
  }, []) // Run only once on mount

  // Download all audio files as ZIP function
  const downloadAllAudio = useCallback(async () => {
    if (isDownloadingZip) return // Prevent multiple simultaneous downloads

    setIsDownloadingZip(true)

    // Capture current values to avoid dependency issues
    const currentAudioData = audioData
    const currentPostTitle = postTitle
    const currentPostDate = postDate

    const zip = new JSZip()
    const folderName = `${currentPostTitle} - ${currentPostDate}`.replace(
      /[<>:"/\\|?*]/g,
      '_'
    ) // Clean folder name
    const folder = zip.folder(folderName)

    try {
      // Fetch all files and add to ZIP
      const fetchPromises = currentAudioData.map(async (audioItem) => {
        const url = typeof audioItem === 'string' ? audioItem : audioItem.url
        const urlParts = url.split('/')
        const filename = urlParts[urlParts.length - 1]

        try {
          const response = await fetch(url)
          const blob = await response.blob()
          folder.file(filename, blob)
          return { success: true, filename }
        } catch (error) {
          console.error(`Failed to fetch ${filename}:`, error)
          return { success: false, filename, error }
        }
      })

      // Wait for all files to be fetched
      const results = await Promise.all(fetchPromises)
      const successful = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length

      if (successful === 0) {
        alert('Failed to download any files. Please try again.')
        setIsDownloadingZip(false)
        return
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 1 }, // Light compression for faster generation
      })

      // Download the ZIP file
      const downloadUrl = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${folderName}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up
      window.URL.revokeObjectURL(downloadUrl)

      // Track ZIP download event with Plausible Analytics
      trackAudioEvent.audioZipDownload(
        currentPostTitle,
        successful,
        `${folderName}.zip`
      )

      if (failed > 0) {
        alert(
          `Download complete! ${successful} files downloaded successfully, ${failed} files failed.`
        )
      }
    } catch (error) {
      console.error('ZIP creation failed:', error)

      // Track ZIP download failure
      trackAudioEvent.audioZipDownloadFailed(
        currentPostTitle,
        'zip_creation_error'
      )

      alert('Failed to create ZIP file. Please try individual downloads.')
    } finally {
      setIsDownloadingZip(false)
    }
  }, [isDownloadingZip, audioData, postTitle, postDate]) // Dependencies for the download function

  // Convert audio data to track format
  const tracks = useMemo(() => {
    // Ensure audioData is an array
    if (!audioData || !Array.isArray(audioData) || audioData.length === 0) {
      return []
    }

    return audioData
      .map((audioItem, index) => {
        // Handle both string URLs and objects
        const url = typeof audioItem === 'string' ? audioItem : audioItem.url
        const hasUrl = url && typeof url === 'string'
        const hasStoragePath =
          typeof audioItem === 'object' &&
          audioItem.storagePath &&
          typeof audioItem.storagePath === 'string'

        // Check if item has either url or storagePath
        if (!hasUrl && !hasStoragePath) {
          return null
        }

        // Use metadata if available, otherwise extract from storage path or URL
        let trackName, filename
        if (typeof audioItem === 'object' && audioItem.title) {
          // Use the clean metadata we provided
          trackName = audioItem.title
          filename = `${audioItem.title}.wav` // For download filename
        } else if (hasStoragePath) {
          // Extract from storage path for new format
          const pathParts = audioItem.storagePath.split('/')
          filename = pathParts[pathParts.length - 1]
          trackName = filename.replace(/\.[^/.]+$/, '') // Remove extension
        } else {
          // Fall back to URL extraction for backward compatibility
          const urlParts = url.split('/')
          filename = urlParts[urlParts.length - 1]
          trackName = filename.replace(/\.[^/.]+$/, '') // Remove extension
        }

        // Use Supabase duration if available, otherwise fall back to trackDurations
        let duration
        if (audioItem.duration && typeof audioItem.duration === 'number') {
          duration = formatDuration(audioItem.duration)
        } else {
          // Duration is now part of the audioItem object, no need to load separately
          duration = '0:00' // Default if not available
        }

        // Add coherency level to title if available
        const coherencyLevel = audioItem.coherency_level
        const titleWithCoherency = coherencyLevel
          ? `${trackName || 'Unknown Track'} ${coherencyLevel}`
          : trackName || 'Unknown Track'

        return {
          title: titleWithCoherency,
          artist: postTitle || 'Unknown Artist',
          album: postDate || 'Unknown Album',
          duration: duration || '0:00',
          src: url || audioItem.storagePath, // Use URL if available, otherwise storage path
          imageSrc: coverArtUrl || null, // Use cover art from blog post
          // Add custom data for download
          downloadUrl: url || audioItem.storagePath, // Use URL if available, otherwise storage path
          downloadFilename: filename,
          // Store storage path for on-demand presigned URL generation
          storagePath:
            typeof audioItem === 'object' ? audioItem.storagePath : null,
        }
      })
      .filter(Boolean) // Remove any null entries
  }, [audioData, postTitle, postDate, coverArtUrl])

  // Calculate total playlist duration
  const totalDuration = useMemo(() => {
    const totalSeconds = audioData
      .filter((item) => typeof item === 'object' && item.duration)
      .reduce((sum, item) => sum + (item.duration || 0), 0)
    return formatDuration(totalSeconds)
  }, [audioData])

  // Update context with total playlist duration
  useEffect(() => {
    const totalSeconds = audioData
      .filter((item) => typeof item === 'object' && item.duration)
      .reduce((sum, item) => sum + (item.duration || 0), 0)
    updateTotalPlaylistDuration(totalSeconds)

    // Also set a global variable for the sketch to access
    if (typeof window !== 'undefined') {
      window.totalPlaylistDuration = totalSeconds
    }
  }, [audioData, updateTotalPlaylistDuration])

  // Convert tracks to context format (url instead of src)
  const contextTracks = useMemo(() => {
    // Ensure tracks is an array
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return []
    }

    return tracks
      .map((track) => {
        // Ensure track is valid
        if (!track || typeof track !== 'object') {
          return null
        }

        return {
          ...track,
          url: track.src, // Convert src to url for context
          // Store storage path for on-demand presigned URL generation
          storagePath: track.storagePath,
        }
      })
      .filter(Boolean) // Remove any null entries
  }, [tracks])

  // Handle track selection and play/pause - let FixedAudioPlayer handle playback
  const handleTrackClick = useCallback(
    async (index) => {
      if (index >= 0 && index < tracks.length) {
        const track = tracks[index]

        // Duration is now part of the audioItem object, no need to load separately

        if (currentIndex === index && isPlaying) {
          // If clicking the currently playing track, pause it
          setIsPlaying(false)

          // Track pause event
          trackAudioEvent.songPause(
            track,
            postTitle,
            index + 1,
            tracks.length,
            'blog_player'
          )
        } else {
          // Otherwise, play the selected track
          // Note: songPlay event is tracked in the context's playTrack function
          playTrack(index, contextTracks)
        }
      }
    },
    [
      tracks,
      currentIndex,
      isPlaying,
      playTrack,
      contextTracks,
      setIsPlaying,
      postTitle,
    ]
  )

  if (!audioData || !Array.isArray(audioData) || audioData.length === 0) {
    return null
  }

  return (
    <div
      className="blog-audio-player"
      style={{
        position: 'relative',
        zIndex: 60, // Higher than FixedAudioPlayer's z-index of 50
      }}
    >
      {/* Download All Button - Positioned as overlay */}
      {/* {!isMobile && audioUrls.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 30,
          }}
        >
          <button
            onClick={downloadAllAudio}
            disabled={isDownloadingZip}
            style={{
              background: isDownloadingZip ? '#666' : '#DE3163',
              border: 'none',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              fontFamily: 'Montserrat, sans-serif',
              cursor: isDownloadingZip ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              opacity: isDownloadingZip ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isDownloadingZip) {
                e.target.style.background = '#c92d56'
                e.target.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isDownloadingZip) {
                e.target.style.background = '#DE3163'
                e.target.style.transform = 'translateY(0)'
              }
            }}
            title={
              isDownloadingZip
                ? 'Creating ZIP archive...'
                : 'Download all audio files as ZIP archive'
            }
          >
            {isDownloadingZip ? '⏳ Creating ZIP...' : '📦 Download ZIP'}
          </button>
        </div>
      )} */}

      <CustomPlaylist
        tracks={tracks}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        handleTrackClick={handleTrackClick}
        coverArtUrl={coverArtUrl}
        postTitle={postTitle}
        totalDuration={totalDuration}
        trackListRef={trackListRef}
        setTrackItemRef={setTrackItemRef}
        isMobile={isMobile}
      />
    </div>
  )
}

export default BlogAudioPlayer
