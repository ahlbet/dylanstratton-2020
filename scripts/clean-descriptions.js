#!/usr/bin/env node

/**
 * Script to clean description fields from blog post frontmatter
 * Removes all description content, leaving just 'description: '
 */

const fs = require('fs')
const path = require('path')

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

// Function to clean description from frontmatter
const cleanDescription = (content) => {
  const lines = content.split('\n')
  const result = []
  let inFrontmatter = false
  let frontmatterEnded = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check for frontmatter boundaries
    if (line.trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true
        result.push(line)
        continue
      } else if (inFrontmatter && !frontmatterEnded) {
        frontmatterEnded = true
        inFrontmatter = false
        result.push(line)
        continue
      }
    }

    // If we're in frontmatter, process description lines
    if (inFrontmatter && !frontmatterEnded) {
      if (line.startsWith('description:')) {
        // Keep just the field name, remove any content
        result.push('description: ')
      } else {
        // Keep all other frontmatter lines as-is
        result.push(line)
      }
    } else {
      // Outside frontmatter, keep as-is
      result.push(line)
    }
  }

  return result.join('\n')
}

// Function to create a backup of the file
const createBackup = (filePath) => {
  const backupPath = `${filePath}.backup-${Date.now()}`
  fs.copyFileSync(filePath, backupPath)
  return backupPath
}

// Function to clean description for a single blog post
const cleanDescriptionForPost = (postPath, postName, options = {}) => {
  const { dryRun = false, createBackups = true } = options

  try {
    console.log(colorize(`Processing: ${postName}`, 'cyan'))

    // Read the current content
    const content = fs.readFileSync(postPath, 'utf8')

    // Check if it has a description field to clean
    if (!content.includes('description:')) {
      console.log(
        colorize(`  ⚠️  No description field found, skipping...`, 'yellow')
      )
      return { success: false, reason: 'no-description' }
    }

    // Extract current description for comparison
    const descriptionMatch = content.match(/description:\s*(.*)/)
    const currentDescription = descriptionMatch
      ? descriptionMatch[1].trim()
      : ''

    if (!currentDescription) {
      console.log(
        colorize(`  ⚠️  Description already empty, skipping...`, 'yellow')
      )
      return { success: false, reason: 'already-empty' }
    }

    // Clean the description
    const cleanedContent = cleanDescription(content)

    if (dryRun) {
      console.log(
        colorize(
          `  🔍 DRY RUN - Would clean description: "${currentDescription}"`,
          'blue'
        )
      )
      return { success: true, reason: 'dry-run', currentDescription }
    }

    // Create backup if requested
    let backupPath = null
    if (createBackups) {
      backupPath = createBackup(postPath)
      console.log(
        colorize(`  💾 Created backup: ${path.basename(backupPath)}`, 'dim')
      )
    }

    // Write the cleaned content
    fs.writeFileSync(postPath, cleanedContent, 'utf8')

    console.log(
      colorize(`  ✅ Cleaned description: "${currentDescription}"`, 'green')
    )
    return { success: true, backupPath, currentDescription }
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
    createBackups: !args.includes('--no-backup'),
    filter: args.find((arg) => arg.startsWith('--filter='))?.split('=')[1],
  }

  console.log(colorize('🧹 Cleaning Blog Post Descriptions', 'bright'))
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
  const cleanedDescriptions = []

  // Process each post
  for (const post of filteredPosts) {
    const result = cleanDescriptionForPost(post.path, post.name, options)

    if (result.success && result.reason !== 'dry-run') {
      processed++
      if (result.backupPath) {
        backups.push(result.backupPath)
      }
      if (result.currentDescription) {
        cleanedDescriptions.push({
          name: post.name,
          description: result.currentDescription,
        })
      }
    } else if (
      result.reason === 'no-description' ||
      result.reason === 'already-empty'
    ) {
      skipped++
    } else if (result.reason === 'dry-run') {
      processed++ // Count as processed for dry run stats
      if (result.currentDescription) {
        cleanedDescriptions.push({
          name: post.name,
          description: result.currentDescription,
        })
      }
    } else {
      errors++
    }
  }

  console.log(colorize('\n📊 Cleaning Summary:', 'bright'))
  console.log(colorize(`  ✅ Processed: ${processed} posts`, 'green'))
  console.log(
    colorize(
      `  ⚠️  Skipped: ${skipped} posts (no description or already empty)`,
      'yellow'
    )
  )
  console.log(colorize(`  ❌ Errors: ${errors} posts`, 'red'))
  console.log(colorize(`  📝 Total: ${filteredPosts.length} posts`, 'cyan'))

  if (cleanedDescriptions.length > 0) {
    console.log(
      colorize('\n🗑️  Descriptions that would be/were cleaned:', 'blue')
    )
    cleanedDescriptions.forEach((item) => {
      console.log(colorize(`  ${item.name}: "${item.description}"`, 'dim'))
    })
  }

  if (backups.length > 0 && !options.dryRun) {
    console.log(colorize(`\n💾 Created ${backups.length} backup files`, 'blue'))
    console.log(
      colorize("   You can delete them once you've verified the results", 'dim')
    )
  }

  if (processed > 0 && !options.dryRun) {
    console.log(
      colorize('\n🎉 Successfully cleaned description fields!', 'green')
    )
    console.log(
      colorize('   All description fields are now empty but preserved', 'dim')
    )
  }
}

// Help function
function showHelp() {
  console.log(colorize('🧹 Clean Blog Post Descriptions', 'bright'))
  console.log('')
  console.log(
    'Removes content from description fields in frontmatter, leaving empty "description: " fields'
  )
  console.log('')
  console.log(colorize('Usage:', 'yellow'))
  console.log('  node scripts/clean-descriptions.js [options]')
  console.log('')
  console.log(colorize('Options:', 'yellow'))
  console.log('  --dry-run, -d         Preview changes without modifying files')
  console.log('  --no-backup           Skip creating backup files')
  console.log(
    '  --filter=TEXT         Only process posts containing TEXT in name'
  )
  console.log('  --help, -h            Show this help message')
  console.log('')
  console.log(colorize('Examples:', 'cyan'))
  console.log('  node scripts/clean-descriptions.js --dry-run')
  console.log('  node scripts/clean-descriptions.js --filter=25jul')
  console.log('  node scripts/clean-descriptions.js --no-backup')
  console.log('')
  console.log(colorize('What it does:', 'green'))
  console.log('  • Finds all blog posts in content/blog/')
  console.log('  • Removes any content after "description: " in frontmatter')
  console.log('  • Preserves the description field but makes it empty')
  console.log('  • Creates backups by default for safety')
  console.log('  • Only touches files that actually have description content')
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
  cleanDescription,
  cleanDescriptionForPost,
}
