import React, { useEffect, useRef, useState } from 'react'
import { useAudioPlayer } from '../../contexts/audio-player-context/audio-player-context'
import './FixedAudioPlayer.css'
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'

export const FixedAudioPlayer = () => {
  const {
    playlist,
    currentIndex,
    isPlaying,
    setIsPlaying,
    playTrack,
    audioRef,
  } = useAudioPlayer()

  console.log('isplaying', isPlaying)

  const progressRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const currentTrack = playlist[currentIndex]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => {
      console.log('ended', currentIndex, playlist.length)
      if (currentIndex < playlist.length - 1) {
        console.log('playing next track', currentIndex + 1)
        playTrack(currentIndex + 1)
      } else {
        setIsPlaying(false)
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioRef, currentIndex])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      isPlaying ? audio.play() : audio.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    // wait until metadata loads before attempting playback
    const tryPlay = () => {
      if (isPlaying) {
        const promise = audio.play()
        if (promise?.catch) {
          promise.catch((err) => {
            console.warn('Autoplay failed:', err)
          })
        }
      }
    }

    audio.addEventListener('loadedmetadata', tryPlay)
    return () => audio.removeEventListener('loadedmetadata', tryPlay)
  }, [currentTrack, isPlaying])

  const togglePlay = () => setIsPlaying(!isPlaying)

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

  if (!currentTrack) return null

  return (
    <div className="audio-player-container">
      <div className="player-left">
        <div className="track-info">
          <div className="track-title">{currentTrack.title}</div>
          <div className="track-artist">{currentTrack.artist}</div>
        </div>
        <div className="player-controls">
          <button onClick={() => playTrack(Math.max(currentIndex - 1, 0))}>
            <SkipBack size={20} />
          </button>
          <button onClick={togglePlay}>
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button
            onClick={() =>
              playTrack(Math.min(currentIndex + 1, playlist.length - 1))
            }
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
          onClick={handleSeek}
        >
          <div
            className="progress-bar-fill"
            style={{ width: `${getProgress()}%` }}
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
          defaultValue={1}
          onChange={(e) => {
            if (audioRef.current)
              audioRef.current.volume = parseFloat(e.target.value)
          }}
        />
      </div>

      <audio ref={audioRef} src={currentTrack.url} />
    </div>
  )
}
