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
 * Parses a filename like "24jul01" to get the date
 */
function parseDateFromFilename(filename) {
  // Handle different date formats
  // 24jul01 -> 2024-07-01
  // 25jul01 -> 2025-07-01

  const match = filename.match(/^(\d{2})([a-z]{3})(\d{2})$/i)
  if (!match) {
    console.warn(`Could not parse date from filename: ${filename}`)
    return null
  }

  const [, year, month, day] = match

  // Convert 2-digit year to 4-digit year
  const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`

  // Convert month abbreviation to number
  const monthMap = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
  }

  const monthNum = monthMap[month.toLowerCase()]
  if (!monthNum) {
    console.warn(`Unknown month: ${month}`)
    return null
  }

  // Add random time between 9 AM and 5 PM
  const randomHour = Math.floor(Math.random() * 8) + 9 // 9-16 (9 AM to 4 PM)
  const randomMinute = Math.floor(Math.random() * 60)
  const randomSecond = Math.floor(Math.random() * 60)

  const dateString = `${fullYear}-${monthNum}-${day.padStart(2, '0')}T${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}:${randomSecond.toString().padStart(2, '0')}.000Z`

  return dateString
}

/**
 * Parses frontmatter from markdown content
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: {}, body: content }
  }

  const frontmatterText = match[1]
  const body = match[2]

  // Parse YAML-like frontmatter
  const frontmatter = {}
  frontmatterText.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      frontmatter[key] = value
    }
  })

  return { frontmatter, body }
}

/**
 * Serializes frontmatter back to YAML
 */
function serializeFrontmatter(frontmatter, body) {
  const frontmatterLines = Object.entries(frontmatter).map(([key, value]) => {
    return `${key}: ${value}`
  })

  return `---\n${frontmatterLines.join('\n')}\n---\n\n${body}`
}

/**
 * Fixes the date for a single blog post
 */
function fixBlogPostDate(postName) {
  const postDir = path.join(BLOG_DIR, postName)
  const postFile = path.join(postDir, `${postName}.md`)

  if (!fs.existsSync(postFile)) {
    console.log(`  ⚠️  Post file not found: ${postFile}`)
    return false
  }

  try {
    // Parse date from filename
    const newDate = parseDateFromFilename(postName)
    if (!newDate) {
      console.log(`  ⚠️  Could not parse date for ${postName}`)
      return false
    }

    // Read the current content
    const content = fs.readFileSync(postFile, 'utf8')
    const { frontmatter, body } = parseFrontmatter(content)

    // Check if date needs updating
    const currentDate = frontmatter.date
    if (currentDate && currentDate.includes(newDate.substring(0, 10))) {
      console.log(`  ⚠️  ${postName} already has correct date, skipping...`)
      return false
    }

    // Update the date
    frontmatter.date = `'${newDate}'`

    // Write back to file
    const updatedContent = serializeFrontmatter(frontmatter, body)
    fs.writeFileSync(postFile, updatedContent, 'utf8')

    console.log(`  ✅ Updated date for ${postName}: ${newDate}`)
    return true
  } catch (error) {
    console.error(`  ❌ Error processing ${postName}:`, error.message)
    return false
  }
}

/**
 * Main function to fix dates for backfilled blog posts
 */
function fixBlogDates() {
  console.log('📅 Fixing backfilled blog post dates to match filenames...\n')

  console.log(`Found ${BACKFILLED_POSTS.length} backfilled posts to update\n`)

  // Process each backfilled post
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < BACKFILLED_POSTS.length; i++) {
    const postName = BACKFILLED_POSTS[i]

    console.log(`[${i + 1}/${BACKFILLED_POSTS.length}] Processing: ${postName}`)

    const success = fixBlogPostDate(postName)

    if (success) {
      successCount++
    } else {
      errorCount++
    }
  }

  // Summary
  console.log('\n📊 Date Fix Summary:')
  console.log(`✅ Successfully updated: ${successCount} posts`)
  console.log(`❌ Failed to update: ${errorCount} posts`)
  console.log(`📁 Blog posts checked in: ${BLOG_DIR}`)
}

/**
 * Main execution
 */
function main() {
  try {
    fixBlogDates()
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { fixBlogDates }
