import React, { useState, useEffect, useMemo, useCallback } from 'react'

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
import { BlogPost } from '../../pages'

// Types

interface ProcessedAudioTrack {
  id: string
  title: string
  date: string
  duration: string
  storage_path: string
  daily_id: string
}

interface HomepageAudioPlayerProps {
  currentBlogPost: BlogPost | null
  supabaseLoading: boolean
  supabaseError: string | null
  onTrackSelect: (track: ProcessedAudioTrack) => void
  parentError?: string | null
}

export const HomepageAudioPlayer: React.FC<HomepageAudioPlayerProps> = ({
  currentBlogPost,
  supabaseLoading,
  supabaseError,
  onTrackSelect,
  parentError,
}) => {
  const {
    playlist,
    currentIndex,
    isPlaying,
    setIsPlaying,
    playTrack,
    resetCurrentIndex,
    audioRef,
    volume,
    updateVolume,
  } = useAudioPlayer()

  const { getAudioUrl } = usePresignedUrl()

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [currentAudioUrl, setCurrentAudioUrl] = useState('')
  const [isMuted, setIsMuted] = useState<boolean>(false)

  // Reset audio player state when switching blog posts
  useEffect(() => {
    // When currentBlogPostTracks changes (switching blog posts), reset the currentIndex
    // to prevent accessing invalid playlist indices
    if (currentBlogPost?.audio.length === 0) {
      // No tracks available, reset to no selection
      if (currentIndex !== null) {
        // Reset the currentIndex in the audio player context
        resetCurrentIndex()
        setCurrentAudioUrl('')
        setError(null)
      }
    } else if (
      currentIndex !== null &&
      currentIndex >= currentBlogPost?.audio.length
    ) {
      // Current index is out of bounds for the new blog post, reset it
      console.warn(
        `Current index ${currentIndex} is out of bounds for blog post with ${currentBlogPost?.audio.length} tracks. Resetting.`
      )
      resetCurrentIndex()
      setCurrentAudioUrl('')
      setError(null)
    }
  }, [currentBlogPost?.audio, currentIndex, resetCurrentIndex])

  // Generate presigned URL when current track changes
  useEffect(() => {
    const generateAudioUrl = async () => {
      if (currentIndex !== null && playlist[currentIndex]) {
        const currentTrack = playlist[currentIndex]

        // Safety check: ensure currentTrack exists and has required properties
        if (!currentTrack || !currentTrack.storagePath) {
          console.warn(
            'Current track is missing or has no storagePath:',
            currentTrack
          )
          setCurrentAudioUrl('')
          return
        }

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
    if (currentBlogPost?.audio.length > 0 && currentIndex === null) {
      // Auto-select the first track but don't auto-play
      const firstTrack = currentBlogPost?.audio[0]
      // Use playTrack to set the current index without starting playback
      playTrack(0)
      // Ensure playback is stopped
      setIsPlaying(false)
    }
  }, [currentBlogPost?.audio, currentIndex, playTrack])

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

  // Sync muted state with audio element
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.muted = isMuted
    }
  }, [isMuted])

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

        // Safety check: ensure firstTrack exists and has required properties
        if (!firstTrack || !firstTrack.storagePath) {
          console.warn(
            'First track is missing or has no storagePath:',
            firstTrack
          )
          setError('Invalid first track')
          return
        }

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

    // Safety check: ensure nextTrack exists and has required properties
    if (!nextTrack || !nextTrack.storagePath) {
      console.warn('Next track is missing or has no storagePath:', nextTrack)
      setError('Invalid next track')
      return
    }

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

    // Safety check: ensure prevTrack exists and has required properties
    if (!prevTrack || !prevTrack.storagePath) {
      console.warn(
        'Previous track is missing or has no storagePath:',
        prevTrack
      )
      setError('Invalid previous track')
      return
    }

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

  const handleMuteToggle = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    if (audioRef.current) {
      audioRef.current.muted = newMutedState
    }
  }

  // Get current track info for display
  const currentTrackInfo = useMemo(() => {
    if (currentIndex === null || playlist.length === 0) {
      // Don't show "No track selected" if we have tracks available but none selected yet
      if (currentBlogPost?.audio.length > 0) {
        return { title: 'Select a track to play', date: '' }
      }
      return { title: 'No tracks available', date: '' }
    }

    const track = playlist[currentIndex]

    // Safety check: ensure track exists and has required properties
    if (!track || !track.id) {
      console.warn(
        'Track at index',
        currentIndex,
        'is missing or has no id:',
        track
      )
      return { title: 'Invalid track', date: '' }
    }

    // Find the corresponding track in currentBlogPostTracks to get the date
    const correspondingTrack = currentBlogPost?.audio.find(
      (processedTrack) => processedTrack.id === track.id
    )

    return {
      title: track.title || track.displayFilename || 'Unknown Track',
      date: correspondingTrack?.date || '',
      coverArt: currentBlogPost?.cover_art || '',
    }
  }, [currentIndex, playlist, currentBlogPost?.audio])

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
        isMuted={isMuted}
        onPlayPause={handlePlayPause}
        onNextTrack={handleNextTrack}
        onPreviousTrack={handlePreviousTrack}
        onVolumeChange={updateVolume}
        onTimeChange={(newTime) => {
          if (audioRef.current) {
            audioRef.current.currentTime = newTime
          }
        }}
        onMuteToggle={handleMuteToggle}
      />

      {/* Playlist View Toggle */}
      <HomepagePlaylistToggle currentBlogPost={currentBlogPost} />

      {/* Playlist */}
      <HomepagePlaylist
        tracks={currentBlogPost?.audio || []}
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
