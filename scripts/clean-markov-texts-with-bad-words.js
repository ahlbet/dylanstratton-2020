const { createClient } = require('@supabase/supabase-js')
const { filterBadWords } = require('../src/utils/text-cleaner')
const Filter = require('bad-words')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

// Create a filter instance for tracking
const filter = new Filter()

async function cleanMarkovTextsWithBadWords() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('🧹 Cleaning existing Markov texts with bad-words filter...')

  // Track bad words found
  const badWordsFound = new Map() // word -> { count, examples }
  let totalBadWordsFound = 0

  // First, get all existing texts using pagination
  console.log('📖 Fetching existing texts...')

  // Fetch all texts in chunks since Supabase has a default limit of 1000
  const allTexts = []
  let offset = 0
  const chunkSize = 1000

  while (true) {
    const { data: chunk, error: chunkError } = await supabase
      .from('markov_texts')
      .select('*')
      .range(offset, offset + chunkSize - 1)

    if (chunkError) {
      console.error('❌ Error fetching chunk:', chunkError.message)
      break
    }

    if (!chunk || chunk.length === 0) {
      break
    }

    allTexts.push(...chunk)
    console.log(
      `📖 Fetched ${chunk.length} texts (offset ${offset}), total so far: ${allTexts.length}`
    )
    offset += chunkSize
  }

  const existingTexts = allTexts

  console.log(`📚 Found ${existingTexts.length} existing texts`)

  // Clean each text with bad-words filter
  console.log('🚫 Applying bad-words filter...')
  const cleanedTexts = existingTexts.map((textRecord, index) => {
    const originalText = textRecord.text_content
    const cleanedText = filterBadWords(originalText)

    // Track bad words found in this text
    const words = originalText.toLowerCase().split(/\s+/)
    words.forEach((word) => {
      // Clean the word for comparison (remove punctuation)
      const cleanWord = word.replace(/[^\w]/g, '')
      if (cleanWord && filter.isProfane(cleanWord)) {
        if (!badWordsFound.has(cleanWord)) {
          badWordsFound.set(cleanWord, { count: 0, examples: [] })
        }
        const entry = badWordsFound.get(cleanWord)
        entry.count++
        totalBadWordsFound++

        // Keep up to 3 examples of context
        if (entry.examples.length < 3) {
          const wordIndex = originalText.toLowerCase().indexOf(word)
          const start = Math.max(0, wordIndex - 20)
          const end = Math.min(
            originalText.length,
            wordIndex + word.length + 20
          )
          const context = originalText.substring(start, end).trim()
          entry.examples.push(context)
        }
      }
    })

    return {
      id: textRecord.id,
      text_content: cleanedText,
      text_length: cleanedText.length,
      metadata: {
        ...textRecord.metadata,
        cleaned_with_bad_words_filter: true,
        cleaned_at: new Date().toISOString(),
        original_length: originalText.length,
      },
    }
  })

  // Update texts in batches
  console.log('📦 Updating cleaned texts in database...')
  const batchSize = 50
  let updatedCount = 0

  for (let i = 0; i < cleanedTexts.length; i += batchSize) {
    const batch = cleanedTexts.slice(i, i + batchSize)

    try {
      // Update each text individually since we need to update by ID
      for (const textRecord of batch) {
        const { error } = await supabase
          .from('markov_texts')
          .update({
            text_content: textRecord.text_content,
            text_length: textRecord.text_length,
            metadata: textRecord.metadata,
          })
          .eq('id', textRecord.id)

        if (error) {
          console.error(
            `❌ Error updating text ${textRecord.id}:`,
            error.message
          )
        } else {
          updatedCount++
        }
      }
    } catch (error) {
      console.error(
        `❌ Error updating batch ${Math.floor(i / batchSize) + 1}:`,
        error.message
      )
    }

    if (i % 200 === 0) {
      console.log(`📤 Updated ${updatedCount}/${cleanedTexts.length} texts...`)
    }
  }

  console.log(
    `✅ Successfully cleaned ${updatedCount} texts with bad-words filter`
  )

  // Log bad words found
  console.log('\n🚫 Bad Words Found:')
  console.log('='.repeat(50))

  if (badWordsFound.size === 0) {
    console.log('✅ No bad words found in any texts!')
  } else {
    console.log(`📊 Total bad words found: ${totalBadWordsFound}`)
    console.log(`📝 Unique bad words: ${badWordsFound.size}`)
    console.log('\n📋 Breakdown:')

    // Sort by frequency (most common first)
    const sortedBadWords = Array.from(badWordsFound.entries()).sort(
      (a, b) => b[1].count - a[1].count
    )

    sortedBadWords.forEach(([word, data]) => {
      console.log(`\n• "${word}": ${data.count} occurrences`)
      if (data.examples.length > 0) {
        console.log('  Examples:')
        data.examples.forEach((example) => {
          console.log(`    "${example}"`)
        })
      }
    })
  }

  // Get final count
  const { count, error: countError } = await supabase
    .from('markov_texts')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ Error getting final count:', countError.message)
  } else {
    console.log(`\n🎉 Done! Total texts in database: ${count}`)
  }
}

cleanMarkovTextsWithBadWords().catch(console.error)
