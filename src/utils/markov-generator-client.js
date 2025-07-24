// Client-side Markov Generator for browser use
// This is a simplified version that doesn't use Node.js-specific modules

class MarkovGeneratorClient {
  constructor(order = 9) {
    this.order = order
    this.ngrams = {}
    this.beginnings = []
    this.lines = []
  }

  // Load text from API endpoint with caching
  async loadTextFromAPI() {
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

      const data = await response.json()

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
  loadFallbackText() {
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
  loadTextFromArray(textArray) {
    this.lines = textArray.filter((line) => line && line.trim().length > 0)
    this.buildNgrams()
  }

  // Load text from a string
  loadTextFromString(text) {
    if (!text || typeof text !== 'string') {
      console.warn('Invalid text input for MarkovGeneratorClient')
      return
    }

    // Apply the same cleaning logic as server-side
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    this.lines = lines
    this.buildNgrams()
  }

  // Clean and compile text from array
  compileAndCleanText(textArray) {
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
  buildNgrams() {
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
  generateText(maxLength = 500, maxSentences = 2) {
    if (this.beginnings.length === 0) {
      return ''
    }

    let result =
      this.beginnings[Math.floor(Math.random() * this.beginnings.length)]
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

    return result
  }

  // Generate multiple lines
  generateMultipleLines(count = 1, maxLength = 500, maxSentences = 2) {
    const lines = []
    for (let i = 0; i < count; i++) {
      lines.push(this.generateText(maxLength, maxSentences))
    }
    return lines
  }

  // Cache management
  getCachedCorpus(cacheKey, expiryHours) {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (!cached) {
        return null
      }

      const data = JSON.parse(cached)
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

  cacheCorpus(cacheKey, data) {
    try {
      const cacheData = {
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
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        return this.handleStorageQuotaExceeded(cacheKey, data)
      }
      console.error('Error caching corpus:', error)
      return false
    }
  }

  handleStorageQuotaExceeded(cacheKey, data) {
    try {
      // Try with reduced data (25% of original)
      const reducedText = data.text
        .split('\n')
        .filter((_, index) => index % 4 === 0) // Keep every 4th line
        .join('\n')

      const reducedData = {
        text: reducedText,
        stats: {
          ...data.stats,
          lines: Math.floor(data.stats.lines / 4),
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

  tryUltraReducedCache(cacheKey, data) {
    try {
      // Try with ultra-reduced data (10% of original)
      const ultraReducedText = data.text
        .split('\n')
        .filter((_, index) => index % 10 === 0) // Keep every 10th line
        .join('\n')

      const ultraReducedData = {
        text: ultraReducedText,
        stats: {
          ...data.stats,
          lines: Math.floor(data.stats.lines / 10),
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

  clearOldCacheEntries() {
    try {
      const keys = Object.keys(localStorage)
      const cacheKeys = keys.filter((key) => key.includes('cache'))

      for (const key of cacheKeys) {
        try {
          const data = JSON.parse(localStorage.getItem(key))
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

  logStorageUsage() {
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
