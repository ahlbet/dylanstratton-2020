const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { execSync } = require('child_process')
const { createClient } = require('@supabase/supabase-js')
const { MarkovGenerator } = require('../src/utils/markov-generator')
const { cleanText } = require('../src/utils/text-cleaner')
const { getCoherencyLevel } = require('../src/utils/coherency-level-utils')
require('dotenv').config()

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Helper function to prompt user for input
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

// Helper function to display text in a formatted way
const displayText = (text, title) => {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`${title}`)
  console.log(`${'='.repeat(60)}`)
  console.log(text)
  console.log(`${'='.repeat(60)}\n`)
}

// Helper function to edit text interactively
const editText = async (originalText, textNumber) => {
  displayText(originalText, `Original Markov Text #${textNumber}`)

  const editChoice = await askQuestion(
    `Do you want to edit this text? (y/n, or 'r' to regenerate): `
  )

  if (editChoice.toLowerCase() === 'r') {
    return 'REGENERATE'
  }

  if (editChoice.toLowerCase() !== 'y') {
    return originalText
  }

  console.log('\nEnter your edited text (press Enter twice to finish):')
  console.log(
    '(Type "skip" to keep original, "regenerate" to generate new text)'
  )

  const lines = []
  let lineNumber = 1

  while (true) {
    const line = await askQuestion(`Line ${lineNumber}: `)

    if (line === '') {
      if (lines.length > 0) break
      continue
    }

    if (line.toLowerCase() === 'skip') {
      return originalText
    }

    if (line.toLowerCase() === 'regenerate') {
      return 'REGENERATE'
    }

    lines.push(line)
    lineNumber++
  }

  return lines.join('\n')
}

// Main dry-run function
const main = async () => {
  const name = process.argv[2]

  if (!name) {
    console.error('Usage: node scripts/init-dry-run.js <post-name>')
    console.error('Example: node scripts/init-dry-run.js 25jan15')
    process.exit(1)
  }

  console.log(`🚀 DRY RUN: Creating blog post "${name}"`)
  console.log('This will generate 5 markov texts for interactive editing')
  console.log('No files will be created or uploaded to Supabase\n')

  // Fetch markov texts from Supabase ONCE at the beginning
  console.log('📥 Fetching markov texts from Supabase...')
  let markovGenerator = null
  try {
    markovGenerator = new MarkovGenerator(7)

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const success = await markovGenerator.loadTextFromSupabaseWithCredentials(
        supabaseUrl,
        supabaseKey,
        'markov-text'
      )
      if (success) {
        console.log('✅ Successfully loaded markov texts from Supabase')
      } else {
        console.warn('⚠️ Failed to load from Supabase, using fallback text')
        // Fallback to sample text if Supabase fails
        const fallbackText = [
          'The quick brown fox jumps over the lazy dog.',
          'A journey of a thousand miles begins with a single step.',
          'All that glitters is not gold.',
          'Actions speak louder than words.',
          'Beauty is in the eye of the beholder.',
          'Every cloud has a silver lining.',
          'Time heals all wounds.',
          'Actions speak louder than words.',
          'The early bird catches the worm.',
          "Don't judge a book by its cover.",
        ]
        markovGenerator.loadTextFromArray(fallbackText)
      }
    } else {
      console.warn('⚠️ Missing Supabase credentials, using fallback text')
      const fallbackText = [
        'The quick brown fox jumps over the lazy dog.',
        'A journey of a thousand miles begins with a single step.',
        'All that glitters is not gold.',
        'Actions speak louder than words.',
        'Beauty is in the eye of the beholder.',
        'Every cloud has a silver lining.',
        'Time heals all wounds.',
        'Actions speak louder than words.',
        'The early bird catches the worm.',
        "Don't judge a book by its cover.",
      ]
      markovGenerator.loadTextFromArray(fallbackText)
    }
  } catch (error) {
    console.error('❌ Failed to initialize markov generator:', error.message)
    // Use fallback text as last resort
    const fallbackText = [
      'The quick brown fox jumps over the lazy dog.',
      'A journey of a thousand miles begins with a single step.',
      'All that glitters is not gold.',
      'Actions speak louder than words.',
      'Beauty is in the eye of the beholder.',
      'Every cloud has a silver lining.',
      'Time heals all wounds.',
      'Actions speak louder than words.',
      'The early bird catches the worm.',
      "Don't judge a book by its cover.",
    ]
    markovGenerator.loadTextFromArray(fallbackText)
  }

  // Generate 5 markov texts using the pre-loaded generator
  console.log('📝 Generating 5 markov texts...')
  const markovTexts = []
  let attempts = 0
  const maxAttempts = 15 // Allow up to 3 attempts per text

  for (let i = 0; i < 5; i++) {
    let text = null
    let attemptCount = 0

    while (!text && attemptCount < 3) {
      try {
        // Use the pre-loaded generator instead of calling generateBlogPostText
        const generatedLines = markovGenerator.generateMultipleLines(1, 1000, 2)
        if (generatedLines.length > 0) {
          text = generatedLines[0]
        }

        if (text && text.length > 10) {
          break
        }
      } catch (error) {
        console.error(`Error generating text ${i + 1}:`, error.message)
      }
      attemptCount++
    }

    if (!text) {
      text = `Generated text ${i + 1} could not be created.`
    }

    markovTexts.push(text)
  }

  console.log(`✅ Generated ${markovTexts.length} initial texts\n`)

  // Interactive editing
  const editedTexts = []
  const coherencyLevels = []
  for (let i = 0; i < markovTexts.length; i++) {
    let currentText = markovTexts[i]
    let needsRegeneration = false

    do {
      needsRegeneration = false
      const editedText = await editText(currentText, i + 1)

      if (editedText === 'REGENERATE') {
        try {
          // Use the pre-loaded generator instead of calling generateBlogPostText
          const generatedLines = markovGenerator.generateMultipleLines(
            1,
            1000,
            2
          )
          if (generatedLines.length > 0) {
            currentText = generatedLines[0]
          } else {
            currentText = `Generated text ${i + 1} could not be created.`
          }
          needsRegeneration = true
          console.log(`🔄 Regenerated text ${i + 1}`)
        } catch (error) {
          console.error(`Error regenerating text ${i + 1}:`, error.message)
          currentText = `Generated text ${i + 1} could not be created.`
        }
      } else {
        currentText = editedText
      }
    } while (needsRegeneration)

    // Get coherency level for this text
    const coherencyLevel = await getCoherencyLevel(askQuestion, i + 1)
    coherencyLevels.push(coherencyLevel)

    editedTexts.push(currentText)
    console.log(
      `✅ Text ${i + 1} finalized with coherency level ${coherencyLevel}\n`
    )
  }

  // Format for markdown
  const markdownText = editedTexts.map((text) => `> ${text}`).join('\n\n')

  // Show what would be uploaded to Supabase
  console.log('📊 WHAT WOULD BE UPLOADED TO SUPABASE:')
  console.log('='.repeat(60))

  const supabaseTexts = editedTexts.map((text, index) => ({
    text_content: text,
    text_length: text.length,
    coherency_level: coherencyLevels[index],
    metadata: {
      generated_at: new Date().toISOString(),
      source: 'markov-generator',
      post_name: name,
      text_number: index + 1,
      edited_by_user: true,
      cleaned_with_bad_words_filter: true,
    },
  }))

  console.log(
    `Would upload ${supabaseTexts.length} texts to markov_texts table:`
  )
  supabaseTexts.forEach((textRecord, index) => {
    console.log(`\nText ${index + 1}:`)
    console.log(`  Length: ${textRecord.text_length} characters`)
    console.log(`  Coherency Level: ${textRecord.coherency_level}/100`)
    console.log(
      `  Content: "${textRecord.text_content.substring(0, 100)}${textRecord.text_content.length > 100 ? '...' : ''}"`
    )
    console.log(`  Metadata: ${JSON.stringify(textRecord.metadata, null, 2)}`)
  })

  // Show what would be added to markdown
  console.log('\n📝 WHAT WOULD BE ADDED TO MARKDOWN:')
  console.log('='.repeat(60))
  displayText(markdownText, 'Markov Text Blockquotes')

  // Show what the final markdown file would look like
  console.log('📄 WHAT THE FINAL MARKDOWN FILE WOULD LOOK LIKE:')
  console.log('='.repeat(60))

  const template = fs.readFileSync(
    path.join(__dirname, '../src/template.md'),
    'utf8'
  )
  const date = new Date().toISOString().split('T')[0]

  const finalMarkdown = template
    .replace(/\{name\}/g, name)
    .replace(/\{date\}/g, date)
    .replace(/\{audio_files\}/g, '<!-- Audio files would be added here -->')
    .replace(/\{cover_art\}/g, '<!-- Cover art would be added here -->')
    .replace(/\{markov_text\}/g, markdownText)

  console.log(finalMarkdown)

  // Ask if user wants to proceed with actual creation
  console.log('\n🤔 DRY RUN COMPLETE')
  console.log('='.repeat(60))

  const proceed = await askQuestion(
    'Do you want to proceed with actual creation? (y/n): '
  )

  if (proceed.toLowerCase() === 'y') {
    console.log('\n🚀 Proceeding with actual creation...')
    console.log('(This would create the files and upload to Supabase)')

    // Here you would call the actual init script or implement the creation logic
    console.log('✅ Would create:')
    console.log(`  - content/blog/${name}/${name}.md`)
    console.log(`  - Upload ${supabaseTexts.length} texts to Supabase`)
    console.log(`  - Commit and push to git`)
  } else {
    console.log('\n❌ Dry run completed. No files created.')
  }

  rl.close()
}

// Run the main function
main().catch((error) => {
  console.error('Script failed:', error.message)
  rl.close()
  process.exit(1)
})
