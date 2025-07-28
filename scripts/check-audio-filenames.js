const fs = require('fs')
const path = require('path')

// Function to extract audio URLs from markdown content
const extractAudioUrls = (content) => {
  // Match both full URLs and relative paths
  const audioRegex =
    /(?:https?:\/\/[^\/]+\/storage\/v1\/object\/public\/audio\/|public\/audio\/)([^)\s]+\.wav)/g
  const matches = []
  let match

  while ((match = audioRegex.exec(content)) !== null) {
    // Extract just the filename part
    const filename = match[1]
    matches.push(`/public/audio/${filename}`)
  }

  return matches
}

// Function to check if filename needs updating
const needsUpdate = (filename) => {
  // Correct formats:
  // - Single audio: /public/audio/{name}.wav (e.g., 24jul01.wav)
  // - Multiple audio: /public/audio/{name}-{n}.wav (e.g., 25jul01-01.wav)

  const singleAudioRegex = /^\/public\/audio\/[a-zA-Z0-9]+\.wav$/ // e.g., 24jul01.wav
  const multipleAudioRegex = /^\/public\/audio\/[a-zA-Z0-9]+-\d+\.wav$/ // e.g., 25jul01-01.wav

  // Check if it matches either correct format
  if (singleAudioRegex.test(filename) || multipleAudioRegex.test(filename)) {
    return false // Already correct
  }

  // Check for patterns that need updating:
  // - Complex metadata (e.g., 25jul01-1-25jul01-G-127bpm...)
  // - Duplicate date (e.g., 25may25-25may25.wav)
  // - Any other non-standard formats
  const oldPatterns = [
    /^\/public\/audio\/[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+/, // Duplicate date
    /^\/public\/audio\/[a-zA-Z0-9]+-\d+-[a-zA-Z0-9]+/, // Complex metadata
  ]

  return oldPatterns.some((pattern) => pattern.test(filename))
}

// Function to suggest new filename
const suggestNewFilename = (oldFilename, postTitle, fileIndex) => {
  // Create clean post title for filename
  const cleanTitle = postTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20) // Limit length

  // Use sequential numbering (1, 2, 3, etc.) based on file order
  const number = (fileIndex + 1).toString().padStart(2, '0')

  return `/public/audio/${cleanTitle}-${number}.wav`
}

// Main function
const checkAudioFilenames = () => {
  console.log('🔍 Checking audio filenames in all blog posts...\n')

  const blogDir = path.join(__dirname, '../content/blog')
  const posts = []

  // Read all blog post directories
  const postDirs = fs
    .readdirSync(blogDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  console.log(`📁 Found ${postDirs.length} blog post directories\n`)

  let totalAudioFiles = 0
  let filesNeedingUpdate = 0

  for (const postDir of postDirs) {
    const postPath = path.join(blogDir, postDir)
    const markdownFile = path.join(postPath, `${postDir}.md`)

    if (!fs.existsSync(markdownFile)) {
      console.log(`⚠️  No markdown file found for ${postDir}`)
      continue
    }

    const content = fs.readFileSync(markdownFile, 'utf8')
    const audioUrls = extractAudioUrls(content)

    if (audioUrls.length === 0) {
      continue
    }

    totalAudioFiles += audioUrls.length

    // Check if any files need updating
    const needsUpdating = audioUrls.filter(needsUpdate)

    if (needsUpdating.length > 0) {
      filesNeedingUpdate += needsUpdating.length

      console.log(`📝 ${postDir}:`)
      console.log(`   Audio files: ${audioUrls.length}`)
      console.log(`   Need updating: ${needsUpdating.length}`)

      // Extract post title for suggestions
      const titleMatch = content.match(/^title:\s*(.+)$/m)
      const postTitle = titleMatch ? titleMatch[1].trim() : postDir

      // Show all files that need updating with sequential numbering
      for (let i = 0; i < needsUpdating.length; i++) {
        const oldFilename = needsUpdating[i]
        const suggestedFilename = suggestNewFilename(oldFilename, postTitle, i)
        console.log(`   ❌ ${oldFilename}`)
        console.log(`   ✅ ${suggestedFilename}`)
      }
      console.log('')
    }
  }

  console.log('📊 Summary:')
  console.log(`   Total audio files found: ${totalAudioFiles}`)
  console.log(`   Files needing update: ${filesNeedingUpdate}`)
  console.log(
    `   Files already correct: ${totalAudioFiles - filesNeedingUpdate}`
  )

  if (filesNeedingUpdate > 0) {
    console.log('\n🔄 Next steps:')
    console.log('   1. Review the suggested new filenames above')
    console.log('   2. Create a script to update the markdown files')
    console.log('   3. Rename the actual audio files in Supabase storage')
    console.log('   4. Update the markdown files with new URLs')
  } else {
    console.log('\n✅ All audio filenames are already in the correct format!')
  }
}

// Run the script
if (require.main === module) {
  checkAudioFilenames()
}

module.exports = {
  checkAudioFilenames,
  extractAudioUrls,
  needsUpdate,
  suggestNewFilename,
}
