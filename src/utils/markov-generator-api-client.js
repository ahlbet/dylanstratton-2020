class MarkovGeneratorAPIClient {
  constructor() {
    this.apiUrl = '/api/markov-text'
  }

  async generateText(maxLength = 600, maxSentences = 2) {
    try {
      const response = await fetch(this.apiUrl)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      const data = await response.json()
      if (data.error) {
        throw new Error(`API error: ${data.error}`)
      }
      return data.text || 'Unable to generate text at this time.'
    } catch (error) {
      console.error('❌ Error generating text:', error)
      return 'Unable to generate text at this time.'
    }
  }

  async generateMultipleLines(count = 5, maxLength = 600, maxSentences = 2) {
    const lines = []
    for (let i = 0; i < count; i++) {
      try {
        const text = await this.generateText(maxLength, maxSentences)
        if (text && text.length > 10) {
          lines.push(text)
        }
      } catch (error) {
        console.error(`❌ Error generating line ${i + 1}:`, error)
      }
    }
    return lines
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
