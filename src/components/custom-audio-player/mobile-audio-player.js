import React, { useRef, useEffect } from 'react'
import AudioPlayer from 'react-h5-audio-player'
import 'react-h5-audio-player/lib/styles.css'
import { rhythm } from '../../utils/typography'
import { useAudioContext } from '../audio-context/audio-context'

const MobileAudioPlayer = ({ src, title, className = '' }) => {
  const { registerAudioPlayer, unregisterAudioPlayer } = useAudioContext()
  const audioPlayerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        // Use the stored reference if available
        let audioElement = audioPlayerRef.current._registeredAudioElement

        if (!audioElement) {
          // Fallback to finding the audio element
          if (audioPlayerRef.current.audio) {
            audioElement = audioPlayerRef.current.audio
          } else if (audioPlayerRef.current.querySelector) {
            audioElement = audioPlayerRef.current.querySelector('audio')
          } else {
            audioElement = audioPlayerRef.current
          }
        }

        if (audioElement && audioElement.tagName === 'AUDIO') {
          unregisterAudioPlayer(audioElement)
        }
      }
    }
  }, [registerAudioPlayer, unregisterAudioPlayer])

  return (
    <div
      className={`mobile-audio-player ${className}`}
      style={{
        padding: '0',
        background: 'transparent',
        border: 'none',
        borderRadius: '12px',
        margin: '20px 0',
        boxShadow: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#ffffff',
      }}
    >
      {title && <div className="audio-title">{title}</div>}

      <AudioPlayer
        ref={audioPlayerRef}
        src={src}
        showJumpControls={false}
        showFilledProgress={true}
        showFilledVolume={true}
        customProgressBarSection={['PROGRESS_BAR', 'CURRENT_TIME', 'DURATION']}
        customControlsSection={[
          'MAIN_CONTROLS',
          'VOLUME_CONTROLS',
          'ADDITIONAL_CONTROLS',
        ]}
        customAdditionalControls={[
          <button
            key="download"
            onClick={() => {
              fetch(src)
                .then((response) => response.blob())
                .then((blob) => {
                  const url = window.URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = src.split('/').pop() || 'audio.wav'
                  link.style.display = 'none'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  window.URL.revokeObjectURL(url)
                })
                .catch((error) => {
                  console.error('Download failed:', error)
                  // Fallback to direct link
                  const link = document.createElement('a')
                  link.href = src
                  link.download = src.split('/').pop() || 'audio.wav'
                  link.style.display = 'none'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                })
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--apple-dark-text-secondary)',
              cursor: 'pointer',
              marginLeft: '16px',
              padding: '0px',
              paddingLeft: '12px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s ease',
            }}
            title="Download"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
                fill="currentColor"
              />
            </svg>
          </button>,
        ]}
        layout="horizontal"
        customIcons={{
          play: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6l8 6-8 6V6z" />
            </svg>
          ),
          pause: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="5" y="5" width="10" height="10" rx="1" ry="1" />
            </svg>
          ),
          stop: (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="5" y="5" width="10" height="10" rx="1" ry="1" />
            </svg>
          ),
          volume: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9 4L6 7H3v2h3l3 3V4z" />
              <path d="M12.5 8c0-1.5-.6-2.9-1.7-3.9l-.7.7c.8.8 1.2 1.9 1.2 3.2s-.4 2.4-1.2 3.2l.7.7c1.1-1 1.7-2.4 1.7-3.9z" />
              <path d="M14.5 8c0-2.2-.9-4.3-2.5-5.8l-.7.7c1.3 1.3 2 3 2 5.1s-.7 3.8-2 5.1l.7.7c1.6-1.5 2.5-3.6 2.5-5.8z" />
            </svg>
          ),
          volumeMute: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9 4L6 7H3v2h3l3 3V4z" />
              <path d="M12.5 5.5l-1 1L10.5 5l1-1 1 1.5z" />
              <path d="M14.5 7.5l-1 1L12.5 7l1-1 1 1.5z" />
            </svg>
          ),
        }}
        progressJumpSteps={{
          backward: 10000,
          forward: 10000,
        }}
        onPlay={(e) => {
          // Register the audio element when it starts playing
          const audioElement = e.target
          if (audioElement && audioElement.tagName === 'AUDIO') {
            registerAudioPlayer(audioElement)
            // Store a reference to this audio element for cleanup
            audioPlayerRef.current._registeredAudioElement = audioElement
          }
        }}
        onLoadStart={(e) => {
          // Also register when the audio starts loading
          const audioElement = e.target
          if (audioElement && audioElement.tagName === 'AUDIO') {
            registerAudioPlayer(audioElement)
            // Store a reference to this audio element for cleanup
            audioPlayerRef.current._registeredAudioElement = audioElement
          }
        }}
        onPause={(e) => {}}
        onEnded={(e) => {}}
        onError={(e) => {}}
        loop
        preload="auto"
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mobile-audio-player .audio-title {
            margin-bottom: 12px;
            font-weight: 600;
            font-size: 1.1em;
            color: var(--apple-dark-text);
            letter-spacing: -0.01em;
            line-height: 1.2;
          }

          .mobile-audio-player .rhap_horizontal {
            display: flex;
            flex-direction: column !important;
            gap: 16px;
          }
          .mobile-audio-player .rhap_progress-container {
            margin-left: 0 !important;
          }
          .mobile-audio-player .rhap_container {
            background-color: transparent !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            color: var(--apple-dark-text) !important;
            border: none !important;
            display: grid !important;
            grid-template-rows: auto auto !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          
          .mobile-audio-player .rhap_controls-section {
            display: grid !important;
            grid-template-columns: auto 1fr auto !important;
            align-items: center !important;
            gap: 12px !important;
            width: 100% !important;
            margin-left: 0 !important;
          }
          
          .mobile-audio-player .rhap_main-controls-button {
            background: #1a1a1a !important;
            border-radius: 50% !important;
            width: 48px !important;
            height: 48px !important;
            color: var(--apple-dark-text) !important;
            border: none !important;
            box-shadow: none !important;
            position: relative !important;
            overflow: hidden !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          
          .mobile-audio-player .rhap_main-controls-button.rhap_playing {
            color: rgba(255, 255, 255, 0.9) !important;
          }
          
          .mobile-audio-player .rhap_progress-bar {
            background: rgba(255, 255, 255, 0.8) !important;
            border-radius: 2px !important;
            height: 4px !important;
            backdrop-filter: none !important;
            border: none !important;
          }
          
          .mobile-audio-player .rhap_progress-filled {
            background: #010101 !important;
            border-radius: 2px !important;
          }
          
          .mobile-audio-player .rhap_progress-indicator {
            display: none !important;
          }
          
          .mobile-audio-player .rhap_download-progress {
            display: none !important;
          }
          
          .mobile-audio-player .rhap_progress-indicator {
            display: none !important;
          }
          
          .mobile-audio-player .rhap_time {
            color: var(--apple-dark-text-secondary) !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            text-shadow: none !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            font-variant-numeric: tabular-nums !important;
          }
          
          .mobile-audio-player .rhap_time:not(:last-child) {
            margin-right: 12px !important;
          }
          

          
          .mobile-audio-player .rhap_volume-controls {
            color: var(--apple-dark-text-secondary) !important;
            opacity: 0.8 !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
          }
          
          .mobile-audio-player .rhap_volume-button {
            color: rgba(255, 255, 255, 0.6) !important;
            opacity: 0.8 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            margin: 0 !important;
            min-width: auto !important;
            width: auto !important;
            height: auto !important;
          }

          .mobile-audio-player .rhap_play-pause-button {
            margin-left: 0 !important;
          }
          
          .mobile-audio-player .rhap_volume-bar-area {
            display: flex !important;
            align-items: center !important;
            height: 20px !important;
            min-width: 60px !important;
          }
          
          .mobile-audio-player .rhap_volume-bar {
            background: rgba(255, 255, 255, 0.1) !important;
            border-radius: 1.5px !important;
            height: 3px !important;
            backdrop-filter: none !important;
            border: none !important;
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3) !important;
            position: relative !important;
            overflow: hidden !important;
            margin: 0 !important;
            flex: 1 !important;
          }
          
          .mobile-audio-player .rhap_volume-filled {
            background: rgba(255, 255, 255, 0.8) !important;
            border-radius: 1.5px !important;
            box-shadow: none !important;
            position: relative !important;
            z-index: 1 !important;
          }
          
          .mobile-audio-player .rhap_volume-indicator {
            background: rgba(255, 255, 255, 0.9) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            box-shadow: 
              0 1px 3px rgba(0, 0, 0, 0.4),
              0 0 0 1px rgba(255, 255, 255, 0.1) !important;
            width: 10px !important;
            height: 10px !important;
            border-radius: 50% !important;
            transform: scale(1) !important;
          }
          
          .mobile-audio-player .rhap_volume-button svg {
            color: rgba(255, 255, 255, 0.6) !important;
            fill: rgba(255, 255, 255, 0.6) !important;
          }
          
          .mobile-audio-player .rhap_volume-button.rhap_volume-button-active svg {
            color: rgba(255, 255, 255, 0.8) !important;
            fill: rgba(255, 255, 255, 0.8) !important;
          }
          
          .mobile-audio-player [class*="volume"] svg,
          .mobile-audio-player [class*="Volume"] svg {
            color: rgba(255, 255, 255, 0.6) !important;
            fill: rgba(255, 255, 255, 0.6) !important;
          }
          
          .mobile-audio-player .rhap_controls-section svg {
            color: rgba(255, 255, 255, 0.6) !important;
            fill: rgba(255, 255, 255, 0.6) !important;
          }
          
          .mobile-audio-player .rhap_additional-controls {
            color: var(--apple-dark-text-secondary) !important;
          }
          
          .mobile-audio-player .rhap_additional-controls button {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          
          .mobile-audio-player .rhap_additional-controls {
            color: var(--apple-blue) !important;
            transform: scale(1.05) !important;
          }
          
          .mobile-audio-player .rhap_main-controls {
            margin-right: 0 !important;
            justify-content: flex-start !important;
            flex-shrink: 0 !important;
          }
          
          .mobile-audio-player .rhap_progress-section {
            margin-right: 0 !important;
            width: 100% !important;
          }
          
          .mobile-audio-player .rhap_volume-controls {
            margin-left: auto !important;
            justify-content: flex-end !important;
            flex-shrink: 0 !important;
          }

          .mobile-audio-player {
            box-shadow: none !important;
            transform: none !important;
          }
        `,
        }}
      />
    </div>
  )
}

export default MobileAudioPlayer
