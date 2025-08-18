import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { trackAudioEvent, getPostName } from '../../utils/plausible-analytics'

// Types
export interface AudioTrack {
  url: string
  title?: string
  artist?: string
  duration?: number
  [key: string]: any // Allow additional properties
}

export interface AudioPlayerContextType {
  playlist: AudioTrack[]
  setPlaylist: React.Dispatch<React.SetStateAction<AudioTrack[]>>
  currentIndex: number | null
  isPlaying: boolean
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>
  totalPlaylistDuration: number
  volume: number
  isShuffleOn: boolean
  isLoopOn: boolean
  isAutopilotOn: boolean
  shuffledPlaylist: AudioTrack[]
  audioRef: React.RefObject<HTMLAudioElement>
  playTrack: (index: number, newPlaylist?: AudioTrack[]) => Promise<void>
  resetCurrentIndex: () => void
  updateTotalPlaylistDuration: (duration: number) => void
  updateVolume: (newVolume: number) => void
  toggleShuffle: () => void
  toggleLoop: () => void
  toggleAutopilot: () => void
  shouldNavigateToRandomPost: () => boolean
  getNextTrackIndex: () => number
  getPreviousTrackIndex: () => number
}

interface AudioPlayerProviderProps {
  children: ReactNode
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined
)

export const AudioPlayerProvider: React.FC<AudioPlayerProviderProps> = ({
  children,
}) => {
  const [playlist, setPlaylist] = useState<AudioTrack[]>([])
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [totalPlaylistDuration, setTotalPlaylistDuration] = useState<number>(0)
  const [volume, setVolume] = useState<number>(1)
  const [isShuffleOn, setIsShuffleOn] = useState<boolean>(false)
  const [isLoopOn, setIsLoopOn] = useState<boolean>(false)
  const [isAutopilotOn, setIsAutopilotOn] = useState<boolean>(false)
  const [shuffledPlaylist, setShuffledPlaylist] = useState<AudioTrack[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)

  // Load volume, shuffle, loop, and autopilot from localStorage on mount
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
      setIsAutopilotOn(savedAutopilot === 'true')
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
    async (index: number, newPlaylist?: AudioTrack[]): Promise<void> => {
      if (newPlaylist) setPlaylist(newPlaylist)

      const trackToPlay = newPlaylist ? newPlaylist[index] : playlist[index]
      if (!trackToPlay) return

      // No need to lazy load audio metadata - durations are already available from Supabase
      setCurrentIndex(index)
      setIsPlaying(true)

      // Track song play with Plausible Analytics
      if (trackToPlay) {
        const postName = getPostName(trackToPlay, null)
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

  const resetCurrentIndex = useCallback((): void => {
    setCurrentIndex(null)
    setIsPlaying(false)
  }, [])

  const updateVolume = (newVolume: number): void => {
    setVolume(newVolume)
    localStorage.setItem('audioPlayerVolume', newVolume.toString())
  }

  const toggleShuffle = (): void => {
    const newShuffleState = !isShuffleOn
    setIsShuffleOn(newShuffleState)
    localStorage.setItem('audioPlayerShuffle', newShuffleState.toString())
  }

  const toggleLoop = (): void => {
    const newLoopState = !isLoopOn
    setIsLoopOn(newLoopState)
    localStorage.setItem('audioPlayerLoop', newLoopState.toString())
  }

  const toggleAutopilot = (): void => {
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
  const shouldNavigateToRandomPost = (): boolean => {
    if (!isAutopilotOn) return false

    return false
  }

  const getNextTrackIndex = (): number => {
    if (isShuffleOn && shuffledPlaylist.length > 0) {
      // Find current track in shuffled playlist and get next
      const currentTrack = playlist[currentIndex!]
      const currentShuffledIndex = shuffledPlaylist.findIndex(
        (track) => track.url === currentTrack.url
      )
      const nextShuffledIndex =
        (currentShuffledIndex + 1) % shuffledPlaylist.length
      const nextTrack = shuffledPlaylist[nextShuffledIndex]
      // Find the original index of the next track
      return playlist.findIndex((track) => track.url === nextTrack.url)
    } else {
      return currentIndex !== null ? (currentIndex + 1) % playlist.length : 0
    }
  }

  const getPreviousTrackIndex = (): number => {
    if (isShuffleOn && shuffledPlaylist.length > 0) {
      // Find current track in shuffled playlist and get previous
      const currentTrack = playlist[currentIndex!]
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
      return Math.max((currentIndex ?? 0) - 1, 0)
    }
  }

  const updateTotalPlaylistDuration = (duration: number): void => {
    setTotalPlaylistDuration(duration)
  }

  const contextValue: AudioPlayerContextType = {
    playlist,
    setPlaylist,
    currentIndex,
    isPlaying,
    setIsPlaying,
    playTrack,
    resetCurrentIndex,
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
  }

  return (
    <AudioPlayerContext.Provider value={contextValue}>
      {children}
    </AudioPlayerContext.Provider>
  )
}

export const useAudioPlayer = (): AudioPlayerContextType => {
  const context = useContext(AudioPlayerContext)
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider')
  }
  return context
}
