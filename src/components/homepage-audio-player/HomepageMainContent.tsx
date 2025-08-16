import React from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { FileText, CalendarIcon } from 'lucide-react'
import { PostCalendar } from '../post-calendar/PostCalendar'
import { AllPostsTable } from './AllPostsTable'
import { Link } from 'gatsby'
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
  bottomView: 'posts' | 'calendar'
  onBottomViewChange: (view: 'posts' | 'calendar') => void
  posts: any[]
  currentBlogPost: string | null
  onPostClick: (post: BlogPost) => void
  markovTexts: MarkovText[]
}

export const HomepageMainContent: React.FC<HomepageMainContentProps> = ({
  bottomView,
  onBottomViewChange,
  posts,
  currentBlogPost,
  onPostClick,
  markovTexts,
}) => {
  const isCurrentBlogPost = (post: BlogPost) => {
    return post.daily_id === currentBlogPost
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* P5 Sketch Visualization */}
      <div className="flex-1 relative bg-black p-6">
        <div className="w-full h-full rounded-lg overflow-hidden relative">
          {/* Placeholder for P5 sketch - replace with your actual sketch */}
          <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 relative">
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
            <h2 className="text-lg text-white">
              {bottomView === 'posts' ? 'All Days' : 'Calendar'}
            </h2>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${bottomView === 'posts' ? 'text-red-400' : 'text-gray-400'}`}
                onClick={() => onBottomViewChange('posts')}
                aria-label="Posts view"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${bottomView === 'calendar' ? 'text-red-400' : 'text-gray-400'}`}
                onClick={() => onBottomViewChange('calendar')}
                aria-label="Calendar view"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Conditional Content */}
          {bottomView === 'posts' ? (
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
          ) : (
            <PostCalendar
              posts={posts.map((post) => ({
                id: post.node.fields.slug,
                title: post.node.frontmatter.title,
                date: post.node.frontmatter.date,
                content: post.node.excerpt,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  )
}
