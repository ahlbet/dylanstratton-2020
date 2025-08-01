const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

console.log('🔍 Debugging Local Development Environment\n')

// Check environment variables
console.log('Environment Variables:')
console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
console.log(`GATSBY_USE_LOCAL_DATA: ${process.env.GATSBY_USE_LOCAL_DATA}`)
console.log(
  `GATSBY_LOCAL_FALLBACK_TO_SUPABASE: ${process.env.GATSBY_LOCAL_FALLBACK_TO_SUPABASE}`
)

// Check if local dev should be enabled
const isLocalDev =
  process.env.NODE_ENV === 'development' &&
  process.env.GATSBY_USE_LOCAL_DATA === 'true'
console.log(`\nLocal Dev Enabled: ${isLocalDev}`)

// Check local directories
console.log('\nLocal Directories:')
const localAudioDir = path.join(process.cwd(), 'static/local-audio')
const localDataDir = path.join(process.cwd(), 'static/local-data')
const localCoverArtDir = path.join(process.cwd(), 'static/local-cover-art')

console.log(
  `Local Audio: ${fs.existsSync(localAudioDir) ? '✅' : '❌'} ${localAudioDir}`
)
console.log(
  `Local Data: ${fs.existsSync(localDataDir) ? '✅' : '❌'} ${localDataDir}`
)
console.log(
  `Local Cover Art: ${fs.existsSync(localCoverArtDir) ? '✅' : '❌'} ${localCoverArtDir}`
)

// Count files in local directories
if (fs.existsSync(localAudioDir)) {
  const audioFiles = fs
    .readdirSync(localAudioDir)
    .filter((f) => f.endsWith('.wav'))
  console.log(`Audio files: ${audioFiles.length}`)
}

if (fs.existsSync(localDataDir)) {
  const markovTextsPath = path.join(localDataDir, 'markov-texts.json')
  if (fs.existsSync(markovTextsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(markovTextsPath, 'utf8'))
      console.log(`Markov texts: ${data.texts ? data.texts.length : 0}`)
    } catch (error) {
      console.log('Markov texts: ❌ Invalid JSON')
    }
  }
}

// Test URL conversion logic
console.log('\nURL Conversion Test:')
const testSupabaseUrl =
  'https://uzsnbfnteazzwirbqgzb.supabase.co/storage/v1/object/public/audio/25jul01-12.wav'

if (isLocalDev) {
  try {
    const url = new URL(testSupabaseUrl)
    const pathParts = url.pathname.split('/')
    const filename = pathParts[pathParts.length - 1]
    const cleanFilename = filename.split('?')[0]
    const localUrl = `/static/local-audio/${cleanFilename}`

    console.log(`Supabase URL: ${testSupabaseUrl}`)
    console.log(`Converted to: ${localUrl}`)
    console.log(
      `Local file exists: ${fs.existsSync(path.join(process.cwd(), 'static/local-audio', cleanFilename)) ? '✅' : '❌'}`
    )
  } catch (error) {
    console.log('URL conversion failed:', error.message)
  }
} else {
  console.log('Local dev not enabled, URL conversion would not happen')
}

console.log('\n' + '='.repeat(50))
console.log('To enable local development:')
console.log('1. Set NODE_ENV=development')
console.log('2. Set GATSBY_USE_LOCAL_DATA=true')
console.log('3. Restart your development server')
console.log('Or use: yarn start-local')
console.log('='.repeat(50))
