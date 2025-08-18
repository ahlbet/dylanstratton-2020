// Define types for the API responses
interface LocalTextData {
  texts: Array<{
    text_content: string
  }>
}

interface APITextData {
  texts: Array<{
    text: string
  }>
  error?: string
}

interface APIError {
  error: string
}

class MarkovGeneratorAPIClient {
  private apiUrl: string
  private texts: string[]
  private isLoading: boolean
  private isLocalMode: boolean
  private _availabilityChecked?: boolean

  constructor() {
    // Always use local data in development mode
    const isLocalDev = process.env.NODE_ENV === 'development'
    this.apiUrl = isLocalDev ? '/api/local-markov-text' : '/api/markov-text'
    this.texts = []
    this.isLoading = false
    this.isLocalMode = isLocalDev
  }

  async loadTextBatch(count: number = 20): Promise<string[]> {
    if (this.isLoading) {
      return this.texts
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

        const data: LocalTextData = await response.json()
        if (data.texts && data.texts.length > 0) {
          // Get random texts from the local data
          const shuffled = [...data.texts].sort(() => 0.5 - Math.random())
          const selectedTexts = shuffled.slice(0, count)
          this.texts = selectedTexts.map((item) => item.text_content)
        }
      } else {
        // Production mode - use API
        const params = new URLSearchParams({ count: count.toString() })
        const response = await fetch(`${this.apiUrl}?${params}`)

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const data: APITextData = await response.json()
        if (data.error) {
          throw new Error(`API error: ${data.error}`)
        }

        if (data.texts && data.texts.length > 0) {
          this.texts = data.texts.map((item) => item.text)
        }
      }

      return this.texts
    } catch (error) {
      console.error('❌ Error loading text batch:', error)
      return []
    } finally {
      this.isLoading = false
    }
  }

  async isAvailable(): Promise<boolean> {
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
