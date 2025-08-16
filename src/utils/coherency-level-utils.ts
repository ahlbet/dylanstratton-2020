/**
 * Shared utility functions for coherency level handling
 */

interface Text {
  coherency_level?: number
  [key: string]: any
}

interface AskQuestionFunction {
  (prompt: string): Promise<string>
}

interface SaveCoherencyLevelFunction {
  (text: Text, level: number): Promise<any>
}

/**
 * Helper function to get coherency level from user
 * @param {Function} askQuestion - Function to prompt user for input
 * @param {number} textNumber - The text number being edited
 * @returns {Promise<number>} The coherency level (1-100)
 */
export const getCoherencyLevel = async (
  askQuestion: AskQuestionFunction,
  textNumber: number
): Promise<number> => {
  console.log(`\n📊 Coherency Level for Text #${textNumber}`)
  console.log('1 = Least coherent (random/jumbled)')
  console.log('100 = Fully coherent (clear, logical flow)')

  while (true) {
    const coherencyInput = await askQuestion(
      'Enter coherency level (1-100, or press Enter for default 1): '
    )

    if (coherencyInput === '') {
      return 1 // Default value
    }

    const coherencyLevel = parseInt(coherencyInput)

    if (isNaN(coherencyLevel) || coherencyLevel < 1 || coherencyLevel > 100) {
      console.log('❌ Please enter a number between 1 and 100')
      continue
    }

    return coherencyLevel
  }
}

/**
 * Helper function to edit coherency level for existing text
 * @param {Function} question - Function to prompt user for input
 * @param {Object} text - The text object being edited
 * @param {Function} saveCoherencyLevel - Function to save the coherency level
 * @returns {Promise<Object|null>} Result object or null if cancelled
 */
export const editCoherencyLevel = async (
  question: AskQuestionFunction,
  text: Text,
  saveCoherencyLevel: SaveCoherencyLevelFunction
): Promise<any | null> => {
  console.log('\n📊 Coherency Level Editor')
  console.log('1 = Least coherent (random/jumbled)')
  console.log('100 = Fully coherent (clear, logical flow)')
  console.log(`Current level: ${text.coherency_level || 'Not set'}`)

  while (true) {
    const coherencyInput = await question(
      'Enter new coherency level (1-100, or press Enter to cancel): '
    )

    if (coherencyInput === '') {
      console.log('⏭️  Cancelled coherency level edit')
      return null
    }

    const coherencyLevel = parseInt(coherencyInput)

    if (isNaN(coherencyLevel) || coherencyLevel < 1 || coherencyLevel > 100) {
      console.log('❌ Please enter a number between 1 and 100')
      continue
    }

    console.log(`📊 Setting coherency level to ${coherencyLevel}`)
    const confirm = await question('Save this coherency level? (y/n): ')

    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      return await saveCoherencyLevel(text, coherencyLevel)
    } else {
      console.log('⏭️  Cancelled coherency level edit')
      return null
    }
  }
}
