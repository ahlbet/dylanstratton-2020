const { createClient } = require('@supabase/supabase-js')
const { MarkovGenerator } = require('../src/utils/markov-generator')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

async function generateMarkovTextsDB() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('🎲 Generating Markov text strings for database...')

  // First, load the full corpus and build ngrams
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
  generator.buildNgrams()
  console.log(
    `🔗 Built ${Object.keys(generator.ngrams).length.toLocaleString()} ngrams`
  )

  // Generate 1000 different text strings
  const numTexts = 1000
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
          },
        })
      }
    } catch (error) {
      console.error(`❌ Error generating text ${i + 1}:`, error.message)
    }

    if (i % 100 === 0) {
      console.log(`📝 Generated ${i + 1}/${numTexts} texts...`)
    }
  }

  console.log(`✅ Generated ${texts.length} valid texts`)

  // Insert texts into database in batches
  console.log('📦 Inserting texts into database...')

  const batchSize = 50
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

    if (i % 200 === 0) {
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

generateMarkovTextsDB().catch(console.error)
