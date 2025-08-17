import React from 'react'
import { AllPostsTable } from './AllPostsTable'
import AudioFFT from '../audio-fft/AudioFFT'

interface BlogPost {
  id: string
  title: string
  date: string
  content: string
  daily_id?: string
}

interface MarkovText {
  id: string
  content: string
  coherency_level?: string
}

interface HomepageMainContentProps {
  posts: any[]
  currentBlogPost: string | null
  onPostClick: (post: BlogPost) => void
  markovTexts: MarkovText[]
}

export const HomepageMainContent: React.FC<HomepageMainContentProps> = ({
  posts,
  currentBlogPost,
  onPostClick,
  markovTexts,
}) => {
  return (
    <div className="flex-1 flex flex-col">
      {/* P5 Sketch Visualization */}
      <div className="flex relative bg-black p-6">
        <div className="w-full h-full rounded-lg overflow-hidden relative">
          {/* Placeholder for P5 sketch - replace with your actual sketch */}
          <div className="w-full h-64 bg-gradient-to-br from-purple-900/20 to-blue-900/20 relative">
            <AudioFFT
              markovText={markovTexts.map((text) => text.content).join(' ')}
            />
          </div>
        </div>
      </div>

      {/* Blog Posts/Calendar Section */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="p-6">
          {/* Section Header with Toggle */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg text-white">All Days</h2>
          </div>

          <AllPostsTable
            posts={posts.map((post) => ({
              id: post.node.fields.slug,
              title: post.node.frontmatter.title,
              date: post.node.frontmatter.date,
              content: post.node.excerpt,
              daily_id: post.node.frontmatter.daily_id,
            }))}
            currentBlogPost={currentBlogPost}
            onPostClick={onPostClick}
          />
        </div>
      </div>
    </div>
  )
}
