import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '../ui/button'
import {
  Calendar as CalendarIcon,
  FileText,
  Grid,
  List,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react'
import { useAudioPlayer } from '../../contexts/audio-player-context/audio-player-context'
import { usePresignedUrl } from '../../hooks/use-presigned-url'
import { HomepageAudioControls } from './HomepageAudioControls'
import { HomepagePlaylist } from './HomepagePlaylist'
import { HomepageCurrentTrackInfo } from './HomepageCurrentTrackInfo'
import { HomepagePlaylistToggle } from './HomepagePlaylistToggle'
import {
  isLocalDev,
  extractFilenameFromStoragePath,
  getNextTrackIndex,
  getPreviousTrackIndex,
} from '../../utils/audio-utils'

// Types
interface AudioItem {
  id: string
  storagePath?: string
  storage_path?: string
  duration?: number | null
  format?: string
  title?: string
  artist?: string
  album?: string
  displayFilename?: string
  daily_id: string
  created_at: string
}

interface ProcessedAudioTrack {
  id: string
  title: string
  date: string
  duration: string
  storage_path: string
  daily_id: string
}

interface HomepageAudioPlayerProps {
  currentBlogPostTracks: ProcessedAudioTrack[]
  currentBlogPost: string | null
  posts: any[]
  supabaseLoading: boolean
  supabaseError: string | null
  onTrackSelect: (track: ProcessedAudioTrack) => void
  parentError?: string | null
}

export const HomepageAudioPlayer: React.FC<HomepageAudioPlayerProps> = ({
  currentBlogPostTracks,
  currentBlogPost,
  posts,
  supabaseLoading,
  supabaseError,
  onTrackSelect,
  parentError,
}) => {
  const {
    playlist,
    setPlaylist,
    currentIndex,
    isPlaying,
    setIsPlaying,
    playTrack,
    audioRef,
    volume,
    updateVolume,
    isShuffleOn,
    toggleShuffle,
    isLoopOn,
    toggleLoop,
    isAutopilotOn,
    toggleAutopilot,
    shouldNavigateToRandomPost,
    shuffledPlaylist,
  } = useAudioPlayer()

  const { getAudioUrl } = usePresignedUrl()

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Effect to handle audio source changes when currentIndex changes
  useEffect(() => {
    if (currentIndex !== null && playlist[currentIndex] && audioRef.current) {
      const currentTrack = playlist[currentIndex]

      // Only update if the track has a URL and it's different from current source
      if (currentTrack.url && audioRef.current.src !== currentTrack.url) {
        audioRef.current.src = currentTrack.url
        // If we're currently playing, start the new track
        if (isPlaying) {
          audioRef.current.play().catch(() => {
            setError('Failed to play track')
          })
        }
      }
    }
  }, [currentIndex, playlist, isPlaying])

  // Handle play/pause
  const handlePlayPause = async () => {
    if (currentIndex === null && playlist.length > 0) {
      // No track selected, start with first track
      try {
        const firstTrack = playlist[0]
        if (firstTrack.storagePath) {
          // Check if we should use local audio files for development
          const isLocalDevMode = isLocalDev()

          let audioUrl: string | null = null

          if (isLocalDevMode) {
            // Use local audio files for development
            const filename = extractFilenameFromStoragePath(
              firstTrack.storagePath
            )
            audioUrl = `/local-audio/${filename}.wav`
          } else {
            // Production mode: generate presigned URL on-demand
            audioUrl = await getAudioUrl({
              storagePath: firstTrack.storagePath,
            })
          }

          if (audioUrl) {
            if (audioRef.current) {
              audioRef.current.src = audioUrl
              audioRef.current.play()
              setIsPlaying(true)
              setError(null) // Clear any previous errors
              // Use playTrack to properly set the current index
              await playTrack(0)
            }
          } else {
            setError('Failed to get audio URL')
          }
        }
      } catch (error) {
        setError('Failed to get audio URL for first track')
      }
    } else if (currentIndex !== null) {
      // Track is selected, toggle play/pause
      if (isPlaying) {
        audioRef.current?.pause()
        setIsPlaying(false)
      } else {
        // Ensure the audio source is correct before playing
        const currentTrack = playlist[currentIndex]
        if (currentTrack && currentTrack.url && audioRef.current) {
          // Check if the audio source matches the current track
          if (audioRef.current.src !== currentTrack.url) {
            audioRef.current.src = currentTrack.url
          }
          audioRef.current.play().catch(() => {
            setError('Failed to play track')
          })
          setIsPlaying(true)
        }
      }
    }
  }

  // Handle next/previous track
  const handleNextTrack = async () => {
    if (playlist.length === 0) return

    const nextIndex = getNextTrackIndex(currentIndex, playlist.length)
    const nextTrack = playlist[nextIndex]

    if (nextTrack.storagePath) {
      try {
        // Check if we should use local audio files for development
        const isLocalDevMode = isLocalDev()

        let audioUrl: string | null = null

        if (isLocalDevMode) {
          // Use local audio files for development
          const filename = extractFilenameFromStoragePath(nextTrack.storagePath)
          audioUrl = `/local-audio/${filename}.wav`
        } else {
          // Production mode: generate presigned URL on-demand
          audioUrl = await getAudioUrl({ storagePath: nextTrack.storagePath })
        }

        if (audioUrl) {
          if (audioRef.current) {
            audioRef.current.src = audioUrl
            audioRef.current.play()
            setIsPlaying(true)
            setError(null) // Clear any previous errors
            // Use playTrack to properly set the current index
            await playTrack(nextIndex)
          }
        } else {
          setError('Failed to get audio URL for next track')
        }
      } catch (error) {
        setError('Failed to get audio URL for next track')
      }
    }
  }

  const handlePreviousTrack = async () => {
    if (playlist.length === 0) return

    const prevIndex = getPreviousTrackIndex(currentIndex, playlist.length)
    const prevTrack = playlist[prevIndex]

    if (prevTrack.storagePath) {
      try {
        // Check if we should use local audio files for development
        const isLocalDevMode = isLocalDev()

        let audioUrl: string | null = null

        if (isLocalDevMode) {
          // Use local audio files for development
          const filename = extractFilenameFromStoragePath(prevTrack.storagePath)
          audioUrl = `/local-audio/${filename}.wav`
        } else {
          // Production mode: generate presigned URL on-demand
          audioUrl = await getAudioUrl({ storagePath: prevTrack.storagePath })
        }

        if (audioUrl) {
          if (audioRef.current) {
            audioRef.current.src = audioUrl
            audioRef.current.play()
            setIsPlaying(true)
            setError(null) // Clear any previous errors
            // Use playTrack to properly set the current index
            await playTrack(prevIndex)
          }
        } else {
          setError('Failed to get audio URL for previous track')
        }
      } catch (error) {
        setError('Failed to get audio URL for previous track')
      }
    }
  }

  // Get current track info for display
  const currentTrackInfo = useMemo(() => {
    if (currentIndex === null || playlist.length === 0) {
      return { title: 'No track selected', date: '' }
    }

    const track = playlist[currentIndex]
    return {
      title: track.title || track.displayFilename || 'Unknown Track',
      date: track.created_at
        ? new Date(track.created_at).toLocaleDateString()
        : '',
    }
  }, [currentIndex, playlist])

  return (
    <div className="border-r border-gray-800 flex flex-col">
      {/* Current Track Info */}
      <HomepageCurrentTrackInfo
        currentTrackInfo={currentTrackInfo}
        error={error || parentError}
        supabaseError={supabaseError}
      />

      {/* Audio Controls */}
      <HomepageAudioControls
        isPlaying={isPlaying}
        isLoading={isLoading}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        onPlayPause={handlePlayPause}
        onNextTrack={handleNextTrack}
        onPreviousTrack={handlePreviousTrack}
        onVolumeChange={updateVolume}
        onTimeChange={(newTime) => {
          if (audioRef.current) {
            audioRef.current.currentTime = newTime
          }
        }}
      />

      {/* Playlist View Toggle */}
      <HomepagePlaylistToggle
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentBlogPost={currentBlogPost}
        posts={posts}
      />

      {/* Playlist */}
      <HomepagePlaylist
        tracks={currentBlogPostTracks}
        currentIndex={currentIndex}
        supabaseLoading={supabaseLoading}
        supabaseError={supabaseError}
        onTrackSelect={onTrackSelect}
      />

      {/* Hidden audio element for actual playback */}
      <audio
        ref={audioRef}
        onEnded={() => {
          // Auto-play next track when current track ends
          if (playlist.length > 0) {
            handleNextTrack()
          }
        }}
        onError={(e) => {
          setError('Audio playback error')
        }}
        onLoadStart={() => {
          setIsLoading(true)
          setError(null) // Clear errors when starting to load new audio
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime)
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration)
          }
        }}
        onCanPlay={() => {
          setIsLoading(false)
          setError(null) // Clear errors when audio can play
        }}
      />
    </div>
  )
}
