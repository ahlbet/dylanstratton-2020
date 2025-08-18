import * as readline from 'readline'

interface AudioPlayer {
  tool: string
  description: string
}

interface TextProcessingResult {
  editedTexts: string[]
  coherencyLevels: number[]
}

/**
 * Manages user interaction for the init script
 */
class UserInteraction {
  private rl: readline.Interface

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }

  /**
   * Close the readline interface
   */
  close(): void {
    this.rl.close()
  }

  /**
   * Ask user a yes/no question
   * @param question - Question to ask
   * @returns Promise<boolean> User's response
   */
  private async askYesNo(question: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.rl.question(`${question} (y/n): `, (answer) => {
        const normalized = answer.toLowerCase().trim()
        resolve(normalized === 'y' || normalized === 'yes')
      })
    })
  }

  /**
   * Ask user for text input
   * @param question - Question to ask
   * @returns Promise<string> User's input
   */
  private async askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim())
      })
    })
  }

  /**
   * Ask user for a number input
   * @param question - Question to ask
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @returns Promise<number> User's input
   */
  private async askNumber(question: string, min: number, max: number): Promise<number> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        const num = parseInt(answer.trim())
        if (isNaN(num) || num < min || num > max) {
          console.log(`Please enter a number between ${min} and ${max}`)
          resolve(this.askNumber(question, min, max))
        } else {
          resolve(num)
        }
      })
    })
  }

  /**
   * Edit Markov text interactively
   * @param text - Text to edit
   * @param index - Index of the text
   * @returns Promise<string> Edited text
   */
  async editText(text: string, index: number): Promise<string> {
    console.log(`\n============================================================`)
    console.log(`Original Markov Text #${index + 1}`)
    console.log(`============================================================`)
    console.log(text)
    console.log(`============================================================\n`)

    const response = await this.askQuestion('Do you want to edit this text? (y/n, or \'r\' to regenerate): ')
    const choice = response.toLowerCase().trim()
    
    if (choice === 'r') {
      return 'REGENERATE'
    } else if (choice === 'y' || choice === 'yes') {
      const newText = await this.askQuestion('Enter your edited text: ')
      return newText || text
    } else {
      return text
    }
  }

  /**
   * Get coherency level for a text
   * @param text - Text to evaluate
   * @param index - Index of the text
   * @returns Promise<number> Coherency level (1-100)
   */
  async getTextCoherencyLevel(text: string, index: number): Promise<number> {
    console.log(`\n============================================================`)
    console.log(`Evaluating Text #${index + 1}`)
    console.log(`============================================================`)
    console.log(text)
    console.log(`============================================================\n`)

    const coherencyLevel = await this.askNumber(
      'Rate the coherency level (1-100, where 1 is completely random and 100 is perfectly coherent): ',
      1,
      100
    )

    console.log(`✅ Coherency level set to ${coherencyLevel}`)
    return coherencyLevel
  }

  /**
   * Get coherency level for an audio track
   * @param trackNumber - Track number
   * @param totalTracks - Total number of tracks
   * @param filePath - Path to audio file
   * @param audioPlayer - Available audio player
   * @returns Promise<number> Coherency level (1-100)
   */
  async getAudioCoherencyLevel(
    trackNumber: number,
    totalTracks: number,
    filePath: string,
    audioPlayer: AudioPlayer | null
  ): Promise<number> {
    console.log(`\n🎵 Audio Track ${trackNumber}/${totalTracks}: ${filePath}`)

    if (audioPlayer) {
      const wantToPlay = await this.askYesNo(
        `Would you like to preview this audio using ${audioPlayer.tool}?`
      )
      
      if (wantToPlay) {
        try {
          const { execSync } = await import('child_process')
          execSync(`${audioPlayer.tool} "${filePath}"`, { stdio: 'inherit' })
        } catch (error) {
          console.log('Audio playback failed, continuing without preview...')
        }
      }
    }

    const coherencyLevel = await this.askNumber(
      'Rate the audio coherency level (1-100, where 1 is completely random and 100 is perfectly coherent): ',
      1,
      100
    )

    console.log(`✅ Audio coherency level set to ${coherencyLevel}`)
    return coherencyLevel
  }

  /**
   * Ask user if they want to continue
   * @param message - Message to display
   * @returns Promise<boolean> User's response
   */
  async askToContinue(message: string = 'Continue?'): Promise<boolean> {
    return this.askYesNo(message)
  }

  /**
   * Ask user for confirmation before proceeding
   * @param message - Message to display
   * @returns Promise<boolean> User's confirmation
   */
  async askForConfirmation(message: string): Promise<boolean> {
    console.log(`\n⚠️  ${message}`)
    return this.askYesNo('Are you sure you want to continue?')
  }
}

export { UserInteraction }
