import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import JSZip from 'jszip'
import { useAudioPlayer } from '../../contexts/audio-player-context/audio-player-context'
import './BlogAudioPlayer.css'

const BlogAudioPlayer = ({ audioUrls, postTitle, postDate, coverArtUrl }) => {
  const [isMuted, setIsMuted] = useState(false)
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

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
  } = useAudioPlayer()

  const [trackDurations, setTrackDurations] = useState({})
  const loadingTracksRef = useRef(new Set()) // Track which URLs we're currently loading
  const batchLoadingRef = useRef({ isRunning: false, currentBatch: 0 })
  const hasStartedLoadingRef = useRef(false) // Prevent multiple loading attempts

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Download function for audio files
  const downloadAudio = useCallback(async (url, filename) => {
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
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: open in new tab
      window.open(url, '_blank')
    }
  }, [])

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
    const currentAudioUrls = audioUrls
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
      const fetchPromises = currentAudioUrls.map(async (url) => {
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

      if (failed > 0) {
        alert(
          `Download complete! ${successful} files downloaded successfully, ${failed} files failed.`
        )
      }
    } catch (error) {
      console.error('ZIP creation failed:', error)
      alert('Failed to create ZIP file. Please try individual downloads.')
    } finally {
      setIsDownloadingZip(false)
    }
  }, [isDownloadingZip, audioUrls, postTitle, postDate]) // Dependencies for the download function

  // Convert audio URLs to track format
  const tracks = useMemo(() => {
    // Ensure audioUrls is an array
    if (!audioUrls || !Array.isArray(audioUrls) || audioUrls.length === 0) {
      return []
    }

    return audioUrls
      .map((url, index) => {
        // Ensure url is a string
        if (!url || typeof url !== 'string') {
          return null
        }

        // Extract filename from URL for display
        const urlParts = url.split('/')
        const filename = urlParts[urlParts.length - 1]
        const trackName = filename.replace(/\.[^/.]+$/, '') // Remove extension

        const duration = formatDuration(trackDurations[url])

        return {
          title: trackName || 'Unknown Track',
          artist: postTitle || 'Unknown Artist',
          album: postDate || 'Unknown Album',
          duration: duration || '0:00',
          src: url,
          imageSrc: coverArtUrl || null, // Use cover art from blog post
          // Add custom data for download
          downloadUrl: url,
          downloadFilename: filename,
        }
      })
      .filter(Boolean) // Remove any null entries
  }, [audioUrls, postTitle, postDate, trackDurations, coverArtUrl])

  // Calculate total playlist duration
  const totalDuration = useMemo(() => {
    const totalSeconds = Object.values(trackDurations).reduce(
      (sum, duration) => sum + (duration || 0),
      0
    )
    return formatDuration(totalSeconds)
  }, [trackDurations])

  // Update context with total playlist duration
  useEffect(() => {
    const totalSeconds = Object.values(trackDurations).reduce(
      (sum, duration) => sum + (duration || 0),
      0
    )
    updateTotalPlaylistDuration(totalSeconds)

    // Also set a global variable for the sketch to access
    if (typeof window !== 'undefined') {
      window.totalPlaylistDuration = totalSeconds
    }
  }, [trackDurations, updateTotalPlaylistDuration])

  // Update duration when audio metadata loads
  const updateDuration = (audio, trackUrl) => {
    // Only store if we have a valid duration AND don't already have a better one
    if (
      audio &&
      audio.duration &&
      !isNaN(audio.duration) &&
      audio.duration > 0
    ) {
      const existingDuration = trackDurations[trackUrl]
      const hasGoodExistingDuration =
        existingDuration && !isNaN(existingDuration) && existingDuration > 0

      if (!hasGoodExistingDuration) {
        setTrackDurations((prev) => ({
          ...prev,
          [trackUrl]: audio.duration,
        }))
      }
    }
  }

  // Load all track durations simultaneously
  const loadAllTrackDurations = async () => {
    if (
      batchLoadingRef.current.isRunning ||
      audioUrls.length === 0 ||
      hasStartedLoadingRef.current
    ) {
      return
    }

    hasStartedLoadingRef.current = true
    batchLoadingRef.current.isRunning = true

    const promises = audioUrls.map((url, index) => {
      return new Promise((resolve) => {
        if (loadingTracksRef.current.has(url)) {
          resolve({ url, success: false, reason: 'already_loading' })
          return
        }

        loadingTracksRef.current.add(url)

        const audio = new Audio()
        audio.preload = 'metadata'
        audio.crossOrigin = 'anonymous'

        // Add a timeout for metadata loading
        const timeoutId = setTimeout(() => {
          loadingTracksRef.current.delete(url)
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
          audio.removeEventListener('error', handleError)
          audio.src = ''
          resolve({ url, success: false, reason: 'timeout' })
        }, 15000) // 15 second timeout

        const handleLoadedMetadata = () => {
          clearTimeout(timeoutId)

          // Capture duration before cleanup to prevent corruption
          const capturedDuration = audio.duration

          if (
            capturedDuration &&
            !isNaN(capturedDuration) &&
            capturedDuration > 0
          ) {
            setTrackDurations((prev) => ({
              ...prev,
              [url]: capturedDuration,
            }))
            resolve({ url, success: true, duration: capturedDuration })
          } else {
            resolve({ url, success: false, reason: 'invalid_duration' })
          }

          loadingTracksRef.current.delete(url)
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
          audio.removeEventListener('error', handleError)
          audio.src = ''
        }

        const handleError = (e) => {
          clearTimeout(timeoutId)
          loadingTracksRef.current.delete(url)
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
          audio.removeEventListener('error', handleError)
          audio.src = ''
          resolve({ url, success: false, reason: 'network_error', error: e })
        }

        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('error', handleError)

        // Set src after listeners are attached
        audio.src = url
      })
    })

    try {
      await Promise.all(promises)
    } catch (error) {
      console.error('Audio duration loading error:', error)
    }

    batchLoadingRef.current.isRunning = false
  }

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
        }
      })
      .filter(Boolean) // Remove any null entries
  }, [tracks])

  // Handle track selection and play/pause - let FixedAudioPlayer handle playback
  const handleTrackClick = useCallback(
    (index) => {
      if (index >= 0 && index < tracks.length) {
        if (currentIndex === index && isPlaying) {
          // If clicking the currently playing track, pause it
          setIsPlaying(false)
        } else {
          // Otherwise, play the selected track
          playTrack(index, contextTracks)
        }
      }
    },
    [tracks, currentIndex, isPlaying, playTrack, contextTracks, setIsPlaying]
  )

  // Start loading when component mounts - run only once
  useEffect(() => {
    if (!hasStartedLoadingRef.current) {
      loadAllTrackDurations()
    }
  }, []) // Empty dependency array - run only once on mount

  // Custom playlist component
  const CustomPlaylist = () => {
    return (
      <div className="custom-playlist">
        {/* Playlist Header */}
        <div
          className="playlist-header"
          style={{
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: 'rgba(42, 42, 42, 0.9)',
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
                width: '200px',
                height: '200px',
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
              {tracks.length} tracks • {totalDuration}
            </p>
          </div>
        </div>

        {/* Track List */}
        <div className="track-list">
          {tracks.map((track, index) => {
            const isCurrentTrack = currentIndex === index
            const isPlayingCurrent = isCurrentTrack && isPlaying

            return (
              <div
                key={index}
                className={`track-item ${isCurrentTrack ? 'current-track' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: isCurrentTrack
                    ? 'rgba(42, 42, 42, 0.9)'
                    : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  position: 'relative',
                  minHeight: '60px', // Ensure clickable area
                  userSelect: 'none', // Prevent text selection
                  zIndex: 10, // Ensure track items are above other content
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleTrackClick(index)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isCurrentTrack
                    ? 'rgba(60, 60, 60, 0.9)'
                    : 'rgba(42, 42, 42, 0.9)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isCurrentTrack
                    ? 'rgba(42, 42, 42, 0.9)'
                    : 'transparent'
                }}
              >
                {/* Play/Pause Button */}
                <div
                  style={{
                    marginRight: '12px',
                    width: '24px',
                    textAlign: 'center',
                  }}
                >
                  {isPlayingCurrent ? (
                    <span style={{ color: '#fff', fontSize: '16px' }}>⏸</span>
                  ) : (
                    <span style={{ color: '#fff', fontSize: '16px' }}>▶</span>
                  )}
                </div>

                {/* Track Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: isCurrentTrack ? '600' : '500',
                      color: isCurrentTrack ? '#fff' : '#fff',
                      fontSize: '14px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {track.title}
                  </div>
                  <div
                    style={{
                      color: '#fff',
                      fontSize: '12px',
                      marginTop: '2px',
                    }}
                  >
                    {track.artist} • {track.album}
                  </div>
                </div>

                {/* Duration */}
                <div
                  style={{
                    color: '#fff',
                    fontSize: '12px',
                    marginLeft: '12px',
                    minWidth: '40px',
                    textAlign: 'right',
                  }}
                >
                  {track.duration}
                </div>

                {/* Download Button */}
                {!isMobile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadAudio(track.downloadUrl, track.downloadFilename)
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px 8px',
                      marginLeft: '8px',
                      borderRadius: '4px',
                      opacity: 1,
                      position: 'relative',
                      zIndex: 100,
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#DE3163'
                      e.target.style.color = '#fff'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent'
                      e.target.style.color = '#fff'
                    }}
                    title="Download audio file"
                  >
                    ⬇
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (!audioUrls || !Array.isArray(audioUrls) || audioUrls.length === 0) {
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
      {!isMobile && audioUrls.length > 1 && (
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
      )}

      <CustomPlaylist />
    </div>
  )
}

export default BlogAudioPlayer
