import React, { createContext, useContext, useState, useRef } from 'react'

const AudioPlayerContext = createContext()

export const AudioPlayerProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  const playTrack = (index, newPlaylist) => {
    if (newPlaylist) setPlaylist(newPlaylist)
    setCurrentIndex(index)
    setIsPlaying(true)
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
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}

export const useAudioPlayer = () => useContext(AudioPlayerContext)
