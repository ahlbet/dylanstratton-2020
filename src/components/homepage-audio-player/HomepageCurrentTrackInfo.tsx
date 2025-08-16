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
    <div className="p-6 border-b border-gray-800">
      <h2 className="text-xl text-red-400 mb-2">{currentTrackInfo.title}</h2>
      <p className="text-gray-400 text-sm">{currentTrackInfo.date}</p>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {supabaseError && (
        <p className="text-red-500 text-sm mt-2">Supabase: {supabaseError}</p>
      )}
    </div>
  )
}
