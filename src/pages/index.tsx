import React, { useState, useMemo, useEffect } from 'react'
import { graphql, Link, PageProps } from 'gatsby'

import Layout from '../components/layout/layout'
import SEO from '../components/seo/seo'
import { Button } from '../components/ui/button'
import { Calendar as CalendarIcon, FileText, Loader } from 'lucide-react'
import { Card } from '../components/ui/card'
import { Calendar } from '../components/ui/calendar'
import { useAudioPlayer } from '../contexts/audio-player-context/audio-player-context'
import { usePresignedUrl } from '../hooks/use-presigned-url'
import { useSupabaseData } from '../hooks/use-supabase-data'
import { PostCalendar } from '../components/post-calendar/PostCalendar'
import { HomepageAudioPlayer } from '../components/homepage-audio-player'
import { HomepageGeneratedText } from '../components/homepage-audio-player'
import { HomepageMainContent } from '../components/homepage-audio-player'
import { formatDuration } from '../utils/audio-utils'

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
  durationSeconds: number
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
  const [bottomView, setBottomView] = useState<'posts' | 'calendar'>('posts')
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
  } = useAudioPlayer()

  const { getAudioUrl } = usePresignedUrl()

  // Get data from Supabase hook and props (GraphQL)
  const supabaseResult = useSupabaseData()
  const supabaseData = supabaseResult.data
  const supabaseLoading = supabaseResult.loading
  const supabaseError = supabaseResult.error
  const siteTitle = data.site.siteMetadata.title
  const posts = data.allMarkdownRemark.edges

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

  // Utility function to check if we're in local development mode
  const isLocalDev = (): boolean => {
    // In test environment, always use production mode (getAudioUrl)
    if (process.env.NODE_ENV === 'test') {
      return false
    }

    return (
      process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined' &&
      window.location.hostname === 'localhost'
    )
  }

  // Utility function to extract filename from storage path
  const extractFilenameFromStoragePath = (storagePath: string): string => {
    const pathParts = storagePath.split('/')
    const filename = pathParts[pathParts.length - 1]
    return filename.replace(/\.[^/.]+$/, '') // Remove extension
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
        duration: formatDuration(track.duration || 0),
        durationSeconds: track.duration || 0,
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
              duration: formatDuration(track.duration || 0),
              durationSeconds: track.duration || 0,
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
      // Stop current audio playback before changing posts
      if (isPlaying) {
        setIsPlaying(false)
      }

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
          duration: formatDuration(track.duration || 0),
          durationSeconds: track.duration || 0,
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

  // Convert current blog post tracks to audio tracks for the player
  useEffect(() => {
    if (currentBlogPostTracks.length > 0) {
      const audioTracks = currentBlogPostTracks.map((track) => ({
        url: '', // Will be populated when track is played
        title: track.title,
        storagePath: track.storage_path,
        daily_id: track.daily_id,
        duration: track.durationSeconds || 0,
        id: track.id,
      }))

      // Always set the playlist to ensure it's populated on refresh/navigation
      setPlaylist(audioTracks)
    }
  }, [currentBlogPostTracks, setPlaylist])

  // Get cover art for the current blog post
  const currentCoverArt = useMemo(() => {
    if (!supabaseData?.daily || !currentBlogPost) return null

    // Find the daily data that matches the current blog post
    const dailyEntry = supabaseData.daily.find(
      (daily) => daily.id === currentBlogPost
    )
    if (dailyEntry && dailyEntry.cover_art) {
      // Return the raw cover art data (storage path or URL) for the component to process
      return dailyEntry.cover_art
    }

    return null
  }, [supabaseData?.daily, currentBlogPost])

  // Process markov texts from Supabase data for the current blog post
  const processedTexts = useMemo(() => {
    if (!supabaseData?.markovTexts || !currentBlogPost) return []

    return supabaseData.markovTexts
      .filter(
        (text): text is MarkovText =>
          text.text_content !== undefined &&
          text.text_content !== null &&
          text.daily_id === currentBlogPost
      )
      .map((text) => ({
        id: text.id,
        content: text.text_content,
        coherencyLevel: text.coherency_level || '50',
      }))
      .slice(0, 5) // Show only first 5 texts for the current post
  }, [supabaseData?.markovTexts, currentBlogPost])

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
      const trackToGetUrlFor = playlist[playlistIndex]

      try {
        // Check if we should use local audio files for development
        const isLocalDevMode = isLocalDev()

        let audioUrl: string | null = null

        if (isLocalDevMode) {
          // Use local audio files for development
          const filename = extractFilenameFromStoragePath(
            trackToGetUrlFor.storagePath
          )
          audioUrl = `/local-audio/${filename}.wav`
        } else {
          // Production mode: generate presigned URL on-demand
          audioUrl = await getAudioUrl({
            storagePath: trackToGetUrlFor.storagePath,
          })
        }

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
          // The audioRef is not defined in this component, so this block is removed.
          // if (audioRef.current) {
          //   audioRef.current.src = audioUrl
          //   audioRef.current.play()
          // }
        } else {
          setError('Failed to get audio URL for track')
        }
      } catch (error) {
        setError('Failed to get audio URL for track')
      }
    }
  }

  if (supabaseLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin" />
      </div>
    )
  }

  return (
    <Layout location={location} title={siteTitle}>
      <SEO title="All posts" />
      <div className="flex flex-col lg:flex-row min-h-screen bg-black">
        <div className="lg:w-1/3 border-r border-gray-800 flex flex-col">
          {/* Left Sidebar - Audio Player */}
          <HomepageAudioPlayer
            currentBlogPostTracks={currentBlogPostTracks}
            currentBlogPost={currentBlogPost}
            posts={posts}
            supabaseLoading={supabaseLoading}
            supabaseError={supabaseError}
            onTrackSelect={handleTrackSelect}
            parentError={error}
            coverArt={currentCoverArt}
          />

          {/* Generated Text Section */}
          <HomepageGeneratedText processedTexts={processedTexts} />
        </div>
        {/* Main Content Area */}
        <HomepageMainContent
          markovTexts={processedTexts}
          bottomView={bottomView}
          onBottomViewChange={setBottomView}
          recentPosts={recentPosts}
          posts={posts}
          currentBlogPost={currentBlogPost}
          onPostClick={handlePostClick}
        />
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
