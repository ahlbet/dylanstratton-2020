const fs = require('fs')
const path = require('path')

// Import Supabase for bucket access - only in Node.js environment
let createClient
if (typeof window === 'undefined') {
  try {
    const supabaseModule = require('@supabase/supabase-js')
    createClient = supabaseModule.createClient
  } catch (error) {
    console.warn('Supabase not available in this environment')
  }
}

class MarkovGenerator {
  constructor(order = 7) {
    this.order = order
    this.ngrams = {}
    this.beginnings = []
    this.lines = []
  }

  // Original file loading method (keeping for backwards compatibility)
  async loadTextFromFile(filePath) {
    try {
      const text = fs.readFileSync(filePath, 'utf8')
      this.lines = text.split('\n').filter((line) => line.trim().length > 0)
      this.buildNgrams()
      return true
    } catch (error) {
      console.error('Error loading text file:', error.message)
      return false
    }
  }

  // New method to load from Supabase markov-text bucket
  async loadTextFromSupabase(bucketName = 'markov-text') {
    if (!createClient || typeof window !== 'undefined') {
      console.warn('Supabase not available, falling back to local file')
      return this.loadTextFromFallback()
    }

    try {
      // Initialize Supabase client
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        console.warn('Missing Supabase credentials, falling back to local file')
        return this.loadTextFromFallback()
      }

      const supabase = createClient(supabaseUrl, supabaseKey)

      // List all txt files in the markov-text bucket
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list('', {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' },
        })

      if (listError) {
        console.error('Error listing files from Supabase:', listError.message)
        return this.loadTextFromFallback()
      }

      // Filter for .txt files
      const txtFiles = files.filter(
        (file) =>
          file.name.toLowerCase().endsWith('.txt') &&
          file.name !== '.emptyFolderPlaceholder'
      )

      if (txtFiles.length === 0) {
        console.warn(
          'No txt files found in markov-text bucket, falling back to local file'
        )
        return this.loadTextFromFallback()
      }

      console.log(`Found ${txtFiles.length} txt files in markov-text bucket`)

      // Download and compile all txt files
      const allTextContent = []

      for (const file of txtFiles) {
        try {
          const { data: fileData, error: downloadError } =
            await supabase.storage.from(bucketName).download(file.name)

          if (downloadError) {
            console.error(
              `Error downloading ${file.name}:`,
              downloadError.message
            )
            continue
          }

          // Convert blob to text
          const text = await fileData.text()
          if (text.trim()) {
            allTextContent.push(text)
            console.log(`Loaded ${file.name} (${text.length} characters)`)
          }
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error.message)
          continue
        }
      }

      if (allTextContent.length === 0) {
        console.warn('No valid text content found, falling back to local file')
        return this.loadTextFromFallback()
      }

      // Compile all text content
      const compiledText = this.compileAndCleanText(allTextContent)

      // Split into lines and build n-grams
      this.lines = compiledText
        .split('\n')
        .filter((line) => line.trim().length > 0)
      this.buildNgrams()

      console.log(
        `Successfully loaded and processed ${allTextContent.length} files with ${this.lines.length} lines`
      )
      return true
    } catch (error) {
      console.error('Error loading from Supabase:', error.message)
      return this.loadTextFromFallback()
    }
  }

  // Helper method to compile and clean multiple text sources
  compileAndCleanText(textArray) {
    // Join all texts with double newlines to separate sources
    let combinedText = textArray.join('\n\n')

    // Clean and normalize the text
    combinedText = combinedText
      // Remove stage directions in brackets/parentheses
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      // Remove all-caps words (character names like HAMLET, JULIET, etc.)
      .replace(/\b[A-Z]{2,}\b\.?/g, '')
      // Remove common play formatting artifacts
      .replace(/Act\s+[IVX]+/gi, '')
      .replace(/Scene\s+[IVX]+/gi, '')
      .replace(/Enter\s+/gi, '')
      .replace(/Exit\s+/gi, '')
      .replace(/Exeunt\s+/gi, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove multiple consecutive newlines, but preserve paragraph breaks
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      // Remove leading/trailing whitespace from lines
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n')
      // Remove any remaining multiple spaces
      .replace(/[ \t]+/g, ' ')
      // Ensure sentences end properly
      .replace(/([.!?])\s*([A-Z])/g, '$1\n$2')
      // Clean up any double spaces that might remain
      .replace(/\s{2,}/g, ' ')

    return combinedText
  }

  // Fallback to local file (backwards compatibility)
  async loadTextFromFallback() {
    const textFilePath = path.join(process.cwd(), 'static', '448.txt')
    return this.loadTextFromFile(textFilePath)
  }

  // Existing method for loading from array (unchanged)
  loadTextFromArray(textArray) {
    this.lines = textArray.filter((line) => line.trim().length > 0)
    this.buildNgrams()
  }

  buildNgrams() {
    this.ngrams = {}
    this.beginnings = []

    for (let j = 0; j < this.lines.length; j++) {
      let txt = this.lines[j]
      for (let i = 0; i <= txt.length - this.order; i++) {
        let gram = txt.substring(i, i + this.order)
        if (i == 0) {
          this.beginnings.push(gram)
        }

        if (!this.ngrams[gram]) {
          this.ngrams[gram] = []
        }
        this.ngrams[gram].push(txt.charAt(i + this.order))
      }
    }
  }

  generateText(maxLength = 1000, maxSentences = 2) {
    if (this.beginnings.length === 0) {
      return null
    }

    let currentGram =
      this.beginnings[Math.floor(Math.random() * this.beginnings.length)]
    let result = currentGram
    let sentenceCount = 0

    for (let i = 0; i < maxLength; i++) {
      let possibilities = this.ngrams[currentGram]
      if (!possibilities) {
        break
      }
      let next = possibilities[Math.floor(Math.random() * possibilities.length)]
      result += next

      // Count sentences (end with ., !, or ?)
      if (next.match(/[.!?]/)) {
        sentenceCount++
        // Stop after maxSentences complete sentences
        if (sentenceCount >= maxSentences) {
          break
        }
      }

      let len = result.length
      currentGram = result.substring(len - this.order, len)
    }

    return result
  }

  generateMultipleLines(count = 5, maxLength = 1000, maxSentences = 2) {
    const lines = []
    for (let i = 0; i < count; i++) {
      const generated = this.generateText(maxLength, maxSentences)
      if (generated) {
        lines.push(generated)
      }
    }
    return lines
  }
}

// Helper function to generate text for blog posts
async function generateBlogPostText(postName, linesCount = 5) {
  const generator = new MarkovGenerator(7)

  // Try to load from Supabase markov-text bucket first
  console.log('Loading Markov text from Supabase markov-text bucket...')
  const success = await generator.loadTextFromSupabase('markov-text')

  if (!success) {
    console.warn('Failed to load from Supabase, using fallback text')
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
    generator.loadTextFromArray(fallbackText)
  }

  const generatedLines = generator.generateMultipleLines(linesCount, 1000, 2)

  // Format the generated text for markdown
  const markdownText = generatedLines.map((line) => `> ${line}`).join('\n\n')

  return markdownText
}

module.exports = { MarkovGenerator, generateBlogPostText }
