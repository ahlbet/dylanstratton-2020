const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

/**
 * Manages Supabase operations for the init script
 */
class SupabaseManager {
  constructor() {
    this.client = this.initializeClient()
  }

  /**
   * Initialize Supabase client
   * @returns {Object} Supabase client instance
   * @throws {Error} If credentials are missing
   */
  initializeClient() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      const errorMessage =
        'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
      console.error(errorMessage)
      if (process.env.NODE_ENV === 'test') {
        throw new Error(errorMessage)
      }
      process.exit(1)
    }

    return createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Upload file to Supabase storage
   * @param {string|Buffer} filePathOrBuffer - File path or buffer
   * @param {string} fileName - Name for the file
   * @param {string} bucketName - Storage bucket name
   * @param {string} contentType - MIME type
   * @returns {Promise<string>} Public URL of uploaded file
   */
  async uploadToStorage(
    filePathOrBuffer,
    fileName,
    bucketName = 'audio',
    contentType = 'audio/wav'
  ) {
    try {
      // Read the file or use provided buffer
      let fileBuffer
      if (Buffer.isBuffer(filePathOrBuffer)) {
        fileBuffer = filePathOrBuffer
      } else {
        fileBuffer = fs.readFileSync(filePathOrBuffer)
      }

      // Upload to Supabase
      const { data, error } = await this.client.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          contentType,
          upsert: false, // Don't overwrite existing files
        })

      if (error) {
        throw new Error(`Failed to upload to Supabase: ${error.message}`)
      }

      // Get the public URL
      const { data: urlData } = this.client.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      return urlData.publicUrl
    } catch (error) {
      console.error(`Upload error for ${fileName}:`, error.message)
      throw error
    }
  }

  /**
   * Create daily entry in database
   * @param {string} title - Title for the daily entry
   * @param {string|null} coverArtPath - Path to cover art
   * @param {string} date - Date string
   * @returns {Promise<number|null>} Daily ID or null if creation fails
   */
  async createDailyEntry(title, coverArtPath, date) {
    try {
      console.log('📝 Creating daily entry in Supabase...')

      const { data, error } = await this.client
        .from('daily')
        .insert([
          {
            title,
            cover_art: coverArtPath,
            date,
          },
        ])
        .select()

      if (error) {
        console.error('Failed to create daily entry:', error.message)
        return null
      }

      const dailyId = data[0].id
      console.log(`✅ Created daily entry with ID: ${dailyId}`)
      if (coverArtPath) {
        console.log(`🎨 Added cover art path: ${coverArtPath}`)
      }

      return dailyId
    } catch (error) {
      console.error('Failed to create daily entry:', error.message)
      return null
    }
  }

  /**
   * Create daily audio entries
   * @param {number} dailyId - Daily entry ID
   * @param {Array} audioFiles - Array of audio file data
   * @param {Function} getCoherencyLevel - Function to get coherency level
   * @returns {Promise<boolean>} Success status
   */
  async createDailyAudioEntries(dailyId, audioFiles, getCoherencyLevel) {
    if (!audioFiles || audioFiles.length === 0) return true

    console.log('🎵 Creating daily_audio entries...')

    try {
      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i]

        // Get coherency level for this audio track
        const audioCoherencyLevel = await getCoherencyLevel(
          i + 1,
          audioFiles.length,
          file.localPath,
          file.audioPlayer
        )

        const { error: audioError } = await this.client
          .from('daily_audio')
          .insert([
            {
              daily_id: dailyId,
              storage_path: file.storagePath,
              duration: file.duration,
              format: 'audio/wav',
              coherency_level: audioCoherencyLevel,
            },
          ])

        if (audioError) {
          console.error(
            `Failed to create daily_audio entry for ${file.fileName}:`,
            audioError.message
          )
        } else {
          console.log(
            `✅ Created daily_audio entry for ${file.fileName} with coherency level ${audioCoherencyLevel}`
          )
        }
      }

      return true
    } catch (error) {
      console.error('Failed to create daily audio entries:', error.message)
      return false
    }
  }

  /**
   * Upload markov texts to database
   * @param {Array} texts - Array of text data
   * @returns {Promise<boolean>} Success status
   */
  async uploadMarkovTexts(texts) {
    if (!texts || texts.length === 0) return true

    console.log('📦 Uploading edited texts to Supabase...')

    try {
      const { error } = await this.client.from('markov_texts').insert(texts)

      if (error) {
        console.error('Failed to upload texts to Supabase:', error.message)
        return false
      } else {
        console.log(
          `✅ Successfully uploaded ${texts.length} texts to Supabase`
        )
        return true
      }
    } catch (error) {
      console.error('Failed to upload texts to Supabase:', error.message)
      return false
    }
  }

  /**
   * Download file from storage
   * @param {string} fileName - Name of file to download
   * @param {string} bucketName - Storage bucket name
   * @returns {Promise<Buffer|null>} File buffer or null if download fails
   */
  async downloadFromStorage(fileName, bucketName = 'audio') {
    try {
      const { data, error } = await this.client.storage
        .from(bucketName)
        .download(fileName)

      if (error) {
        console.warn(`⚠️ Failed to download ${fileName}:`, error.message)
        return null
      }

      // Convert blob to buffer
      const arrayBuffer = await data.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.warn(`⚠️ Failed to download ${fileName}:`, error.message)
      return null
    }
  }
}

module.exports = { SupabaseManager }
