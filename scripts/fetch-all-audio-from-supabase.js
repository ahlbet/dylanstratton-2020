const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

async function fetchAllAudioFromSupabase() {
  console.log('🎵 Fetching all audio files from Supabase...')

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

    // List all files in the audio bucket
    console.log('📋 Listing audio files from Supabase...')
    const { data: files, error: listError } = await supabase.storage
      .from('audio')
      .list('', {
        limit: 1000, // Get up to 1000 files
        sortBy: { column: 'name', order: 'asc' },
      })

    if (listError) {
      console.error('❌ Error listing files from Supabase:', listError.message)
      return
    }

    // Filter for audio files
    const audioFiles = files.filter((file) => {
      const ext = path.extname(file.name).toLowerCase()
      return ['.wav', '.mp3', '.ogg', '.m4a', '.flac'].includes(ext)
    })

    if (audioFiles.length === 0) {
      console.log('⚠️ No audio files found in Supabase storage')
      return
    }

    console.log(`📁 Found ${audioFiles.length} audio files to download`)

    // Download each audio file
    let successfulDownloads = 0
    let failedDownloads = 0
    const downloadPromises = audioFiles.map(async (file, index) => {
      try {
        console.log(
          `📥 Downloading ${index + 1}/${audioFiles.length}: ${file.name}`
        )

        const { data, error } = await supabase.storage
          .from('audio')
          .download(file.name)

        if (error) {
          console.error(`❌ Error downloading ${file.name}:`, error.message)
          failedDownloads++
          return
        }

        // Convert blob to buffer
        const arrayBuffer = await data.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Save to local directory
        const localPath = path.join(localAudioDir, file.name)
        fs.writeFileSync(localPath, buffer)

        const sizeKB = (buffer.length / 1024).toFixed(1)
        console.log(`✅ Downloaded ${file.name} (${sizeKB}KB)`)
        successfulDownloads++
      } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error.message)
        failedDownloads++
      }
    })

    // Wait for all downloads to complete
    await Promise.all(downloadPromises)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Download Summary:')
    console.log(`✅ Successfully downloaded: ${successfulDownloads} files`)
    console.log(`❌ Failed downloads: ${failedDownloads} files`)
    console.log(`📁 Total files processed: ${audioFiles.length} files`)

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

// Run the script
fetchAllAudioFromSupabase().catch(console.error)
