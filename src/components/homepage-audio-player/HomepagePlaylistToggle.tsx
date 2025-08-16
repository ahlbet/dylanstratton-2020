import React from 'react'
import { Button } from '../ui/button'
import { Grid, List } from 'lucide-react'

interface HomepagePlaylistToggleProps {
  viewMode: 'list' | 'grid'
  onViewModeChange: (mode: 'list' | 'grid') => void
  currentBlogPost: string | null
  posts: any[]
}

export const HomepagePlaylistToggle: React.FC<HomepagePlaylistToggleProps> = ({
  viewMode,
  onViewModeChange,
  currentBlogPost,
  posts,
}) => {
  return (
    <div
      className="p-4 border-b border-gray-800"
      data-testid="playlist-toggle-container"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-gray-400">Playlist</span>
          {currentBlogPost && (
            <span className="text-xs text-gray-500">
              Blog Post:{' '}
              {posts.find(
                (p) => p.node.frontmatter.daily_id === currentBlogPost
              )?.node.frontmatter.title || currentBlogPost}
            </span>
          )}
        </div>
        <div className="flex space-x-2" data-testid="toggle-buttons-container">
          <button
            role="button"
            aria-label="Switch to list view"
            aria-pressed={viewMode === 'list'}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-red-400 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
            onClick={() => onViewModeChange('list')}
          >
            List
          </button>
          <button
            role="button"
            aria-label="Switch to grid view"
            aria-pressed={viewMode === 'grid'}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-red-400 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
            onClick={() => onViewModeChange('grid')}
          >
            Grid
          </button>
        </div>
      </div>
      {currentBlogPost && (
        <div className="text-center text-gray-400 text-sm mt-2">
          {currentBlogPost}
        </div>
      )}
    </div>
  )
}
