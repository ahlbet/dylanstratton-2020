import React, { useEffect, useRef, useState } from 'react'
import { useAudioPlayer } from '../../contexts/audio-player-context/audio-player-context'
import { trackAudioEvent, getPostName } from '../../utils/plausible-analytics'
import { navigate, useStaticQuery, graphql } from 'gatsby'
import './FixedAudioPlayer.css'
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  Shuffle,
  Repeat,
  Zap,
} from 'lucide-react'

export const FixedAudioPlayer = () => {
  // Get all blog posts for random navigation
  const data = useStaticQuery(graphql`
    query {
      allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              title
            }
          }
        }
      }
    }
  `)

  const {
    playlist,
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
    getNextTrackIndex,
    getPreviousTrackIndex,
  } = useAudioPlayer()

  const progressRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const currentTrack = playlist[currentIndex]

  // Function to navigate to a random blog post
  const navigateToRandomPost = () => {
    const posts = data.allMarkdownRemark.edges
    if (posts.length > 0) {
      const randomIndex = Math.floor(Math.random() * posts.length)
      const randomPost = posts[randomIndex].node

      // Store that we're navigating via autopilot so we can auto-play
      // This flag will be checked by AutopilotAutoPlay component on the new page
      localStorage.setItem('autopilotNavigation', 'true')

      // Store whether audio was playing when navigation occurred
      if (isPlaying) {
        localStorage.setItem('audioWasPlaying', 'true')
      }

      // Small delay to ensure localStorage is set before navigation
      setTimeout(() => {
        navigate(randomPost.fields.slug)
      }, 50)
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleLoadStart = () => {
      // Set volume when audio starts loading new source
      if (audioRef.current) {
        audioRef.current.volume = volume
      }
    }
    const handleEnded = () => {
      if (isLoopOn) {
        // If loop is on, restart the current track
        if (audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.play()
        }
      } else {
        // Check if this was the last track in the playlist
        const isLastTrack =
          currentIndex === playlist.length - 1 ||
          (isShuffleOn &&
            shuffledPlaylist.length > 0 &&
            shuffledPlaylist.findIndex(
              (track) => track.url === playlist[currentIndex]?.url
            ) ===
              shuffledPlaylist.length - 1)

        console.log('🎵 Track ended:', {
          currentIndex,
          playlistLength: playlist.length,
          isShuffleOn,
          shuffledPlaylistLength: shuffledPlaylist.length,
          isLastTrack,
          isAutopilotOn,
          currentTrackUrl: playlist[currentIndex]?.url,
        })

        if (isLastTrack && isAutopilotOn) {
          // If autopilot is on and this was the last track, navigate to random post
          navigateToRandomPost()
          setIsPlaying(false)
          return
        }

        // Normal behavior - go to next track or stop
        let nextIndex = getNextTrackIndex()
        if (!isShuffleOn && currentIndex === playlist.length - 1) {
          // If shuffle is off and we're at the last track, loop back to the first track
          nextIndex = 0
        }
        if (nextIndex !== currentIndex) {
          playTrack(nextIndex)
        } else {
          setIsPlaying(false)
        }
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [
    audioRef,
    currentIndex,
    getNextTrackIndex,
    isLoopOn,
    isAutopilotOn,
    shuffledPlaylist,
    navigateToRandomPost,
    volume,
  ])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      if (isPlaying) {
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // Ignore AbortError as it's expected when navigating
            if (error.name !== 'AbortError') {
              console.warn('Audio play failed:', error)
            }
          })
        }
      } else {
        audio.pause()
      }
    }
  }, [isPlaying])

  // Handle autopilot navigation when enabled on home or /all page
  useEffect(() => {
    if (isAutopilotOn && shouldNavigateToRandomPost()) {
      // Immediate navigation for better responsiveness
      navigateToRandomPost()
    }
  }, [isAutopilotOn, shouldNavigateToRandomPost, navigateToRandomPost])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    // wait until metadata loads before attempting playback
    const tryPlay = () => {
      if (isPlaying) {
        const promise = audio.play()
        if (promise?.catch) {
          promise.catch((err) => {
            // Ignore AbortError as it's expected when navigating
            if (err.name !== 'AbortError') {
              console.warn('Autoplay failed:', err)
            }
          })
        }
      }
    }

    audio.addEventListener('loadedmetadata', tryPlay)
    return () => audio.removeEventListener('loadedmetadata', tryPlay)
  }, [currentTrack, isPlaying])

  const togglePlay = () => {
    // If no track is selected but we have a playlist, start playing
    if (!currentTrack && playlist.length > 0) {
      const trackIndex = isShuffleOn
        ? Math.floor(Math.random() * playlist.length)
        : 0
      playTrack(trackIndex)
      return
    }

    const newPlayingState = !isPlaying
    setIsPlaying(newPlayingState)

    // Track play/pause events
    if (currentTrack) {
      const postName = getPostName(currentTrack)
      const eventName = newPlayingState ? 'songPlay' : 'songPause'
      trackAudioEvent[eventName](
        currentTrack,
        postName,
        currentIndex + 1,
        playlist.length,
        'fixed_player'
      )
    }
  }

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00'
    const minutes = Math.floor(secs / 60)
    const seconds = Math.floor(secs % 60)
      .toString()
      .padStart(2, '0')
    return `${minutes}:${seconds}`
  }

  const getProgress = () => {
    return duration ? (currentTime / duration) * 100 : 0
  }

  const handleSeek = (e) => {
    const progress = progressRef.current
    if (!progress || !audioRef.current) return

    const rect = progress.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = percent * duration
  }

  return (
    <div className="audio-player-container">
      <div className="player-left">
        <button
          onClick={toggleAutopilot}
          style={{
            color: isAutopilotOn ? '#DE3163' : '#fff',
            transition: 'color 0.2s ease',
            backgroundColor: 'transparent',
            border: 'none',
            display: 'flex',
            padding: 0,
            margin: '0 6px 0 0',
            cursor: 'pointer',
          }}
          title={isAutopilotOn ? 'Autopilot is on' : 'Turn autopilot on'}
        >
          <Zap size={24} />
        </button>
        <div className="track-info">
          <div className="track-title">
            {currentTrack?.title || 'No track selected'}
          </div>
          <div className="track-artist">
            {currentTrack?.artist || 'Select a track to start playing'}
          </div>
        </div>
        <div className="player-controls">
          {playlist.length > 1 && (
            <button
              onClick={toggleShuffle}
              style={{
                color: isShuffleOn ? '#DE3163' : '#fff',
                transition: 'color 0.2s ease',
              }}
              title={isShuffleOn ? 'Shuffle is on' : 'Turn shuffle on'}
              disabled={!currentTrack}
            >
              <Shuffle size={18} />
            </button>
          )}

          <button
            onClick={toggleLoop}
            style={{
              color: isLoopOn ? '#DE3163' : '#fff',
              transition: 'color 0.2s ease',
            }}
            title={isLoopOn ? 'Loop is on' : 'Turn loop on'}
            disabled={!currentTrack}
          >
            <Repeat size={18} />
          </button>
          <button
            onClick={() => {
              const prevIndex = getPreviousTrackIndex()

              // Check if we're on the first track and autopilot is on
              const isFirstTrack =
                currentIndex === 0 ||
                (isShuffleOn &&
                  shuffledPlaylist.length > 0 &&
                  shuffledPlaylist.findIndex(
                    (track) => track.url === playlist[currentIndex]?.url
                  ) === 0)

              if (isFirstTrack && isAutopilotOn) {
                // Set flag to indicate audio was playing when navigation occurred
                if (isPlaying) {
                  localStorage.setItem('audioWasPlaying', 'true')
                }

                // Navigate to previous page instead of playing previous track
                if (
                  typeof window !== 'undefined' &&
                  window.history.length > 1
                ) {
                  window.history.back()
                }
                return
              }

              playTrack(prevIndex)

              // Track previous track navigation
              if (playlist[prevIndex]) {
                const track = playlist[prevIndex]
                const postName = getPostName(track)
                trackAudioEvent.trackNavigate(
                  track,
                  postName,
                  prevIndex + 1,
                  playlist.length,
                  'previous',
                  'fixed_player'
                )
              }
            }}
            disabled={!currentTrack}
          >
            <SkipBack size={20} />
          </button>
          <button
            onClick={togglePlay}
            disabled={!currentTrack && playlist.length === 0}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button
            onClick={() => {
              const nextIndex = getNextTrackIndex()

              // Check if this is the last track and autopilot is on
              const isLastTrack =
                currentIndex === playlist.length - 1 ||
                (isShuffleOn &&
                  shuffledPlaylist.length > 0 &&
                  shuffledPlaylist.findIndex(
                    (track) => track.url === playlist[currentIndex]?.url
                  ) ===
                    shuffledPlaylist.length - 1)

              if (isLastTrack && isAutopilotOn) {
                // Navigate to random blog post instead of playing next track
                navigateToRandomPost()
                return
              }

              playTrack(nextIndex)

              // Track next track navigation
              if (playlist[nextIndex]) {
                const track = playlist[nextIndex]
                const postName = getPostName(track)
                trackAudioEvent.trackNavigate(
                  track,
                  postName,
                  nextIndex + 1,
                  playlist.length,
                  'next',
                  'fixed_player'
                )
              }
            }}
            disabled={!currentTrack}
          >
            <SkipForward size={20} />
          </button>
        </div>
      </div>

      <div className="player-center">
        <div className="time-display">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div
          className="progress-bar-container"
          ref={progressRef}
          onClick={currentTrack ? handleSeek : undefined}
        >
          <div
            className="progress-bar-fill"
            style={{ width: currentTrack ? `${getProgress()}%` : '0%' }}
          ></div>
        </div>
      </div>

      <div className="player-right">
        <Volume2 size={18} style={{ marginRight: 6 }} />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => {
            const newVolume = parseFloat(e.target.value)
            updateVolume(newVolume)
          }}
          disabled={!currentTrack}
        />
      </div>

      <audio ref={audioRef} src={currentTrack?.url} />
    </div>
  )
}
