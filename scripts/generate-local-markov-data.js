const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

// Import the Markov generator
const { MarkovGenerator } = require('../src/utils/markov-generator')

async function generateLocalMarkovData() {
  console.log('🎲 Generating local Markov data for development...')

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Generate Markov texts (similar to the database)
    console.log('📝 Generating Markov texts...')
    const generator = new MarkovGenerator(5)

    // Load text from Supabase storage
    const success = await generator.loadTextFromSupabaseWithCredentials(
      supabaseUrl,
      supabaseKey,
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
          texts.push({
            id: i + 1,
            text_content: text,
            text_length: text.length,
            created_at: new Date().toISOString(),
            metadata: {
              generated_at: new Date().toISOString(),
              source: 'local-markov-generator',
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

    // 2. Save Markov texts to local JSON file
    const markovTextsPath = path.join(
      __dirname,
      '../static/local-data/markov-texts.json'
    )
    // Ensure directory exists
    const markovTextsDir = path.dirname(markovTextsPath)
    if (!fs.existsSync(markovTextsDir)) {
      fs.mkdirSync(markovTextsDir, { recursive: true })
      console.log(`📁 Created directory: ${markovTextsDir}`)
    }
    fs.writeFileSync(markovTextsPath, JSON.stringify({ texts }, null, 2))
    console.log(`💾 Saved Markov texts to: ${markovTextsPath}`)

    // 3. Save the source text for local use
    const markovSourcePath = path.join(
      __dirname,
      '../static/local-data/markov-source.txt'
    )
    // generator.lines should be an array after compileAndCleanText
    const sourceText = Array.isArray(generator.lines)
      ? generator.lines.join('\n')
      : generator.lines
    fs.writeFileSync(markovSourcePath, sourceText)
    console.log(`💾 Saved source text to: ${markovSourcePath}`)

    // 4. Generate cover art for all existing blog posts
    console.log('🎨 Generating cover art for all blog posts...')
    const { generateCoverArt } = require('../src/utils/cover-art-generator')

    // Get all blog post directories dynamically
    const blogContentDir = path.join(__dirname, '../content/blog')
    const blogPostDirs = fs
      .readdirSync(blogContentDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .sort() // Sort alphabetically for consistent ordering

    console.log(
      `📚 Found ${blogPostDirs.length} blog posts to generate cover art for`
    )

    // Ensure cover art directory exists
    const coverArtDir = path.join(__dirname, '../static/local-cover-art')
    if (!fs.existsSync(coverArtDir)) {
      fs.mkdirSync(coverArtDir, { recursive: true })
      console.log(`📁 Created directory: ${coverArtDir}`)
    }

    for (const postName of blogPostDirs) {
      try {
        const coverArtBuffer = await generateCoverArt(postName)
        const coverArtPath = path.join(
          __dirname,
          `../static/local-cover-art/${postName}.png`
        )
        fs.writeFileSync(coverArtPath, coverArtBuffer)
        console.log(`🎨 Generated cover art for: ${postName}`)
      } catch (error) {
        console.error(
          `❌ Error generating cover art for ${postName}:`,
          error.message
        )
      }
    }

    console.log('🎉 Local development data generation complete!')
    console.log('\n📋 To use local data in development:')
    console.log('1. Set USE_LOCAL_DATA=true in your .env file')
    console.log(
      '2. Set LOCAL_FALLBACK_TO_SUPABASE=true if you want fallback to Supabase'
    )
    console.log('3. Restart your development server')
  } catch (error) {
    console.error('❌ Error generating local data:', error)
  }
}

generateLocalMarkovData().catch(console.error)
