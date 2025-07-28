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

  // const onEnded = () => {
  //   console.log(
  //     'Context onEnded called - currentIndex:',
  //     currentIndex,
  //     'playlist.length:',
  //     playlist.length
  //   )
  //   if (currentIndex !== null && currentIndex < playlist.length - 1) {
  //     console.log('Auto-advancing to next track:', currentIndex + 1)
  //     playTrack(currentIndex + 1)
  //   } else {
  //     console.log('End of playlist reached, stopping playback')
  //     setIsPlaying(false)
  //   }
  // }

  return (
    <AudioPlayerContext.Provider
      value={{
        playlist,
        currentIndex,
        isPlaying,
        setIsPlaying,
        playTrack,
        audioRef,
        // onEnded,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}

export const useAudioPlayer = () => useContext(AudioPlayerContext)
