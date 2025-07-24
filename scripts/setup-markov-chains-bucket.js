const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error(
    'Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupMarkovChainsBucket() {
  console.log('🚀 Setting up markov-chains bucket...')

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets()

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }

    const existingBucket = buckets.find(
      (bucket) => bucket.name === 'markov-chains'
    )

    if (existingBucket) {
      console.log('✅ markov-chains bucket already exists')
      console.log(`📋 Bucket details:`)
      console.log(`  - Name: ${existingBucket.name}`)
      console.log(`  - Public: ${existingBucket.public}`)
      console.log(`  - Created: ${existingBucket.created_at}`)
      return
    }

    // Create the bucket
    console.log('📦 Creating markov-chains bucket...')
    const { data: bucket, error: createError } =
      await supabase.storage.createBucket('markov-chains', {
        public: true,
        allowedMimeTypes: ['application/json'],
        fileSizeLimit: 52428800, // 50MB limit
      })

    if (createError) {
      throw new Error(`Failed to create bucket: ${createError.message}`)
    }

    console.log('✅ Successfully created markov-chains bucket!')
    console.log(`📋 Bucket details:`)
    console.log(`  - Name: ${bucket.name}`)
    console.log(`  - Public: ${bucket.public}`)
    console.log(`  - Created: ${bucket.created_at}`)

    // Test the bucket by uploading a small test file
    console.log('🧪 Testing bucket with a small test file...')
    const testData = {
      test: 'markov-chains-bucket-setup',
      timestamp: new Date().toISOString(),
    }
    const testBlob = new Blob([JSON.stringify(testData)], {
      type: 'application/json',
    })

    const { error: testUploadError } = await supabase.storage
      .from('markov-chains')
      .upload('test-setup.json', testBlob, {
        contentType: 'application/json',
        upsert: true,
      })

    if (testUploadError) {
      throw new Error(`Failed to upload test file: ${testUploadError.message}`)
    }

    console.log('✅ Test upload successful!')

    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('markov-chains')
      .remove(['test-setup.json'])

    if (deleteError) {
      console.warn(`⚠️  Failed to clean up test file: ${deleteError.message}`)
    } else {
      console.log('🧹 Test file cleaned up')
    }

    console.log('\n🎉 markov-chains bucket setup completed successfully!')
    console.log('\nNext steps:')
    console.log(
      '1. Run the preprocessing script: node scripts/preprocess-markov-chains.js'
    )
    console.log(
      '2. This will process your text files and store the Markov chains in this bucket'
    )
  } catch (error) {
    console.error('❌ Error setting up bucket:', error.message)
    process.exit(1)
  }
}

// Run the setup
setupMarkovChainsBucket()
