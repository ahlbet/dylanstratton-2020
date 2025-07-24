#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { MarkovGenerator } = require('../src/utils/markov-generator')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

// Configuration
const BLOG_DIR = 'content/blog'

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
 * Fixes a single blog post by adding Markov text
 */
async function fixBlogPost(postDir, postName) {
  const postFile = path.join(postDir, `${postName}.md`)

  if (!fs.existsSync(postFile)) {
    console.log(`  ⚠️  Post file not found: ${postFile}`)
    return false
  }

  try {
    // Read the current content
    const content = fs.readFileSync(postFile, 'utf8')

    // Check if it already has Markov text (blockquotes)
    if (content.includes('> ')) {
      console.log(`  ⚠️  ${postName} already has Markov text, skipping...`)
      return false
    }

    // Generate Markov text
    console.log(`  🎲 Generating Markov text for ${postName}...`)
    const markovText = await generateMarkovTextWithCredentials(postName, 5)

    // Add the Markov text to the end of the file
    const updatedContent = content + '\n\n' + markovText

    // Write back to file
    fs.writeFileSync(postFile, updatedContent, 'utf8')

    console.log(`  ✅ Added Markov text to ${postName}`)
    return true
  } catch (error) {
    console.error(`  ❌ Error processing ${postName}:`, error.message)
    return false
  }
}

/**
 * Main function to fix all blog posts
 */
async function fixMarkovText() {
  console.log('🎲 Starting Markov text fix for all blog posts...\n')

  // Get all blog post directories
  const postDirs = fs.readdirSync(BLOG_DIR).filter((item) => {
    const fullPath = path.join(BLOG_DIR, item)
    return fs.statSync(fullPath).isDirectory()
  })

  if (postDirs.length === 0) {
    console.log('No blog post directories found')
    return
  }

  console.log(`Found ${postDirs.length} blog post directories\n`)

  // Process each directory
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < postDirs.length; i++) {
    const postDir = postDirs[i]
    const fullPath = path.join(BLOG_DIR, postDir)

    console.log(`[${i + 1}/${postDirs.length}] Processing: ${postDir}`)

    const success = await fixBlogPost(fullPath, postDir)

    if (success) {
      successCount++
    } else {
      errorCount++
    }

    // Add small delay between posts
    if (i < postDirs.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  // Summary
  console.log('\n📊 Fix Summary:')
  console.log(`✅ Successfully fixed: ${successCount} posts`)
  console.log(`❌ Failed to fix: ${errorCount} posts`)
  console.log(`📁 Blog posts checked in: ${BLOG_DIR}`)
}

/**
 * Main execution
 */
async function main() {
  try {
    await fixMarkovText()
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { fixMarkovText }
