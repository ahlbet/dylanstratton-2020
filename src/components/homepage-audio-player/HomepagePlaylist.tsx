import React from 'react'

interface ProcessedAudioTrack {
  id: string
  title: string
  date: string
  duration: string
  storage_path: string
  daily_id: string
}

interface HomepagePlaylistProps {
  tracks: ProcessedAudioTrack[]
  currentIndex: number | null
  supabaseLoading: boolean
  supabaseError: string | null
  onTrackSelect: (track: ProcessedAudioTrack) => void
}

export const HomepagePlaylist: React.FC<HomepagePlaylistProps> = ({
  tracks,
  currentIndex,
  supabaseLoading,
  supabaseError,
  onTrackSelect,
}) => {
  if (supabaseLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 text-center text-gray-400">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-400 mx-auto mb-2"></div>
          Loading audio data...
        </div>
      </div>
    )
  }

  if (supabaseError) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 text-center text-red-400">
          Error loading audio data: {supabaseError}
        </div>
      </div>
    )
  }

  if (tracks.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 text-center text-gray-400">
          No tracks available for this blog post
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {tracks.map((track, index) => (
        <div
          key={track.id}
          className={`p-4 border-b border-gray-900 hover:bg-gray-900 cursor-pointer transition-colors ${
            currentIndex === index
              ? 'bg-gray-900 border-l-2 border-l-red-400'
              : ''
          }`}
          onClick={() => onTrackSelect(track)}
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
              <span className="text-xs text-gray-400">{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{track.title}</p>
              <p className="text-xs text-gray-400">{track.date}</p>
            </div>
            <span className="text-xs text-gray-400">{track.duration}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
