import React from 'react'
import {
  convertCoverArtUrlToLocal,
  getCoverArtUrl,
} from '../../utils/local-audio-urls'
import { isLocalDev } from '../../utils/local-dev-utils'

interface CurrentTrackInfo {
  title: string
  date: string
}

interface HomepageCurrentTrackInfoProps {
  currentTrackInfo: CurrentTrackInfo
  error: string | null
  supabaseError: string | null
  coverArt?: string | null
}

export const HomepageCurrentTrackInfo: React.FC<
  HomepageCurrentTrackInfoProps
> = ({ currentTrackInfo, error, supabaseError, coverArt }) => {
  return (
    <div
      className="p-6 border-b border-gray-800"
      data-testid="current-track-info-container"
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
          {coverArt ? (
            <img
              src={(() => {
                // Process cover art URL using the same logic as blog post template
                const coverArtSource = coverArt.startsWith('http')
                  ? coverArt
                  : getCoverArtUrl(coverArt)

                // Only convert to local URLs in development mode
                if (isLocalDev()) {
                  // Extract the actual filename from the cover art path for local development
                  let filename = 'daily-cover'
                  if (coverArt.includes('/')) {
                    // Handle storage path like "cover-art/25aug12.png"
                    filename =
                      coverArt.split('/').pop()?.replace('.png', '') ||
                      'daily-cover'
                  } else if (coverArt.startsWith('http')) {
                    // Handle full URLs
                    const urlParts = coverArt.split('/')
                    filename = urlParts[urlParts.length - 1]
                      .replace('.png', '')
                      .split('?')[0]
                  }

                  return convertCoverArtUrlToLocal(coverArtSource, filename)
                }

                // In production, return the original URL unchanged
                return coverArtSource
              })()}
              alt="Daily cover art"
              className="w-full h-full object-cover"
              data-testid="daily-cover-art"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Art</span>
            </div>
          )}
        </div>

        <div className="flex flex-col">
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
            <p
              className="text-red-500 text-sm mt-2"
              data-testid="error-message"
            >
              {error}
            </p>
          )}
          {supabaseError && (
            <p
              className="text-red-500 text-sm mt-2"
              data-testid="error-message"
            >
              Supabase: {supabaseError}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
