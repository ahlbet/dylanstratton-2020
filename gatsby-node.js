const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const blogPost = path.resolve(`./src/templates/blog-post/blog-post.js`)

  // Query both markdown and Supabase data
  const result = await graphql(`
    {
      allMarkdownRemark(
        sort: { fields: [frontmatter___date], order: DESC }
        limit: 1000
      ) {
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              title
              daily_id
            }
            html
            excerpt
            timeToRead
          }
        }
      }
    }
  `)

  // Query Supabase data directly using the client
  let supabaseData = { daily: [], audio: [], markovTexts: [] }

  try {
    console.log('🔍 Attempting to query Supabase data directly...')

    // Query daily table
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily')
      .select('id, title, created_at, coherency_level, cover_art')

    if (dailyError) {
      console.error('❌ Error querying daily table:', dailyError)
      throw dailyError
    }

    // Query daily_audio table
    const { data: audioData, error: audioError } = await supabase
      .from('daily_audio')
      .select(
        'id, daily_id, storage_path, duration, format, created_at, coherency_level'
      )

    if (audioError) {
      console.error('❌ Error querying daily_audio table:', audioError)
      throw audioError
    }

    // Query markov_texts table
    const { data: markovData, error: markovError } = await supabase
      .from('markov_texts')
      .select('id, daily_id, text_content, created_at, coherency_level')

    if (markovError) {
      console.error('❌ Error querying markov_texts table:', markovError)
      throw markovError
    }

    console.log('📊 Supabase query result:', {
      dailyCount: dailyData?.length || 0,
      audioCount: audioData?.length || 0,
      markovCount: markovData?.length || 0,
    })

    supabaseData = {
      daily: dailyData || [],
      audio: audioData || [],
      markovTexts: markovData || [],
    }
    console.log('✅ Supabase data loaded successfully')
  } catch (error) {
    console.warn('⚠️ Supabase data not available during build:', error.message)
    console.warn('Pages will be created with markdown data only')
  }

  if (result.errors) {
    throw result.errors
  }

  // Create blog posts pages.
  const posts = result.data.allMarkdownRemark.edges

  posts.forEach((post, index) => {
    const previous = index === posts.length - 1 ? null : posts[index + 1].node
    const next = index === 0 ? null : posts[index - 1].node

    // Find corresponding Supabase data
    const dailyId = post.node.frontmatter.daily_id
    let postSupabaseData = null

    if (dailyId && supabaseData.daily.length > 0) {
      // Find daily entry
      const dailyEntry = supabaseData.daily.find(
        (entry) => entry.id === dailyId
      )

      if (dailyEntry) {
        // Find related audio files
        const audioFiles = supabaseData.audio.filter(
          (audio) => audio.daily_id === dailyId
        )

        // Find related markov texts
        const markovTexts = supabaseData.markovTexts.filter(
          (markov) => markov.daily_id === dailyId
        )

        postSupabaseData = {
          daily: dailyEntry,
          audio: audioFiles,
          markovTexts: markovTexts,
        }
      }
    }

    createPage({
      path: post.node.fields.slug,
      component: blogPost,
      context: {
        slug: post.node.fields.slug,
        previous,
        next,
        // Merge markdown and Supabase data
        markdownData: {
          title: post.node.frontmatter.title,
          html: post.node.html,
          excerpt: post.node.excerpt,
          timeToRead: post.node.timeToRead,
          daily_id: post.node.frontmatter.daily_id,
        },
        supabaseData: postSupabaseData,
      },
    })
  })
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const filePath = createFilePath({ node, getNode })

    // Only modify slug for blog posts that have the duplicate pattern
    let value = filePath
    const duplicateMatch = filePath.match(/\/([^/]+)\/\1\/$/)

    if (duplicateMatch) {
      // Extract just the directory name for blog posts (e.g., '/25jul01/25jul01/' -> '/25jul01/')
      const directoryName = duplicateMatch[1]
      value = `/${directoryName}/`
    }

    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}
