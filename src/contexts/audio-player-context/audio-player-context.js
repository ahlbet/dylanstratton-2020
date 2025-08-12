import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'
import { trackAudioEvent, getPostName } from '../../utils/plausible-analytics'

const AudioPlayerContext = createContext()

export const AudioPlayerProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [totalPlaylistDuration, setTotalPlaylistDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isShuffleOn, setIsShuffleOn] = useState(false)
  const [isLoopOn, setIsLoopOn] = useState(false)
  const [isAutopilotOn, setIsAutopilotOn] = useState(false)
  const [shuffledPlaylist, setShuffledPlaylist] = useState([])
  const audioRef = useRef(null)

  // Load volume, shuffle, and loop from localStorage on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem('audioPlayerVolume')
    if (savedVolume !== null) {
      const parsedVolume = parseFloat(savedVolume)
      if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
        setVolume(parsedVolume)
      }
    }

    const savedShuffle = localStorage.getItem('audioPlayerShuffle')
    if (savedShuffle !== null) {
      setIsShuffleOn(savedShuffle === 'true')
    }

    const savedLoop = localStorage.getItem('audioPlayerLoop')
    if (savedLoop !== null) {
      setIsLoopOn(savedLoop === 'true')
    }

    const savedAutopilot = localStorage.getItem('audioPlayerAutopilot')
    if (savedAutopilot !== null) {
      // Don't load autopilot state if we're on the /all page
      if (
        typeof window !== 'undefined' &&
        window.location.pathname !== '/all' &&
        window.location.pathname !== '/all/'
      ) {
        setIsAutopilotOn(savedAutopilot === 'true')
      }
    }
  }, [])

  // Update audio volume when volume state changes
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = volume
    }
  }, [volume])

  // Set volume when current track changes (e.g., after navigation)
  useEffect(() => {
    const audio = audioRef.current
    if (audio && currentIndex !== null) {
      // Small delay to ensure audio element has loaded the new source
      const timeoutId = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.volume = volume
        }
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [currentIndex, volume])

  // Create shuffled playlist when shuffle is toggled or playlist changes
  useEffect(() => {
    if (isShuffleOn && playlist.length > 0) {
      const shuffled = [...playlist].sort(() => Math.random() - 0.5)
      setShuffledPlaylist(shuffled)
    } else {
      setShuffledPlaylist([])
    }
  }, [isShuffleOn, playlist])

  const playTrack = useCallback(
    async (index, newPlaylist) => {
      if (newPlaylist) setPlaylist(newPlaylist)

      const trackToPlay = newPlaylist ? newPlaylist[index] : playlist[index]
      if (!trackToPlay) return

      // No need to lazy load audio metadata - durations are already available from Supabase
      setCurrentIndex(index)
      setIsPlaying(true)

      // Track song play with Plausible Analytics
      if (trackToPlay) {
        const postName = getPostName(trackToPlay)
        trackAudioEvent.songPlay(
          trackToPlay,
          postName,
          index + 1,
          newPlaylist ? newPlaylist.length : playlist.length,
          'context_player'
        )
      }
    },
    [playlist]
  )

  const updateVolume = (newVolume) => {
    setVolume(newVolume)
    localStorage.setItem('audioPlayerVolume', newVolume.toString())
  }

  const toggleShuffle = () => {
    const newShuffleState = !isShuffleOn
    setIsShuffleOn(newShuffleState)
    localStorage.setItem('audioPlayerShuffle', newShuffleState.toString())
  }

  const toggleLoop = () => {
    const newLoopState = !isLoopOn
    setIsLoopOn(newLoopState)
    localStorage.setItem('audioPlayerLoop', newLoopState.toString())
  }

  const toggleAutopilot = () => {
    const newAutopilotState = !isAutopilotOn
    setIsAutopilotOn(newAutopilotState)
    localStorage.setItem('audioPlayerAutopilot', newAutopilotState.toString())

    // If turning on autopilot, ensure shuffle is also on
    if (newAutopilotState && !isShuffleOn) {
      setIsShuffleOn(true)
      localStorage.setItem('audioPlayerShuffle', 'true')
    }
  }

  // Function to check if autopilot navigation is needed
  const shouldNavigateToRandomPost = () => {
    if (!isAutopilotOn) return false

    // Check if we're on home or /all page
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname
      return pathname === '/' || pathname === '/all' || pathname === '/all/'
    }

    return false
  }

  const getNextTrackIndex = () => {
    if (isShuffleOn && shuffledPlaylist.length > 0) {
      // Find current track in shuffled playlist and get next
      const currentTrack = playlist[currentIndex]
      const currentShuffledIndex = shuffledPlaylist.findIndex(
        (track) => track.url === currentTrack.url
      )
      const nextShuffledIndex =
        (currentShuffledIndex + 1) % shuffledPlaylist.length
      const nextTrack = shuffledPlaylist[nextShuffledIndex]
      // Find the original index of the next track
      return playlist.findIndex((track) => track.url === nextTrack.url)
    } else {
      return (currentIndex + 1) % playlist.length
    }
  }

  const getPreviousTrackIndex = () => {
    if (isShuffleOn && shuffledPlaylist.length > 0) {
      // Find current track in shuffled playlist and get previous
      const currentTrack = playlist[currentIndex]
      const currentShuffledIndex = shuffledPlaylist.findIndex(
        (track) => track.url === currentTrack.url
      )
      const prevShuffledIndex =
        currentShuffledIndex === 0
          ? shuffledPlaylist.length - 1
          : currentShuffledIndex - 1
      const prevTrack = shuffledPlaylist[prevShuffledIndex]
      // Find the original index of the previous track
      return playlist.findIndex((track) => track.url === prevTrack.url)
    } else {
      return Math.max(currentIndex - 1, 0)
    }
  }

  const updateTotalPlaylistDuration = (duration) => {
    setTotalPlaylistDuration(duration)
  }

  return (
    <AudioPlayerContext.Provider
      value={{
        playlist,
        setPlaylist,
        currentIndex,
        isPlaying,
        setIsPlaying,
        playTrack,
        audioRef,
        totalPlaylistDuration,
        updateTotalPlaylistDuration,
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
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}

export const useAudioPlayer = () => useContext(AudioPlayerContext)
