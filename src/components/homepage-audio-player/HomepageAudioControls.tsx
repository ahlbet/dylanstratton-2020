import React from 'react'
import { Button } from '../ui/button'
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { formatDuration } from '../../utils/audio-utils'

interface HomepageAudioControlsProps {
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  onPlayPause: () => void
  onNextTrack: () => void
  onPreviousTrack: () => void
  onVolumeChange: (volume: number) => void
  onTimeChange: (time: number) => void
}

export const HomepageAudioControls: React.FC<HomepageAudioControlsProps> = ({
  isPlaying,
  isLoading,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onNextTrack,
  onPreviousTrack,
  onVolumeChange,
  onTimeChange,
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
        <Volume2 className="h-4 w-4 text-gray-400" />
        <div
          className="flex-1 bg-gray-800 rounded-full h-1 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const clickX = e.clientX - rect.left
            const newVolume = clickX / rect.width
            onVolumeChange(Math.max(0, Math.min(1, newVolume)))
          }}
        >
          <div
            className="bg-white h-1 rounded-full"
            style={{ width: `${volume * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}
