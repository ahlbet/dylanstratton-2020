// Test URL conversion logic in a simulated browser environment
const fs = require('fs')
const path = require('path')

// Simulate browser environment
global.window = {}
const originalProcess = process
global.process = {
  ...originalProcess,
  env: {
    ...originalProcess.env,
    NODE_ENV: 'development',
    GATSBY_USE_LOCAL_DATA: 'true',
  },
}

// Import the conversion function
const {
  convertToLocalAudioUrl,
  convertAudioUrlsToLocal,
} = require('../src/utils/local-audio-urls')

console.log('🧪 Testing URL Conversion Logic\n')

// Test cases
const testCases = [
  'https://uzsnbfnteazzwirbqgzb.supabase.co/storage/v1/object/public/audio/25jul01-12.wav',
  'https://uzsnbfnteazzwirbqgzb.supabase.co/storage/v1/object/public/audio/25jul27.wav',
  'https://uzsnbfnteazzwirbqgzb.supabase.co/storage/v1/object/public/audio/25jul27-1.wav',
  'https://uzsnbfnteazzwirbqgzb.supabase.co/storage/v1/object/public/audio/25jul27-10.wav?v=1234567890',
]

console.log('Single URL Conversion Tests:')
testCases.forEach((url, index) => {
  const converted = convertToLocalAudioUrl(url)
  const localPath = path.join(
    process.cwd(),
    'public/local-audio',
    converted.split('/').pop()
  )
  const exists = fs.existsSync(localPath)

  console.log(`${index + 1}. ${url}`)
  console.log(`   → ${converted} ${exists ? '✅' : '❌'}`)
  console.log('')
})

console.log('Array URL Conversion Test:')
const arrayResult = convertAudioUrlsToLocal(testCases)
console.log('Input:', testCases.length, 'URLs')
console.log('Output:', arrayResult.length, 'URLs')
arrayResult.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`)
})

console.log('\n' + '='.repeat(60))
console.log('✅ URL conversion tests complete!')
console.log('='.repeat(60))
