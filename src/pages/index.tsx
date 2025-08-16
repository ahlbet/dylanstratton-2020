import React, { useState, useMemo, useEffect } from 'react'
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
import { useSupabaseData } from '../hooks/use-supabase-data'
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
}: {
  data: IndexPageData
  location: any
  pageContext: PageContext
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [bottomView, setBottomView] = useState<'posts' | 'calendar'>('posts')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentBlogPost, setCurrentBlogPost] = useState<string | null>(null)
  const [currentBlogPostTracks, setCurrentBlogPostTracks] = useState<
    ProcessedAudioTrack[]
  >([])

  const {
    playlist,
    setPlaylist,
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

  // Get data from Supabase hook and props (GraphQL)
  const supabaseResult = useSupabaseData()
  const supabaseData = supabaseResult.data
  const supabaseLoading = supabaseResult.loading
  const supabaseError = supabaseResult.error
  const siteTitle = data.site.siteMetadata.title
  const posts = data.allMarkdownRemark.edges

  // Utility function to format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Utility function to generate track title from available data
  const generateTrackTitle = (track: AudioItem): string => {
    // Extract from storage path (similar to BlogAudioPlayer logic)
    if (track.storage_path) {
      const pathParts = track.storage_path.split('/')
      const filename = pathParts[pathParts.length - 1]
      const trackName = filename.replace(/\.[^/.]+$/, '') // Remove extension
      return trackName
    }

    // Fallback: use the daily_id and track number
    return `${track.daily_id}-${track.id}`
  }

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
        title: generateTrackTitle(track),
        date: new Date(track.created_at || '').toLocaleDateString(),
        duration: formatDuration(Number(track.duration) || 0),
        storage_path: track.storage_path,
        daily_id: track.daily_id,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [supabaseData?.audio])

  // Set current blog post and tracks when data changes
  useEffect(() => {
    // Check if we have posts but no audio data yet
    if (posts.length > 0) {
      const mostRecentPost = posts[0]
      const mostRecentDailyId = mostRecentPost.node.frontmatter.daily_id

      if (mostRecentDailyId) {
        setCurrentBlogPost(mostRecentDailyId)

        // Only process tracks if we have audio data
        if (supabaseData?.audio && supabaseData.audio.length > 0) {
          // Filter tracks for the current blog post
          const tracks = supabaseData.audio
            .filter(
              (track): track is AudioItem =>
                Boolean(track.storage_path) &&
                Boolean(track.daily_id) &&
                track.daily_id === mostRecentDailyId
            )
            .map((track) => ({
              id: track.id,
              title: generateTrackTitle(track),
              date: new Date(track.created_at || '').toLocaleDateString(),
              duration: formatDuration(Number(track.duration) || 0),
              storage_path: track.storage_path,
              daily_id: track.daily_id,
            }))
            .sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )

          setCurrentBlogPostTracks(tracks)
        } else {
          setCurrentBlogPostTracks([])
        }
      }
    }
  }, [posts, supabaseData?.audio])

  // Function to change the current blog post
  const changeBlogPost = (dailyId: string) => {
    if (supabaseData?.audio) {
      setCurrentBlogPost(dailyId)

      // Filter tracks for the selected blog post
      const tracks = supabaseData.audio
        .filter(
          (track): track is AudioItem =>
            Boolean(track.storage_path) &&
            Boolean(track.daily_id) &&
            track.daily_id === dailyId
        )
        .map((track) => ({
          id: track.id,
          title: generateTrackTitle(track),
          date: new Date(track.created_at || '').toLocaleDateString(),
          duration: formatDuration(Number(track.duration) || 0),
          storage_path: track.storage_path,
          daily_id: track.daily_id,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setCurrentBlogPostTracks(tracks)
    }
  }

  // Function to handle post click and change current blog post
  const handlePostClick = (post: {
    id: string
    title: string
    date: string
    content: string
  }) => {
    // Find the daily_id for this post
    const postData = posts.find((p) => p.node.fields.slug === post.id)
    if (postData?.node.frontmatter.daily_id) {
      changeBlogPost(postData.node.frontmatter.daily_id)
    }
  }

  // Function to check if a post is the current blog post
  const isCurrentBlogPost = (post: {
    id: string
    title: string
    date: string
    content: string
  }) => {
    const postData = posts.find((p) => p.node.fields.slug === post.id)
    return postData?.node.frontmatter.daily_id === currentBlogPost
  }

  // Queue up the current blog post's tracks when they change
  useEffect(() => {
    if (currentBlogPostTracks.length > 0) {
      // Convert processed tracks to AudioTrack format for the audio player
      const audioTracks = currentBlogPostTracks.map((track) => ({
        url: '', // Will be populated when track is played
        title: track.title,
        storagePath: track.storage_path,
        daily_id: track.daily_id,
        duration:
          Number(track.duration.split(':')[0]) * 60 +
            Number(track.duration.split(':')[1]) || 0,
        id: track.id,
      }))

      // Always set the playlist to ensure it's populated on refresh/navigation
      setPlaylist(audioTracks)
    }
  }, [currentBlogPostTracks, setPlaylist])

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
        coherencyLevel: text.coherency_level || '50',
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
      date:
        currentBlogPostTracks.find((t) => t.id === track.id)?.date ||
        new Date().toLocaleDateString(),
    }
  }, [currentIndex, playlist, currentBlogPostTracks])

  // Handle track selection
  const handleTrackSelect = async (track: ProcessedAudioTrack) => {
    // Find the track in the current playlist
    const playlistIndex = playlist.findIndex((p) => p.id === track.id)
    if (playlistIndex !== -1) {
      // Get the presigned URL for the track
      const audioUrl = await getAudioUrl({
        storagePath: track.storage_path,
      })

      if (audioUrl) {
        // Update the playlist with the URL and play the track
        const updatedPlaylist = [...playlist]
        updatedPlaylist[playlistIndex] = {
          ...updatedPlaylist[playlistIndex],
          url: audioUrl,
        }

        setPlaylist(updatedPlaylist)
        playTrack(playlistIndex, updatedPlaylist)

        // Set the audio source and play
        if (audioRef.current) {
          audioRef.current.src = audioUrl
          audioRef.current.play()
        }
      }
    }
  }

  // Handle play/pause button click
  const handlePlayPause = async () => {
    setError(null)

    // If no track is selected but we have a playlist, start playing the first one
    if (currentIndex === null && playlist.length > 0) {
      playTrack(0)
      return
    }

    // Don't allow play if there's no audio source
    if (!audioRef.current?.src) {
      return
    }

    // Toggle play/pause for current track
    const newPlayingState = !isPlaying
    setIsPlaying(newPlayingState)

    if (newPlayingState) {
      audioRef.current?.play()
    } else {
      audioRef.current?.pause()
    }
  }

  // Handle next/previous track
  const handleNextTrack = async () => {
    if (playlist.length === 0) return

    const nextIndex = getNextTrackIndex()
    const nextTrack = playlist[nextIndex]

    if (nextTrack.storagePath) {
      const audioUrl = await getAudioUrl({
        storagePath: nextTrack.storagePath,
      })

      if (audioUrl) {
        const updatedPlaylist = [...playlist]
        updatedPlaylist[nextIndex] = {
          ...updatedPlaylist[nextIndex],
          url: audioUrl,
        }

        setPlaylist(updatedPlaylist)
        playTrack(nextIndex, updatedPlaylist)

        // Set the audio source and play
        if (audioRef.current) {
          audioRef.current.src = audioUrl
          audioRef.current.play()
        }
      }
    }
  }

  const handlePreviousTrack = async () => {
    if (playlist.length === 0) return

    const prevIndex = getPreviousTrackIndex()
    const prevTrack = playlist[prevIndex]

    if (prevTrack.storagePath) {
      const audioUrl = await getAudioUrl({
        storagePath: prevTrack.storagePath,
      })

      if (audioUrl) {
        const updatedPlaylist = [...playlist]
        updatedPlaylist[prevIndex] = {
          ...updatedPlaylist[prevIndex],
          url: audioUrl,
        }

        setPlaylist(updatedPlaylist)
        playTrack(prevIndex, updatedPlaylist)

        // Set the audio source and play
        if (audioRef.current) {
          audioRef.current.src = audioUrl
          audioRef.current.play()
        }
      }
    }
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
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {supabaseError && (
              <p className="text-red-500 text-sm mt-2">
                Supabase: {supabaseError}
              </p>
            )}
          </div>

          {/* Audio Controls */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-gray-300"
                onClick={handlePreviousTrack}
                aria-label="Previous track"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:text-gray-300"
                onClick={handlePlayPause}
                disabled={isLoading}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-gray-300"
                onClick={handleNextTrack}
                aria-label="Next track"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div
                className="w-full bg-gray-800 rounded-full h-1 cursor-pointer"
                onClick={(e) => {
                  if (audioRef.current && duration > 0) {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const clickX = e.clientX - rect.left
                    const newTime = (clickX / rect.width) * duration
                    audioRef.current.currentTime = newTime
                  }
                }}
              >
                <div
                  className="bg-red-400 h-1 rounded-full"
                  style={{
                    width:
                      duration > 0
                        ? `${(currentTime / duration) * 100}%`
                        : '0%',
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2 mt-4">
              <Volume2 className="h-4 w-4 text-gray-400" />
              <div
                className="flex-1 bg-gray-800 rounded-full h-1 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const clickX = e.clientX - rect.left
                  const newVolume = clickX / rect.width
                  updateVolume(Math.max(0, Math.min(1, newVolume)))
                }}
              >
                <div
                  className="bg-white h-1 rounded-full"
                  style={{ width: `${volume * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Playlist View Toggle */}
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
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-1 ${viewMode === 'grid' ? 'text-red-400' : 'text-gray-400'}`}
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Playlist */}
            <div className="flex-1 overflow-y-auto">
              {supabaseLoading ? (
                <div className="p-4 text-center text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-400 mx-auto mb-2"></div>
                  Loading audio data...
                </div>
              ) : supabaseError ? (
                <div className="p-4 text-center text-red-400">
                  Error loading audio data: {supabaseError}
                </div>
              ) : currentBlogPostTracks.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  No tracks available for this blog post
                </div>
              ) : (
                currentBlogPostTracks.map((track, index) => (
                  <div
                    key={track.id}
                    className={`p-4 border-b border-gray-900 hover:bg-gray-900 cursor-pointer transition-colors ${
                      currentIndex === index
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

          {/* Hidden audio element for actual playback */}
          <audio
            ref={audioRef}
            onEnded={() => {
              // Auto-play next track when current track ends
              if (playlist.length > 0) {
                handleNextTrack()
              }
            }}
            onError={(e) => {
              console.error('Audio playback error:', e)
              setError('Audio playback error')
            }}
            onTimeUpdate={() => {
              if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime)
              }
            }}
            onLoadedMetadata={() => {
              if (audioRef.current) {
                setDuration(audioRef.current.duration)
              }
            }}
            onLoadStart={() => {
              setIsLoading(true)
            }}
            onCanPlay={() => {
              setIsLoading(false)
            }}
          />

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
                    aria-label="Posts view"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-2 ${bottomView === 'calendar' ? 'text-red-400' : 'text-gray-400'}`}
                    onClick={() => setBottomView('calendar')}
                    aria-label="Calendar view"
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
                      className={`bg-black border transition-colors cursor-pointer ${
                        isCurrentBlogPost(post)
                          ? 'border-red-400 bg-gray-900'
                          : 'border-gray-800 hover:border-gray-700'
                      }`}
                      onClick={() => handlePostClick(post)}
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
