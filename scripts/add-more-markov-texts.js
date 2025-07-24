const { createClient } = require('@supabase/supabase-js')
const { MarkovGenerator } = require('../src/utils/markov-generator')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

// Clean text by removing Gutenberg headers, footers, and other metadata
function cleanText(text) {
  return (
    text
      // Remove Project Gutenberg headers and footers
      .replace(
        /^\*\*\* START OF (THE|THIS) PROJECT GUTENBERG EBOOK .* \*\*\*/gi,
        ''
      )
      .replace(
        /^\*\*\* END OF (THE|THIS) PROJECT GUTENBERG EBOOK .* \*\*\*/gi,
        ''
      )
      .replace(/Project Gutenberg.*?www\.gutenberg\.org.*?$/gim, '')
      .replace(/This eBook is for the use of anyone anywhere.*?$/gim, '')
      .replace(/Updated editions will.*?$/gim, '')
      .replace(/Creating the works from.*?$/gim, '')
      .replace(/The Foundation's EBook.*?$/gim, '')
      .replace(/EBook of .*?$/gim, '')
      .replace(/by .*?$/gim, '')
      .replace(/Transcriber's Note:.*?$/gim, '')
      .replace(/Produced by .*?$/gim, '')
      // Remove common metadata patterns
      .replace(/^Title:.*$/gim, '')
      .replace(/^Author:.*$/gim, '')
      .replace(/^Release Date:.*$/gim, '')
      .replace(/^Language:.*$/gim, '')
      .replace(/^Character set encoding:.*$/gim, '')
      .replace(/^\*\*\* START OF .* \*\*\*/gi, '')
      .replace(/^\*\*\* END OF .* \*\*\*/gi, '')
      // Remove empty lines and normalize whitespace
      .replace(/\n\s*\n/g, '\n')
      .replace(/^\s+|\s+$/gm, '')
      .trim()
  )
}

async function addMoreMarkovTexts() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('📈 Adding 10,000 more Markov texts...')

  // Load the full corpus and build ngrams with cleaning
  const generator = new MarkovGenerator(5)
  const success = await generator.loadTextFromSupabaseWithCredentials(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    'markov-text'
  )

  if (!success) {
    console.error('❌ Failed to load text from Supabase')
    return
  }

  console.log(`📚 Loaded ${generator.lines.length} lines of text`)

  // Clean the lines before building ngrams
  console.log('🧹 Cleaning text lines...')
  generator.lines = generator.lines
    .map((line) => cleanText(line))
    .filter((line) => line.length > 10) // Remove very short lines

  console.log(`📚 After cleaning: ${generator.lines.length} lines of text`)

  generator.buildNgrams()
  console.log(
    `🔗 Built ${Object.keys(generator.ngrams).length.toLocaleString()} ngrams`
  )

  // Generate 10,000 additional text strings
  const numTexts = 10000
  const texts = []

  for (let i = 0; i < numTexts; i++) {
    try {
      const text = generator.generateText(600, 2) // max 600 chars, 2 sentences
      if (text && text.length > 20) {
        // Only keep substantial texts
        texts.push({
          text_content: text,
          text_length: text.length,
          metadata: {
            generated_at: new Date().toISOString(),
            source: 'markov-generator',
            max_length: 600,
            max_sentences: 2,
            batch: 'additional-10k',
          },
        })
      }
    } catch (error) {
      console.error(`❌ Error generating text ${i + 1}:`, error.message)
    }

    if (i % 500 === 0) {
      console.log(`📝 Generated ${i + 1}/${numTexts} texts...`)
    }
  }

  console.log(`✅ Generated ${texts.length} valid texts`)

  // Insert texts into database in batches
  console.log('📦 Inserting additional texts into database...')

  const batchSize = 100 // Larger batches for efficiency
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)

    try {
      const { error } = await supabase.from('markov_texts').insert(batch)

      if (error) {
        console.error(
          `❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`,
          error.message
        )
      }
    } catch (error) {
      console.error(
        `❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`,
        error.message
      )
    }

    if (i % 1000 === 0) {
      console.log(`📤 Inserted ${i + batch.length}/${texts.length} texts...`)
    }
  }

  // Get final count
  const { count, error: countError } = await supabase
    .from('markov_texts')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ Error getting final count:', countError.message)
  } else {
    console.log(`🎉 Done! Total texts in database: ${count}`)
  }
}

addMoreMarkovTexts().catch(console.error)
