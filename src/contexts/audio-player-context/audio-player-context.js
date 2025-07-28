import React, { createContext, useContext, useState, useRef } from 'react'

const AudioPlayerContext = createContext()

export const AudioPlayerProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [totalPlaylistDuration, setTotalPlaylistDuration] = useState(0)
  const audioRef = useRef(null)

  const playTrack = (index, newPlaylist) => {
    if (newPlaylist) setPlaylist(newPlaylist)
    setCurrentIndex(index)
    setIsPlaying(true)
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
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}

export const useAudioPlayer = () => useContext(AudioPlayerContext)
