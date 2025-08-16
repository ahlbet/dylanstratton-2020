import React from 'react'

interface CurrentTrackInfo {
  title: string
  date: string
}

interface HomepageCurrentTrackInfoProps {
  currentTrackInfo: CurrentTrackInfo
  error: string | null
  supabaseError: string | null
}

export const HomepageCurrentTrackInfo: React.FC<
  HomepageCurrentTrackInfoProps
> = ({ currentTrackInfo, error, supabaseError }) => {
  return (
    <div
      className="p-6 border-b border-gray-800"
      data-testid="current-track-info-container"
    >
      <h2
        className="text-xl text-red-400 mb-2"
        data-testid="current-track-title"
      >
        {currentTrackInfo.title}
      </h2>
      <p className="text-gray-400 text-sm" data-testid="current-track-date">
        {currentTrackInfo.date}
      </p>
      {error && (
        <p className="text-red-500 text-sm mt-2" data-testid="error-message">
          {error}
        </p>
      )}
      {supabaseError && (
        <p className="text-red-500 text-sm mt-2" data-testid="error-message">
          Supabase: {supabaseError}
        </p>
      )}
    </div>
  )
}
