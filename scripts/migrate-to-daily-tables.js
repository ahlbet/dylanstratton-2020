#!/usr/bin/env node

const { execSync } = require('child_process')
const path = require('path')

console.log('🚀 Starting migration to daily tables...')
console.log('This will:')
console.log('1. Add daily_id frontmatter to all markdown files')
console.log('2. Create corresponding entries in the daily table')
console.log('3. Process markov texts (link existing or create new)')
console.log('4. Link audio files to the daily_audio table')
console.log('')

// Run the daily_id addition script
console.log('📝 Step 1: Adding daily_id to markdown files...')
try {
  execSync('node scripts/add-daily-ids-to-markdown.js', {
    stdio: 'inherit',
    cwd: process.cwd(),
  })
  console.log('✅ Step 1 completed successfully!\n')
} catch (error) {
  console.error('❌ Step 1 failed:', error.message)
  process.exit(1)
}

// Run the audio linking script
console.log('🎵 Step 2: Linking audio files to daily_audio table...')
try {
  execSync('node scripts/link-audio-to-daily.js', {
    stdio: 'inherit',
    cwd: process.cwd(),
  })
  console.log('✅ Step 2 completed successfully!\n')
} catch (error) {
  console.error('❌ Step 2 failed:', error.message)
  process.exit(1)
}

console.log('🎉 Migration completed successfully!')
console.log('')
console.log('Next steps:')
console.log('1. Verify the changes in your markdown files')
console.log('2. Check your Supabase database tables')
console.log('3. Test creating a new blog post with: node init.js <name>')
