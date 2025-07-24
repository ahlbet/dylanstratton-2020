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

  // New method to load from Supabase markov-text bucket with explicit credentials
  async loadTextFromSupabaseWithCredentials(
    supabaseUrl,
    supabaseKey,
    bucketName = 'markov-text'
  ) {
    if (!createClient || typeof window !== 'undefined') {
      console.warn('Supabase not available, falling back to local file')
      return this.loadTextFromFallback()
    }

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        'Missing Supabase credentials passed directly, falling back to local file'
      )
      return this.loadTextFromFallback()
    }

    try {
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

      // Download and combine all txt files
      let allText = ''
      let successfulDownloads = 0

      for (const file of txtFiles) {
        try {
          const { data, error } = await supabase.storage
            .from(bucketName)
            .download(file.name)

          if (error) {
            console.error(`Error downloading ${file.name}:`, error.message)
            continue
          }

          const text = await data.text()
          allText += text + '\n'
          successfulDownloads++
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error.message)
        }
      }

      if (successfulDownloads === 0) {
        console.warn(
          'No files successfully downloaded, falling back to local file'
        )
        return this.loadTextFromFallback()
      }

      // Process the combined text
      this.lines = allText.split('\n').filter((line) => line.trim().length > 0)
      this.buildNgrams()

      return true
    } catch (error) {
      console.error(
        'Error in loadTextFromSupabaseWithCredentials:',
        error.message
      )
      return this.loadTextFromFallback()
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

          const text = await fileData.text()
          allTextContent.push(text)
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error.message)
        }
      }

      if (allTextContent.length === 0) {
        console.warn(
          'No files successfully downloaded, falling back to local file'
        )
        return this.loadTextFromFallback()
      }

      // Process the combined text
      this.lines = this.compileAndCleanText(allTextContent)
      this.buildNgrams()

      return true
    } catch (error) {
      console.error('Error in loadTextFromSupabase:', error.message)
      return this.loadTextFromFallback()
    }
  }

  // Helper method to compile and clean multiple text sources
  compileAndCleanText(textArray) {
    // Join all texts with double newlines to separate sources
    let combinedText = textArray.join('\n\n')

    // Clean and normalize the text
    combinedText = combinedText
      // Remove Gutenberg header and metadata
      .replace(
        /The Project Gutenberg eBook.*?START OF THE PROJECT GUTENBERG EBOOK.*?by William Shakespeare\s*/gs,
        ''
      )
      .replace(/Title:.*?Language: English\s*/gs, '')
      .replace(/Release date:.*?Language: English\s*/gs, '')
      .replace(/Most recently updated:.*?Language: English\s*/gs, '')
      .replace(/Contents\s*/gi, '')
      .replace(/THE SONNETS\s*/gi, '')
      // Remove play titles and headers
      .replace(/ALL'S WELL THAT ENDS WELL\s*/gi, '')
      .replace(/THE TRAGEDY OF MACBETH\s*/gi, '')
      .replace(/THE COMEDY OF ERRORS\s*/gi, '')
      .replace(/HAMLET, PRINCE OF DENMARK\s*/gi, '')
      .replace(/ROMEO AND JULIET\s*/gi, '')
      .replace(/A MIDSUMMER NIGHT'S DREAM\s*/gi, '')
      .replace(/THE MERCHANT OF VENICE\s*/gi, '')
      .replace(/MUCH ADO ABOUT NOTHING\s*/gi, '')
      .replace(/AS YOU LIKE IT\s*/gi, '')
      .replace(/TWELFTH NIGHT\s*/gi, '')
      .replace(/THE TAMING OF THE SHREW\s*/gi, '')
      .replace(/KING LEAR\s*/gi, '')
      .replace(/OTHELLO\s*/gi, '')
      .replace(/JULIUS CAESAR\s*/gi, '')
      .replace(/ANTONY AND CLEOPATRA\s*/gi, '')
      .replace(/CORIOLANUS\s*/gi, '')
      .replace(/TITUS ANDRONICUS\s*/gi, '')
      .replace(/PERICLES\s*/gi, '')
      .replace(/CYMBELINE\s*/gi, '')
      .replace(/THE WINTER'S TALE\s*/gi, '')
      .replace(/THE TEMPEST\s*/gi, '')
      .replace(/HENRY IV\s*/gi, '')
      .replace(/HENRY V\s*/gi, '')
      .replace(/HENRY VI\s*/gi, '')
      .replace(/HENRY VIII\s*/gi, '')
      .replace(/RICHARD II\s*/gi, '')
      .replace(/RICHARD III\s*/gi, '')
      .replace(/KING JOHN\s*/gi, '')
      .replace(/MEASURE FOR MEASURE\s*/gi, '')
      .replace(/TROILUS AND CRESSIDA\s*/gi, '')
      .replace(/TIMON OF ATHENS\s*/gi, '')
      .replace(/LOVE'S LABOUR'S LOST\s*/gi, '')
      .replace(/THE TWO GENTLEMEN OF VERONA\s*/gi, '')
      .replace(/THE MERRY WIVES OF WINDSOR\s*/gi, '')
      .replace(/THE LIFE AND DEATH OF KING JOHN\s*/gi, '')
      .replace(/THE FIRST PART OF KING HENRY IV\s*/gi, '')
      .replace(/THE SECOND PART OF KING HENRY IV\s*/gi, '')
      .replace(/THE LIFE OF KING HENRY V\s*/gi, '')
      .replace(/THE FIRST PART OF KING HENRY VI\s*/gi, '')
      .replace(/THE SECOND PART OF KING HENRY VI\s*/gi, '')
      .replace(/THE THIRD PART OF KING HENRY VI\s*/gi, '')
      .replace(/THE LIFE AND DEATH OF RICHARD III\s*/gi, '')
      .replace(/THE LIFE OF KING HENRY VIII\s*/gi, '')
      .replace(/THE TRAGEDY OF\s*/gi, '')
      .replace(/THE COMEDY OF\s*/gi, '')
      .replace(/THE HISTORY OF\s*/gi, '')
      // Remove stage directions in brackets/parentheses
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
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

  // Clean generated text to remove character names and formatting artifacts
  cleanGeneratedText(text) {
    if (!text) return text

    let cleaned = text
      // Remove stage directions in brackets/parentheses
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      // Remove common play formatting artifacts
      .replace(/Act\s+[IVX]+/gi, '')
      .replace(/Scene\s+[IVX]+/gi, '')
      .replace(/Enter\s+/gi, '')
      .replace(/Exit\s+/gi, '')
      .replace(/Exeunt\s+/gi, '')
      // Remove formatting artifacts like underscores and brackets
      .replace(/[_\[\]]/g, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      .trim()

    // If cleaning resulted in empty or very short text, return the original
    if (!cleaned || cleaned.length < 10) {
      return text
    }

    return cleaned
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
    let attempts = 0
    const maxAttempts = count * 3 // Allow more attempts to get good lines

    while (lines.length < count && attempts < maxAttempts) {
      const generated = this.generateText(maxLength, maxSentences)
      if (generated) {
        // Additional filtering for character names and short lines
        const cleaned = this.cleanGeneratedText(generated)
        if (
          cleaned &&
          cleaned.length > 15 &&
          !this.containsOnlyCharacterName(cleaned)
        ) {
          lines.push(cleaned)
        }
      }
      attempts++
    }
    return lines
  }

  // Check if text contains only a character name or is problematic
  containsOnlyCharacterName(text) {
    const trimmed = text.trim()

    // Check if text is just numbers
    if (/^\d+$/.test(trimmed)) return true

    // Check if text is too short (less than 3 words)
    const words = trimmed.split(/\s+/).filter((word) => word.length > 0)
    if (words.length < 3) return true

    // Check if text has excessive formatting artifacts
    if (trimmed.includes('_') || trimmed.includes('[') || trimmed.includes(']'))
      return true

    // Check if text is mostly whitespace
    if (trimmed.length < 10) return true

    return false
  }
}

// Helper function to generate text for blog posts
async function generateBlogPostText(postName, linesCount = 5) {
  const generator = new MarkovGenerator(7)

  // Try to load from Supabase markov-text bucket first
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
