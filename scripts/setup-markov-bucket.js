#!/usr/bin/env node

/**
 * Script to set up and manage the Supabase markov-text bucket
 * This script helps:
 * 1. Create the markov-text bucket if it doesn't exist
 * 2. Upload the existing 448.txt file to the bucket
 * 3. Upload additional txt files to the bucket
 * 4. Test the Markov text generation
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to create the markov-text bucket
async function createMarkovBucket() {
  console.log('🪣 Creating markov-text bucket...')

  const { data, error } = await supabase.storage.createBucket('markov-text', {
    public: true,
    allowedMimeTypes: ['text/plain'],
    fileSizeLimit: 1024 * 1024 * 10, // 10MB limit
  })

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ markov-text bucket already exists')
      return true
    } else {
      console.error('❌ Error creating bucket:', error.message)
      return false
    }
  }

  console.log('✅ Successfully created markov-text bucket')
  return true
}

// Function to upload a text file to the bucket
async function uploadTextFile(filePath, fileName) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`)
      return false
    }

    const fileContent = fs.readFileSync(filePath, 'utf8')
    const fileBuffer = Buffer.from(fileContent, 'utf8')

    console.log(`📤 Uploading ${fileName}...`)

    const { data, error } = await supabase.storage
      .from('markov-text')
      .upload(fileName, fileBuffer, {
        contentType: 'text/plain',
        upsert: true, // Allow overwriting
      })

    if (error) {
      console.error(`❌ Error uploading ${fileName}:`, error.message)
      return false
    }

    const { data: urlData } = supabase.storage
      .from('markov-text')
      .getPublicUrl(fileName)

    console.log(`✅ Successfully uploaded ${fileName}`)
    console.log(`   URL: ${urlData.publicUrl}`)
    return true
  } catch (error) {
    console.error(`❌ Error uploading ${fileName}:`, error.message)
    return false
  }
}

// Function to list all files in the bucket
async function listBucketFiles() {
  console.log('📋 Listing files in markov-text bucket...')

  const { data: files, error } = await supabase.storage
    .from('markov-text')
    .list('', {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' },
    })

  if (error) {
    console.error('❌ Error listing files:', error.message)
    return []
  }

  const txtFiles = files.filter(
    (file) =>
      file.name.toLowerCase().endsWith('.txt') &&
      file.name !== '.emptyFolderPlaceholder'
  )

  console.log(`📁 Found ${txtFiles.length} txt files:`)
  txtFiles.forEach((file) => {
    console.log(
      `   - ${file.name} (${Math.round(file.metadata?.size / 1024) || '?'} KB)`
    )
  })

  return txtFiles
}

// Function to test Markov generation
async function testMarkovGeneration() {
  console.log('🎲 Testing Markov generation...')

  try {
    const { generateBlogPostText } = require('../src/utils/markov-generator')
    const markovText = await generateBlogPostText('test-post', 3)

    console.log('✅ Successfully generated Markov text:')
    console.log('---')
    console.log(markovText)
    console.log('---')
    return true
  } catch (error) {
    console.error('❌ Error testing Markov generation:', error.message)
    return false
  }
}

// Main function
async function main() {
  const command = process.argv[2]

  console.log('🔮 Markov Text Bucket Setup\n')

  switch (command) {
    case 'setup':
      console.log('🚀 Setting up markov-text bucket...\n')

      // Create bucket
      const bucketCreated = await createMarkovBucket()
      if (!bucketCreated) return

      // Upload existing 448.txt if it exists
      const staticTxtPath = path.join(process.cwd(), 'static', '448.txt')
      if (fs.existsSync(staticTxtPath)) {
        await uploadTextFile(staticTxtPath, '448.txt')
      } else {
        console.log('⚠️  No 448.txt found in static folder')
      }

      // List current files
      await listBucketFiles()

      console.log('\n✅ Setup complete! You can now:')
      console.log(
        '   - Add more txt files using: node scripts/setup-markov-bucket.js upload <file-path>'
      )
      console.log(
        '   - Test generation using: node scripts/setup-markov-bucket.js test'
      )
      console.log(
        '   - List files using: node scripts/setup-markov-bucket.js list'
      )
      break

    case 'upload':
      const filePath = process.argv[3]
      if (!filePath) {
        console.log(
          '❌ Please provide a file path: node scripts/setup-markov-bucket.js upload <file-path>'
        )
        return
      }

      const fileName = path.basename(filePath)
      await uploadTextFile(filePath, fileName)
      break

    case 'list':
      await listBucketFiles()
      break

    case 'test':
      await testMarkovGeneration()
      break

    default:
      console.log('Usage: node scripts/setup-markov-bucket.js <command>')
      console.log('')
      console.log('Commands:')
      console.log('  setup     - Create bucket and upload initial content')
      console.log('  upload    - Upload a txt file to the bucket')
      console.log('  list      - List all txt files in the bucket')
      console.log('  test      - Test Markov text generation')
      console.log('')
      console.log('Examples:')
      console.log('  node scripts/setup-markov-bucket.js setup')
      console.log('  node scripts/setup-markov-bucket.js upload ./my-text.txt')
      console.log('  node scripts/setup-markov-bucket.js test')
  }
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  })
}

module.exports = {
  createMarkovBucket,
  uploadTextFile,
  listBucketFiles,
  testMarkovGeneration,
}
