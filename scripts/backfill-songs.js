#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const { generateCoverArt } = require('../src/utils/cover-art-generator')
const { MarkovGenerator } = require('../src/utils/markov-generator')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

// Supabase configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Configuration
const DOWNLOADS_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE,
  'Downloads',
  'backfill-songs'
)
const BLOG_DIR = 'content/blog'
const DELAY_BETWEEN_POSTS = 2000 // 2 second delay between posts

/**
 * Sanitizes filename to be safe for storage and URLs
 */
function sanitizeFilename(filename) {
  // Get the extension first
  const ext = path.extname(filename)
  const baseName = path.basename(filename, ext)

  // Sanitize the base name but preserve the extension
  const sanitizedBase = baseName.replace(/[^a-zA-Z0-9\-]/g, '')

  return sanitizedBase + ext
}

/**
 * Extracts the base name from an audio file (removes extension)
 */
function getBaseName(filename) {
  return path.basename(filename, path.extname(filename))
}

/**
 * Gets content type based on file extension
 */
function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  const contentTypes = {
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
  }
  return contentTypes[ext] || 'audio/wav'
}

/**
 * Generates Markov text with explicit Supabase credentials
 */
async function generateMarkovTextWithCredentials(postName, linesCount = 5) {
  const generator = new MarkovGenerator(7)

  // Use explicit credentials from environment
  const success = await generator.loadTextFromSupabaseWithCredentials(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    'markov-text'
  )

  if (!success) {
    console.warn('Failed to load from Supabase, using fallback text')
    // Fallback to sample text if Supabase fails
    const fallbackText = [
      'The quick brown fox jumps over the lazy dog.',
      'A journey of a thousand miles begins with a single step.',
      'All that glitters is not gold.',
      'Actions speak louder than words.',
      'Beauty is in the eye of the beholder.',
      'Every cloud has a silver lining.',
      'Time heals all wounds.',
      'Actions speak louder than words.',
      'The early bird catches the worm.',
      "Don't judge a book by its cover.",
    ]
    generator.loadTextFromArray(fallbackText)
  }

  const generatedLines = generator.generateMultipleLines(linesCount, 1000, 2)

  // Format the generated text for markdown
  const markdownText = generatedLines.map((line) => `> ${line}`).join('\n\n')

  return markdownText
}

/**
 * Uploads audio file to Supabase
 */
async function uploadAudioToSupabase(filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const sanitizedName = sanitizeFilename(fileName)
    const contentType = getContentType(fileName)

    const { data, error } = await supabase.storage
      .from('audio')
      .upload(sanitizedName, fileBuffer, {
        contentType: contentType,
        upsert: true, // Overwrite if exists
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio')
      .getPublicUrl(sanitizedName)

    // Add cache-busting parameter
    const audioUrl = `${urlData.publicUrl}?v=${Date.now()}`

    return audioUrl
  } catch (error) {
    throw new Error(`Failed to upload audio file ${fileName}: ${error.message}`)
  }
}

/**
 * Uploads cover art to Supabase
 */
async function uploadCoverArtToSupabase(coverArtBuffer, postName) {
  const sanitizedName = sanitizeFilename(postName)
  const fileName = `${sanitizedName}.png`

  try {
    const { data, error } = await supabase.storage
      .from('cover-art')
      .upload(fileName, coverArtBuffer, {
        contentType: 'image/png',
        upsert: true, // Overwrite if exists
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('cover-art')
      .getPublicUrl(fileName)

    // Add cache-busting parameter
    const coverArtUrl = `${urlData.publicUrl}?v=${Date.now()}`

    return coverArtUrl
  } catch (error) {
    throw new Error(
      `Failed to upload cover art for ${postName}: ${error.message}`
    )
  }
}

/**
 * Creates blog post directory and markdown file
 */
function createBlogPost(postName, audioUrl, coverArtUrl, markovText) {
  const postDir = path.join(BLOG_DIR, postName)
  const postFile = path.join(postDir, `${postName}.md`)

  // Create directory if it doesn't exist
  if (!fs.existsSync(postDir)) {
    fs.mkdirSync(postDir, { recursive: true })
  }

  // Create frontmatter
  const frontmatter = {
    title: postName,
    date: new Date().toISOString(),
    description: '',
    cover_art: coverArtUrl,
  }

  // Create markdown content
  const content = `---
title: ${frontmatter.title}
date: '${frontmatter.date}'
description: ${frontmatter.description}
cover_art: ${frontmatter.cover_art}
---

\`audio: ${audioUrl}\`

${markovText}
`

  // Write the file
  fs.writeFileSync(postFile, content, 'utf8')

  return postFile
}

/**
 * Processes a single audio file
 */
async function processAudioFile(filePath, options = {}) {
  const { dryRun = false } = options
  const fileName = path.basename(filePath)
  const baseName = getBaseName(fileName)

  console.log(`🎵 Processing: ${fileName}`)

  try {
    // Step 1: Upload audio to Supabase
    console.log(`  📤 Uploading audio to Supabase...`)
    let audioUrl = 'DRY_RUN_AUDIO_URL'
    if (!dryRun) {
      audioUrl = await uploadAudioToSupabase(filePath, fileName)
      console.log(`  ✅ Audio uploaded: ${audioUrl}`)
    } else {
      console.log(`  🧪 [DRY RUN] Would upload audio to Supabase`)
    }

    // Step 2: Generate cover art
    console.log(`  🎨 Generating cover art...`)
    const coverArtBuffer = await generateCoverArt(baseName)
    console.log(`  ✅ Cover art generated`)

    // Step 3: Upload cover art to Supabase
    console.log(`  📤 Uploading cover art to Supabase...`)
    let coverArtUrl = 'DRY_RUN_COVER_ART_URL'
    if (!dryRun) {
      coverArtUrl = await uploadCoverArtToSupabase(coverArtBuffer, baseName)
      console.log(`  ✅ Cover art uploaded: ${coverArtUrl}`)
    } else {
      console.log(`  🧪 [DRY RUN] Would upload cover art to Supabase`)
    }

    // Step 4: Generate Markov text
    console.log(`  🎲 Generating Markov text...`)
    const markovText = await generateMarkovTextWithCredentials(baseName, 5)
    console.log(`  ✅ Markov text generated`)

    // Step 5: Create blog post
    console.log(`  📝 Creating blog post...`)
    let postFile = 'DRY_RUN_POST_FILE'
    if (!dryRun) {
      postFile = createBlogPost(baseName, audioUrl, coverArtUrl, markovText)
      console.log(`  ✅ Blog post created: ${postFile}`)
    } else {
      console.log(
        `  🧪 [DRY RUN] Would create blog post: content/blog/${baseName}/${baseName}.md`
      )
    }

    console.log(`🎉 Successfully processed ${fileName}\n`)
    return true
  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error.message)
    return false
  }
}

/**
 * Main function to process all audio files
 */
async function backfillSongs(options = {}) {
  const { dryRun = false } = options

  console.log('🎵 Starting song backfill process...\n')

  if (dryRun) {
    console.log('🧪 DRY RUN MODE - No files will be uploaded or created\n')
  }

  // Check if downloads directory exists
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    console.error(`❌ Downloads directory not found: ${DOWNLOADS_DIR}`)
    console.log('Please create the directory: ~/Downloads/backfill-songs/')
    return
  }

  // Get all audio files
  const audioExtensions = ['.wav', '.mp3', '.ogg', '.m4a', '.aac', '.flac']
  const files = fs
    .readdirSync(DOWNLOADS_DIR)
    .filter((file) => {
      const ext = path.extname(file).toLowerCase()
      return audioExtensions.includes(ext)
    })
    .map((file) => path.join(DOWNLOADS_DIR, file))

  if (files.length === 0) {
    console.log('No audio files found in downloads directory')
    return
  }

  console.log(`Found ${files.length} audio files to process\n`)

  // Process files
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    console.log(`[${i + 1}/${files.length}] Processing: ${path.basename(file)}`)

    const success = await processAudioFile(file, { dryRun })

    if (success) {
      successCount++
    } else {
      errorCount++
    }

    // Add delay between posts (except for the last one)
    if (i < files.length - 1) {
      console.log(`⏳ Waiting ${DELAY_BETWEEN_POSTS}ms before next file...`)
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_POSTS))
    }
  }

  // Summary
  console.log('\n📊 Backfill Summary:')
  console.log(`✅ Successfully processed: ${successCount} files`)
  console.log(`❌ Failed to process: ${errorCount} files`)
  console.log(`📁 Blog posts created in: ${BLOG_DIR}`)
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
🎵 Song Backfill Script

This script processes audio files from ~/Downloads/backfill-songs/ and creates blog posts for each one.

Usage:
  node scripts/backfill-songs.js [options]

Options:
  --help, -h     Show this help message
  --dry-run      Run in dry-run mode (no uploads or file creation)

Requirements:
  - Audio files in ~/Downloads/backfill-songs/
  - Valid .env file with Supabase credentials
  - Supported audio formats: .wav, .mp3, .ogg, .m4a, .aac, .flac

The script will:
  1. Upload each audio file to Supabase storage
  2. Generate cover art using the song name as seed
  3. Upload cover art to Supabase storage
  4. Generate 5 Markov text blockquotes
  5. Create a blog post markdown file

Output:
  - Blog posts created in content/blog/[song-name]/
  - Each post includes audio player and Markov text

Examples:
  node scripts/backfill-songs.js --dry-run    # Test run without making changes
  node scripts/backfill-songs.js              # Process all files
`)
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    return
  }

  const dryRun = args.includes('--dry-run')

  try {
    await backfillSongs({ dryRun })
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { backfillSongs }
