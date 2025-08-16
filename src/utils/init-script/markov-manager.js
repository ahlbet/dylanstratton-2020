const { MarkovGenerator } = require('../markov-generator')

/**
 * Manages Markov text generation and editing for the init script
 */
class MarkovManager {
  constructor() {
    this.generator = null
    this.fallbackTexts = [
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
  }

  /**
   * Initialize Markov generator with Supabase data
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
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
          return true
        } else {
          console.warn('⚠️ Failed to load from Supabase, using fallback text')
          this.generator.loadTextFromArray(this.fallbackTexts)
          return false
        }
      } else {
        console.warn('⚠️ Missing Supabase credentials, using fallback text')
        this.generator.loadTextFromArray(this.fallbackTexts)
        return false
      }
    } catch (error) {
      console.error('❌ Failed to initialize markov generator:', error.message)
      // Use fallback text as last resort
      this.generator.loadTextFromArray(this.fallbackTexts)
      return false
    }
  }

  /**
   * Generate initial Markov texts
   * @param {number} count - Number of texts to generate
   * @returns {Array<string>} Array of generated texts
   */
  generateInitialTexts(count = 5) {
    if (!this.generator) {
      throw new Error('Markov generator not initialized')
    }

    const texts = []

    for (let i = 0; i < count; i++) {
      let text = null
      let attemptCount = 0

      while (!text && attemptCount < 3) {
        try {
          const generatedLines = this.generator.generateMultipleLines(
            1,
            1000,
            2
          )
          if (generatedLines.length > 0) {
            text = generatedLines[0]
          }

          if (text && text.length > 10) {
            break
          }
        } catch (error) {
          console.error(`Error generating text ${i + 1}:`, error.message)
        }
        attemptCount++
      }

      if (!text) {
        text = `Generated text ${i + 1} could not be created.`
      }

      texts.push(text)
    }

    console.log(`✅ Generated ${texts.length} initial texts\n`)
    return texts
  }

  /**
   * Regenerate a specific text
   * @param {number} textIndex - Index of text to regenerate
   * @returns {string} New generated text
   */
  regenerateText(textIndex) {
    if (!this.generator) {
      throw new Error('Markov generator not initialized')
    }

    try {
      const generatedLines = this.generator.generateMultipleLines(1, 1000, 2)
      if (generatedLines.length > 0) {
        return generatedLines[0]
      } else {
        return `Generated text ${textIndex + 1} could not be created.`
      }
    } catch (error) {
      console.error(`Error regenerating text ${textIndex + 1}:`, error.message)
      return `Generated text ${textIndex + 1} could not be created.`
    }
  }

  /**
   * Process and edit texts interactively
   * @param {Array<string>} texts - Initial texts to edit
   * @param {Function} editText - Function to handle text editing
   * @param {Function} getCoherencyLevel - Function to get coherency level
   * @returns {Promise<Object>} Object containing edited texts and coherency levels
   */
  async processTexts(texts, editText, getCoherencyLevel) {
    const editedTexts = []
    const coherencyLevels = []

    for (let i = 0; i < texts.length; i++) {
      let currentText = texts[i]
      let needsRegeneration = false

      do {
        needsRegeneration = false
        const editedText = await editText(currentText, i + 1)

        if (editedText === 'REGENERATE') {
          currentText = this.regenerateText(i)
          needsRegeneration = true
          console.log(`🔄 Regenerated text ${i + 1}`)
        } else {
          currentText = editedText
        }
      } while (needsRegeneration)

      // Get coherency level for this text
      const coherencyLevel = await getCoherencyLevel(i + 1)
      coherencyLevels.push(coherencyLevel)

      editedTexts.push(currentText)
      console.log(
        `✅ Text ${i + 1} finalized with coherency level ${coherencyLevel}\n`
      )
    }

    return { editedTexts, coherencyLevels }
  }

  /**
   * Format texts for markdown
   * @param {Array<string>} texts - Array of texts to format
   * @returns {string} Formatted markdown text
   */
  formatForMarkdown(texts) {
    return texts.map((text) => `> ${text}`).join('\n\n')
  }

  /**
   * Prepare texts data for database
   * @param {Array<string>} texts - Array of edited texts
   * @param {Array<number>} coherencyLevels - Array of coherency levels
   * @param {string} postName - Name of the post
   * @param {number|null} dailyId - Daily entry ID
   * @returns {Array<Object>} Array of text data objects
   */
  prepareTextsData(texts, coherencyLevels, postName, dailyId = null) {
    return texts.map((text, index) => ({
      text_content: text,
      text_length: text.length,
      coherency_level: coherencyLevels[index],
      daily_id: dailyId,
      metadata: {
        generated_at: new Date().toISOString(),
        source: 'markov-generator',
        post_name: postName,
        text_number: index + 1,
        edited_by_user: true,
        cleaned_with_bad_words_filter: true,
      },
    }))
  }
}

module.exports = { MarkovManager }
