import * as fs from 'fs'
import * as path from 'path'

interface AudioFile {
  fileName: string
  url: string
  duration: number
  storagePath: string
  localPath: string
}

interface MarkovText {
  text_content: string
  coherency_level: number
  daily_id?: string
  text_length: number
}

interface LocalData {
  audioFiles: AudioFile[]
  markovTexts: MarkovText[]
  coverArt: Buffer | null
  postName: string
  timestamp: string
}

/**
 * Manages local development data for the init script
 */
class LocalDataManager {
  private static readonly LOCAL_DATA_DIR = 'local-dev-data'
  private static readonly AUDIO_FILES_FILE = 'audio-files.json'
  private static readonly MARKOV_TEXTS_FILE = 'markov-texts.json'
  private static readonly COVER_ART_DIR = 'cover-art'

  /**
   * Update all local development data
   * @param audioFiles - Array of audio files
   * @param markovTexts - Array of Markov texts
   * @param postName - Name of the post
   * @param coverArtBuffer - Cover art buffer
   * @param supabaseClient - Supabase client instance
   */
  static async updateAllLocalData(
    audioFiles: AudioFile[],
    markovTexts: MarkovText[],
    postName: string,
    coverArtBuffer: Buffer | null,
    supabaseClient: any
  ): Promise<void> {
    try {
      // Ensure local data directory exists
      this.ensureLocalDataDirectory()

      // Update audio files data
      await this.updateAudioFilesData(audioFiles, postName)

      // Update Markov texts data
      await this.updateMarkovTextsData(markovTexts, postName)

      // Update cover art
      if (coverArtBuffer) {
        await this.updateCoverArtData(coverArtBuffer, postName)
      }

      // Create summary file
      await this.createSummaryFile(audioFiles, markovTexts, postName)

      console.log('✅ Local development data updated successfully')
    } catch (error) {
      console.error('Failed to update local data:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /**
   * Ensure local data directory exists
   */
  private static ensureLocalDataDirectory(): void {
    const dataDir = path.join(process.cwd(), this.LOCAL_DATA_DIR)
    const coverArtDir = path.join(dataDir, this.COVER_ART_DIR)

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    if (!fs.existsSync(coverArtDir)) {
      fs.mkdirSync(coverArtDir, { recursive: true })
    }
  }

  /**
   * Update audio files data
   * @param audioFiles - Array of audio files
   * @param postName - Name of the post
   */
  private static async updateAudioFilesData(audioFiles: AudioFile[], postName: string): Promise<void> {
    const dataDir = path.join(process.cwd(), this.LOCAL_DATA_DIR)
    const audioFilesPath = path.join(dataDir, this.AUDIO_FILES_FILE)

    let existingData: Record<string, AudioFile[]> = {}
    
    if (fs.existsSync(audioFilesPath)) {
      try {
        const fileContent = fs.readFileSync(audioFilesPath, 'utf8')
        existingData = JSON.parse(fileContent)
      } catch (error) {
        console.warn('Failed to read existing audio files data, starting fresh')
      }
    }

    // Update with new data
    existingData[postName] = audioFiles

    // Write updated data
    fs.writeFileSync(audioFilesPath, JSON.stringify(existingData, null, 2))
    console.log(`✅ Updated audio files data for ${postName}`)
  }

  /**
   * Update Markov texts data
   * @param markovTexts - Array of Markov texts
   * @param postName - Name of the post
   */
  private static async updateMarkovTextsData(markovTexts: MarkovText[], postName: string): Promise<void> {
    const dataDir = path.join(process.cwd(), this.LOCAL_DATA_DIR)
    const markovTextsPath = path.join(dataDir, this.MARKOV_TEXTS_FILE)

    let existingData: Record<string, MarkovText[]> = {}
    
    if (fs.existsSync(markovTextsPath)) {
      try {
        const fileContent = fs.readFileSync(markovTextsPath, 'utf8')
        existingData = JSON.parse(fileContent)
      } catch (error) {
        console.warn('Failed to read existing Markov texts data, starting fresh')
      }
    }

    // Update with new data
    existingData[postName] = markovTexts

    // Write updated data
    fs.writeFileSync(markovTextsPath, JSON.stringify(existingData, null, 2))
    console.log(`✅ Updated Markov texts data for ${postName}`)
  }

  /**
   * Update cover art data
   * @param coverArtBuffer - Cover art buffer
   * @param postName - Name of the post
   */
  private static async updateCoverArtData(coverArtBuffer: Buffer, postName: string): Promise<void> {
    const dataDir = path.join(process.cwd(), this.LOCAL_DATA_DIR)
    const coverArtDir = path.join(dataDir, this.COVER_ART_DIR)
    const coverArtPath = path.join(coverArtDir, `${postName}.png`)

    fs.writeFileSync(coverArtPath, coverArtBuffer)
    console.log(`✅ Updated cover art for ${postName}`)
  }

  /**
   * Create summary file
   * @param audioFiles - Array of audio files
   * @param markovTexts - Array of Markov texts
   * @param postName - Name of the post
   */
  private static async createSummaryFile(
    audioFiles: AudioFile[],
    markovTexts: MarkovText[],
    postName: string
  ): Promise<void> {
    const dataDir = path.join(process.cwd(), this.LOCAL_DATA_DIR)
    const summaryPath = path.join(dataDir, `${postName}-summary.json`)

    const summary: LocalData = {
      audioFiles,
      markovTexts,
      coverArt: null, // We don't store the buffer in JSON
      postName,
      timestamp: new Date().toISOString()
    }

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
    console.log(`✅ Created summary file for ${postName}`)
  }

  /**
   * Get local data for a specific post
   * @param postName - Name of the post
   * @returns Local data object or null if not found
   */
  static getLocalData(postName: string): LocalData | null {
    try {
      const dataDir = path.join(process.cwd(), this.LOCAL_DATA_DIR)
      const summaryPath = path.join(dataDir, `${postName}-summary.json`)

      if (!fs.existsSync(summaryPath)) {
        return null
      }

      const fileContent = fs.readFileSync(summaryPath, 'utf8')
      return JSON.parse(fileContent)
    } catch (error) {
      console.error('Failed to read local data:', error instanceof Error ? error.message : String(error))
      return null
    }
  }

  /**
   * List all available local data
   * @returns Array of post names with local data
   */
  static listLocalData(): string[] {
    try {
      const dataDir = path.join(process.cwd(), this.LOCAL_DATA_DIR)
      
      if (!fs.existsSync(dataDir)) {
        return []
      }

      const files = fs.readdirSync(dataDir)
      const summaryFiles = files.filter(file => file.endsWith('-summary.json'))
      
      return summaryFiles.map(file => file.replace('-summary.json', ''))
    } catch (error) {
      console.error('Failed to list local data:', error instanceof Error ? error.message : String(error))
      return []
    }
  }

  /**
   * Clean up old local data
   * @param daysOld - Number of days old to consider for cleanup
   */
  static cleanupOldData(daysOld: number = 30): void {
    try {
      const dataDir = path.join(process.cwd(), this.LOCAL_DATA_DIR)
      
      if (!fs.existsSync(dataDir)) {
        return
      }

      const files = fs.readdirSync(dataDir)
      const summaryFiles = files.filter(file => file.endsWith('-summary.json'))
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      let cleanedCount = 0

      summaryFiles.forEach(file => {
        const filePath = path.join(dataDir, file)
        const stats = fs.statSync(filePath)
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath)
          cleanedCount++
        }
      })

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} old local data files`)
      }
    } catch (error) {
      console.error('Failed to cleanup old data:', error instanceof Error ? error.message : String(error))
    }
  }
}

export { LocalDataManager }
