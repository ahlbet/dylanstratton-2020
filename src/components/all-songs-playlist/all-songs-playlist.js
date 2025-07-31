import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useAudioPlayer } from '../../contexts/audio-player-context/audio-player-context'
import { trackAudioEvent } from '../../utils/plausible-analytics'
import { useTrackDurations } from '../../hooks/use-track-durations'
import './all-songs-playlist.css'

const AllSongsPlaylist = ({ audioUrlsWithMetadata }) => {
  const [isMuted, setIsMuted] = useState(false)
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
    setPlaylist,
    isShuffleOn,
  } = useAudioPlayer()

  // Use shared hook for track durations
  const { trackDurations } = useTrackDurations(audioUrlsWithMetadata)
  const trackListRef = useRef(null)
  const trackItemRefs = useRef({})

  // Format duration from seconds to HH:MM:SS or MM:SS
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'

    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
  }

  // Convert audio URLs with metadata to track format
  const tracks = useMemo(() => {
    if (
      !audioUrlsWithMetadata ||
      !Array.isArray(audioUrlsWithMetadata) ||
      audioUrlsWithMetadata.length === 0
    ) {
      return []
    }

    return audioUrlsWithMetadata
      .map((item, index) => {
        if (!item || !item.url || typeof item.url !== 'string') {
          return null
        }

        // Extract filename from URL for display
        const urlParts = item.url.split('/')
        const filename = urlParts[urlParts.length - 1]
        const trackName = filename.replace(/\.[^/.]+$/, '') // Remove extension

        const duration = formatDuration(trackDurations[item.url])

        return {
          title: trackName || 'Unknown Track',
          artist: item.postTitle || 'Unknown Artist',
          album: item.postDate || 'Unknown Album',
          duration: duration || '0:00',
          src: item.url,
          downloadUrl: item.url,
          downloadFilename: filename,
        }
      })
      .filter(Boolean)
  }, [audioUrlsWithMetadata, trackDurations])

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

    if (typeof window !== 'undefined') {
      window.totalPlaylistDuration = totalSeconds
    }
  }, [trackDurations, updateTotalPlaylistDuration])

  // Convert tracks to context format
  const contextTracks = useMemo(() => {
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return []
    }

    return tracks.map((track) => ({
      url: track.src,
      title: track.title,
      artist: track.artist,
    }))
  }, [tracks])

  // Update context playlist when tracks change
  useEffect(() => {
    if (contextTracks.length > 0) {
      // Set the playlist in the context
      setPlaylist(contextTracks)
    }
  }, [contextTracks, setPlaylist])

  // Scroll current track into view when shuffle is on
  useEffect(() => {
    if (
      isShuffleOn &&
      currentIndex !== null &&
      trackItemRefs.current[currentIndex]
    ) {
      const trackElement = trackItemRefs.current[currentIndex]
      const trackList = trackListRef.current

      if (trackElement && trackList) {
        // Calculate if the track is visible
        const trackRect = trackElement.getBoundingClientRect()
        const listRect = trackList.getBoundingClientRect()

        const isVisible =
          trackRect.top >= listRect.top && trackRect.bottom <= listRect.bottom

        if (!isVisible) {
          trackElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      }
    }
  }, [currentIndex, isShuffleOn])

  // Handle track click
  const handleTrackClick = useCallback(
    (index) => {
      if (tracks[index] && contextTracks.length > 0) {
        playTrack(index, contextTracks)
        trackAudioEvent.songPlay(tracks[index].title, 'All Songs')
      }
    },
    [tracks, contextTracks, playTrack]
  )

  if (
    !audioUrlsWithMetadata ||
    !Array.isArray(audioUrlsWithMetadata) ||
    audioUrlsWithMetadata.length === 0
  ) {
    return null
  }

  return (
    <div
      className="all-songs-playlist"
      style={{
        position: 'relative',
        zIndex: 60,
      }}
    >
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
              All Songs
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
        <div className="track-list" ref={trackListRef}>
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

                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  position: 'relative',
                  minHeight: '60px',
                  userSelect: 'none',
                  zIndex: 10,
                  borderLeft: isCurrentTrack
                    ? '4px solid #DE3163'
                    : '4px solid transparent',
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleTrackClick(index)
                }}
                ref={(el) => (trackItemRefs.current[index] = el)}
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
                    <span style={{ color: '#DE3163', fontSize: '16px' }}>
                      ⏸
                    </span>
                  ) : (
                    <span
                      style={{
                        color: isCurrentTrack ? '#DE3163' : '#fff',
                        fontSize: '16px',
                      }}
                    >
                      ▶
                    </span>
                  )}
                </div>

                {/* Track Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: isCurrentTrack ? '600' : '500',
                      color: isCurrentTrack ? '#DE3163' : '#fff',
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
                      color: isCurrentTrack ? '#DE3163' : '#fff',
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
                    color: isCurrentTrack ? '#DE3163' : '#fff',
                    fontSize: '12px',
                    marginLeft: '12px',
                    minWidth: '40px',
                    textAlign: 'right',
                  }}
                >
                  {track.duration}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AllSongsPlaylist
