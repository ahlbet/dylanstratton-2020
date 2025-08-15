import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useAudioPlayer } from '../../contexts/audio-player-context/audio-player-context'
import { trackAudioEvent } from '../../utils/plausible-analytics'
import TrackItem from '../track-item/TrackItem'
import './all-songs-playlist.css'

const AllSongsPlaylist = ({ audioUrlsWithMetadata }) => {
  const [isMuted, setIsMuted] = useState(false)
  const {
    playlist,
    currentIndex,
    isPlaying,
    setIsPlaying,
    playTrack,
    setPlaylist,
    updateTotalPlaylistDuration,
  } = useAudioPlayer()

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`
    } else {
      return `0:${secs.toString().padStart(2, '0')}`
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
        // Handle both old format (with url) and new format (with storagePath)
        if (!item) {
          return null
        }

        // Check if item has either url or storagePath
        const hasUrl = item.url && typeof item.url === 'string'
        const hasStoragePath =
          item.storagePath && typeof item.storagePath === 'string'

        if (!hasUrl && !hasStoragePath) {
          return null
        }

        // Use title from metadata if available, otherwise extract from storage path
        let trackName, filename
        if (item.title) {
          // Use the clean metadata we provided
          trackName = item.title
          filename = `${item.title}.wav` // For download filename
        } else if (hasStoragePath) {
          // Extract from storage path for new format
          const pathParts = item.storagePath.split('/')
          filename = pathParts[pathParts.length - 1]
          trackName = filename.replace(/\.[^/.]+$/, '') // Remove extension
        } else {
          // Fall back to URL extraction for backward compatibility
          const urlParts = item.url.split('/')
          filename = urlParts[urlParts.length - 1]
          trackName = filename.replace(/\.[^/.]+$/, '') // Remove extension
        }

        // Use duration from metadata if available, otherwise show 0:00
        const duration =
          item.duration !== null && item.duration !== undefined
            ? formatDuration(item.duration)
            : '0:00'

        return {
          title: trackName || 'Unknown Track',
          artist: item.postTitle || 'Unknown Artist',
          album: item.postDate || 'Unknown Album',
          duration: duration,
          src: item.url || item.storagePath, // Use URL if available, otherwise storage path
          downloadUrl: item.url || item.storagePath, // Use URL if available, otherwise storage path
          downloadFilename: filename,
          // Store storage path for on-demand presigned URL generation
          storagePath: item.storagePath,
        }
      })
      .filter(Boolean)
  }, [audioUrlsWithMetadata])

  // Calculate total playlist duration from track metadata
  const totalDuration = useMemo(() => {
    const totalSeconds =
      audioUrlsWithMetadata?.reduce((sum, item) => {
        if (!item) return sum
        return sum + (item.duration || 0)
      }, 0) || 0
    return formatDuration(totalSeconds)
  }, [audioUrlsWithMetadata])

  // Update context with total playlist duration
  useEffect(() => {
    const totalSeconds =
      audioUrlsWithMetadata?.reduce((sum, item) => {
        if (!item) return sum
        return sum + (item.duration || 0)
      }, 0) || 0
    updateTotalPlaylistDuration(totalSeconds)

    if (typeof window !== 'undefined') {
      window.totalPlaylistDuration = totalSeconds
    }
  }, [audioUrlsWithMetadata, updateTotalPlaylistDuration])

  // Convert tracks to context format
  const contextTracks = useMemo(() => {
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return []
    }

    return tracks.map((track) => ({
      url: track.src,
      title: track.title,
      artist: track.artist,
      // Store storage path for on-demand presigned URL generation
      storagePath: track.storagePath,
    }))
  }, [tracks])

  // Update context playlist when tracks change
  useEffect(() => {
    if (contextTracks.length > 0) {
      // Set the playlist in the context
      setPlaylist(contextTracks)
    }
  }, [contextTracks, setPlaylist])

  // Handle track click
  const handleTrackClick = useCallback(
    (index) => {
      if (tracks[index] && contextTracks.length > 0) {
        if (currentIndex === index && isPlaying) {
          // If clicking the currently playing track, pause it
          setIsPlaying(false)

          // Track pause event
          trackAudioEvent.songPause(
            tracks[index].title,
            'All',
            index + 1,
            tracks.length,
            'all_player'
          )
        } else {
          // Otherwise, play the selected track
          playTrack(index, contextTracks)
          trackAudioEvent.songPlay(tracks[index].title, 'All')
        }
      }
    },
    [tracks, contextTracks, playTrack, currentIndex, isPlaying, setIsPlaying]
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
              All
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
        <div className="track-list">
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
                showDownloadButton={false}
                isMobile={false}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AllSongsPlaylist
