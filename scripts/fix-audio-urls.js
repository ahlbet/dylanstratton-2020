#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Configuration
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
 * Fixes the audio URL for a single blog post
 */
function fixBlogPostAudioUrl(postName) {
  const postDir = path.join(BLOG_DIR, postName)
  const postFile = path.join(postDir, `${postName}.md`)

  if (!fs.existsSync(postFile)) {
    console.log(`  ⚠️  Post file not found: ${postFile}`)
    return false
  }

  try {
    // Read the current content
    const content = fs.readFileSync(postFile, 'utf8')

    // Find the audio URL line
    const audioLineMatch = content.match(/`audio: ([^`]+)`/)
    if (!audioLineMatch) {
      console.log(`  ⚠️  No audio line found in ${postName}`)
      return false
    }

    const currentUrl = audioLineMatch[1]

    // Check if the URL already has the correct extension
    if (
      currentUrl.includes('.wav') ||
      currentUrl.includes('.mp3') ||
      currentUrl.includes('.ogg') ||
      currentUrl.includes('.m4a') ||
      currentUrl.includes('.aac') ||
      currentUrl.includes('.flac')
    ) {
      console.log(
        `  ⚠️  ${postName} already has correct audio URL, skipping...`
      )
      return false
    }

    // Fix the URL by adding .wav extension (assuming all files are .wav)
    const fixedUrl = currentUrl.replace(/(\?v=\d+)$/, '.wav$1')

    // Replace the audio line
    const updatedContent = content.replace(
      /`audio: ([^`]+)`/,
      `\`audio: ${fixedUrl}\``
    )

    // Write back to file
    fs.writeFileSync(postFile, updatedContent, 'utf8')

    console.log(`  ✅ Fixed audio URL for ${postName}: ${fixedUrl}`)
    return true
  } catch (error) {
    console.error(`  ❌ Error processing ${postName}:`, error.message)
    return false
  }
}

/**
 * Main function to fix audio URLs for backfilled blog posts
 */
function fixAudioUrls() {
  console.log('🔧 Fixing audio URLs in backfilled blog posts...\n')

  console.log(`Found ${BACKFILLED_POSTS.length} backfilled posts to fix\n`)

  // Process each backfilled post
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < BACKFILLED_POSTS.length; i++) {
    const postName = BACKFILLED_POSTS[i]

    console.log(`[${i + 1}/${BACKFILLED_POSTS.length}] Processing: ${postName}`)

    const success = fixBlogPostAudioUrl(postName)

    if (success) {
      successCount++
    } else {
      errorCount++
    }
  }

  // Summary
  console.log('\n📊 Audio URL Fix Summary:')
  console.log(`✅ Successfully fixed: ${successCount} posts`)
  console.log(`❌ Failed to fix: ${errorCount} posts`)
  console.log(`📁 Blog posts checked in: ${BLOG_DIR}`)
}

/**
 * Main execution
 */
function main() {
  try {
    fixAudioUrls()
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { fixAudioUrls }
