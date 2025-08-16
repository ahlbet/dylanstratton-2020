import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
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
  const [currentAudioUrl, setCurrentAudioUrl] = useState('')

  // Generate presigned URL when current track changes
  useEffect(() => {
    const generateAudioUrl = async () => {
      if (currentIndex !== null && playlist[currentIndex]) {
        const currentTrack = playlist[currentIndex]
        if (currentTrack.storagePath) {
          try {
            // Check if we should use local audio files for development
            const isLocalDevMode = isLocalDev()

            let audioUrl: string | null = null

            if (isLocalDevMode) {
              // Use local audio files for development
              const filename = extractFilenameFromStoragePath(
                currentTrack.storagePath
              )
              audioUrl = `/local-audio/${filename}.wav`
            } else {
              // Production mode: generate presigned URL on-demand
              audioUrl = await getAudioUrl({
                storagePath: currentTrack.storagePath,
              })
            }

            if (audioUrl) {
              setCurrentAudioUrl(audioUrl)
            } else {
              setCurrentAudioUrl('')
            }
          } catch (error) {
            // Fall back to original URL if available
            setCurrentAudioUrl(currentTrack.url || '')
          }
        } else {
          setCurrentAudioUrl('')
        }
      } else {
        setCurrentAudioUrl('')
      }
    }

    generateAudioUrl()
  }, [currentIndex, playlist, getAudioUrl])

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleLoadStart = () => {
      setIsLoading(true)
      setError(null) // Clear errors when starting to load new audio
      // Set volume when audio starts loading
      if (audioRef.current) {
        audioRef.current.volume = volume
      }
    }
    const handleEnded = () => {
      // Auto-play next track when current track ends
      if (playlist.length > 0) {
        handleNextTrack()
      }
    }
    const handleError = (e: Event) => {
      // Only show error if we have a track selected and audio source
      if (currentIndex !== null && currentAudioUrl) {
        setError('Audio playback error')
      }
      setIsLoading(false)
    }
    const handleCanPlay = () => {
      setIsLoading(false)
      setError(null) // Clear errors when audio can play
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [audioRef, volume, playlist, currentIndex, currentAudioUrl])

  // Ensure audio element gets the source when currentAudioUrl changes
  useEffect(() => {
    const audio = audioRef.current
    if (audio && currentAudioUrl) {
      // Only update if the source is different
      if (audio.src !== currentAudioUrl) {
        audio.src = currentAudioUrl
        // Load the new source
        audio.load()
      }
    }
  }, [currentAudioUrl])

  // Auto-select first track when tracks become available
  useEffect(() => {
    if (currentBlogPostTracks.length > 0 && currentIndex === null) {
      // Auto-select the first track
      const firstTrack = currentBlogPostTracks[0]
      onTrackSelect(firstTrack)
    }
  }, [currentBlogPostTracks, currentIndex, onTrackSelect])

  // Handle initial state setup
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      // Set initial volume
      audio.volume = volume
      // Clear any initial error state
      setError(null)
      setIsLoading(false)
    }
  }, [volume])

  // Function to check if audio is ready to play
  const isAudioReady = useCallback(() => {
    const audio = audioRef.current
    return (
      audio &&
      audio.src &&
      audio.readyState >= 1 && // HAVE_METADATA or higher
      currentAudioUrl
    )
  }, [currentAudioUrl])

  // Function to wait for audio to be ready and then play
  const waitForAudioAndPlay = useCallback(
    (audio: HTMLAudioElement) => {
      if (isAudioReady()) {
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // Ignore AbortError as it's expected when navigating
            if (error.name !== 'AbortError') {
              // If play fails due to source issues, try to recover
              if (error.name === 'NotSupportedError' && currentAudioUrl) {
                audio.load()
              } else {
                setError('Failed to play track')
              }
            }
          })
        }
        return true
      }
      return false
    },
    [currentAudioUrl, isAudioReady]
  )

  // Handle audio playback when isPlaying changes
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      if (isPlaying) {
        // Check if audio source is ready before attempting to play
        if (!currentAudioUrl || audio.readyState === 0 || !audio.src) {
          return
        }

        // Try to play immediately if ready
        if (waitForAudioAndPlay(audio)) {
          return
        }

        // If not ready, wait and try again
        const timeoutId = setTimeout(() => {
          if (isPlaying) {
            waitForAudioAndPlay(audio)
          }
        }, 200)

        return () => clearTimeout(timeoutId)
      } else {
        audio.pause()
      }
    }
  }, [isPlaying, currentAudioUrl, waitForAudioAndPlay])

  // Listen for audio metadata loading to know when it's ready to play
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleMetadataLoaded = () => {
      // If user was waiting to play, try to play now
      if (isPlaying && isAudioReady()) {
        waitForAudioAndPlay(audio)
      }
    }

    audio.addEventListener('loadedmetadata', handleMetadataLoaded)
    return () =>
      audio.removeEventListener('loadedmetadata', handleMetadataLoaded)
  }, [isPlaying, isAudioReady, waitForAudioAndPlay])

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
              setError(null) // Clear any previous errors
              // Use playTrack to properly set the current index
              await playTrack(0)
              // The useEffect will handle actual playback when isPlaying changes
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
        // Audio source is managed by currentAudioUrl state
        // Just set playing state, the useEffect will handle actual playback
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
            setError(null) // Clear any previous errors
            // Use playTrack to properly set the current index
            await playTrack(nextIndex)
            // The useEffect will handle actual playback when isPlaying changes
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
            setError(null) // Clear any previous errors
            // Use playTrack to properly set the current index
            await playTrack(prevIndex)
            // The useEffect will handle actual playback when isPlaying changes
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
      // Don't show "No track selected" if we have tracks available but none selected yet
      if (currentBlogPostTracks.length > 0) {
        return { title: 'Select a track to play', date: '' }
      }
      return { title: 'No tracks available', date: '' }
    }

    const track = playlist[currentIndex]

    // Find the corresponding track in currentBlogPostTracks to get the date
    const correspondingTrack = currentBlogPostTracks.find(
      (processedTrack) => processedTrack.id === track.id
    )

    return {
      title: track.title || track.displayFilename || 'Unknown Track',
      date: correspondingTrack?.date || '',
    }
  }, [currentIndex, playlist, currentBlogPostTracks])

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

      {/* Audio element for playback */}
      <audio
        ref={audioRef}
        src={currentAudioUrl}
        preload="auto"
        crossOrigin="anonymous"
      />
    </div>
  )
}
