const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

// Check if --dry-run flag is passed
const isDryRun = process.argv.includes('--dry-run')

// Show usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🎵 Fetch Missing Audio from Supabase')
  console.log('')
  console.log('Usage:')
  console.log(
    '  node scripts/fetch-all-audio-from-supabase.js          # Download missing files'
  )
  console.log(
    '  node scripts/fetch-all-audio-from-supabase.js --dry-run # Show what would be downloaded'
  )
  console.log(
    '  node scripts/fetch-all-audio-from-supabase.js --help   # Show this help message'
  )
  console.log('')
  process.exit(0)
}

async function fetchMissingAudioFromSupabase() {
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No files will be downloaded')
  }
  console.log('🎵 Checking for missing audio files...')

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials')
      console.log(
        'Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file'
      )
      return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Ensure local audio directory exists
    const localAudioDir = path.join(__dirname, '../static/local-audio')
    if (!fs.existsSync(localAudioDir)) {
      fs.mkdirSync(localAudioDir, { recursive: true })
    }

    // Get list of existing local audio files
    const existingFiles = new Set()
    if (fs.existsSync(localAudioDir)) {
      const files = fs.readdirSync(localAudioDir)
      files.forEach((file) => {
        if (
          file.endsWith('.wav') ||
          file.endsWith('.mp3') ||
          file.endsWith('.ogg') ||
          file.endsWith('.m4a') ||
          file.endsWith('.flac')
        ) {
          // Strip query parameters and just use the filename
          const cleanFilename = file.split('?')[0]
          existingFiles.add(cleanFilename)
        }
      })
    }

    console.log(`📁 Found ${existingFiles.size} existing local audio files`)
    console.log(
      '📋 Existing files:',
      Array.from(existingFiles).slice(0, 10).join(', ')
    )

    // Scan all blog post markdown files for audio references
    const blogDir = path.join(__dirname, '../content/blog')
    const requiredAudioFiles = new Set()

    if (fs.existsSync(blogDir)) {
      const blogFolders = fs
        .readdirSync(blogDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)

      console.log(
        `📝 Scanning ${blogFolders.length} blog posts for audio references...`
      )

      for (const folder of blogFolders) {
        const blogPath = path.join(blogDir, folder)
        const files = fs.readdirSync(blogPath)

        for (const file of files) {
          if (file.endsWith('.md')) {
            const markdownPath = path.join(blogPath, file)
            const content = fs.readFileSync(markdownPath, 'utf8')

            // Extract audio file references using regex
            const audioRegex =
              /`audio: https:\/\/[^\/]+\/storage\/v1\/object\/public\/audio\/([^`]+)`/g
            let match

            while ((match = audioRegex.exec(content)) !== null) {
              const filename = match[1]
              // Strip query parameters from the filename
              const cleanFilename = filename.split('?')[0]
              requiredAudioFiles.add(cleanFilename)
            }
          }
        }
      }
    }

    console.log(
      `📋 Found ${requiredAudioFiles.size} audio files referenced in blog posts`
    )
    console.log(
      '📋 Required files:',
      Array.from(requiredAudioFiles).slice(0, 10).join(', ')
    )

    // Find missing files
    const missingFiles = []
    for (const requiredFile of requiredAudioFiles) {
      // Strip any query parameters from the required file as well
      const cleanRequiredFile = requiredFile.split('?')[0]
      if (!existingFiles.has(cleanRequiredFile)) {
        missingFiles.push(cleanRequiredFile)
      }
    }

    if (missingFiles.length === 0) {
      console.log('✅ All required audio files are already downloaded locally!')
      return
    }

    console.log(
      `📥 Found ${missingFiles.length} missing audio files to download:`
    )
    if (missingFiles.length > 0) {
      missingFiles.forEach((file) => console.log(`   - ${file}`))
    } else {
      console.log('   No missing files found!')
    }

    if (isDryRun) {
      console.log('\n🔍 DRY RUN COMPLETE - No files were downloaded')
      console.log('\n📊 DRY RUN SUMMARY:')
      console.log(`   Files to download: ${missingFiles.length}`)
      console.log(`   Total required files: ${requiredAudioFiles.size}`)
      console.log(`   Existing local files: ${existingFiles.size}`)
      console.log(
        '\n📋 To actually download files, run without --dry-run flag:'
      )
      console.log('   node scripts/fetch-all-audio-from-supabase.js')
      return
    }

    // Download missing audio files
    let successfulDownloads = 0
    let failedDownloads = 0

    for (let i = 0; i < missingFiles.length; i++) {
      const filename = missingFiles[i]

      try {
        console.log(
          `📥 Downloading ${i + 1}/${missingFiles.length}: ${filename}`
        )

        const { data, error } = await supabase.storage
          .from('audio')
          .download(filename)

        if (error) {
          console.error(`❌ Error downloading ${filename}:`, error.message)
          failedDownloads++
          continue
        }

        if (!data) {
          console.error(`❌ No data received for ${filename}`)
          failedDownloads++
          continue
        }

        // Convert blob to buffer
        const arrayBuffer = await data.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        console.log(`📊 Buffer size: ${buffer.length} bytes`)

        // Save to local directory as binary file
        const localPath = path.join(localAudioDir, filename)
        fs.writeFileSync(localPath, buffer, { encoding: null })

        const sizeKB = (buffer.length / 1024).toFixed(1)
        console.log(`✅ Downloaded ${filename} (${sizeKB}KB)`)
        successfulDownloads++

        // Add a small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error.message)
        failedDownloads++
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Download Summary:')
    console.log(`✅ Successfully downloaded: ${successfulDownloads} files`)
    console.log(`❌ Failed downloads: ${failedDownloads} files`)
    console.log(`📁 Total missing files: ${missingFiles.length} files`)
    console.log(`📁 Total existing files: ${existingFiles.size} files`)
    console.log(`📁 Total required files: ${requiredAudioFiles.size} files`)

    if (successfulDownloads > 0) {
      console.log(`\n💾 Files saved to: ${localAudioDir}`)
      console.log('\n📋 Next steps:')
      console.log('1. Add USE_LOCAL_DATA=true to your .env file')
      console.log('2. Restart your development server: yarn start')
      console.log('3. Test local audio playback on a blog post')
    }

    console.log('='.repeat(60))
  } catch (error) {
    console.error('❌ Error fetching audio files:', error)
  }
}

// Export the function for testing
module.exports = { fetchMissingAudioFromSupabase }

// Run the script only when not in test mode
if (require.main === module) {
  fetchMissingAudioFromSupabase().catch(console.error)
}
