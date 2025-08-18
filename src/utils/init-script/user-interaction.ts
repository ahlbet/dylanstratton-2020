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
   * Display text in a formatted way
   * @param text - Text to display
   * @param title - Title for the text block
   */
  displayText(text: string, title: string): void {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`${title}`)
    console.log(`${'='.repeat(60)}`)
    console.log(text)
    console.log(`${'='.repeat(60)}\n`)
  }

  /**
   * Edit Markov text interactively
   * @param text - Text to edit
   * @param index - Index of the text
   * @returns Promise<string> Edited text or 'REGENERATE' to regenerate
   */
  async editText(text: string, index: number): Promise<string> {
    this.displayText(text, `Original Markov Text #${index + 1}`)

    const editChoice = await this.askQuestion(
      `Do you want to edit this text? (y/n, or 'r' to regenerate): `
    )

    if (editChoice.toLowerCase() === 'r') {
      return 'REGENERATE'
    }

    if (editChoice.toLowerCase() !== 'y') {
      return text
    }

    console.log('\nEnter your edited text (press Enter twice to finish):')
    console.log(
      '(Type "skip" to keep original, "regenerate" to generate new text)'
    )

    const lines: string[] = []
    let lineNumber = 1

    while (true) {
      const line = await this.askQuestion(`Line ${lineNumber}: `)

      if (line === '') {
        if (lines.length > 0) break
        continue
      }

      if (line.toLowerCase() === 'skip') {
        return text
      }

      if (line.toLowerCase() === 'regenerate') {
        return 'REGENERATE'
      }

      lines.push(line)
      lineNumber++
    }

    return lines.join('\n')
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
    console.log(`\n🎵 Audio Track #${trackNumber} Coherency Level`)
    console.log('1 = Least coherent (random/jumbled)')
    console.log('100 = Fully coherent (clear, logical flow)')
    console.log(`Track ${trackNumber} of ${totalTracks}`)

    // Offer to play the audio first if available
    if (filePath && audioPlayer) {
      const listenChoice = await this.askQuestion(
        `Would you like to listen to this track before rating? (y/n): `
      )

      if (
        listenChoice.toLowerCase() === 'y' ||
        listenChoice.toLowerCase() === 'yes'
      ) {
        console.log(`\n🎧 Playing audio track...`)
        try {
          await this.playAudioWithStop(filePath, audioPlayer)
          console.log('\n🎵 Playback finished. Now rate the coherency level.')
        } catch (error) {
          console.log('Audio playback failed, continuing without preview...')
        }
      } else {
        console.log('⏭️  Skipping audio playback for this track.')
      }
    } else if (filePath && !audioPlayer) {
      console.log('⚠️ Audio playback not available, skipping preview')
    }

    while (true) {
      const coherencyInput = await this.askQuestion(
        `Enter coherency level (1-100, or press Enter for default 50): `
      )

      if (coherencyInput === '') {
        return 50 // Default value for audio tracks
      }

      const coherencyLevel = parseInt(coherencyInput)

      if (
        isNaN(coherencyLevel) ||
        coherencyLevel < 1 ||
        coherencyLevel > 100
      ) {
        console.log(
          `❌ Please enter a number between 1 and 100`
        )
        continue
      }

      return coherencyLevel
    }
  }

  /**
   * Play audio with ability to stop early by pressing Enter
   * @param filePath - Path to audio file
   * @param audioPlayer - Audio player to use
   */
  private async playAudioWithStop(filePath: string, audioPlayer: AudioPlayer): Promise<void> {
    const { spawn } = await import('child_process')
    
    console.log(`🎵 Playing audio with ${audioPlayer.tool}`)
    console.log(`📁 File: ${filePath}`)

    let command: string
    let args: string[] = []

    switch (audioPlayer.tool) {
      case 'afplay':
        // macOS built-in player
        command = 'afplay'
        args = [filePath]
        break
      case 'aplay':
        // Linux ALSA player
        command = 'aplay'
        args = [filePath]
        break
      case 'mpv':
        // Cross-platform player with quiet output
        command = 'mpv'
        args = ['--no-video', '--quiet', filePath]
        break
      case 'ffplay':
        // FFmpeg player with quiet output
        command = 'ffplay'
        args = ['-nodisp', '-autoexit', '-loglevel', 'error', filePath]
        break
      case 'vlc':
        // VLC player with quiet output
        command = 'vlc'
        args = ['--intf', 'dummy', '--play-and-exit', filePath]
        break
      default:
        command = audioPlayer.tool
        args = [filePath]
    }

    console.log(`▶️  Playing audio... (Press Enter to stop early)`)

    return new Promise((resolve, reject) => {
      const audioProcess = spawn(command, args, {
        stdio: 'pipe',
        detached: false,
      })

      let isStopped = false

      const stopPlayback = () => {
        if (isStopped) return
        isStopped = true

        console.log('\n⏹️  Stopping audio playback...')
        audioProcess.kill('SIGTERM')

        // Give it a moment to clean up, then force kill if needed
        setTimeout(() => {
          if (!audioProcess.killed) {
            audioProcess.kill('SIGKILL')
          }
        }, 1000)

        resolve()
      }

      // Handle process exit
      audioProcess.on('close', (code) => {
        if (isStopped) return // Already handled by stopPlayback

        if (code === 0) {
          console.log('\n🎵 Playback finished normally')
          resolve()
        } else if (code === null) {
          console.log('\n⏹️  Playback stopped')
          resolve()
        } else {
          console.log(`\n⚠️  Playback ended with code ${code}`)
          resolve()
        }
      })

      // Handle process errors
      audioProcess.on('error', (error) => {
        if (isStopped) return
        console.error(`❌ Error playing audio: ${error.message}`)
        reject(error)
      })

      // Set up a prompt to stop playback
      const checkForStop = async () => {
        try {
          console.log('\n💡 Press Enter to stop audio, or wait for it to finish...')
          const answer = await this.askQuestion('')
          if (answer === '') {
            stopPlayback()
          }
        } catch (error) {
          // User interrupted, continue with playback
        }
      }

      // Start checking for stop command after a short delay
      setTimeout(() => {
        if (!isStopped) {
          checkForStop()
        }
      }, 500)
    })
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
