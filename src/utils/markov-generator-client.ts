// Client-side Markov Generator for browser use
// This is a simplified version that doesn't use Node.js-specific modules

// Define types for cache data
interface CacheData {
  text: string
  stats?: {
    lines: number
    characters: number
  }
  timestamp: number
}

// Define types for API response
interface APIResponse {
  text: string
  stats?: {
    lines: number
    characters: number
  }
}

class MarkovGeneratorClient {
  private order: number
  private ngrams: Record<string, string[]>
  private beginnings: string[]
  private lines: string[]
  private recentBeginnings: string[] // Track recently used beginnings
  private maxRecentBeginnings: number // Keep track of last 5 used

  constructor(order = 9) {
    this.order = order
    this.ngrams = {}
    this.beginnings = []
    this.lines = []
    this.recentBeginnings = [] // Track recently used beginnings
    this.maxRecentBeginnings = 5 // Keep track of last 5 used
  }

  // Load text from API endpoint with caching
  async loadTextFromAPI(): Promise<boolean> {
    try {
      // Check cache first
      const cacheKey = 'markov-corpus-cache'
      const cacheExpiryHours = 24 // Cache for 24 hours

      const cached = this.getCachedCorpus(cacheKey, cacheExpiryHours)
      if (cached) {
        this.loadTextFromString(cached.text)
        return true
      }

      const response = await fetch('/api/markov-text')

      if (!response.ok) {
        const errorText = await response.text()
        console.error('⚠️ API request failed:', response.status, errorText)
        return this.loadFallbackText()
      }

      const data: APIResponse = await response.json()

      if (!data.text || data.text.length < 100) {
        console.warn('⚠️ No substantial text from API, using fallback')
        return this.loadFallbackText()
      }

      // Cache the response
      const cacheSuccess = this.cacheCorpus(cacheKey, data)

      // Load the text regardless of cache success
      this.loadTextFromString(data.text)

      // Log cache status for debugging
      if (!cacheSuccess) {
        console.warn('Failed to cache corpus, but text loaded successfully')
      }

      return true
    } catch (error) {
      console.error('❌ Error fetching from API:', error)
      return this.loadFallbackText()
    }
  }

  // Fallback text for when Supabase fails
  loadFallbackText(): boolean {
    const fallbackText = [
      'The quick brown fox jumps over the lazy dog.',
      'A journey of a thousand miles begins with a single step.',
      'All that glitters is not gold.',
      'Actions speak louder than words.',
      'Beauty is in the eye of the beholder.',
      'Every cloud has a silver lining.',
      'Time heals all wounds.',
      'The early bird catches the worm.',
      "Don't judge a book by its cover.",
      'When life gives you lemons, make lemonade.',
      "Rome wasn't built in a day.",
      'The pen is mightier than the sword.',
      "Where there's a will, there's a way.",
      'Practice makes perfect.',
      'Better late than never.',
    ]
    this.loadTextFromArray(fallbackText)
    return true
  }

  // Load text from an array of strings
  loadTextFromArray(textArray: string[]): void {
    this.lines = textArray.filter((line) => line && line.trim().length > 0)
    this.buildNgrams()
  }

  // Load text from a string
  loadTextFromString(text: string): void {
    if (!text || typeof text !== 'string') {
      console.warn('Invalid text input for MarkovGeneratorClient')
      return
    }

    // Apply the same comprehensive cleaning logic as server-side
    const cleanedText = this.cleanText(text)
    const lines = cleanedText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      // Filter out only the most problematic lines
      .filter((line) => {
        // Skip lines that are too short
        if (line.length < 5) return false
        // Skip lines that are just numbers
        if (/^\d+$/.test(line)) return false
        // Skip lines that are mostly punctuation
        if (/^[^a-zA-Z]*$/.test(line)) return false
        return true
      })

    this.lines = lines
    this.buildNgrams()
  }

  // Clean text to remove character names and formatting artifacts
  cleanText(text: string): string {
    if (!text) return text

    // Much more conservative cleaning - only remove obvious headers
    return (
      text
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
        // Remove only the most obvious headers (exact matches only)
        .replace(/^ALL'S WELL THAT ENDS WELL$/gim, '')
        .replace(/^THE TRAGEDY OF MACBETH$/gim, '')
        .replace(/^HAMLET, PRINCE OF DENMARK$/gim, '')
        .replace(/^ROMEO AND JULIET$/gim, '')
        .replace(/^A MIDSUMMER NIGHT'S DREAM$/gim, '')
        .replace(/^THE MERCHANT OF VENICE$/gim, '')
        .replace(/^MUCH ADO ABOUT NOTHING$/gim, '')
        .replace(/^AS YOU LIKE IT$/gim, '')
        .replace(/^TWELFTH NIGHT$/gim, '')
        .replace(/^KING LEAR$/gim, '')
        .replace(/^OTHELLO$/gim, '')
        .replace(/^JULIUS CAESAR$/gim, '')
        .replace(/^THE TEMPEST$/gim, '')
        .replace(/^HENRY IV$/gim, '')
        .replace(/^HENRY V$/gim, '')
        .replace(/^RICHARD II$/gim, '')
        .replace(/^RICHARD III$/gim, '')
        .replace(/^KING JOHN$/gim, '')
        // Remove stage directions in brackets/parentheses
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        // Remove only obvious formatting artifacts
        .replace(/^Act\s+[IVX]+$/gim, '')
        .replace(/^Scene\s+[IVX]+$/gim, '')
        .replace(/^Enter\s+/gim, '')
        .replace(/^Exit\s+/gim, '')
        .replace(/^Exeunt\s+/gim, '')
        // Remove excessive whitespace but preserve line breaks
        .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
        .replace(/\n\s*\n\s*\n+/g, '\n\n') // Replace multiple newlines with double newlines
        .trim()
    )
  }

  // Clean and compile text from array
  compileAndCleanText(textArray: string[]): string[] {
    if (!Array.isArray(textArray)) {
      console.warn('Invalid textArray input for compileAndCleanText')
      return []
    }

    return textArray
      .filter((line) => line && typeof line === 'string')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  }

  // Build n-grams from loaded text
  buildNgrams(): void {
    this.ngrams = {}
    this.beginnings = []

    for (let line of this.lines) {
      if (line.length < this.order) continue

      // Add beginning
      this.beginnings.push(line.substring(0, this.order))

      // Build n-grams
      for (let i = 0; i <= line.length - this.order; i++) {
        let gram = line.substring(i, i + this.order)
        if (!this.ngrams[gram]) {
          this.ngrams[gram] = []
        }
        if (i + this.order < line.length) {
          this.ngrams[gram].push(line.charAt(i + this.order))
        }
      }
    }
  }

  // Generate text using Markov chain
  generateText(maxLength = 500, maxSentences = 2): string {
    if (this.beginnings.length === 0) {
      return ''
    }

    // Try multiple random beginnings to get variety
    let result = ''
    let attempts = 0
    const maxAttempts = 20

    while (attempts < maxAttempts) {
      const randomIndex = Math.floor(Math.random() * this.beginnings.length)
      const beginning = this.beginnings[randomIndex]

      // Skip if this beginning is too short or problematic
      if (
        beginning.length < 5 ||
        beginning.includes('_') ||
        beginning.includes('[')
      ) {
        attempts++
        continue
      }

      // Skip if we've used this beginning recently
      if (this.recentBeginnings.includes(beginning)) {
        attempts++
        continue
      }

      result = beginning
      break
    }

    // If we couldn't find a good beginning, use any available one
    if (!result && this.beginnings.length > 0) {
      result =
        this.beginnings[Math.floor(Math.random() * this.beginnings.length)]
    }

    let sentenceCount = 0

    for (let i = 0; i < maxLength; i++) {
      let currentGram = result.substring(result.length - this.order)
      let possibilities = this.ngrams[currentGram]

      if (!possibilities || possibilities.length === 0) {
        break
      }

      let next = possibilities[Math.floor(Math.random() * possibilities.length)]
      result += next

      // Count sentences
      if (next === '.' || next === '!' || next === '?') {
        sentenceCount++
        if (sentenceCount >= maxSentences) {
          break
        }
      }
    }

    // Clean the generated text
    result = this.cleanGeneratedText(result)

    // Track this beginning to avoid repetition
    if (result && this.recentBeginnings.length >= this.maxRecentBeginnings) {
      this.recentBeginnings.shift() // Remove oldest
    }
    this.recentBeginnings.push(result.substring(0, this.order))

    return result
  }

  // Clean generated text to remove character names and formatting artifacts
  cleanGeneratedText(text: string): string {
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

  // Generate multiple lines
  generateMultipleLines(count = 1, maxLength = 500, maxSentences = 2): string[] {
    const lines: string[] = []
    let attempts = 0
    const maxAttempts = count * 10 // Allow more attempts to get good lines

    while (lines.length < count && attempts < maxAttempts) {
      const line = this.generateText(maxLength, maxSentences)

      // Filter out problematic lines
      if (line && line.length > 20 && !this.containsOnlyCharacterName(line)) {
        lines.push(line)
      }

      attempts++
    }

    return lines
  }

  // Check if text contains only a character name or is problematic
  containsOnlyCharacterName(text: string): boolean {
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

  // Cache management
  getCachedCorpus(cacheKey: string, expiryHours: number): CacheData | null {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (!cached) {
        return null
      }

      const data: CacheData = JSON.parse(cached)
      const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60)

      if (ageHours > expiryHours) {
        localStorage.removeItem(cacheKey)
        return null
      }

      return data
    } catch (error) {
      console.error('Error reading cache:', error)
      return null
    }
  }

  cacheCorpus(cacheKey: string, data: APIResponse): boolean {
    try {
      const cacheData: CacheData = {
        text: data.text,
        stats: data.stats,
        timestamp: Date.now(),
      }

      const cacheSizeMB =
        new Blob([JSON.stringify(cacheData)]).size / (1024 * 1024)

      if (cacheSizeMB > 5) {
        console.warn('Cache too large, attempting to reduce...')
        return this.handleStorageQuotaExceeded(cacheKey, data)
      }

      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      return true
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        return this.handleStorageQuotaExceeded(cacheKey, data)
      }
      console.error('Error caching corpus:', error)
      return false
    }
  }

  handleStorageQuotaExceeded(cacheKey: string, data: APIResponse): boolean {
    try {
      // Try with reduced data (25% of original)
      const reducedText = data.text
        .split('\n')
        .filter((_, index) => index % 4 === 0) // Keep every 4th line
        .join('\n')

      const reducedData: CacheData = {
        text: reducedText,
        stats: {
          ...data.stats,
          lines: Math.floor((data.stats?.lines || 0) / 4),
          characters: reducedText.length,
        },
        timestamp: Date.now(),
      }

      const reducedSizeMB =
        new Blob([JSON.stringify(reducedData)]).size / (1024 * 1024)

      if (reducedSizeMB <= 5) {
        localStorage.setItem(cacheKey, JSON.stringify(reducedData))
        return true
      }

      return this.tryUltraReducedCache(cacheKey, data)
    } catch (error) {
      console.error('Error handling storage quota exceeded:', error)
      return false
    }
  }

  tryUltraReducedCache(cacheKey: string, data: APIResponse): boolean {
    try {
      // Try with ultra-reduced data (10% of original)
      const ultraReducedText = data.text
        .split('\n')
        .filter((_, index) => index % 10 === 0) // Keep every 10th line
        .join('\n')

      const ultraReducedData: CacheData = {
        text: ultraReducedText,
        stats: {
          ...data.stats,
          lines: Math.floor((data.stats?.lines || 0) / 10),
          characters: ultraReducedText.length,
        },
        timestamp: Date.now(),
      }

      const ultraReducedSizeMB =
        new Blob([JSON.stringify(ultraReducedData)]).size / (1024 * 1024)

      if (ultraReducedSizeMB <= 5) {
        localStorage.setItem(cacheKey, JSON.stringify(ultraReducedData))
        return true
      }

      // If still too large, clear old entries and try again
      this.clearOldCacheEntries()

      try {
        localStorage.setItem(cacheKey, JSON.stringify(ultraReducedData))
        return true
      } catch (finalError) {
        console.error('Failed to cache even ultra-reduced data:', finalError)
        return false
      }
    } catch (error) {
      console.error('Error trying ultra-reduced cache:', error)
      return false
    }
  }

  clearOldCacheEntries(): void {
    try {
      const keys = Object.keys(localStorage)
      const cacheKeys = keys.filter((key) => key.includes('cache'))

      for (const key of cacheKeys) {
        try {
          const data: CacheData = JSON.parse(localStorage.getItem(key) || '{}')
          const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60)

          if (ageHours > 24) {
            localStorage.removeItem(key)
          }
        } catch (error) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.error('Error clearing old cache entries:', error)
    }
  }

  logStorageUsage(): void {
    try {
      let totalSize = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length
        }
      }
      const totalSizeMB = totalSize / (1024 * 1024)
      console.log(`📊 Total localStorage usage: ${totalSizeMB.toFixed(2)}MB`)
    } catch (error) {
      console.log('📊 Could not calculate storage usage')
    }
  }
}

export default MarkovGeneratorClient
