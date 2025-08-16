const readline = require('readline')

/**
 * Manages user interaction and input handling for the init script
 */
class UserInteraction {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }

  /**
   * Close the readline interface
   */
  close() {
    this.rl.close()
  }

  /**
   * Prompt user for input
   * @param {string} question - Question to ask
   * @returns {Promise<string>} User's answer
   */
  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer)
      })
    })
  }

  /**
   * Display text in a formatted way
   * @param {string} text - Text to display
   * @param {string} title - Title for the text block
   */
  displayText(text, title) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`${title}`)
    console.log(`${'='.repeat(60)}`)
    console.log(text)
    console.log(`${'='.repeat(60)}\n`)
  }

  /**
   * Edit text interactively
   * @param {string} originalText - Original text to edit
   * @param {number} textNumber - Number of the text being edited
   * @returns {Promise<string>} Edited text or 'REGENERATE' to regenerate
   */
  async editText(originalText, textNumber) {
    this.displayText(originalText, `Original Markov Text #${textNumber}`)

    const editChoice = await this.askQuestion(
      `Do you want to edit this text? (y/n, or 'r' to regenerate): `
    )

    if (editChoice.toLowerCase() === 'r') {
      return 'REGENERATE'
    }

    if (editChoice.toLowerCase() !== 'y') {
      return originalText
    }

    console.log('\nEnter your edited text (press Enter twice to finish):')
    console.log(
      '(Type "skip" to keep original, "regenerate" to generate new text)'
    )

    const lines = []
    let lineNumber = 1

    while (true) {
      const line = await this.askQuestion(`Line ${lineNumber}: `)

      if (line === '') {
        if (lines.length > 0) break
        continue
      }

      if (line.toLowerCase() === 'skip') {
        return originalText
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
   * Get coherency level for text
   * @param {number} textNumber - Number of the text
   * @returns {Promise<number>} Coherency level (1-100)
   */
  async getTextCoherencyLevel(textNumber) {
    const { getCoherencyLevel } = require('../coherency-level-utils')
    return await getCoherencyLevel(this.askQuestion.bind(this), textNumber)
  }

  /**
   * Get coherency level for audio track
   * @param {number} trackNumber - Number of the track
   * @param {number} totalTracks - Total number of tracks
   * @param {string|null} audioPath - Path to audio file
   * @param {Object|null} audioPlayer - Audio player object
   * @returns {Promise<number>} Coherency level (1-100)
   */
  async getAudioCoherencyLevel(
    trackNumber,
    totalTracks,
    audioPath = null,
    audioPlayer = null
  ) {
    const {
      COHERENCY_MIN_LEVEL,
      COHERENCY_MAX_LEVEL,
    } = require('../audio-tools')

    console.log(`\n🎵 Audio Track #${trackNumber} Coherency Level`)
    console.log('1 = Least coherent (random/jumbled)')
    console.log('100 = Fully coherent (clear, logical flow)')
    console.log(`Track ${trackNumber} of ${totalTracks}`)

    // Offer to play the audio first if available
    if (audioPath && audioPlayer) {
      const listenChoice = await this.askQuestion(
        `Would you like to listen to this track before rating? (y/n): `
      )

      if (
        listenChoice.toLowerCase() === 'y' ||
        listenChoice.toLowerCase() === 'yes'
      ) {
        console.log(`\n🎧 Playing audio track...`)
        const { AudioPlayer } = require('./audio-player')
        const player = new AudioPlayer()
        await player.playAudio(audioPath, audioPlayer)
        console.log('\n🎵 Playback finished. Now rate the coherency level.')
      } else {
        console.log('⏭️  Skipping audio playback for this track.')
      }
    } else if (audioPath && !audioPlayer) {
      console.log('⚠️ Audio playback not available, skipping preview')
    }

    while (true) {
      const coherencyInput = await this.askQuestion(
        `Enter coherency level (${COHERENCY_MIN_LEVEL}-${COHERENCY_MAX_LEVEL}, or press Enter for default 50): `
      )

      if (coherencyInput === '') {
        return 50 // Default value for audio tracks
      }

      const coherencyLevel = parseInt(coherencyInput)

      if (
        isNaN(coherencyLevel) ||
        coherencyLevel < COHERENCY_MIN_LEVEL ||
        coherencyLevel > COHERENCY_MAX_LEVEL
      ) {
        console.log(
          `❌ Please enter a number between ${COHERENCY_MIN_LEVEL} and ${COHERENCY_MAX_LEVEL}`
        )
        continue
      }

      return coherencyLevel
    }
  }
}

module.exports = { UserInteraction }
