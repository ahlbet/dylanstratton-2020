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
const BLOG_DIR = 'content/blog'
const DELAY_BETWEEN_POSTS = 1000 // 1 second delay between posts

/**
 * Sanitizes filename to be safe for storage
 */
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9\-]/g, '')
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
      let value = line.substring(colonIndex + 1).trim()

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      frontmatter[key] = value
    }
  })

  return { frontmatter, body }
}

/**
 * Gets the storage path for a cover art file in Supabase storage
 */
async function getCoverArtPath(postName) {
  const sanitizedName = sanitizeFilename(postName)
  const fileName = `${sanitizedName}.png`

  try {
    // Check if file exists in storage
    const { data: listData, error: listError } = await supabase.storage
      .from('cover-art')
      .list('', {
        search: fileName,
      })

    if (listError) {
      throw new Error(`Failed to list files: ${listError.message}`)
    }

    // Check if the file exists
    const fileExists = listData.some((file) => file.name === fileName)

    if (!fileExists) {
      return null
    }

    // Return just the bucket/filename path
    return `cover-art/${fileName}`
  } catch (error) {
    console.error(
      `Error getting cover art path for ${postName}:`,
      error.message
    )
    return null
  }
}

/**
 * Updates the daily table with cover art path
 */
async function updateDailyWithCoverArt(dailyId, coverArtPath) {
  try {
    const { data, error } = await supabase
      .from('daily')
      .update({ cover_art: coverArtPath })
      .eq('id', dailyId)
      .select()

    if (error) {
      throw new Error(`Failed to update daily table: ${error.message}`)
    }

    return data[0]
  } catch (error) {
    console.error(
      `Error updating daily table for ID ${dailyId}:`,
      error.message
    )
    return null
  }
}

/**
 * Processes a single blog post
 */
async function processBlogPost(postDir, options = {}) {
  const { dryRun = false, force = false } = options

  // Find the markdown file
  const markdownFiles = fs
    .readdirSync(postDir)
    .filter((file) => file.endsWith('.md'))

  if (markdownFiles.length === 0) {
    console.log(`⚠️  No markdown file found in ${postDir}`)
    return { success: false, reason: 'No markdown file' }
  }

  if (markdownFiles.length > 1) {
    console.log(`⚠️  Multiple markdown files found in ${postDir}, skipping`)
    return { success: false, reason: 'Multiple markdown files' }
  }

  const markdownFile = markdownFiles[0]
  const filePath = path.join(postDir, markdownFile)
  const postName = path.basename(postDir)

  try {
    // Read and parse the file
    const content = fs.readFileSync(filePath, 'utf8')
    const { frontmatter } = parseFrontmatter(content)

    // Check if daily_id exists
    if (!frontmatter.daily_id) {
      console.log(`⚠️  ${postName}: No daily_id found, skipping`)
      return { success: false, reason: 'No daily_id' }
    }

    const dailyId = parseInt(frontmatter.daily_id)

    // Check if cover art already exists in daily table (unless force is enabled)
    if (!force) {
      const { data: existingDaily, error: fetchError } = await supabase
        .from('daily')
        .select('cover_art')
        .eq('id', dailyId)
        .single()

      if (!fetchError && existingDaily && existingDaily.cover_art) {
        console.log(
          `⏭️  ${postName}: Already has cover_art in daily table, skipping`
        )
        return {
          success: false,
          reason: 'Already has cover_art in daily table',
        }
      }
    }

    console.log(`🎨 ${postName}: Looking for cover art...`)

    if (dryRun) {
      console.log(
        `   [DRY RUN] Would check for cover art and update daily table`
      )
      return { success: true, reason: 'Dry run - would process' }
    }

    // Get cover art path from Supabase storage
    const coverArtPath = await getCoverArtPath(postName)

    if (!coverArtPath) {
      console.log(`   ❌ No cover art found in storage for ${postName}`)
      return { success: false, reason: 'No cover art in storage' }
    }

    console.log(`   Found cover art: ${coverArtPath}`)

    // Update daily table
    const updatedDaily = await updateDailyWithCoverArt(dailyId, coverArtPath)

    if (!updatedDaily) {
      console.log(`   ❌ Failed to update daily table`)
      return { success: false, reason: 'Failed to update daily table' }
    }

    console.log(`✅ ${postName}: Cover art added to daily table successfully`)
    return { success: true, reason: 'Processed successfully' }
  } catch (error) {
    console.error(`❌ ${postName}: Error - ${error.message}`)
    return { success: false, reason: error.message }
  }
}

/**
 * Main function to backfill all blog posts
 */
async function backfillCoverArtToDaily(options = {}) {
  const { dryRun = false, filter = '' } = options

  console.log('🎨 Cover Art to Daily Table Backfill Script')
  console.log('============================================\n')

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n')
  }

  if (!fs.existsSync(BLOG_DIR)) {
    console.error(`❌ Blog directory not found: ${BLOG_DIR}`)
    process.exit(1)
  }

  // Get all blog post directories
  const postDirs = fs
    .readdirSync(BLOG_DIR)
    .map((dir) => path.join(BLOG_DIR, dir))
    .filter((dir) => fs.statSync(dir).isDirectory())
    .filter((dir) => (filter ? path.basename(dir).includes(filter) : true))
    .sort()

  console.log(`📋 Found ${postDirs.length} blog post(s) to process`)
  if (filter) {
    console.log(`🔍 Filtered by: "${filter}"`)
  }
  console.log()

  const results = {
    total: postDirs.length,
    processed: 0,
    skipped: 0,
    errors: 0,
    reasons: {},
  }

  // Process each blog post
  for (let i = 0; i < postDirs.length; i++) {
    const postDir = postDirs[i]
    const postName = path.basename(postDir)

    console.log(`[${i + 1}/${postDirs.length}] Processing ${postName}...`)

    const result = await processBlogPost(postDir, options)

    if (result.success) {
      results.processed++
    } else {
      results.skipped++
      results.reasons[result.reason] = (results.reasons[result.reason] || 0) + 1
    }

    // Add delay between posts to avoid rate limiting
    if (i < postDirs.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_POSTS))
    }
  }

  // Print summary
  console.log('\n📊 Summary')
  console.log('==========')
  console.log(`Total posts: ${results.total}`)
  console.log(`Processed: ${results.processed}`)
  console.log(`Skipped: ${results.skipped}`)
  console.log(`Errors: ${results.errors}`)

  if (Object.keys(results.reasons).length > 0) {
    console.log('\nSkipped reasons:')
    Object.entries(results.reasons).forEach(([reason, count]) => {
      console.log(`  ${reason}: ${count}`)
    })
  }

  return results
}

/**
 * Shows help information
 */
function showHelp() {
  console.log('🎨 Cover Art to Daily Table Backfill Script')
  console.log('============================================')
  console.log('')
  console.log(
    'This script finds existing cover art files in the Supabase cover-art'
  )
  console.log(
    'storage bucket and updates the corresponding daily table records with'
  )
  console.log('the storage path (bucket/filename) for each cover art file.')
  console.log('')
  console.log('Usage:')
  console.log('  node scripts/backfill-cover-art-to-daily.js [options]')
  console.log('')
  console.log('Options:')
  console.log('  --dry-run     Show what would be done without making changes')
  console.log('  --filter=STR  Only process posts containing STR in the name')
  console.log(
    '  --force       Update even if cover_art already exists in daily table'
  )
  console.log('  --help        Show this help message')
  console.log('')
  console.log('Examples:')
  console.log('  node scripts/backfill-cover-art-to-daily.js')
  console.log('  node scripts/backfill-cover-art-to-daily.js --dry-run')
  console.log('  node scripts/backfill-cover-art-to-daily.js --filter=25jul')
  console.log('  node scripts/backfill-cover-art-to-daily.js --force')
  console.log('')
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  const options = {
    dryRun: false,
    filter: '',
    force: false,
  }

  // Parse command line arguments
  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      showHelp()
      return
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg.startsWith('--filter=')) {
      options.filter = arg.substring(9)
    } else if (arg === '--force') {
      options.force = true
    } else {
      console.error(`❌ Unknown argument: ${arg}`)
      console.log('Use --help for usage information')
      process.exit(1)
    }
  }

  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables')
    console.error(
      'Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set'
    )
    process.exit(1)
  }

  try {
    await backfillCoverArtToDaily(options)
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

// Run the script if called directly
if (require.main === module) {
  main()
}

module.exports = { backfillCoverArtToDaily, processBlogPost }
