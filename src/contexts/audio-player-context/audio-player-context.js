import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react'

const AudioPlayerContext = createContext()

export const AudioPlayerProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [totalPlaylistDuration, setTotalPlaylistDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const audioRef = useRef(null)

  // Load volume from localStorage on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem('audioPlayerVolume')
    if (savedVolume !== null) {
      const parsedVolume = parseFloat(savedVolume)
      if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
        setVolume(parsedVolume)
      }
    }
  }, [])

  // Update audio volume when volume state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const playTrack = (index, newPlaylist) => {
    if (newPlaylist) setPlaylist(newPlaylist)
    setCurrentIndex(index)
    setIsPlaying(true)
  }

  const updateVolume = (newVolume) => {
    setVolume(newVolume)
    localStorage.setItem('audioPlayerVolume', newVolume.toString())
  }

  const updateTotalPlaylistDuration = (duration) => {
    setTotalPlaylistDuration(duration)
  }

  return (
    <AudioPlayerContext.Provider
      value={{
        playlist,
        currentIndex,
        isPlaying,
        setIsPlaying,
        playTrack,
        audioRef,
        totalPlaylistDuration,
        updateTotalPlaylistDuration,
        volume,
        updateVolume,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}

export const useAudioPlayer = () => useContext(AudioPlayerContext)
