const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '❌')
  console.error(
    '   SUPABASE_SERVICE_ROLE_KEY:',
    supabaseServiceKey ? '✓' : '❌'
  )
  process.exit(1)
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const bucketName = 'cover-art'

/**
 * Creates the cover-art bucket if it doesn't exist
 */
async function createBucket() {
  console.log('🎨 Setting up cover-art bucket...')

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets()

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }

    const bucketExists = buckets.some((bucket) => bucket.name === bucketName)

    if (bucketExists) {
      console.log(`✅ Bucket '${bucketName}' already exists`)
      return true
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
      fileSizeLimit: 10485760, // 10MB limit
    })

    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`)
    }

    console.log(`✅ Created bucket '${bucketName}' successfully`)
    return true
  } catch (error) {
    console.error(`❌ Error creating bucket: ${error.message}`)
    return false
  }
}

/**
 * Lists all files in the cover-art bucket
 */
async function listFiles() {
  try {
    const { data, error } = await supabase.storage.from(bucketName).list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    })

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`)
    }

    console.log(`\n📋 Files in ${bucketName} bucket:`)
    if (data.length === 0) {
      console.log('   (empty)')
    } else {
      data.forEach((file, index) => {
        const sizeKB = Math.round(file.metadata?.size / 1024) || 0
        console.log(`   ${index + 1}. ${file.name} (${sizeKB} KB)`)
      })
    }

    return data
  } catch (error) {
    console.error(`❌ Error listing files: ${error.message}`)
    return []
  }
}

/**
 * Tests the bucket by checking access and permissions
 */
async function testBucket() {
  console.log('\n🧪 Testing bucket access...')

  try {
    // Try to list files (tests read access)
    const files = await listFiles()

    // Try to get public URL for a test file (tests public access)
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl('test.png') // This will work even if file doesn't exist

    if (urlData?.publicUrl) {
      console.log(`✅ Public URL format: ${urlData.publicUrl}`)
    }

    console.log('✅ Bucket access test successful')
    return true
  } catch (error) {
    console.error(`❌ Bucket test failed: ${error.message}`)
    return false
  }
}

/**
 * Deletes a specific file from the bucket
 */
async function deleteFile(fileName) {
  try {
    const { error } = await supabase.storage.from(bucketName).remove([fileName])

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`)
    }

    console.log(`✅ Deleted file: ${fileName}`)
    return true
  } catch (error) {
    console.error(`❌ Error deleting file: ${error.message}`)
    return false
  }
}

/**
 * Displays help information
 */
function showHelp() {
  console.log(`
🎨 Cover Art Bucket Setup Script

Usage: node setup-cover-art-bucket.js [command]

Commands:
  setup     - Create the cover-art bucket (default)
  list      - List all files in the bucket
  test      - Test bucket access and permissions
  delete    - Delete a specific file (requires filename)
  help      - Show this help message

Examples:
  node setup-cover-art-bucket.js setup
  node setup-cover-art-bucket.js list
  node setup-cover-art-bucket.js test
  node setup-cover-art-bucket.js delete 25jul01.png
  node setup-cover-art-bucket.js help

Environment Variables Required:
  SUPABASE_URL              - Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key (for admin operations)
`)
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2] || 'setup'
  const fileName = process.argv[3]

  console.log('🎨 Cover Art Bucket Manager\n')

  switch (command) {
    case 'setup':
      const success = await createBucket()
      if (success) {
        await testBucket()
        console.log('\n✅ Cover art bucket setup complete!')
        console.log('\n💡 Next steps:')
        console.log(
          '   1. Run your init script to generate cover art for new posts'
        )
        console.log(
          '   2. Cover art will be automatically displayed in the audio player'
        )
      }
      break

    case 'list':
      await listFiles()
      break

    case 'test':
      await testBucket()
      break

    case 'delete':
      if (!fileName) {
        console.error('❌ Please provide a filename to delete')
        console.log(
          '   Usage: node setup-cover-art-bucket.js delete <filename>'
        )
        process.exit(1)
      }
      await deleteFile(fileName)
      break

    case 'help':
      showHelp()
      break

    default:
      console.error(`❌ Unknown command: ${command}`)
      showHelp()
      process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  })
}

module.exports = {
  createBucket,
  listFiles,
  testBucket,
  deleteFile,
}
