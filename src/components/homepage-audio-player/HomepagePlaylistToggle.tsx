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
    <div className="p-4 border-b border-gray-800">
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
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className={`p-1 ${viewMode === 'list' ? 'text-red-400' : 'text-gray-400'}`}
            onClick={() => onViewModeChange('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`p-1 ${viewMode === 'grid' ? 'text-red-400' : 'text-gray-400'}`}
            onClick={() => onViewModeChange('grid')}
            aria-label="Grid view"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
