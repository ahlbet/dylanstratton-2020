import React from 'react'
import { BlogPost } from '../../pages'

interface HomepagePlaylistToggleProps {
  currentBlogPost: BlogPost | null
}

export const HomepagePlaylistToggle: React.FC<HomepagePlaylistToggleProps> = ({
  currentBlogPost,
}) => {
  return (
    <div className="p-4 border-b border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-gray-400">Playlist</span>
          {currentBlogPost && (
            <span className="text-xs text-gray-500">
              {currentBlogPost.title}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
