#!/usr/bin/env node

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { MarkovGenerator } = require('../src/utils/markov-generator')

async function generateMarkovData() {
  console.log('🎲 Generating static markov data...')

  try {
    const generator = new MarkovGenerator(5)
    const success = await generator.loadTextFromSupabase('markov-text')

    if (!success) {
      console.error('❌ Failed to load markov text from Supabase')
      process.exit(1)
    }

    const textContent = generator.lines.join('\n')
    const data = {
      text: textContent,
      stats: {
        lines: generator.lines.length,
        characters: textContent.length,
        ngramsCount: Object.keys(generator.ngrams).length,
        beginningsCount: generator.beginnings.length,
      },
      generatedAt: new Date().toISOString(),
    }

    // Write to static directory
    const outputPath = path.join(__dirname, '../static/markov-data.json')
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))

    console.log(
      `✅ Generated markov data: ${data.stats.characters} characters, ${data.stats.lines} lines`
    )
    console.log(`📁 Saved to: ${outputPath}`)
  } catch (error) {
    console.error('❌ Error generating markov data:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  generateMarkovData()
}

module.exports = { generateMarkovData }
