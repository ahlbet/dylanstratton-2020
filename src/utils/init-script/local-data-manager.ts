import * as fs from 'fs'
import * as path from 'path'

/**
 * Manages local development data for the init script
 */
class LocalDataManager {
  /**
   * Update local audio files
   * @param movedFiles - Array of file data from Supabase
   * @param supabase - Supabase client instance
   * @returns Promise<void>
   */
  static async updateLocalAudioFiles(movedFiles: any[], supabase: any): Promise<void> {
    if (!movedFiles || movedFiles.length === 0) return

    const localAudioDir = path.join(process.cwd(), 'static/local-audio')
    if (!fs.existsSync(localAudioDir)) {
      fs.mkdirSync(localAudioDir, { recursive: true })
    }

    console.log('📥 Adding new audio files to local directory...')

    for (const file of movedFiles) {
      try {
        // Download from Supabase to local directory
        const { data, error } = await supabase.storage
          .from('audio')
          .download(file.fileName)

        if (error) {
          console.warn(`⚠️ Failed to download ${file.fileName}:`, error.message)
          continue
        }

        // Convert blob to buffer and save
        const arrayBuffer = await data.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const localPath = path.join(localAudioDir, file.fileName)
        fs.writeFileSync(localPath, buffer)

        const sizeKB = (buffer.length / 1024).toFixed(1)
        console.log(`✅ Added ${file.fileName} to local audio (${sizeKB}KB)`)
      } catch (error) {
        console.warn(
          `⚠️ Failed to add ${file.fileName} to local audio:`,
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
    }
  }

  /**
   * Update local Markov texts
   * @param newTexts - Array of new text data
   * @param postName - Name of the post
   * @returns Promise<void>
   */
  static async updateLocalMarkovTexts(newTexts: any[], postName: string): Promise<void> {
    if (!newTexts || newTexts.length === 0) return

    const localDataDir = path.join(process.cwd(), 'static/local-data')
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true })
    }

    const markovTextsPath = path.join(localDataDir, 'markov-texts.json')

    try {
      // Read existing texts
      let existingData: { texts: any[] } = { texts: [] }
      if (fs.existsSync(markovTextsPath)) {
        const existingContent = fs.readFileSync(markovTextsPath, 'utf8')
        existingData = JSON.parse(existingContent)
      }

      // Add new texts with unique IDs
      const maxId =
        existingData.texts.length > 0
          ? Math.max(...existingData.texts.map((t: any) => t.id))
          : 0

      const textsWithIds = newTexts.map((text, index) => ({
        id: maxId + index + 1,
        text_content: text.text_content,
        text_length: text.text_length,
        coherency_level: text.coherency_level,
        created_at: new Date().toISOString(),
        metadata: {
          generated_at: new Date().toISOString(),
          source: 'init-script',
          post_name: postName,
        },
      }))

      // Combine existing and new texts
      existingData.texts = [...existingData.texts, ...textsWithIds]

      // Save updated data
      fs.writeFileSync(markovTextsPath, JSON.stringify(existingData, null, 2))
      console.log(`✅ Added ${newTexts.length} new Markov texts to local data`)
    } catch (error) {
      console.warn('⚠️ Failed to update local Markov texts:', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Update local cover art
   * @param postName - Name of the post
   * @param coverArtBuffer - Cover art buffer
   * @returns Promise<void>
   */
  static async updateLocalCoverArt(postName: string, coverArtBuffer: Buffer): Promise<void> {
    if (!coverArtBuffer) return

    const localCoverArtDir = path.join(process.cwd(), 'static/local-cover-art')
    if (!fs.existsSync(localCoverArtDir)) {
      fs.mkdirSync(localCoverArtDir, { recursive: true })
    }

    try {
      const sanitizedName = this.sanitizeFilename(postName)
      const coverArtPath = path.join(localCoverArtDir, `${sanitizedName}.png`)
      fs.writeFileSync(coverArtPath, coverArtBuffer)
      console.log(`✅ Added cover art for ${postName} to local directory`)
    } catch (error) {
      console.warn('⚠️ Failed to update local cover art:', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Strip special characters except hyphens from filename
   * @param filename - Original filename
   * @returns Sanitized filename
   */
  static sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9\-]/g, '')
  }

  /**
   * Update all local development data
   * @param movedFiles - Array of file data from Supabase
   * @param supabaseTexts - Array of text data from Supabase
   * @param postName - Name of the post
   * @param coverArtBuffer - Cover art buffer
   * @param supabase - Supabase client instance
   * @returns Promise<void>
   */
  static async updateAllLocalData(
    movedFiles: any[],
    supabaseTexts: any[],
    postName: string,
    coverArtBuffer: Buffer | null,
    supabase: any
  ): Promise<void> {
    try {
      console.log('\n🔄 Updating local development data...')

      // Update local audio files
      await this.updateLocalAudioFiles(movedFiles, supabase)

      // Update local Markov texts
      await this.updateLocalMarkovTexts(supabaseTexts, postName)

      // Update local cover art
      if (coverArtBuffer) {
        await this.updateLocalCoverArt(postName, coverArtBuffer)
      }

      console.log('✅ Local development data updated successfully!')
    } catch (error) {
      console.warn('⚠️ Failed to update local development data:', error instanceof Error ? error.message : 'Unknown error')
      console.log(
        'You can manually update local data with: yarn generate-local-data'
      )
    }
  }
}

export { LocalDataManager }
