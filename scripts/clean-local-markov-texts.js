const fs = require('fs')
const path = require('path')
const Filter = require('bad-words')

const filter = new Filter()

// Function to clean text by removing bad words completely (whitespace)
function cleanText(text) {
  if (!text || typeof text !== 'string') {
    return text
  }

  // First apply the full text cleaning (removes Gutenberg headers, etc.)
  let cleaned = text
    // Remove Project Gutenberg headers and footers (including TM superscript)
    .replace(
      /^\*\*\* START OF (THE|THIS) PROJECT GUTENBERG EBOOK .* \*\*\*/gi,
      ''
    )
    .replace(
      /^\*\*\* END OF (THE|THIS) PROJECT GUTENBERG EBOOK .* \*\*\*/gi,
      ''
    )
    .replace(/Project Gutenberg™.*?www\.gutenberg\.org.*?$/gim, '')
    .replace(/Project Gutenberg.*?www\.gutenberg\.org.*?$/gim, '')
    .replace(/Project Gutenberg™.*?$/gim, '')
    .replace(/Project Gutenberg.*?$/gim, '')
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
    // Remove specific Gutenberg patterns with TM
    .replace(/Project Gutenberg™/gi, '')
    .replace(/Gutenberg™/gi, '')
    .replace(/™/g, '') // Remove any remaining TM symbols
    // Remove empty lines and normalize whitespace
    .replace(/\n\s*\n/g, '\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim()

  // Then filter out bad words completely (not replace with asterisks)
  const words = cleaned.split(/\s+/)
  const cleanedWords = words.filter((word) => {
    // Check if the word (case insensitive) is in the bad words list
    const lowerWord = word.toLowerCase().replace(/[^\w]/g, '') // Remove punctuation for checking
    return !filter.list.includes(lowerWord)
  })

  return cleanedWords.join(' ')
}

async function cleanLocalMarkovTexts() {
  try {
    console.log('🧹 Cleaning local Markov texts...')

    const dataPath = path.join(
      __dirname,
      '../public/local-data/markov-texts.json'
    )

    if (!fs.existsSync(dataPath)) {
      console.error('❌ Local Markov texts file not found:', dataPath)
      return
    }

    // Read the current data
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
    const { texts } = data

    if (!texts || !Array.isArray(texts)) {
      console.error('❌ Invalid data format in local Markov texts file')
      return
    }

    console.log(`📚 Found ${texts.length} texts to clean...`)

    let cleanedCount = 0
    let removedCount = 0

    // Clean each text
    const cleanedTexts = texts
      .map((item, index) => {
        const originalText = item.text_content
        const cleanedText = cleanText(originalText)

        if (cleanedText !== originalText) {
          cleanedCount++
          console.log(
            `🧹 Cleaned text ${index + 1}: "${originalText.substring(0, 50)}..." → "${cleanedText.substring(0, 50)}..."`
          )
        }

        // If text becomes too short after cleaning, remove it
        if (cleanedText.length < 20) {
          removedCount++
          console.log(
            `🗑️ Removed text ${index + 1} (too short after cleaning): "${cleanedText}"`
          )
          return null
        }

        return {
          ...item,
          text_content: cleanedText,
          text_length: cleanedText.length,
        }
      })
      .filter(Boolean) // Remove null entries

    // Save the cleaned data
    const cleanedData = {
      ...data,
      texts: cleanedTexts,
    }

    // Backup original file
    const backupPath = dataPath.replace('.json', '.backup.json')
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2))
    console.log(`💾 Backed up original file to: ${backupPath}`)

    // Save cleaned file
    fs.writeFileSync(dataPath, JSON.stringify(cleanedData, null, 2))

    console.log(`✅ Cleaning complete!`)
    console.log(`📊 Results:`)
    console.log(`   - Original texts: ${texts.length}`)
    console.log(`   - Cleaned texts: ${cleanedCount}`)
    console.log(`   - Removed texts: ${removedCount}`)
    console.log(`   - Final texts: ${cleanedTexts.length}`)
  } catch (error) {
    console.error('❌ Error cleaning local Markov texts:', error)
  }
}

// Run the script
cleanLocalMarkovTexts()
