import React from 'react'
import { Button } from '../ui/button'
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { formatDuration } from '../../utils/audio-utils'

interface HomepageAudioControlsProps {
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  onPlayPause: () => void
  onNextTrack: () => void
  onPreviousTrack: () => void
  onVolumeChange: (volume: number) => void
  onTimeChange: (time: number) => void
  onMuteToggle: () => void
}

export const HomepageAudioControls: React.FC<HomepageAudioControlsProps> = ({
  isPlaying,
  isLoading,
  currentTime,
  duration,
  volume,
  isMuted,
  onPlayPause,
  onNextTrack,
  onPreviousTrack,
  onVolumeChange,
  onTimeChange,
  onMuteToggle,
}) => {
  return (
    <div className="p-6 border-b border-gray-800">
      <div className="flex items-center justify-center space-x-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-gray-300"
          onClick={onPreviousTrack}
          aria-label="Previous track"
        >
          <SkipBack className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="text-white hover:text-gray-300"
          onClick={onPlayPause}
          disabled={isLoading}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-gray-300"
          onClick={onNextTrack}
          aria-label="Next track"
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div
          className="w-full bg-gray-800 rounded-full h-1 cursor-pointer"
          onClick={(e) => {
            if (duration > 0) {
              const rect = e.currentTarget.getBoundingClientRect()
              const clickX = e.clientX - rect.left
              const newTime = (clickX / rect.width) * duration
              onTimeChange(newTime)
            }
          }}
        >
          <div
            className="bg-red-400 h-1 rounded-full"
            style={{
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
            }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-2 mt-4">
        <button
          onClick={onMuteToggle}
          className="text-gray-400 hover:text-gray-300 transition-colors duration-150 p-1 rounded"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
        <div className="flex-1 relative">
          {/* Background track showing current volume level */}
          <div className="absolute inset-0 bg-gray-800 rounded-full h-1"></div>
          <div
            className="absolute inset-0 bg-white rounded-full h-1 "
            style={{ width: `${volume * 100}%` }}
          ></div>
          {/* Range input on top for interaction */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-1 appearance-none cursor-pointer bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-md focus:outline-none focus:[&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] focus:[&::-moz-range-thumb]:shadow-[0_0_0_3px_rgba(59,130,246,0.3)]"
          />
        </div>
      </div>
    </div>
  )
}
