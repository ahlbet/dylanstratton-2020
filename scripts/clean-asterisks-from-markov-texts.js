#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

async function cleanAsterisksFromMarkovTexts() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('🧹 Cleaning asterisks from existing Markov texts...')

  // Track asterisks found
  let totalAsterisksFound = 0
  let textsWithAsterisks = 0

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

  // Clean each text by removing asterisks
  console.log('🚫 Removing asterisks...')
  const cleanedTexts = existingTexts.map((textRecord, index) => {
    const originalText = textRecord.text_content
    const asteriskCount = (originalText.match(/\*/g) || []).length

    if (asteriskCount > 0) {
      totalAsterisksFound += asteriskCount
      textsWithAsterisks++
    }

    // Remove all asterisks and clean up whitespace
    let cleaned = originalText
      .replace(/\*/g, '') // Remove all asterisks
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s+\./g, '.') // Remove spaces before periods
      .replace(/\s+,/g, ',') // Remove spaces before commas
      .replace(/\s+!/g, '!') // Remove spaces before exclamation marks
      .replace(/\s+\?/g, '?') // Remove spaces before question marks
      .replace(/\s+:/g, ':') // Remove spaces before colons
      .replace(/\s+;/g, ';') // Remove spaces before semicolons
      .trim()

    return {
      id: textRecord.id,
      text_content: cleaned,
      text_length: cleaned.length,
      metadata: {
        ...textRecord.metadata,
        asterisks_removed: true,
        cleaned_at: new Date().toISOString(),
        original_length: originalText.length,
        asterisks_removed_count: asteriskCount,
      },
    }
  })

  console.log(`✅ Cleaned ${cleanedTexts.length} texts`)
  console.log(
    `📊 Found ${totalAsterisksFound} asterisks in ${textsWithAsterisks} texts`
  )

  // Update texts in batches
  console.log('💾 Updating texts in database...')
  const batchSize = 100
  let updatedCount = 0

  for (let i = 0; i < cleanedTexts.length; i += batchSize) {
    const batch = cleanedTexts.slice(i, i + batchSize)

    const { error: updateError } = await supabase
      .from('markov_texts')
      .upsert(batch, { onConflict: 'id' })

    if (updateError) {
      console.error(
        `❌ Error updating batch ${i / batchSize + 1}:`,
        updateError.message
      )
    } else {
      updatedCount += batch.length
      console.log(
        `✅ Updated batch ${i / batchSize + 1}: ${batch.length} texts`
      )
    }
  }

  console.log(`🎉 Successfully updated ${updatedCount} texts`)
  console.log(`📊 Summary:`)
  console.log(`   - Total texts processed: ${cleanedTexts.length}`)
  console.log(`   - Texts with asterisks: ${textsWithAsterisks}`)
  console.log(`   - Total asterisks removed: ${totalAsterisksFound}`)
  console.log(`   - Texts updated: ${updatedCount}`)

  console.log('\n✨ Asterisk removal completed!')
}

// Run the script
cleanAsterisksFromMarkovTexts().catch(console.error)
