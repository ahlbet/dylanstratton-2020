import React, { createContext, useContext, useRef, useCallback } from 'react'

const AudioContext = createContext()

export const useAudioContext = () => {
  const context = useContext(AudioContext)
  if (!context) {
    // Return a fallback context instead of throwing an error
    return {
      registerAudioPlayer: () => {},
      unregisterAudioPlayer: () => {},
      stopAllAudio: () => {},
    }
  }
  return context
}

export const AudioProvider = ({ children }) => {
  const audioPlayersRef = useRef(new Set())

  const registerAudioPlayer = useCallback((player) => {
    // Check if player is already registered
    if (audioPlayersRef.current.has(player)) {
      return
    }
    audioPlayersRef.current.add(player)
  }, [])

  const unregisterAudioPlayer = useCallback((player) => {
    audioPlayersRef.current.delete(player)
  }, [])

  const stopAllAudio = useCallback(() => {
    audioPlayersRef.current.forEach((player) => {
      if (player && typeof player.pause === 'function') {
        player.pause()
      }
    })
  }, [])

  const value = {
    registerAudioPlayer,
    unregisterAudioPlayer,
    stopAllAudio,
  }

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}
