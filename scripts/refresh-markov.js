#!/usr/bin/env node

/**
 * Script to refresh/replace existing Markov text in blog posts
 * Uses the new Supabase multi-file corpus instead of old single-file generation
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { generateBlogPostText } = require('../src/utils/markov-generator')

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

// Function to recursively find all markdown files in blog directory
const findBlogPosts = (dir) => {
  const posts = []

  if (!fs.existsSync(dir)) {
    console.log(colorize(`Directory ${dir} does not exist`, 'red'))
    return posts
  }

  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      // Check for both naming patterns
      const directoryNamedFile = path.join(fullPath, `${item}.md`)
      const indexFile = path.join(fullPath, 'index.md')

      let mdFile = null

      if (fs.existsSync(directoryNamedFile)) {
        mdFile = directoryNamedFile
      } else if (fs.existsSync(indexFile)) {
        mdFile = indexFile
      }

      if (mdFile) {
        posts.push({
          path: mdFile,
          name: item,
          directory: fullPath,
        })
      }
    }
  }

  return posts
}

// Function to detect if content has Markov text (blockquotes at the end)
const hasMarkovText = (content) => {
  const lines = content.split('\n')
  let blockquoteCount = 0
  let consecutiveBlockquotes = 0

  // Count blockquotes, especially consecutive ones at the end
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim()
    if (line.startsWith('>')) {
      blockquoteCount++
      consecutiveBlockquotes++
    } else if (line.length > 0) {
      // Hit non-empty, non-blockquote line
      break
    }
  }

  // Consider it Markov text if there are 2+ consecutive blockquotes at the end
  return consecutiveBlockquotes >= 2
}

// Function to remove existing Markov text (trailing blockquotes)
const removeMarkovText = (content) => {
  const lines = content.split('\n')
  let lastContentIndex = -1

  // Find the last line that's not a blockquote or empty
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim()
    if (line.length > 0 && !line.startsWith('>')) {
      lastContentIndex = i
      break
    }
  }

  if (lastContentIndex === -1) {
    // No non-blockquote content found, keep everything
    return content
  }

  // Return content up to the last non-blockquote line
  return lines.slice(0, lastContentIndex + 1).join('\n')
}

// Function to create a backup of the file
const createBackup = (filePath) => {
  const backupPath = `${filePath}.backup-${Date.now()}`
  fs.copyFileSync(filePath, backupPath)
  return backupPath
}

// Function to refresh Markov text for a single blog post
const refreshMarkovTextForPost = async (postPath, postName, options = {}) => {
  const { dryRun = false, linesCount = 5, createBackups = true } = options

  try {
    console.log(colorize(`Processing: ${postName}`, 'cyan'))

    // Read the current content
    const content = fs.readFileSync(postPath, 'utf8')

    // Check if it has Markov text
    if (!hasMarkovText(content)) {
      console.log(
        colorize(`  ⚠️  No Markov text detected, skipping...`, 'yellow')
      )
      return { success: false, reason: 'no-markov-text' }
    }

    // Remove existing Markov text
    const contentWithoutMarkov = removeMarkovText(content)

    // Generate new Markov text
    console.log(
      colorize(
        `  🎲 Generating new Markov text (${linesCount} lines)...`,
        'dim'
      )
    )
    const newMarkovText = await generateBlogPostText(postName, linesCount)

    // Combine the content
    const updatedContent = contentWithoutMarkov + '\n\n' + newMarkovText

    if (dryRun) {
      console.log(colorize(`  🔍 DRY RUN - Would update ${postName}`, 'blue'))
      console.log(
        colorize(`     Old content length: ${content.length} chars`, 'dim')
      )
      console.log(
        colorize(
          `     New content length: ${updatedContent.length} chars`,
          'dim'
        )
      )
      return { success: true, reason: 'dry-run' }
    }

    // Create backup if requested
    let backupPath = null
    if (createBackups) {
      backupPath = createBackup(postPath)
      console.log(
        colorize(`  💾 Created backup: ${path.basename(backupPath)}`, 'dim')
      )
    }

    // Write the updated content
    fs.writeFileSync(postPath, updatedContent, 'utf8')

    console.log(colorize(`  ✅ Successfully refreshed Markov text`, 'green'))
    return { success: true, backupPath }
  } catch (error) {
    console.error(
      colorize(`  ❌ Error processing ${postName}: ${error.message}`, 'red')
    )
    return { success: false, reason: 'error', error: error.message }
  }
}

// Main function
const main = async () => {
  const args = process.argv.slice(2)
  const options = {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    linesCount:
      parseInt(args.find((arg) => arg.startsWith('--lines='))?.split('=')[1]) ||
      5,
    createBackups: !args.includes('--no-backup'),
    filter: args.find((arg) => arg.startsWith('--filter='))?.split('=')[1],
  }

  console.log(colorize('🔄 Refreshing Markov Text in Blog Posts', 'bright'))
  console.log(colorize('='.repeat(50), 'dim'))

  if (options.dryRun) {
    console.log(
      colorize('🔍 DRY RUN MODE - No files will be modified\n', 'yellow')
    )
  }

  // Find all blog posts
  const blogDir = path.join(process.cwd(), 'content', 'blog')
  const posts = findBlogPosts(blogDir)

  if (posts.length === 0) {
    console.log(colorize('No blog posts found in content/blog/', 'red'))
    return
  }

  // Filter posts if requested
  const filteredPosts = options.filter
    ? posts.filter((post) => post.name.includes(options.filter))
    : posts

  console.log(
    colorize(
      `Found ${posts.length} blog posts${options.filter ? ` (${filteredPosts.length} matching filter)` : ''}\n`,
      'cyan'
    )
  )

  let processed = 0
  let skipped = 0
  let errors = 0
  const backups = []

  // Process each post
  for (const post of filteredPosts) {
    const result = await refreshMarkovTextForPost(post.path, post.name, options)

    if (result.success && result.reason !== 'dry-run') {
      processed++
      if (result.backupPath) {
        backups.push(result.backupPath)
      }
    } else if (result.reason === 'no-markov-text') {
      skipped++
    } else if (result.reason === 'dry-run') {
      processed++ // Count as processed for dry run stats
    } else {
      errors++
    }

    // Add a small delay to avoid overwhelming Supabase
    if (!options.dryRun) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  console.log(colorize('\n📊 Refresh Summary:', 'bright'))
  console.log(colorize(`  ✅ Processed: ${processed} posts`, 'green'))
  console.log(
    colorize(`  ⚠️  Skipped: ${skipped} posts (no Markov text found)`, 'yellow')
  )
  console.log(colorize(`  ❌ Errors: ${errors} posts`, 'red'))
  console.log(colorize(`  📝 Total: ${filteredPosts.length} posts`, 'cyan'))

  if (backups.length > 0 && !options.dryRun) {
    console.log(colorize(`\n💾 Created ${backups.length} backup files`, 'blue'))
    console.log(
      colorize("   You can delete them once you've verified the results", 'dim')
    )
  }

  if (processed > 0 && !options.dryRun) {
    console.log(
      colorize(
        '\n🎉 Successfully refreshed Markov text with new Supabase corpus!',
        'green'
      )
    )
    console.log(
      colorize(
        '   Your blog posts now use the rich classical literature sources',
        'dim'
      )
    )
  }
}

// Help function
function showHelp() {
  console.log(colorize('🔄 Refresh Markov Text in Blog Posts', 'bright'))
  console.log('')
  console.log(
    'Replaces existing Markov text with newly generated content from Supabase corpus'
  )
  console.log('')
  console.log(colorize('Usage:', 'yellow'))
  console.log('  node scripts/refresh-markov.js [options]')
  console.log('')
  console.log(colorize('Options:', 'yellow'))
  console.log('  --dry-run, -d         Preview changes without modifying files')
  console.log(
    '  --lines=N             Number of Markov lines to generate (default: 5)'
  )
  console.log('  --no-backup           Skip creating backup files')
  console.log(
    '  --filter=TEXT         Only process posts containing TEXT in name'
  )
  console.log('  --help, -h            Show this help message')
  console.log('')
  console.log(colorize('Examples:', 'cyan'))
  console.log('  node scripts/refresh-markov.js --dry-run')
  console.log('  node scripts/refresh-markov.js --lines=3')
  console.log('  node scripts/refresh-markov.js --filter=25jul')
  console.log('  node scripts/refresh-markov.js --no-backup')
  console.log('')
  console.log(colorize('Safety:', 'green'))
  console.log(
    '  • Backups are created by default (filename.md.backup-timestamp)'
  )
  console.log('  • Use --dry-run first to see what would be changed')
  console.log('  • Only replaces trailing blockquotes (Markov text)')
  console.log('  • Preserves all other content in the file')
}

// Run the script
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp()
  } else {
    main().catch((error) => {
      console.error(colorize(`❌ Script failed: ${error.message}`, 'red'))
      process.exit(1)
    })
  }
}

module.exports = {
  findBlogPosts,
  hasMarkovText,
  removeMarkovText,
  refreshMarkovTextForPost,
}
