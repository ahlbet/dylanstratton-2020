import * as fs from 'fs'
import * as path from 'path'
import { MarkovGenerator } from '../markov-generator'

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
  private generator: MarkovGenerator | null

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

      this.generator = new MarkovGenerator(7)

      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const success =
          await this.generator.loadTextFromSupabaseWithCredentials(
            supabaseUrl,
            supabaseKey,
            'markov-text'
          )
        if (success) {
          console.log('✅ Successfully loaded markov texts from Supabase')
          this.markovTexts = this.generator.getLines()
          this.isInitialized = true
          return
        } else {
          console.warn('⚠️ Failed to load from Supabase, using fallback text')
          this.generator.loadTextFromArray(this.getSampleMarkovTexts())
          this.markovTexts = this.generator.getLines()
          this.isInitialized = true
          return
        }
      } else {
        console.warn('⚠️ Missing Supabase credentials, using fallback text')
        this.generator.loadTextFromArray(this.getSampleMarkovTexts())
        this.markovTexts = this.generator.getLines()
        this.isInitialized = true
        return
      }
    } catch (error) {
      console.error('❌ Failed to initialize markov generator:', error instanceof Error ? error.message : String(error))
      // Use fallback text as last resort
      this.generator.loadTextFromArray(this.getSampleMarkovTexts())
      this.markovTexts = this.generator.getLines()
      this.isInitialized = true
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
   * Generate initial Markov texts
   * @param count - Number of texts to generate
   * @returns Array of generated texts
   */
  generateInitialTexts(count: number): string[] {
    if (!this.generator) {
      return this.getSampleMarkovTexts().slice(0, count)
    }
    
    try {
      // Use the generator to create multiple lines
      const generatedLines = this.generator.generateMultipleLines(count, 1000, 2)
      return generatedLines
    } catch (error) {
      console.warn('Failed to generate with MarkovGenerator, using sample texts')
      return this.getSampleMarkovTexts().slice(0, count)
    }
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
      let currentText = texts[i]
      let needsRegeneration = false
      
      do {
        needsRegeneration = false
        const editedText = await editTextFn(currentText, i)
        
        if (editedText === 'REGENERATE') {
          try {
            // Generate new text using the Markov generator
            const generatedLines = this.generator.generateMultipleLines(1, 1000, 2)
            if (generatedLines.length > 0) {
              currentText = generatedLines[0]
            } else {
              currentText = `Generated text ${i + 1} could not be created.`
            }
            needsRegeneration = true
            console.log(`🔄 Regenerated text ${i + 1}`)
          } catch (error) {
            console.error(`Error regenerating text ${i + 1}:`, error instanceof Error ? error.message : 'Unknown error')
            currentText = `Generated text ${i + 1} could not be created.`
          }
        } else {
          currentText = editedText
        }
      } while (needsRegeneration)
      
      // Store the final text
      editedTexts.push(currentText)
      
      // Get coherency level
      const coherencyLevel = await getCoherencyFn(currentText, i)
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
