import React, { useState, useEffect } from 'react'
import { useAudioContext } from '../audio-context/audio-context'

const StopAllButton = () => {
  const { stopAllAudio } = useAudioContext()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const checkWidth = () => {
      setIsVisible(window.innerWidth >= 750)
    }

    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  if (!isVisible) return null

  return (
    <button
      onClick={stopAllAudio}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        background: '#1a1a1a',
        color: '#ffffff',
        border: 'none',
        borderRadius: '50%',
        width: '56px',
        height: '56px',
        cursor: 'pointer',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title="Stop all audio"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="1" ry="1" />
      </svg>
    </button>
  )
}

export default StopAllButton
