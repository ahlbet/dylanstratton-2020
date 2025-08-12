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
    // Check for local development mode first
    if (typeof window !== 'undefined') {
      // Client-side: try Supabase first, fallback to local data
      try {
        // Try to fetch from Supabase bucket first
        const supabaseResponse = await fetch('/api/markov-text')
        if (supabaseResponse.ok) {
          const supabaseData = await supabaseResponse.json()
          if (supabaseData.texts && supabaseData.texts.length > 0) {
            this.lines = this.compileAndCleanText(supabaseData.texts)
            this.buildNgrams()
            console.log(`✅ Loaded ${this.lines.length} lines from Supabase`)
            return true
          }
        }
      } catch (error) {
        console.warn('Supabase fetch failed, trying local source...')
      }

      // Fallback to local data if Supabase fails
      try {
        const localPath = '/public/local-data/markov-source.txt'
        const response = await fetch(localPath)
        if (response.ok) {
          const text = await response.text()
          const textArray = text
            .split('\n')
            .filter((line) => line.trim().length > 0)
          this.lines = this.compileAndCleanText(textArray)
          this.buildNgrams()
          console.log(
            `✅ Loaded ${this.lines.length} lines from local source (fallback)`
          )
          return true
        }
      } catch (error) {
        console.warn('Local source also failed')
      }
    }

    // Node.js environment: try Supabase first, then fallback
    if (typeof window === 'undefined') {
      if (!supabaseUrl || !supabaseKey) {
        console.warn('Missing Supabase credentials, falling back to local file')
        return this.loadTextFromFallback()
      }

      // Try to load from Supabase directly
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
        const textArray = allText
          .split('\n')
          .filter((line) => line.trim().length > 0)

        this.lines = this.compileAndCleanText(textArray)
        this.buildNgrams()

        console.log(
          `✅ Loaded ${this.lines.length} lines from ${successfulDownloads} Supabase files`
        )
        return true
      } catch (error) {
        console.error('Error loading from Supabase:', error.message)
        return this.loadTextFromFallback()
      }
    }

    // Browser environment but no createClient: fallback to local file
    if (!createClient) {
      console.warn('Supabase not available, falling back to local file')
      return this.loadTextFromFallback()
    }
  }

  // Helper method to compile and clean multiple text sources, returns array of lines
  compileAndCleanText(textArray) {
    // Join all texts with double newlines to separate sources
    const combinedText = textArray.join('\n\n')

    // Clean and normalize the text - be much more conservative
    const cleanedText = combinedText
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
      // Remove stage directions in brackets/parentheses
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      // Remove common play formatting artifacts
      .replace(/^Act\s+[IVX]+/gim, '')
      .replace(/^Scene\s+[IVX]+/gim, '')
      .replace(/^Enter\s+/gim, '')
      .replace(/^Exit\s+/gim, '')
      .replace(/^Exeunt\s+/gim, '')
      // Remove excessive whitespace but preserve line breaks
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n') // Normalize line endings
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Remove excessive newlines
      .replace(/[ \t]+/g, ' ') // Normalize spaces

    // Split into lines and clean each line individually
    const lines = cleanedText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => line.length > 10) // Only keep lines with substantial content
      .filter((line) => !/^[A-Z\s]+$/.test(line)) // Remove lines that are just ALL CAPS (headers)
      .filter((line) => !/^[0-9]+\s/.test(line)) // Remove numbered lines (like "1 From fairest creatures...")
      .filter(
        (line) =>
          !line.match(
            /^(The|A|An)\s+[A-Z][a-z]+\s+(OF|THAT|AND|OR)\s+[A-Z][a-z]+/i
          )
      ) // Remove play titles like "THE TRAGEDY OF MACBETH"

    return lines
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
    const textFilePath = path.join(
      process.cwd(),
      'public',
      'local-data',
      '448.txt'
    )
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

  // Try to load from Supabase markov-text bucket first with explicit credentials
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  let success = false
  if (supabaseUrl && supabaseKey) {
    success = await generator.loadTextFromSupabaseWithCredentials(
      supabaseUrl,
      supabaseKey,
      'markov-text'
    )
  }

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
