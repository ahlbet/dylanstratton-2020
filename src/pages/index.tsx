import React, { useState, useMemo, useEffect } from 'react'
import { graphql } from 'gatsby'

import Layout from '../components/layout/layout'
import SEO from '../components/seo/seo'
import { useAudioPlayer } from '../contexts/audio-player-context/audio-player-context'
import { usePresignedUrl } from '../hooks/use-presigned-url'
import { useSupabaseData, FilterSortParams } from '../hooks/use-supabase-data'
import { useDebounce } from '../hooks/use-debounce'
import { HomepageAudioPlayer } from '../components/homepage-audio-player'
import { HomepageGeneratedText } from '../components/homepage-audio-player'
import { HomepageMainContent } from '../components/homepage-audio-player'
import {
  formatDuration,
  extractFilenameFromStoragePath,
  generateTrackTitle,
} from '../utils/audio-utils'
import { isLocalDev } from '../utils/local-dev-utils'

// Types
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

interface ProcessedAudioTrack {
  id: string
  title: string
  date: string
  duration: string
  durationSeconds: number
  storage_path: string
  daily_id: string
}

export interface BlogPost {
  id: string
  title: string
  date: string
  content: string
  daily_id: string
  cover_art: string
  audio: ProcessedAudioTrack[]
  markovTexts: MarkovText[]
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
}: {
  data: IndexPageData
  location: any
}) => {
  const [error, setError] = useState<string | null>(null)
  const [currentBlogPost, setCurrentBlogPost] = useState<BlogPost | null>(null)

  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [postsPerPage] = useState(10)

  // Debounce the search term to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500) // 500ms delay

  // Track when search is loading (when searchTerm differs from debouncedSearchTerm)
  const searchLoading = searchTerm !== debouncedSearchTerm

  const {
    playlist,
    setPlaylist,
    currentIndex,
    isPlaying,
    setIsPlaying,
    playTrack,
    audioRef,
  } = useAudioPlayer()

  const { getAudioUrl } = usePresignedUrl()

  // Build filter/sort parameters for Supabase
  const filterSortParams: FilterSortParams = useMemo(
    () => ({
      searchTerm: debouncedSearchTerm.trim()
        ? debouncedSearchTerm.trim()
        : undefined,
      sortDirection,
      currentPage,
      postsPerPage,
    }),
    [debouncedSearchTerm, sortDirection, currentPage, postsPerPage]
  )

  // Get data from Supabase hook with filter/sort parameters
  const supabaseResult = useSupabaseData(filterSortParams)
  const supabaseData = supabaseResult.data
  const supabaseLoading = supabaseResult.loading
  const supabaseError = supabaseResult.error
  const totalCount = supabaseResult.totalCount || 0

  const siteTitle = data.site.siteMetadata.title
  const posts = data.allMarkdownRemark.edges

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalCount / postsPerPage)

  // Process daily data from Supabase into the format expected by components
  const processedPosts = useMemo(() => {
    if (!supabaseData?.daily) {
      return []
    }

    const processed = supabaseData.daily.map((daily) => {
      // Find corresponding markdown post for excerpt content
      const markdownPost = posts.find(
        (p) => p.node.frontmatter.daily_id === daily.id
      )

      // If we have a markdown post, use its excerpt, otherwise create a fallback
      const content =
        markdownPost?.node.excerpt ||
        (daily.title ? `Content for ${daily.title}` : 'No content available')

      return {
        id: daily.id,
        title: daily.title || 'Untitled',
        date: daily.date,
        content,
        daily_id: daily.id,
        cover_art: daily.cover_art || '',
      }
    })

    return processed
  }, [supabaseData?.daily, posts])

  useEffect(() => {
    if (processedPosts.length > 0 && !currentBlogPost) {
      const post = processedPosts[0]
      const postMarkovTexts = supabaseData?.markovTexts.filter(
        (text) => text.daily_id === post.daily_id
      )
      // Filter tracks for the selected blog post
      const tracks = supabaseData.audio
        .filter(
          (track): track is AudioItem =>
            Boolean(track.storage_path) &&
            Boolean(track.daily_id) &&
            track.daily_id === post.daily_id
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
      changeBlogPost({
        ...post,
        audio: tracks || [],
        markovTexts: postMarkovTexts,
      })
    }
  }, [processedPosts, currentBlogPost])

  // Function to change the current blog post
  const changeBlogPost = (blogPost: BlogPost) => {
    if (supabaseData?.audio) {
      // Stop current audio playback before changing posts
      if (isPlaying) {
        setIsPlaying(false)
      }

      const postMarkovTexts = supabaseData?.markovTexts.filter(
        (text) => text.daily_id === blogPost.daily_id
      )

      // Filter tracks for the selected blog post
      const tracks = supabaseData.audio
        .filter(
          (track): track is AudioItem =>
            Boolean(track.storage_path) &&
            Boolean(track.daily_id) &&
            track.daily_id === blogPost.daily_id
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

      setCurrentBlogPost({
        ...blogPost,
        audio: tracks,
        markovTexts: postMarkovTexts || [],
      })
    }
  }

  // Function to handle post click and change current blog post
  const handlePostClick = (post: BlogPost) => {
    changeBlogPost(post)
  }

  // Convert current blog post tracks to audio tracks for the player
  useEffect(() => {
    if (currentBlogPost?.audio.length > 0) {
      const audioTracks = currentBlogPost?.audio.map((track) => ({
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
  }, [currentBlogPost?.audio, setPlaylist])

  // Process markov texts from Supabase data for the current blog post
  const processedTexts = useMemo(() => {
    if (!supabaseData?.markovTexts || !currentBlogPost) return []

    return supabaseData.markovTexts
      .filter(
        (text): text is MarkovText =>
          text.text_content !== undefined &&
          text.text_content !== null &&
          text.daily_id === currentBlogPost.daily_id
      )
      .map((text) => ({
        id: text.id,
        content: text.text_content,
        coherencyLevel: text.coherency_level || '50',
      }))
      .slice(0, 5) // Show only first 5 texts for the current post
  }, [supabaseData?.markovTexts, currentBlogPost])

  // Handle track selection
  const handleTrackSelect = async (track: ProcessedAudioTrack) => {
    // Find the track in the current playlist
    const playlistIndex = playlist.findIndex((p) => p.id === track.id)
    if (playlistIndex !== -1) {
      // Check if this track is already playing
      if (currentIndex === playlistIndex && isPlaying) {
        // Track is already playing, pause it
        if (audioRef.current) {
          audioRef.current.pause()
          setIsPlaying(false)
        }
        return
      }

      // Get the presigned URL for the track
      const trackToGetUrlFor = playlist[playlistIndex]

      try {
        // Check if we should use local audio files for development

        let audioUrl: string | null = null

        if (isLocalDev()) {
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
        } else {
          setError('Failed to get audio URL for track')
        }
      } catch (error) {
        setError('Failed to get audio URL for track')
      }
    }
  }

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  // Handle sort change
  const handleSortChange = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    setCurrentPage(1) // Reset to first page when sorting
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <Layout location={location} title={siteTitle}>
      <SEO title="All posts" />
      <div className="flex flex-col lg:flex-row min-h-screen bg-black">
        <div className="lg:w-1/3 border-r border-gray-800 flex flex-col">
          {/* Left Sidebar - Audio Player */}
          <HomepageAudioPlayer
            currentBlogPost={currentBlogPost}
            supabaseLoading={supabaseLoading}
            supabaseError={supabaseError}
            onTrackSelect={handleTrackSelect}
            parentError={error}
          />

          {/* Generated Text Section */}
          <HomepageGeneratedText currentBlogPost={currentBlogPost} />
        </div>
        {/* Main Content Area */}
        <HomepageMainContent
          posts={processedPosts}
          currentBlogPost={currentBlogPost}
          onPostClick={handlePostClick}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          totalPages={totalPages}
          totalCount={totalCount}
          postsPerPage={postsPerPage}
          searchLoading={searchLoading}
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
