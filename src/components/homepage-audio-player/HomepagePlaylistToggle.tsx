import React from 'react'

interface HomepagePlaylistToggleProps {
  currentBlogPost: string | null
  posts: any[]
}

export const HomepagePlaylistToggle: React.FC<HomepagePlaylistToggleProps> = ({
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
              {posts.find(
                (p) => p.node.frontmatter.daily_id === currentBlogPost
              )?.node.frontmatter.title || currentBlogPost}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
