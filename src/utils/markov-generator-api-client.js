class MarkovGeneratorAPIClient {
  constructor() {
    this.apiUrl = '/api/markov-text'
    this.textQueue = []
    this.isLoading = false
  }

  async loadTextBatch(count = 20) {
    if (this.isLoading) {
      return this.textQueue.length
    }

    try {
      this.isLoading = true
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
    try {
      const response = await fetch(this.apiUrl)
      return response.ok
    } catch (error) {
      return false
    }
  }
}

export default MarkovGeneratorAPIClient
