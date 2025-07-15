import React, { useState, useRef, useEffect } from 'react'
import { rhythm } from '../../utils/typography'

const AudioPlayer = ({ src, title, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const audioRef = useRef(null)
  const progressRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleLoadedData = () => {
      setIsLoading(false)
      setDuration(audio.duration)
    }
    const handleError = () => {
      setError('Failed to load audio file')
      setIsLoading(false)
    }
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('error', handleError)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width
    const clickTime = (clickX / width) * duration
    audioRef.current.currentTime = clickTime
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    audioRef.current.volume = newVolume
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div
        style={{
          padding: rhythm(1),
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          color: '#c53030',
          marginBottom: rhythm(1),
        }}
      >
        <strong>Error:</strong> {error}
      </div>
    )
  }

  return (
    <div
      className={`audio-player ${className}`}
      style={{
        border: '1px solid #38383a',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: rhythm(1),
        backgroundColor: '#1c1c1e',
        color: '#ffffff',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px #38383a',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Title */}
      {title && (
        <div
          style={{
            marginBottom: rhythm(0.5),
            fontWeight: '600',
            fontSize: '1.1em',
            color: '#ffffff',
            letterSpacing: '-0.01em',
            lineHeight: '1.2',
          }}
        >
          {title}
        </div>
      )}

      {/* Main controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: rhythm(0.5) }}>
        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#2c2c2e',
            color: '#ffffff',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isLoading ? 0.6 : 1,
            boxShadow:
              '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
          ) : isPlaying ? (
            '⏸'
          ) : (
            '▶'
          )}
        </button>

        {/* Progress bar */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            style={{
              height: '4px',
              backgroundColor: '#2c2c2e',
              borderRadius: '2px',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #0a84ff, #409cff)',
                borderRadius: '2px',
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                transition: 'width 0.1s ease-out',
                boxShadow: '0 0 8px rgba(10, 132, 255, 0.3)',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '14px',
              color: '#8e8e93',
              marginTop: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: '500',
            }}
          >
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#8e8e93' }}>🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            style={{
              width: '60px',
              cursor: 'pointer',
              height: '3px',
              backgroundColor: '#2c2c2e',
              borderRadius: '1.5px',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
              WebkitAppearance: 'none',
              appearance: 'none',
            }}
            aria-label="Volume"
          />
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .audio-player input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            background: #ffffff;
            border: 2px solid #0a84ff;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .audio-player input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 12px rgba(10, 132, 255, 0.3);
          }
          
          .audio-player input[type="range"]::-moz-range-thumb {
            width: 12px;
            height: 12px;
            background: #ffffff;
            border: 2px solid #0a84ff;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .audio-player input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          }
          
          .audio-player button:hover {
            background-color: #3a3a3c !important;
            transform: scale(1.05);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 0 1px #0a84ff !important;
          }
          
          .audio-player button:active {
            transform: scale(0.95);
          }
        `,
        }}
      />
    </div>
  )
}

export default AudioPlayer
