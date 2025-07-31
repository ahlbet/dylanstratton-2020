import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
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

  const playTrack = (index, newPlaylist) => {
    if (newPlaylist) setPlaylist(newPlaylist)
    setCurrentIndex(index)
    setIsPlaying(true)

    // Track song play with Plausible Analytics
    const track = newPlaylist ? newPlaylist[index] : playlist[index]
    if (track) {
      const postName = getPostName(track)
      trackAudioEvent.songPlay(
        track,
        postName,
        index + 1,
        newPlaylist ? newPlaylist.length : playlist.length,
        'context_player'
      )
    }
  }

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
        getNextTrackIndex,
        getPreviousTrackIndex,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}

export const useAudioPlayer = () => useContext(AudioPlayerContext)
