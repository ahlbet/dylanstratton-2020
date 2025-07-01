#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config()

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Function to strip special characters except hyphens
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9\-]/g, '')
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to upload file to Supabase storage
const uploadToSupabase = async (filePath, fileName, bucketName = 'audio') => {
  try {
    // Read the file
    const fileBuffer = fs.readFileSync(filePath)

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: 'audio/wav',
        upsert: true, // Allow overwriting if file exists
      })

    if (error) {
      throw new Error(`Failed to upload to Supabase: ${error.message}`)
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    return urlData.publicUrl
  } catch (error) {
    console.error(`Upload error for ${fileName}:`, error.message)
    throw error
  }
}

// Function to update markdown file with new audio URLs
const updateMarkdownFile = (filePath, oldAudioRefs, newAudioRefs) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8')

    // Replace each old audio reference with the new one
    oldAudioRefs.forEach((oldRef, index) => {
      const newRef = newAudioRefs[index]
      if (newRef) {
        content = content.replace(oldRef, newRef)
        console.log(`  Updated: ${oldRef} → ${newRef}`)
      }
    })

    fs.writeFileSync(filePath, content)
    return true
  } catch (error) {
    console.error(`Failed to update ${filePath}:`, error.message)
    return false
  }
}

// Function to find all blog post directories
const findBlogPosts = () => {
  const blogDir = path.join(process.cwd(), 'content', 'blog')
  const posts = []

  if (!fs.existsSync(blogDir)) {
    console.error('Blog directory not found:', blogDir)
    return posts
  }

  const entries = fs.readdirSync(blogDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const postDir = path.join(blogDir, entry.name)
      const markdownFiles = fs
        .readdirSync(postDir)
        .filter((file) => file.endsWith('.md'))

      if (markdownFiles.length > 0) {
        posts.push({
          name: entry.name,
          dir: postDir,
          markdownFile: path.join(postDir, markdownFiles[0]),
        })
      }
    }
  }

  return posts
}

// Function to extract audio references from markdown content
const extractAudioRefs = (content) => {
  const audioRegex = /`audio:\s*([^`]+)`/g
  const refs = []
  let match

  while ((match = audioRegex.exec(content)) !== null) {
    refs.push(match[0]) // Full match including backticks
  }

  return refs
}

// Function to get local file path from audio reference
const getLocalFilePath = (audioRef) => {
  // Extract the path from `audio: ../../assets/music/filename.wav`
  const pathMatch = audioRef.match(
    /`audio:\s*\.\.\/\.\.\/assets\/music\/([^`]+)`/
  )
  if (pathMatch) {
    return path.join(process.cwd(), 'content', 'assets', 'music', pathMatch[1])
  }
  return null
}

// Main migration function
const migrateToSupabase = async () => {
  console.log('🚀 Starting migration to Supabase...\n')

  // Find all blog posts
  const posts = findBlogPosts()
  console.log(`Found ${posts.length} blog posts to process\n`)

  let totalUploaded = 0
  let totalUpdated = 0

  for (const post of posts) {
    console.log(`📝 Processing: ${post.name}`)

    try {
      // Read the markdown file
      const content = fs.readFileSync(post.markdownFile, 'utf8')

      // Extract audio references
      const audioRefs = extractAudioRefs(content)

      if (audioRefs.length === 0) {
        console.log(`  No audio files found, skipping...`)
        continue
      }

      console.log(`  Found ${audioRefs.length} audio reference(s)`)

      const newAudioRefs = []

      // Process each audio reference
      for (const audioRef of audioRefs) {
        const localFilePath = getLocalFilePath(audioRef)

        if (!localFilePath) {
          console.log(`  ⚠️  Could not parse path from: ${audioRef}`)
          newAudioRefs.push(audioRef) // Keep original
          continue
        }

        if (!fs.existsSync(localFilePath)) {
          console.log(`  ⚠️  Local file not found: ${localFilePath}`)
          newAudioRefs.push(audioRef) // Keep original
          continue
        }

        // Generate new filename
        const fileName = path.basename(localFilePath)
        const fileExtension = path.extname(fileName)
        const baseName = path.basename(fileName, fileExtension)
        const sanitizedBaseName = sanitizeFilename(baseName)
        const newFileName = `${post.name}-${sanitizedBaseName}${fileExtension}`

        try {
          // Upload to Supabase
          console.log(`  📤 Uploading: ${fileName} → ${newFileName}`)
          const supabaseUrl = await uploadToSupabase(localFilePath, newFileName)

          // Create new audio reference
          const newAudioRef = `\`audio: ${supabaseUrl}\``
          newAudioRefs.push(newAudioRef)

          totalUploaded++
          console.log(`  ✅ Uploaded successfully`)
        } catch (error) {
          console.log(`  ❌ Upload failed: ${error.message}`)
          newAudioRefs.push(audioRef) // Keep original
        }
      }

      // Update the markdown file
      if (updateMarkdownFile(post.markdownFile, audioRefs, newAudioRefs)) {
        totalUpdated++
        console.log(`  ✅ Updated markdown file`)
      } else {
        console.log(`  ❌ Failed to update markdown file`)
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${post.name}:`, error.message)
    }

    console.log('') // Empty line for readability
  }

  console.log('🎉 Migration completed!')
  console.log(`📊 Summary:`)
  console.log(`  - Files uploaded to Supabase: ${totalUploaded}`)
  console.log(`  - Blog posts updated: ${totalUpdated}`)
  console.log(`  - Total posts processed: ${posts.length}`)

  if (totalUploaded > 0) {
    console.log('\n💡 Next steps:')
    console.log('  1. Test your blog to ensure audio files play correctly')
    console.log('  2. Verify all files are accessible in Supabase dashboard')
    console.log('  3. Consider removing local audio files to reduce repo size')
    console.log('  4. Update .gitignore to exclude local audio files')
  }
}

// Run the migration
migrateToSupabase().catch((error) => {
  console.error('Migration failed:', error.message)
  process.exit(1)
})
