const fs = require('fs')
const path = require('path')
const { generateCoverArt } = require('../src/utils/cover-art-generator')
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
 * Uploads cover art to Supabase
 */
async function uploadCoverArt(postName, coverArtBuffer) {
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
 * Creates a backup of the file
 */
function createBackup(filePath, backupDir) {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const fileName = path.basename(filePath)
  const backupPath = path.join(backupDir, fileName)
  fs.copyFileSync(filePath, backupPath)

  return backupPath
}

/**
 * Processes a single blog post
 */
async function processBlogPost(postDir, options = {}) {
  const { dryRun = false, createBackups = true } = options

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
    const { frontmatter, body } = parseFrontmatter(content)

    // Check if cover art already exists
    if (frontmatter.cover_art && frontmatter.cover_art.trim()) {
      console.log(`⏭️  ${postName}: Already has cover art, skipping`)
      return { success: false, reason: 'Already has cover art' }
    }

    console.log(`🎨 ${postName}: Generating cover art...`)

    if (dryRun) {
      console.log(`   [DRY RUN] Would generate and upload cover art`)
      return { success: true, reason: 'Dry run - would process' }
    }

    // Generate cover art
    const coverArtBuffer = await generateCoverArt(postName, 2500)
    console.log(
      `   Generated ${Math.round(coverArtBuffer.length / 1024)} KB cover art`
    )

    // Upload to Supabase
    const coverArtUrl = await uploadCoverArt(postName, coverArtBuffer)
    console.log(`   Uploaded to: ${coverArtUrl.split('?')[0]}`)

    // Create backup if requested
    if (createBackups) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupDir = `backup-cover-art-${timestamp}`
      const backupPath = createBackup(filePath, backupDir)
      console.log(`   Backup created: ${backupPath}`)
    }

    // Update frontmatter
    frontmatter.cover_art = coverArtUrl

    // Write updated content
    const updatedContent = serializeFrontmatter(frontmatter, body)
    fs.writeFileSync(filePath, updatedContent)

    console.log(`✅ ${postName}: Cover art added successfully`)
    return { success: true, reason: 'Processed successfully' }
  } catch (error) {
    console.error(`❌ ${postName}: Error - ${error.message}`)
    return { success: false, reason: error.message }
  }
}

/**
 * Main function to backfill all blog posts
 */
async function backfillCoverArt(options = {}) {
  const { dryRun = false, createBackups = true, filter = '' } = options

  console.log('🎨 Cover Art Backfill Script')
  console.log('=============================\n')

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
    details: [],
  }

  // Process each blog post
  for (let i = 0; i < postDirs.length; i++) {
    const postDir = postDirs[i]
    const postName = path.basename(postDir)

    console.log(`[${i + 1}/${postDirs.length}] Processing ${postName}...`)

    const result = await processBlogPost(postDir, { dryRun, createBackups })
    results.details.push({ postName, ...result })

    if (result.success) {
      results.processed++
    } else if (
      result.reason.includes('Already has') ||
      result.reason.includes('No markdown')
    ) {
      results.skipped++
    } else {
      results.errors++
    }

    // Add delay between posts to be gentle on Supabase
    if (i < postDirs.length - 1 && !dryRun) {
      console.log(`   Waiting ${DELAY_BETWEEN_POSTS}ms...\n`)
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_POSTS))
    } else {
      console.log()
    }
  }

  // Print summary
  console.log('📊 Summary')
  console.log('==========')
  console.log(`Total posts: ${results.total}`)
  console.log(`Processed: ${results.processed}`)
  console.log(`Skipped: ${results.skipped}`)
  console.log(`Errors: ${results.errors}`)

  if (results.errors > 0) {
    console.log('\n❌ Posts with errors:')
    results.details
      .filter(
        (r) =>
          !r.success &&
          !r.reason.includes('Already has') &&
          !r.reason.includes('No markdown')
      )
      .forEach((r) => console.log(`   ${r.postName}: ${r.reason}`))
  }

  if (results.skipped > 0) {
    console.log('\n⏭️  Skipped posts:')
    results.details
      .filter(
        (r) =>
          !r.success &&
          (r.reason.includes('Already has') || r.reason.includes('No markdown'))
      )
      .forEach((r) => console.log(`   ${r.postName}: ${r.reason}`))
  }

  if (!dryRun && results.processed > 0) {
    console.log(
      `\n✅ Successfully added cover art to ${results.processed} blog post(s)!`
    )
    console.log('\n💡 Next steps:')
    console.log(
      '   1. Check a few posts in your browser to verify the cover art looks good'
    )
    console.log(
      '   2. Run "git add ." and commit the changes if everything looks correct'
    )
  } else if (dryRun) {
    console.log(
      `\n🔍 Dry run complete - would process ${results.processed} post(s)`
    )
    console.log('   Run without --dry-run to actually add cover art')
  }
}

/**
 * Shows help information
 */
function showHelp() {
  console.log(`
🎨 Cover Art Backfill Script

Usage: node scripts/backfill-cover-art.js [options]

Options:
  --dry-run      Preview what would be changed without making changes
  --no-backup    Skip creating backup files (not recommended)
  --filter=TEXT  Only process posts containing TEXT in their name
  --help         Show this help message

Examples:
  # Preview what would be processed (recommended first step)
  node scripts/backfill-cover-art.js --dry-run

  # Backfill all posts with cover art (creates backups)
  node scripts/backfill-cover-art.js

  # Process only posts from July 2025
  node scripts/backfill-cover-art.js --filter=25jul

  # Process without creating backups (not recommended)
  node scripts/backfill-cover-art.js --no-backup

Environment Variables Required:
  SUPABASE_URL              - Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key

Features:
  ✅ Generates deterministic cover art using post names
  ✅ Uploads to Supabase cover-art bucket
  ✅ Updates blog post frontmatter with cover_art URLs
  ✅ Creates automatic backups with timestamps
  ✅ Dry-run mode to preview changes
  ✅ Smart skipping of posts that already have cover art
  ✅ Batch processing with delays to be gentle on Supabase
`)
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help')) {
    showHelp()
    return
  }

  const options = {
    dryRun: args.includes('--dry-run'),
    createBackups: !args.includes('--no-backup'),
    filter:
      args.find((arg) => arg.startsWith('--filter='))?.split('=')[1] || '',
  }

  // Validate environment
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:')
    console.error('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '❌')
    console.error(
      '   SUPABASE_SERVICE_ROLE_KEY:',
      process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '❌'
    )
    process.exit(1)
  }

  await backfillCoverArt(options)
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  })
}

module.exports = {
  backfillCoverArt,
  processBlogPost,
}
