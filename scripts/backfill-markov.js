#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { generateBlogPostText } = require('../src/utils/markov-generator')

// Function to recursively find all markdown files in blog directory
const findBlogPosts = (dir) => {
  const posts = []

  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist`)
    return posts
  }

  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      // Check if this directory contains a markdown file with the same name
      const potentialMdFile = path.join(fullPath, `${item}.md`)
      if (fs.existsSync(potentialMdFile)) {
        posts.push({
          path: potentialMdFile,
          name: item,
          directory: fullPath,
        })
      }
    }
  }

  return posts
}

// Function to check if a post already has Markov text
const hasMarkovText = (content) => {
  // Look for blockquotes that might be Markov generated text
  const lines = content.split('\n')
  let blockquoteCount = 0

  for (const line of lines) {
    if (line.trim().startsWith('>')) {
      blockquoteCount++
    }
  }

  // If there are more than 2 blockquotes, likely has Markov text
  return blockquoteCount > 2
}

// Function to add Markov text to a blog post
const addMarkovTextToPost = async (postPath, postName) => {
  try {
    console.log(`Processing: ${postName}`)

    // Read the current content
    const content = fs.readFileSync(postPath, 'utf8')

    // Check if it already has Markov text
    if (hasMarkovText(content)) {
      console.log(
        `  ⚠️  ${postName} already appears to have Markov text, skipping...`
      )
      return false
    }

    // Generate Markov text
    console.log(`  Generating Markov text for ${postName}...`)
    const markovText = await generateBlogPostText(postName, 5)

    // Add the Markov text to the end of the file
    const updatedContent = content + '\n\n' + markovText

    // Write back to file
    fs.writeFileSync(postPath, updatedContent, 'utf8')

    console.log(`  ✅ Added Markov text to ${postName}`)
    return true
  } catch (error) {
    console.error(`  ❌ Error processing ${postName}:`, error.message)
    return false
  }
}

// Main function
const main = async () => {
  console.log('🎲 Starting Markov text backfill for all blog posts...\n')

  // Find all blog posts
  const blogDir = path.join(process.cwd(), 'content', 'blog')
  const posts = findBlogPosts(blogDir)

  if (posts.length === 0) {
    console.log('No blog posts found in content/blog/')
    return
  }

  console.log(`Found ${posts.length} blog posts:\n`)

  let processed = 0
  let skipped = 0
  let errors = 0

  // Process each post
  for (const post of posts) {
    const success = await addMarkovTextToPost(post.path, post.name)

    if (success === true) {
      processed++
    } else if (success === false) {
      skipped++
    } else {
      errors++
    }
  }

  console.log('\n📊 Backfill Summary:')
  console.log(`  ✅ Processed: ${processed} posts`)
  console.log(`  ⚠️  Skipped: ${skipped} posts (already had Markov text)`)
  console.log(`  ❌ Errors: ${errors} posts`)
  console.log(`  📝 Total: ${posts.length} posts`)

  if (processed > 0) {
    console.log('\n🎉 Successfully added Markov text to existing blog posts!')
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error.message)
    process.exit(1)
  })
}

module.exports = { main, findBlogPosts, addMarkovTextToPost }
