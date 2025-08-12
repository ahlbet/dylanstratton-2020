#!/usr/bin/env node

require('dotenv').config()

// Dynamic import for ES6 modules
let generatePresignedUrl, generatePresignedUrlsForAudio

async function loadModules() {
  const presignedUrls = await import('../src/utils/presigned-urls.js')
  generatePresignedUrl = presignedUrls.generatePresignedUrl
  generatePresignedUrlsForAudio = presignedUrls.generatePresignedUrlsForAudio
}

async function testPresignedUrls() {
  // Load ES6 modules first
  await loadModules()

  console.log('🧪 Testing Pre-signed URL Generation')
  console.log('='.repeat(50))

  try {
    // Test single URL generation
    console.log('\n📝 Testing single pre-signed URL generation...')
    const singleUrl = await generatePresignedUrl(
      'test-audio.wav',
      'audio',
      3600
    )
    console.log('✅ Single URL generated:', singleUrl)

    // Test multiple audio files
    console.log('\n📝 Testing multiple pre-signed URL generation...')
    const mockAudioFiles = [
      { storage_path: 'audio/24mar10.wav', duration: 120, format: 'audio/wav' },
      { storage_path: 'audio/24jul01.wav', duration: 180, format: 'audio/wav' },
      { storage_path: 'audio/25jan15.wav', duration: 90, format: 'audio/wav' },
    ]

    const audioWithUrls = await generatePresignedUrlsForAudio(
      mockAudioFiles,
      7200
    ) // 2 hours
    console.log('✅ Multiple URLs generated:', audioWithUrls.length)

    audioWithUrls.forEach((audio, index) => {
      console.log(`  Audio ${index + 1}:`)
      console.log(`    Storage path: ${audio.storage_path}`)
      console.log(`    URL: ${audio.url}`)
      console.log(`    Duration: ${audio.duration}s`)
      console.log(`    Format: ${audio.format}`)
    })

    console.log(
      '\n🎉 All tests passed! Pre-signed URL generation is working correctly.'
    )
  } catch (error) {
    console.error('❌ ERROR: Pre-signed URL generation failed')
    console.error('Error details:', error.message)

    if (error.message.includes('Supabase')) {
      console.log('\n💡 This might be a Supabase connection issue.')
      console.log('Check your environment variables and network connection.')
    }

    process.exit(1)
  }
}

// Run the test
testPresignedUrls().catch((error) => {
  console.error('Script failed:', error.message)
  process.exit(1)
})
