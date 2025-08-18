import * as fs from 'fs'
import * as path from 'path'

interface MarkovText {
  text_content: string
  coherency_level: number
  daily_id: string
  name: string
}

interface TextProcessingResult {
  editedTexts: string[]
  coherencyLevels: number[]
}

interface MarkovChain {
  [key: string]: string[]
}

type EditTextFunction = (text: string, index: number) => Promise<string>
type GetCoherencyFunction = (text: string, index: number) => Promise<number>

/**
 * Manages Markov text generation and processing for the init script
 */
class MarkovManager {
  private markovTexts: string[]
  private markovChains: MarkovChain
  private isInitialized: boolean

  constructor() {
    this.markovTexts = []
    this.markovChains = {}
    this.isInitialized = false
  }

  /**
   * Initialize the Markov manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      console.log('📥 Fetching markov texts from Supabase...')
      await this.fetchMarkovTextsFromSupabase()
      this.buildMarkovChains()
      this.isInitialized = true
      console.log('✅ Successfully loaded markov texts from Supabase')
    } catch (error) {
      console.error('Failed to initialize Markov manager:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /**
   * Fetch Markov texts from Supabase
   */
  private async fetchMarkovTextsFromSupabase(): Promise<void> {
    try {
      // This would typically fetch from Supabase, but for now we'll use local data
      // In a real implementation, you'd use the Supabase client
      const localDataPath = path.join(process.cwd(), 'src', 'utils', 'markov-data.json')
      
      if (fs.existsSync(localDataPath)) {
        const data = fs.readFileSync(localDataPath, 'utf8')
        this.markovTexts = JSON.parse(data)
      } else {
        // Fallback to sample data
        this.markovTexts = this.getSampleMarkovTexts()
      }
    } catch (error) {
      console.warn('Failed to fetch from Supabase, using sample data')
      this.markovTexts = this.getSampleMarkovTexts()
    }
  }

  /**
   * Get sample Markov texts for development
   */
  private getSampleMarkovTexts(): string[] {
    return [
      "The quick brown fox jumps over the lazy dog.",
      "All work and no play makes Jack a dull boy.",
      "To be or not to be, that is the question.",
      "It was the best of times, it was the worst of times.",
      "In a hole in the ground there lived a hobbit."
    ]
  }

  /**
   * Build Markov chains from texts
   */
  private buildMarkovChains(): void {
    this.markovChains = {}
    
    this.markovTexts.forEach(text => {
      const words = text.split(/\s+/)
      
      for (let i = 0; i < words.length - 1; i++) {
        const currentWord = words[i]
        const nextWord = words[i + 1]
        
        if (!this.markovChains[currentWord]) {
          this.markovChains[currentWord] = []
        }
        
        this.markovChains[currentWord].push(nextWord)
      }
    })
  }

  /**
   * Generate initial Markov texts
   * @param count - Number of texts to generate
   * @returns Array of generated texts
   */
  generateInitialTexts(count: number): string[] {
    const texts: string[] = []
    
    for (let i = 0; i < count; i++) {
      const text = this.generateMarkovText()
      texts.push(text)
    }
    
    return texts
  }

  /**
   * Generate a single Markov text
   * @returns Generated text
   */
  private generateMarkovText(): string {
    const words: string[] = []
    const startWords = Object.keys(this.markovChains).filter(word => 
      word.length > 0 && /^[A-Z]/.test(word)
    )
    
    if (startWords.length === 0) {
      return "Generated text unavailable."
    }
    
    let currentWord = startWords[Math.floor(Math.random() * startWords.length)]
    words.push(currentWord)
    
    let wordCount = 0
    const maxWords = 20
    
    while (wordCount < maxWords && this.markovChains[currentWord]) {
      const possibleNextWords = this.markovChains[currentWord]
      const nextWord = possibleNextWords[Math.floor(Math.random() * possibleNextWords.length)]
      
      if (nextWord) {
        words.push(nextWord)
        currentWord = nextWord
        wordCount++
      } else {
        break
      }
    }
    
    return words.join(' ')
  }

  /**
   * Process texts interactively with user input
   * @param texts - Initial texts to process
   * @param editTextFn - Function to handle text editing
   * @param getCoherencyFn - Function to get coherency level
   * @returns Promise<TextProcessingResult> Processed texts and coherency levels
   */
  async processTexts(
    texts: string[],
    editTextFn: EditTextFunction,
    getCoherencyFn: GetCoherencyFunction
  ): Promise<TextProcessingResult> {
    const editedTexts: string[] = []
    const coherencyLevels: number[] = []
    
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i]
      
      // Edit text
      const editedText = await editTextFn(text, i)
      editedTexts.push(editedText)
      
      // Get coherency level
      const coherencyLevel = await getCoherencyFn(editedText, i)
      coherencyLevels.push(coherencyLevel)
    }
    
    return { editedTexts, coherencyLevels }
  }

  /**
   * Format texts for markdown
   * @param texts - Array of texts to format
   * @returns Formatted markdown string
   */
  formatForMarkdown(texts: string[]): string {
    return texts.map(text => `> ${text}`).join('\n\n')
  }

  /**
   * Prepare texts data for database insertion
   * @param editedTexts - Array of edited texts
   * @param coherencyLevels - Array of coherency levels
   * @param name - Name of the post
   * @param dailyId - ID of the daily entry
   * @returns Array of MarkovText objects
   */
  prepareTextsData(
    editedTexts: string[],
    coherencyLevels: number[],
    name: string,
    dailyId: string
  ): MarkovText[] {
    return editedTexts.map((text, index) => ({
      text_content: text,
      coherency_level: coherencyLevels[index],
      daily_id: dailyId,
      name: name
    }))
  }

  /**
   * Get statistics about the Markov data
   * @returns Object with statistics
   */
  getStatistics(): {
    totalTexts: number
    totalWords: number
    uniqueWords: number
    averageTextLength: number
  } {
    const totalTexts = this.markovTexts.length
    const totalWords = this.markovTexts.reduce((sum, text) => sum + text.split(/\s+/).length, 0)
    const uniqueWords = Object.keys(this.markovChains).length
    const averageTextLength = totalTexts > 0 ? Math.round(totalWords / totalTexts) : 0
    
    return {
      totalTexts,
      totalWords,
      uniqueWords,
      averageTextLength
    }
  }

  /**
   * Validate text coherency
   * @param text - Text to validate
   * @returns Coherency score (0-100)
   */
  validateTextCoherency(text: string): number {
    const words = text.split(/\s+/)
    let coherentPairs = 0
    let totalPairs = 0
    
    for (let i = 0; i < words.length - 1; i++) {
      const currentWord = words[i]
      const nextWord = words[i + 1]
      
      if (this.markovChains[currentWord] && this.markovChains[currentWord].includes(nextWord)) {
        coherentPairs++
      }
      totalPairs++
    }
    
    return totalPairs > 0 ? Math.round((coherentPairs / totalPairs) * 100) : 0
  }
}

export { MarkovManager }
