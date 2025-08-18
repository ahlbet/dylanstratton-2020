import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface AudioFile {
  fileName: string
  localPath: string
  size: number
}

interface AudioData {
  localPlaybackFiles: AudioFile[]
}

/**
 * Manages audio file processing for the init script
 */
class AudioProcessor {
  /**
   * Find audio files for a given post name
   * @param postName - Name of the post
   * @returns AudioData object containing found audio files
   */
  static findAudioFiles(postName: string): AudioData {
    const downloadsPath = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Downloads')
    const subfolderPath = path.join(downloadsPath, postName)
    const singleFilePath = path.join(downloadsPath, `${postName}.wav`)

    const localPlaybackFiles: AudioFile[] = []

    // Check if subfolder exists and contains WAV files
    if (fs.existsSync(subfolderPath) && fs.statSync(subfolderPath).isDirectory()) {
      const files = fs.readdirSync(subfolderPath)
      const wavFiles = files.filter(file => file.toLowerCase().endsWith('.wav'))

      if (wavFiles.length > 0) {
        console.log(`Found ${wavFiles.length} WAV file(s) in subfolder '${postName}'.`)

        // Create backup of the entire subfolder
        const backupSubfolderPath = path.join(downloadsPath, `${postName}-backup`)
        if (fs.existsSync(backupSubfolderPath)) {
          fs.rmSync(backupSubfolderPath, { recursive: true, force: true })
        }
        fs.cpSync(subfolderPath, backupSubfolderPath, { recursive: true })
        console.log(`Created backup at '${backupSubfolderPath}'.`)

        // Process all WAV files from subfolder
        for (let index = 0; index < wavFiles.length; index++) {
          const wavFile = wavFiles[index]
          const sourcePath = path.join(subfolderPath, wavFile)

          // Create unique filename with just the name and index, sanitized
          const fileExtension = path.extname(wavFile)
          const sanitizedName = this.sanitizeFilename(postName)
          const uniqueFileName = wavFiles.length === 1
            ? `${sanitizedName}${fileExtension}`
            : `${sanitizedName}-${index + 1}${fileExtension}`

          // Store local path for playback
          localPlaybackFiles.push({
            fileName: uniqueFileName,
            localPath: sourcePath,
            size: fs.statSync(sourcePath).size
          })

          console.log(`Processed file '${wavFile}' as '${uniqueFileName}'.`)
        }

        // Remove empty subfolder
        if (fs.readdirSync(subfolderPath).length === 0) {
          fs.rmdirSync(subfolderPath)
          console.log(`Removed empty subfolder '${subfolderPath}'.`)
        }
      } else {
        console.warn(`Subfolder '${postName}' exists but contains no WAV files.`)
      }
    } else if (fs.existsSync(singleFilePath)) {
      // Handle single file case
      console.log(`Found single WAV file '${postName}.wav'.`)

      // Duplicate the original file before moving
      const backupPath = path.join(downloadsPath, `${postName}-backup.wav`)

      fs.copyFileSync(singleFilePath, backupPath)
      console.log(`Created backup at '${backupPath}'.`)

      // Store local path for playback
      const sanitizedName = this.sanitizeFilename(postName)
      localPlaybackFiles.push({
        fileName: `${sanitizedName}.wav`,
        localPath: singleFilePath,
        size: fs.statSync(singleFilePath).size
      })

      console.log(`Processed file '${postName}.wav' as '${sanitizedName}.wav'.`)
    } else {
      console.warn(`No WAV files found. Neither subfolder '${postName}' nor single file '${postName}.wav' exist in Downloads.`)
    }

    return { localPlaybackFiles }
  }

  /**
   * Extract audio duration from a file
   * @param filePath - Path to audio file
   * @returns Promise<number> Duration in seconds
   */
  static async extractAudioDuration(filePath: string): Promise<number> {
    try {
      // Try using ffprobe first (more reliable)
      const ffprobeOutput = execSync(
        `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`,
        { encoding: 'utf8', stdio: 'pipe' }
      ).trim()
      
      const duration = parseFloat(ffprobeOutput)
      if (!isNaN(duration)) {
        return Math.round(duration)
      }
    } catch (error) {
      // ffprobe failed, try alternative methods
    }

    try {
      // Try using soxi (Sound eXchange Info)
      const soxiOutput = execSync(
        `soxi -D "${filePath}"`,
        { encoding: 'utf8', stdio: 'pipe' }
      ).trim()
      
      const duration = parseFloat(soxiOutput)
      if (!isNaN(duration)) {
        return Math.round(duration)
      }
    } catch (error) {
      // soxi failed, try alternative methods
    }

    try {
      // Try using mediainfo
      const mediainfoOutput = execSync(
        `mediainfo --Inform="Audio;%Duration%" "${filePath}"`,
        { encoding: 'utf8', stdio: 'pipe' }
      ).trim()
      
      const duration = parseFloat(mediainfoOutput)
      if (!isNaN(duration)) {
        return Math.round(duration / 1000) // Convert milliseconds to seconds
      }
    } catch (error) {
      // mediainfo failed
    }

    // Fallback: estimate duration based on file size
    console.warn('Could not determine audio duration using audio tools. Estimating from file size...')
    const stats = fs.statSync(filePath)
    const estimatedDuration = Math.round(stats.size / (44100 * 2 * 2)) // Rough estimate for WAV files
    return Math.max(1, estimatedDuration) // Ensure minimum 1 second
  }

  /**
   * Validate audio file format
   * @param filePath - Path to audio file
   * @returns Promise<boolean> True if valid audio file
   */
  static async validateAudioFile(filePath: string): Promise<boolean> {
    try {
      // Check if file exists and is readable
      if (!fs.existsSync(filePath)) {
        return false
      }

      // Check file size (should be reasonable for audio)
      const stats = fs.statSync(filePath)
      if (stats.size < 1024) { // Less than 1KB
        return false
      }

      // Try to extract duration as a validation check
      await this.extractAudioDuration(filePath)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get audio file metadata
   * @param filePath - Path to audio file
   * @returns Promise<object> Audio metadata
   */
  static async getAudioMetadata(filePath: string): Promise<{
    duration: number
    format: string
    sampleRate?: number
    channels?: number
    bitDepth?: number
  }> {
    const duration = await this.extractAudioDuration(filePath)
    
    try {
      // Try to get more detailed metadata with ffprobe
      const ffprobeOutput = execSync(
        `ffprobe -v quiet -show_entries stream=sample_rate,channels,bits_per_sample -of csv=p=0 "${filePath}"`,
        { encoding: 'utf8', stdio: 'pipe' }
      ).trim()
      
      const [sampleRate, channels, bitDepth] = ffprobeOutput.split(',').map(v => parseInt(v) || undefined)
      
      return {
        duration,
        format: 'audio/wav',
        sampleRate,
        channels,
        bitDepth
      }
    } catch (error) {
      // Return basic metadata if detailed extraction fails
      return {
        duration,
        format: 'audio/wav'
      }
    }
  }

  /**
   * Sanitize filename for safe storage
   * @param filename - Original filename
   * @returns Sanitized filename
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  /**
   * Check if audio file is corrupted
   * @param filePath - Path to audio file
   * @returns Promise<boolean> True if file appears corrupted
   */
  static async isFileCorrupted(filePath: string): Promise<boolean> {
    try {
      const duration = await this.extractAudioDuration(filePath)
      return duration <= 0 || duration > 3600 // Less than 1 second or more than 1 hour
    } catch (error) {
      return true
    }
  }
}

export { AudioProcessor }
