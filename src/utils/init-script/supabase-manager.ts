import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

interface DailyEntry {
  name: string
  cover_art_path?: string | null
  date: string
}

interface DailyAudioEntry {
  daily_id: string
  storage_path: string
  duration: number
  format: string
  coherency_level: number
}

interface MarkovText {
  text_content: string
  coherency_level: number
  daily_id: string
  name: string
}

interface StorageUploadResult {
  data: { path: string } | null
  error: any
}

/**
 * Manages Supabase operations for the init script
 */
class SupabaseManager {
  public client: SupabaseClient

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required')
    }

    this.client = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Upload file to Supabase storage
   * @param localPath - Local path to file
   * @param fileName - Name for the file in storage
   * @returns Promise<string> URL of uploaded file
   */
  async uploadToStorage(localPath: string | Buffer, fileName: string): Promise<string> {
    try {
      let fileBuffer: Buffer
      let contentType: string

      if (typeof localPath === 'string') {
        // Local file path
        fileBuffer = fs.readFileSync(localPath)
        contentType = this.getContentTypeFromPath(localPath)
      } else {
        // Buffer (e.g., cover art)
        fileBuffer = localPath
        contentType = this.getContentTypeFromPath(fileName)
      }

      const storagePath = this.getStoragePath(fileName)
      
      const { data, error }: StorageUploadResult = await this.client.storage
        .from('audio')
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: true
        })

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`)
      }

      if (!data) {
        throw new Error('Storage upload returned no data')
      }

      // Get public URL
      const { data: urlData } = this.client.storage
        .from('audio')
        .getPublicUrl(storagePath)

      return urlData.publicUrl
    } catch (error) {
      throw new Error(`Failed to upload to storage: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Create daily entry in database
   * @param name - Name of the daily entry
   * @param coverArtPath - Path to cover art (optional)
   * @param date - Date string
   * @returns Promise<string> ID of created entry
   */
  async createDailyEntry(name: string, coverArtPath: string | null, date: string): Promise<string> {
    try {
      const dailyEntry: DailyEntry = {
        name,
        cover_art_path: coverArtPath,
        date
      }

      const { data, error } = await this.client
        .from('daily')
        .insert([dailyEntry])
        .select('id')
        .single()

      if (error) {
        throw new Error(`Failed to create daily entry: ${error.message}`)
      }

      if (!data) {
        throw new Error('No data returned from daily entry creation')
      }

      console.log(`✅ Created daily entry with ID: ${data.id}`)
      return data.id
    } catch (error) {
      throw new Error(`Failed to create daily entry: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Upload Markov texts to database
   * @param texts - Array of Markov text entries
   */
  async uploadMarkovTexts(texts: MarkovText[]): Promise<void> {
    try {
      if (texts.length === 0) {
        console.log('No Markov texts to upload')
        return
      }

      const { error } = await this.client
        .from('markov_texts')
        .insert(texts)

      if (error) {
        throw new Error(`Failed to upload Markov texts: ${error.message}`)
      }

      console.log(`✅ Successfully uploaded ${texts.length} Markov texts`)
    } catch (error) {
      throw new Error(`Failed to upload Markov texts: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get storage path for a file
   * @param fileName - Name of the file
   * @returns Storage path
   */
  private getStoragePath(fileName: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const sanitizedName = this.sanitizeFileName(fileName)
    return `${timestamp}-${sanitizedName}`
  }

  /**
   * Get content type from file path
   * @param filePath - Path to file
   * @returns Content type
   */
  private getContentTypeFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    const contentTypeMap: Record<string, string> = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.flac': 'audio/flac',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    }
    return contentTypeMap[ext] || 'application/octet-stream'
  }

  /**
   * Sanitize filename for storage
   * @param fileName - Original filename
   * @returns Sanitized filename
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  /**
   * Test database connection
   * @returns Promise<boolean> True if connection successful
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('daily')
        .select('count')
        .limit(1)

      if (error) {
        throw new Error(`Connection test failed: ${error.message}`)
      }

      console.log('✅ Supabase connection successful')
      return true
    } catch (error) {
      console.error('❌ Supabase connection failed:', error instanceof Error ? error.message : String(error))
      return false
    }
  }

  /**
   * Get storage bucket info
   * @param bucketName - Name of storage bucket
   * @returns Promise<object> Bucket information
   */
  async getBucketInfo(bucketName: string): Promise<any> {
    try {
      const { data, error } = await this.client.storage.getBucket(bucketName)
      
      if (error) {
        throw new Error(`Failed to get bucket info: ${error.message}`)
      }

      return data
    } catch (error) {
      throw new Error(`Failed to get bucket info: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export { SupabaseManager }
