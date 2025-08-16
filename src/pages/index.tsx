import React, { useState, useMemo } from 'react'
import { graphql, Link, PageProps } from 'gatsby'

import Layout from '../components/layout/layout'
import SEO from '../components/seo/seo'
import { Button } from '../components/ui/button'
import {
  Calendar as CalendarIcon,
  FileText,
  Grid,
  List,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { Calendar } from '../components/ui/calendar'
import { useAudioPlayer } from '../contexts/audio-player-context/audio-player-context'
import { usePresignedUrl } from '../hooks/use-presigned-url'
import { PostCalendar } from '../components/post-calendar/PostCalendar'

// Types
interface BlogPost {
  node: {
    excerpt: string
    fields: {
      slug: string
    }
    frontmatter: {
      date: string
      title: string
      description?: string
      daily_id?: string
    }
  }
}

interface PageContext {
  previous?: {
    fields: { slug: string }
    frontmatter: { title: string }
  }
  next?: {
    fields: { slug: string }
    frontmatter: { title: string }
  }
  markdownData?: any
  supabaseData?: SupabaseData
}

interface AudioItem {
  id: string
  storagePath?: string
  storage_path?: string
  duration?: number | null
  format?: string
  title?: string
  artist?: string
  album?: string
  displayFilename?: string
  daily_id: string
  created_at: string
}

interface MarkovText {
  id: string
  text_content: string
  coherency_level?: string
  daily_id: string
  created_at: string
}

interface SupabaseData {
  audio?: AudioItem[]
  markovTexts?: MarkovText[]
  daily?: DailyData
}

interface DailyData {
  title?: string
  coherency_level?: string
  cover_art?: string
}

interface ProcessedAudioTrack {
  id: string
  title: string
  date: string
  duration: string
  storage_path: string
  daily_id: string
}

interface IndexPageData {
  site: {
    siteMetadata: {
      title: string
    }
  }
  allMarkdownRemark: {
    edges: Array<{
      node: {
        excerpt: string
        fields: {
          slug: string
        }
        frontmatter: {
          date: string
          title: string
          daily_id?: string
        }
      }
    }>
  }
}

const BlogIndex = ({
  data,
  location,
  pageContext,
}: PageProps<IndexPageData, PageContext>) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [bottomView, setBottomView] = useState<'posts' | 'calendar'>('posts')

  const {
    playlist,
    currentIndex,
    isPlaying,
    setIsPlaying,
    playTrack,
    audioRef,
    volume,
    updateVolume,
    isShuffleOn,
    toggleShuffle,
    isLoopOn,
    toggleLoop,
    isAutopilotOn,
    toggleAutopilot,
    shouldNavigateToRandomPost,
    shuffledPlaylist,
    getNextTrackIndex,
    getPreviousTrackIndex,
  } = useAudioPlayer()

  const { getAudioUrl } = usePresignedUrl()

  // Get data from pageContext (Supabase) and props (GraphQL)
  const { supabaseData } = pageContext || {}
  const siteTitle = data.site.siteMetadata.title
  const posts = data.allMarkdownRemark.edges

  // Process audio tracks from Supabase data
  const processedTracks = useMemo(() => {
    if (!supabaseData?.audio) return []

    return supabaseData.audio
      .filter(
        (track): track is AudioItem =>
          Boolean(track.storage_path) && Boolean(track.daily_id)
      )
      .map((track) => ({
        id: track.id,
        title: track.title || `Track ${track.id}`,
        date: new Date(track.created_at || '').toLocaleDateString(),
        duration: formatDuration(Number(track.duration) || 0),
        storage_path: track.storage_path,
        daily_id: track.daily_id,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [supabaseData?.audio])

  // Process markov texts from Supabase data
  const processedTexts = useMemo(() => {
    if (!supabaseData?.markovTexts) return []

    return supabaseData.markovTexts
      .filter(
        (text): text is MarkovText =>
          text.text_content !== undefined && text.text_content !== null
      )
      .map((text) => ({
        id: text.id,
        content: text.text_content,
        coherencyLevel: text.coherency_level || 'medium',
      }))
      .slice(0, 5) // Show only first 5 texts
  }, [supabaseData?.markovTexts])

  // Get recent posts from GraphQL data
  const recentPosts = useMemo(() => {
    return posts.slice(0, 5).map((post) => ({
      id: post.node.fields.slug,
      title: post.node.frontmatter.title,
      date: post.node.frontmatter.date,
      content: post.node.excerpt,
    }))
  }, [posts])

  // Current track info
  const currentTrackInfo = useMemo(() => {
    if (currentIndex === null || !playlist[currentIndex]) {
      return {
        title: 'No Track Playing',
        date: new Date().toLocaleDateString(),
      }
    }
    const track = playlist[currentIndex]
    return {
      title: track.title || 'Unknown Track',
      date: new Date().toLocaleDateString(),
    }
  }, [currentIndex, playlist])

  // Handle track selection
  const handleTrackSelect = (track: ProcessedAudioTrack) => {
    if (getAudioUrl) {
      getAudioUrl({
        storagePath: track.storage_path,
      })
    }
  }

  // Utility function to format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Layout location={location} title={siteTitle}>
      <SEO title="All posts" />
      <div className="flex flex-col lg:flex-row min-h-screen bg-black">
        {/* Left Sidebar - Audio Player */}
        <div className="lg:w-1/3 border-r border-gray-800 flex flex-col">
          {/* Current Track Info */}
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl text-red-400 mb-2">
              {currentTrackInfo.title}
            </h2>
            <p className="text-gray-400 text-sm">{currentTrackInfo.date}</p>
          </div>

          {/* Audio Controls */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-gray-300"
                onClick={() => getPreviousTrackIndex && getPreviousTrackIndex()}
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:text-gray-300"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-gray-300"
                onClick={() => getNextTrackIndex && getNextTrackIndex()}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-gray-800 rounded-full h-1">
                <div
                  className="bg-red-400 h-1 rounded-full"
                  style={{ width: '35%' }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>0:01</span>
                <span>4:27</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2 mt-4">
              <Volume2 className="h-4 w-4 text-gray-400" />
              <div className="flex-1 bg-gray-800 rounded-full h-1">
                <div
                  className="bg-white h-1 rounded-full"
                  style={{ width: `${volume * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Playlist View Toggle */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Playlist</span>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-1 ${viewMode === 'list' ? 'text-red-400' : 'text-gray-400'}`}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-1 ${viewMode === 'grid' ? 'text-red-400' : 'text-gray-400'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Playlist */}
            <div className="flex-1 overflow-y-auto">
              {processedTracks.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  No tracks available
                </div>
              ) : (
                processedTracks.slice(0, 20).map((track, index) => (
                  <div
                    key={track.id}
                    className={`p-4 border-b border-gray-900 hover:bg-gray-900 cursor-pointer transition-colors ${
                      track.id === currentTrackInfo.title
                        ? 'bg-gray-900 border-l-2 border-l-red-400'
                        : ''
                    }`}
                    onClick={() => handleTrackSelect(track)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-400">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {track.title}
                        </p>
                        <p className="text-xs text-gray-400">{track.date}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {track.duration}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Generated Text Section */}
          <div className="mb-8">
            <h3 className="text-sm text-gray-400 mb-4 uppercase tracking-wide">
              Generated Text
            </h3>
            <div className="space-y-4">
              {processedTexts.length === 0 ? (
                <p className="text-gray-400">No generated text available</p>
              ) : (
                processedTexts.map((text) => (
                  <div key={text.id} className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-gray-300 leading-relaxed">
                      {text.content}
                    </p>
                    <div className="flex items-center space-x-2 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-red-400"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-gray-400"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* P5 Sketch Visualization */}
          <div className="flex-1 relative bg-black p-6">
            <div className="w-full h-full rounded-lg overflow-hidden relative">
              {/* Placeholder for P5 sketch - replace with your actual sketch */}
              <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 relative">
                <div>Sketch</div>
              </div>
            </div>
          </div>

          {/* Blog Posts/Calendar Section */}
          <div className="border-t border-gray-800 bg-gray-950">
            <div className="p-6">
              {/* Section Header with Toggle */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg text-white">
                  {bottomView === 'posts' ? 'Recent Posts' : 'Post Calendar'}
                </h2>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-2 ${bottomView === 'posts' ? 'text-red-400' : 'text-gray-400'}`}
                    onClick={() => setBottomView('posts')}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-2 ${bottomView === 'calendar' ? 'text-red-400' : 'text-gray-400'}`}
                    onClick={() => setBottomView('calendar')}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Conditional Content */}
              {bottomView === 'posts' ? (
                <div className="space-y-6">
                  {recentPosts.map((post) => (
                    <Card
                      key={post.id}
                      className="bg-black border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className="p-6">
                        <div className="flex items-baseline space-x-4 mb-3 group">
                          <h3 className="text-red-400 font-medium group-hover:text-red-300 transition-colors duration-200">
                            <Link to={post.id} className="">
                              {post.title}
                            </Link>
                          </h3>
                          <span className="text-xs text-gray-500">
                            {post.date}
                          </span>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                          {post.content}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
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
      </div>
    </Layout>
  )
}

export default BlogIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
            daily_id
          }
        }
      }
    }
  }
`
