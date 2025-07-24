const { createClient } = require('@supabase/supabase-js')
const { MarkovGenerator } = require('../src/utils/markov-generator')
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

async function preprocessMarkovChains() {
  console.log('🚀 Starting Markov chain preprocessing...')

  try {
    // Step 1: Load all text files from markov-text bucket
    console.log('📥 Loading text files from Supabase...')
    const { data: files, error: listError } = await supabase.storage
      .from('markov-text')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      })

    if (listError) {
      throw new Error(`Failed to list files: ${listError.message}`)
    }

    const txtFiles = files.filter((file) => file.name.endsWith('.txt'))
    console.log(`📁 Found ${txtFiles.length} text files`)

    if (txtFiles.length === 0) {
      throw new Error('No text files found in markov-text bucket')
    }

    // Step 2: Download and combine all text files
    console.log('📖 Downloading and processing text files...')
    let allText = ''
    let totalSize = 0

    for (const file of txtFiles) {
      console.log(`  📄 Processing ${file.name}...`)

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('markov-text')
        .download(file.name)

      if (downloadError) {
        console.warn(
          `⚠️  Failed to download ${file.name}: ${downloadError.message}`
        )
        continue
      }

      const text = await fileData.text()
      allText += text + '\n\n'
      totalSize += text.length

      console.log(`  ✅ ${file.name} (${text.length.toLocaleString()} bytes)`)
    }

    console.log(`📊 Total text size: ${totalSize.toLocaleString()} bytes`)

    // Step 3: Build Markov chains
    console.log('🔗 Building Markov chains...')
    const generator = new MarkovGenerator()

    // Load the combined text into the generator
    generator.lines = allText
      .split('\n')
      .filter((line) => line.trim().length > 0)

    // Build ngrams from the loaded text
    generator.buildNgrams()

    // Get the processed data
    const markovData = {
      ngrams: generator.ngrams,
      beginnings: generator.beginnings,
      lines: generator.lines,
      metadata: {
        totalFiles: txtFiles.length,
        totalSize: totalSize,
        processedAt: new Date().toISOString(),
        ngramCount: Object.keys(generator.ngrams).length,
        beginningCount: generator.beginnings.length,
        lineCount: generator.lines.length,
      },
    }

    console.log(`📈 Markov data summary:`)
    console.log(
      `  - Ngrams: ${markovData.metadata.ngramCount.toLocaleString()}`
    )
    console.log(
      `  - Beginnings: ${markovData.metadata.beginningCount.toLocaleString()}`
    )
    console.log(`  - Lines: ${markovData.metadata.lineCount.toLocaleString()}`)

    // Step 4: Store processed data in Supabase
    console.log('💾 Storing processed Markov data in Supabase...')

    // Convert to JSON string
    const jsonData = JSON.stringify(markovData)
    const blob = new Blob([jsonData], { type: 'application/json' })

    // Upload to a new bucket or table
    const { error: uploadError } = await supabase.storage
      .from('markov-chains')
      .upload('processed-chains.json', blob, {
        contentType: 'application/json',
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`Failed to upload processed data: ${uploadError.message}`)
    }

    console.log('✅ Successfully stored processed Markov data!')
    console.log('📋 Data stored as: markov-chains/processed-chains.json')
    console.log(
      `📏 File size: ${(jsonData.length / 1024 / 1024).toFixed(2)} MB`
    )

    // Step 5: Test the stored data
    console.log('🧪 Testing stored data...')
    const { data: testData, error: testError } = await supabase.storage
      .from('markov-chains')
      .download('processed-chains.json')

    if (testError) {
      throw new Error(`Failed to test stored data: ${testError.message}`)
    }

    const testJson = await testData.text()
    const testMarkovData = JSON.parse(testJson)

    console.log('✅ Stored data verified successfully!')
    console.log(
      `📊 Retrieved ${Object.keys(testMarkovData.ngrams).length} ngrams`
    )

    console.log('\n🎉 Markov chain preprocessing completed successfully!')
    console.log('\nNext steps:')
    console.log(
      '1. Update your API to fetch from markov-chains/processed-chains.json'
    )
    console.log(
      '2. The API will now load pre-processed data instead of raw text files'
    )
    console.log(
      '3. This should eliminate memory issues and improve performance'
    )
  } catch (error) {
    console.error('❌ Error during preprocessing:', error.message)
    process.exit(1)
  }
}

// Run the preprocessing
preprocessMarkovChains()
