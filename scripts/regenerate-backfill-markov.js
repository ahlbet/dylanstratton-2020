#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { MarkovGenerator } = require('../src/utils/markov-generator')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

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
 * Regenerates Markov text for a single blog post
 */
async function regenerateBlogPost(postName) {
  const postDir = path.join(BLOG_DIR, postName)
  const postFile = path.join(postDir, `${postName}.md`)

  if (!fs.existsSync(postFile)) {
    console.log(`  ⚠️  Post file not found: ${postFile}`)
    return false
  }

  try {
    // Read the current content
    const content = fs.readFileSync(postFile, 'utf8')

    // Find where the Markov text starts (after the audio line)
    const audioLineIndex = content.indexOf('`audio:')
    if (audioLineIndex === -1) {
      console.log(`  ⚠️  No audio line found in ${postName}`)
      return false
    }

    // Find the end of the audio line
    const audioLineEnd = content.indexOf('\n', audioLineIndex)
    if (audioLineEnd === -1) {
      console.log(`  ⚠️  Could not find end of audio line in ${postName}`)
      return false
    }

    // Get content up to and including the audio line
    const contentBeforeMarkov = content.substring(0, audioLineEnd + 1)

    // Generate new Markov text
    console.log(`  🎲 Generating new Markov text for ${postName}...`)
    const markovText = await generateMarkovTextWithCredentials(postName, 5)

    // Create new content
    const updatedContent = contentBeforeMarkov + '\n\n' + markovText

    // Write back to file
    fs.writeFileSync(postFile, updatedContent, 'utf8')

    console.log(`  ✅ Regenerated Markov text for ${postName}`)
    return true
  } catch (error) {
    console.error(`  ❌ Error processing ${postName}:`, error.message)
    return false
  }
}

/**
 * Main function to regenerate Markov text for backfilled posts
 */
async function regenerateBackfillMarkov() {
  console.log('🎲 Regenerating Markov text for backfilled song posts...\n')

  console.log(
    `Found ${BACKFILLED_POSTS.length} backfilled posts to regenerate\n`
  )

  // Process each backfilled post
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < BACKFILLED_POSTS.length; i++) {
    const postName = BACKFILLED_POSTS[i]

    console.log(`[${i + 1}/${BACKFILLED_POSTS.length}] Processing: ${postName}`)

    const success = await regenerateBlogPost(postName)

    if (success) {
      successCount++
    } else {
      errorCount++
    }

    // Add small delay between posts
    if (i < BACKFILLED_POSTS.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  // Summary
  console.log('\n📊 Regeneration Summary:')
  console.log(`✅ Successfully regenerated: ${successCount} posts`)
  console.log(`❌ Failed to regenerate: ${errorCount} posts`)
  console.log(`📁 Blog posts updated in: ${BLOG_DIR}`)
}

/**
 * Main execution
 */
async function main() {
  try {
    await regenerateBackfillMarkov()
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { regenerateBackfillMarkov }
