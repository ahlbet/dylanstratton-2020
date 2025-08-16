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
}

export const HomepageAudioPlayer: React.FC<HomepageAudioPlayerProps> = ({
  currentBlogPostTracks,
  currentBlogPost,
  posts,
  supabaseLoading,
  supabaseError,
  onTrackSelect,
}) => {
  const {
    playlist,
    setPlaylist,
    currentIndex,
    setCurrentIndex,
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
              setCurrentIndex(0)
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
        audioRef.current?.play()
        setIsPlaying(true)
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
            setCurrentIndex(nextIndex)
            setIsPlaying(true)
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
            setCurrentIndex(prevIndex)
            setIsPlaying(true)
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
    <div className="lg:w-1/3 border-r border-gray-800 flex flex-col">
      {/* Current Track Info */}
      <HomepageCurrentTrackInfo
        currentTrackInfo={currentTrackInfo}
        error={error}
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
        onLoadStart={() => {
          setIsLoading(true)
        }}
        onCanPlay={() => {
          setIsLoading(false)
        }}
      />
    </div>
  )
}
