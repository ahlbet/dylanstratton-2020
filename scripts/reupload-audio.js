#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
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

// List of backfilled song posts (the ones we created)
const BACKFILLED_POSTS = [
  '24jul01',
  '24jul21',
  '24jun01',
  '24jun02',
  '24jun09',
  '24jun11',
  '24jun16',
  '24jun17',
  '24jun26',
  '24jun30',
  '24mar03',
  '24mar10',
  '24may02',
  '24may22',
  '24may23',
  '24nov05',
  '24nov10',
  '24sep18',
]

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
 * Uploads audio file to Supabase with correct filename
 */
async function uploadAudioToSupabase(filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const contentType = getContentType(fileName)

    // Use the original filename with extension
    const uploadName = fileName

    const { data, error } = await supabase.storage
      .from('audio')
      .upload(uploadName, fileBuffer, {
        contentType: contentType,
        upsert: true, // Overwrite if exists
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio')
      .getPublicUrl(uploadName)

    // Add cache-busting parameter
    const audioUrl = `${urlData.publicUrl}?v=${Date.now()}`

    return audioUrl
  } catch (error) {
    throw new Error(`Failed to upload audio file ${fileName}: ${error.message}`)
  }
}

/**
 * Updates the audio URL in a blog post
 */
function updateBlogPostAudioUrl(postName, newAudioUrl) {
  const postDir = path.join(BLOG_DIR, postName)
  const postFile = path.join(postDir, `${postName}.md`)

  if (!fs.existsSync(postFile)) {
    console.log(`  ⚠️  Post file not found: ${postFile}`)
    return false
  }

  try {
    // Read the current content
    const content = fs.readFileSync(postFile, 'utf8')

    // Replace the audio line
    const updatedContent = content.replace(
      /`audio: ([^`]+)`/,
      `\`audio: ${newAudioUrl}\``
    )

    // Write back to file
    fs.writeFileSync(postFile, updatedContent, 'utf8')

    console.log(`  ✅ Updated audio URL for ${postName}`)
    return true
  } catch (error) {
    console.error(`  ❌ Error updating ${postName}:`, error.message)
    return false
  }
}

/**
 * Re-uploads audio and updates blog post for a single file
 */
async function reuploadAudioFile(postName) {
  console.log(`🎵 Re-uploading audio for: ${postName}`)

  try {
    // Find the audio file in downloads
    const audioExtensions = ['.wav', '.mp3', '.ogg', '.m4a', '.aac', '.flac']
    const files = fs.readdirSync(DOWNLOADS_DIR).filter((file) => {
      const ext = path.extname(file).toLowerCase()
      return audioExtensions.includes(ext) && file.startsWith(postName)
    })

    if (files.length === 0) {
      console.log(`  ⚠️  No audio file found for ${postName} in downloads`)
      return false
    }

    const audioFile = files[0]
    const filePath = path.join(DOWNLOADS_DIR, audioFile)

    // Step 1: Re-upload audio with correct filename
    console.log(`  📤 Re-uploading audio: ${audioFile}`)
    const audioUrl = await uploadAudioToSupabase(filePath, audioFile)
    console.log(`  ✅ Audio re-uploaded: ${audioUrl}`)

    // Step 2: Update blog post
    console.log(`  📝 Updating blog post...`)
    const success = updateBlogPostAudioUrl(postName, audioUrl)

    if (success) {
      console.log(`🎉 Successfully re-uploaded audio for ${postName}\n`)
      return true
    } else {
      return false
    }
  } catch (error) {
    console.error(`❌ Error processing ${postName}:`, error.message)
    return false
  }
}

/**
 * Main function to re-upload all audio files
 */
async function reuploadAllAudio() {
  console.log('🎵 Re-uploading audio files with correct filenames...\n')

  // Check if downloads directory exists
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    console.error(`❌ Downloads directory not found: ${DOWNLOADS_DIR}`)
    return
  }

  console.log(`Found ${BACKFILLED_POSTS.length} posts to re-upload\n`)

  // Process each post
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < BACKFILLED_POSTS.length; i++) {
    const postName = BACKFILLED_POSTS[i]

    console.log(`[${i + 1}/${BACKFILLED_POSTS.length}] Processing: ${postName}`)

    const success = await reuploadAudioFile(postName)

    if (success) {
      successCount++
    } else {
      errorCount++
    }

    // Add delay between uploads
    if (i < BACKFILLED_POSTS.length - 1) {
      console.log(`⏳ Waiting 2 seconds before next upload...`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  // Summary
  console.log('\n📊 Re-upload Summary:')
  console.log(`✅ Successfully re-uploaded: ${successCount} files`)
  console.log(`❌ Failed to re-upload: ${errorCount} files`)
  console.log(`📁 Blog posts updated in: ${BLOG_DIR}`)
}

/**
 * Main execution
 */
async function main() {
  try {
    await reuploadAllAudio()
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { reuploadAllAudio }
