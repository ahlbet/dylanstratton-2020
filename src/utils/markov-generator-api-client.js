class MarkovGeneratorAPIClient {
  constructor() {
    // Always use local data in development mode
    const isLocalDev = process.env.NODE_ENV === 'development'
    this.apiUrl = isLocalDev ? '/api/local-markov-text' : '/api/markov-text'
    this.textQueue = []
    this.isLoading = false
    this.isLocalMode = isLocalDev
  }

  async loadTextBatch(count = 20) {
    if (this.isLoading) {
      return this.textQueue.length
    }

    try {
      this.isLoading = true

      if (this.isLocalMode) {
        console.log('Loading local data')
        // In development mode, read directly from local JSON file
        const response = await fetch('/local-data/markov-texts.json')
        if (!response.ok) {
          throw new Error(`Failed to load local data: ${response.status}`)
        }

        const data = await response.json()
        if (data.texts && data.texts.length > 0) {
          // Get random texts from the local data
          const shuffled = [...data.texts].sort(() => 0.5 - Math.random())
          const selectedTexts = shuffled.slice(0, count)
          this.textQueue = selectedTexts.map((item) => item.text_content)
        }
      } else {
        // Production mode - use API
        const params = new URLSearchParams({ count: count.toString() })
        const response = await fetch(`${this.apiUrl}?${params}`)

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()
        if (data.error) {
          throw new Error(`API error: ${data.error}`)
        }

        if (data.texts && data.texts.length > 0) {
          this.textQueue = data.texts.map((item) => item.text)
        }
      }

      return this.textQueue.length
    } catch (error) {
      console.error('❌ Error loading text batch:', error)
      return 0
    } finally {
      this.isLoading = false
    }
  }

  getNextText() {
    if (this.textQueue.length === 0) {
      return null
    }
    return this.textQueue.shift()
  }

  getQueueLength() {
    return this.textQueue.length
  }

  async isAvailable() {
    // Cache the availability check to prevent repeated calls
    if (this._availabilityChecked !== undefined) {
      return this._availabilityChecked
    }

    try {
      if (this.isLocalMode) {
        // In development mode, check if local data file exists
        const response = await fetch('/local-data/markov-texts.json')
        this._availabilityChecked = response.ok
        return this._availabilityChecked
      } else {
        // Production mode - check API
        const response = await fetch(this.apiUrl)
        this._availabilityChecked = response.ok
        return this._availabilityChecked
      }
    } catch (error) {
      this._availabilityChecked = false
      return false
    }
  }
}

export default MarkovGeneratorAPIClient
