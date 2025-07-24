import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { ListPlayer, ListPlayerContext } from 'react-list-player'
import JSZip from 'jszip'
import './BlogAudioPlayer.css'

const BlogAudioPlayer = ({ audioUrls, postTitle, postDate, coverArtUrl }) => {
  const [selectedTrack, setSelectedTrack] = useState(-1) // -1 means no track selected
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)

  // Audio element ref for actual playback
  const audioRef = useRef(null)
  const [currentAudio, setCurrentAudio] = useState(null)
  const [trackDurations, setTrackDurations] = useState({})
  const loadingTracksRef = useRef(new Set()) // Track which URLs we're currently loading
  const batchLoadingRef = useRef({ isRunning: false, currentBatch: 0 })
  const hasStartedLoadingRef = useRef(false) // Prevent multiple loading attempts
  const hiddenAudioRef = useRef(null) // Hidden DOM audio element for audio-reactive-grid-sketch

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

    // Run after component mounts and after any track changes
    const timer = setTimeout(disableAutoScroll, 100)

    return () => clearTimeout(timer)
  }, [selectedTrack]) // Re-run when selectedTrack changes

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

  // Convert Supabase URLs to react-list-player format
  const tracks = useMemo(() => {
    return audioUrls.map((url, index) => {
      // Extract filename from URL for display
      const urlParts = url.split('/')
      const filename = urlParts[urlParts.length - 1]
      const trackName = filename.replace(/\.[^/.]+$/, '') // Remove extension

      const duration = formatDuration(trackDurations[url])

      return {
        title: [
          {
            type: 'text',
            content: trackName,
            className: 'track-title',
          },
        ],
        artist: [
          {
            type: 'text',
            content: postTitle,
            className: 'track-artist',
          },
        ],
        album: [
          {
            type: 'text',
            content: postDate,
            className: 'track-album',
          },
        ],
        duration: duration,
        src: url,
        imageSrc: coverArtUrl || null, // Use cover art from blog post
        // Add custom data for download
        downloadUrl: url,
        downloadFilename: filename,
      }
    })
  }, [audioUrls, postTitle, postDate, trackDurations, coverArtUrl])

  // Calculate total playlist duration
  const totalDuration = useMemo(() => {
    const totalSeconds = Object.values(trackDurations).reduce(
      (sum, duration) => sum + (duration || 0),
      0
    )
    return formatDuration(totalSeconds)
  }, [trackDurations])

  // Playlist info
  const listInfo = useMemo(
    () => ({
      type: 'playlist',
      name: postTitle,
      numTracks: tracks.length,
      duration: totalDuration,
      creationDate: postDate,
    }),
    [postTitle, tracks.length, totalDuration, postDate]
  )

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

  // Handle playback callbacks
  const handlePlay = (index, resume) => {
    if (index >= 0 && index < tracks.length) {
      const track = tracks[index]

      // If we're switching tracks or starting fresh, load new audio
      if (!currentAudio || currentAudio.src !== track.src) {
        // Clean up previous audio
        if (currentAudio) {
          currentAudio.pause()
          currentAudio.src = '' // Clear src to stop loading
        }

        // Create new audio element
        const audio = new Audio(track.src)
        audio.addEventListener('loadedmetadata', () =>
          updateDuration(audio, track.src)
        )

        // Define track end handler inline to avoid circular dependency
        audio.addEventListener('ended', () => {
          setIsPlaying(false)
          // Auto-advance to next track if not the last track
          if (index >= 0 && index < tracks.length - 1) {
            setTimeout(() => {
              handlePlay(index + 1, false)
            }, 100)
          }
        })

        audio.muted = isMuted

        setCurrentAudio(audio)
        setSelectedTrack(index)

        // Play when loaded
        audio.addEventListener(
          'canplay',
          () => {
            audio.play().catch(console.error)
            setIsPlaying(true)
          },
          { once: true }
        )

        audio.load()
      } else {
        // Resume existing audio
        currentAudio.play().catch(console.error)
        setIsPlaying(true)
      }
    }
  }

  const handlePause = () => {
    if (currentAudio) {
      currentAudio.pause()
      setIsPlaying(false)
    }
  }

  const handleMute = () => {
    if (currentAudio) {
      currentAudio.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.src = '' // Clear src to stop loading
      }
    }
  }, [currentAudio])

  // Update mute state when isMuted changes
  useEffect(() => {
    if (currentAudio) {
      currentAudio.muted = isMuted
    }
  }, [isMuted, currentAudio])

  // Create and sync hidden DOM audio element for audio-reactive-grid-sketch
  useEffect(() => {
    // Create hidden audio element if it doesn't exist
    if (!hiddenAudioRef.current) {
      const hiddenAudio = document.createElement('audio')
      hiddenAudio.style.display = 'none'
      hiddenAudio.id = 'blog-audio-player-hidden'
      hiddenAudio.crossOrigin = 'anonymous' // Help with CORS for audio analysis
      document.body.appendChild(hiddenAudio)
      hiddenAudioRef.current = hiddenAudio
    }

    // Sync hidden audio with current audio
    if (currentAudio && hiddenAudioRef.current) {
      const hiddenAudio = hiddenAudioRef.current

      // Set same source
      hiddenAudio.src = currentAudio.src
      hiddenAudio.volume = currentAudio.volume
      hiddenAudio.muted = currentAudio.muted

      // Sync playback events
      const syncPlayback = () => {
        if (!currentAudio.paused && hiddenAudio.paused) {
          hiddenAudio.currentTime = currentAudio.currentTime
          hiddenAudio.play().catch(() => {}) // Ignore errors
        } else if (currentAudio.paused && !hiddenAudio.paused) {
          hiddenAudio.pause()
        }
      }

      // Sync time periodically
      const syncInterval = setInterval(() => {
        if (!currentAudio.paused && !hiddenAudio.paused) {
          const timeDiff = Math.abs(
            hiddenAudio.currentTime - currentAudio.currentTime
          )
          if (timeDiff > 0.1) {
            // Only sync if more than 100ms difference
            hiddenAudio.currentTime = currentAudio.currentTime
          }
        }
      }, 100)

      // Add event listeners to main audio
      currentAudio.addEventListener('play', syncPlayback)
      currentAudio.addEventListener('pause', syncPlayback)
      currentAudio.addEventListener('ended', () => hiddenAudio.pause())

      // Cleanup function
      return () => {
        currentAudio.removeEventListener('play', syncPlayback)
        currentAudio.removeEventListener('pause', syncPlayback)
        clearInterval(syncInterval)
      }
    }

    // Cleanup hidden audio when no current audio
    if (!currentAudio && hiddenAudioRef.current) {
      hiddenAudioRef.current.pause()
      hiddenAudioRef.current.src = ''
    }
  }, [currentAudio])

  // Cleanup hidden audio element on unmount
  useEffect(() => {
    return () => {
      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.pause()
        hiddenAudioRef.current.remove()
        hiddenAudioRef.current = null
      }
    }
  }, [])

  // Start loading when component mounts - run only once
  useEffect(() => {
    if (!hasStartedLoadingRef.current) {
      loadAllTrackDurations()
    }
  }, []) // Empty dependency array - run only once on mount

  // Add download buttons to tracks
  useEffect(() => {
    const addDownloadButtons = () => {
      const trackElements = document.querySelectorAll(
        '.blog-audio-player .track'
      )

      trackElements.forEach((trackElement, index) => {
        // Skip if button already exists
        if (trackElement.querySelector('.download-button')) {
          return
        }

        // Create download button
        const downloadButton = document.createElement('button')
        downloadButton.className = 'download-button'
        downloadButton.innerHTML = '⬇'
        downloadButton.title = 'Download audio file'
        downloadButton.style.cssText = `
          position: absolute;
          right: 60px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #DE3163;
          cursor: pointer;
          font-size: 16px;
          padding: 4px 8px;
          border-radius: 4px;
          opacity: 0;
          transition: all 0.2s ease;
          z-index: 10;
        `

        // Add hover styles
        downloadButton.addEventListener('mouseenter', () => {
          downloadButton.style.backgroundColor = '#DE3163'
          downloadButton.style.color = '#fff'
        })

        downloadButton.addEventListener('mouseleave', () => {
          downloadButton.style.backgroundColor = 'transparent'
          downloadButton.style.color = '#DE3163'
        })

        // Add click handler using audioUrls directly to avoid dependency issues
        if (audioUrls[index]) {
          const url = audioUrls[index]
          const urlParts = url.split('/')
          const filename = urlParts[urlParts.length - 1]

          downloadButton.addEventListener('click', (e) => {
            e.stopPropagation() // Prevent track selection
            downloadAudio(url, filename)
          })
        }

        // Make track element relative positioned
        trackElement.style.position = 'relative'

        // Show button on track hover
        trackElement.addEventListener('mouseenter', () => {
          downloadButton.style.opacity = '1'
        })

        trackElement.addEventListener('mouseleave', () => {
          downloadButton.style.opacity = '0'
        })

        // Add button to track
        trackElement.appendChild(downloadButton)
      })
    }

    // Run after component renders
    const timer = setTimeout(addDownloadButtons, 200)

    return () => {
      clearTimeout(timer)
    }
  }, [audioUrls, downloadAudio]) // Only depend on audioUrls, not tracks

  if (!audioUrls || audioUrls.length === 0) {
    return null
  }

  return (
    <div className="blog-audio-player">
      {/* Download All Button - Positioned as overlay */}
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

      <ListPlayerContext.Provider
        value={{
          selectedTrack,
          setSelectedTrack,
          isPlaying,
          setIsPlaying,
          isMuted,
          setIsMuted,
        }}
      >
        <ListPlayer
          tracks={tracks}
          listInfo={listInfo}
          playCallback={handlePlay}
          pauseCallback={handlePause}
          muteCallback={handleMute}
          autoScroll={false}
        />
      </ListPlayerContext.Provider>
    </div>
  )
}

export default BlogAudioPlayer
