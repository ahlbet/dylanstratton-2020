const fs = require('fs')
const path = require('path')

/**
 * Manages audio file processing operations for the init script
 */
class AudioProcessor {
  /**
   * Extract audio duration from WAV file
   * @param {string} filePath - Path to WAV file
   * @returns {Promise<number|null>} Duration in seconds or null if extraction fails
   */
  static async extractAudioDuration(filePath) {
    try {
      console.log(`   📊 Extracting duration from: ${path.basename(filePath)}`)

      const data = fs.readFileSync(filePath)

      if (data.length < 80) {
        console.log(`   ⚠️ File too small, using null`)
        return null
      }

      // Check if it's actually a WAV file (should start with "RIFF")
      const riffHeader = data.toString('ascii', 0, 4)
      if (riffHeader !== 'RIFF') {
        console.log(`   ⚠️ Not a valid WAV file (no RIFF header), using null`)
        return null
      }

      // Find the format chunk ("fmt ")
      const fmtIndex = data.indexOf('fmt ')
      if (fmtIndex === -1) {
        console.log(`   ⚠️ No format chunk found, using null`)
        return null
      }

      // Find the data chunk ("data")
      const dataIndex = data.indexOf('data')
      if (dataIndex === -1) {
        console.log(`   ⚠️ No data chunk found, using null`)
        return null
      }

      // Read format chunk data
      const sampleRate = data.readUInt32LE(fmtIndex + 12)
      const byteRate = data.readUInt32LE(fmtIndex + 16)
      const dataSize = data.readUInt32LE(dataIndex + 4)

      if (sampleRate > 0 && byteRate > 0 && dataSize > 0) {
        const durationSeconds = dataSize / byteRate
        if (durationSeconds > 0 && durationSeconds < 3600) {
          // Sanity check: between 0 and 1 hour
          console.log(`   ✅ Duration: ${durationSeconds.toFixed(2)} seconds`)
          return Math.round(durationSeconds)
        } else {
          console.log(
            `   ⚠️ Duration out of reasonable range (${durationSeconds}s), using null`
          )
          return null
        }
      } else {
        console.log(`   ⚠️ Invalid WAV header values, using null`)
        return null
      }
    } catch (error) {
      console.log(`   ⚠️ Duration extraction failed: ${error.message}`)
      return null
    }
  }

  /**
   * Strip special characters except hyphens from filename
   * @param {string} filename - Original filename
   * @returns {string} Sanitized filename
   */
  static sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9\-]/g, '')
  }

  /**
   * Find audio files in Downloads directory
   * @param {string} name - Name to search for
   * @returns {Object} Object containing found files and their paths
   */
  static findAudioFiles(name) {
    const downloadsPath = path.join(
      process.env.HOME || process.env.USERPROFILE,
      'Downloads'
    )

    // Check for subfolder first (multiple files)
    const subfolderPath = path.join(downloadsPath, name)
    const singleFilePath = path.join(downloadsPath, `${name}.wav`)

    let movedFiles = [] // Track which files were moved
    let localPlaybackFiles = [] // Track local paths for audio playback

    // Check if subfolder exists and contains WAV files
    if (
      fs.existsSync(subfolderPath) &&
      fs.statSync(subfolderPath).isDirectory()
    ) {
      const files = fs.readdirSync(subfolderPath)
      const wavFiles = files.filter((file) =>
        file.toLowerCase().endsWith('.wav')
      )

      if (wavFiles.length > 0) {
        console.log(
          `Found ${wavFiles.length} WAV file(s) in subfolder '${name}'.`
        )

        // Create backup of the entire subfolder
        const backupSubfolderPath = path.join(downloadsPath, `${name}-backup`)
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
          const sanitizedName = this.sanitizeFilename(name)
          const uniqueFileName =
            wavFiles.length === 1
              ? `${sanitizedName}${fileExtension}`
              : `${sanitizedName}-${index + 1}${fileExtension}`

          // Store local path for playback
          localPlaybackFiles.push({
            fileName: uniqueFileName,
            localPath: sourcePath,
          })

          console.log(`Processed file '${wavFile}' as '${uniqueFileName}'.`)
        }

        // Remove empty subfolder
        if (fs.readdirSync(subfolderPath).length === 0) {
          fs.rmdirSync(subfolderPath)
          console.log(`Removed empty subfolder '${subfolderPath}'.`)
        }
      } else {
        console.warn(`Subfolder '${name}' exists but contains no WAV files.`)
      }
    } else if (fs.existsSync(singleFilePath)) {
      // Handle single file case
      console.log(`Found single WAV file '${name}.wav'.`)

      // Duplicate the original file before moving
      const backupPath = path.join(downloadsPath, `${name}-backup.wav`)

      fs.copyFileSync(singleFilePath, backupPath)
      console.log(`Created backup at '${backupPath}'.`)

      // Store local path for playback
      const sanitizedName = this.sanitizeFilename(name)
      localPlaybackFiles.push({
        fileName: `${sanitizedName}.wav`,
        localPath: singleFilePath,
      })

      console.log(`Processed file '${name}.wav' as '${sanitizedName}.wav'.`)
    } else {
      console.warn(
        `No WAV files found. Neither subfolder '${name}' nor single file '${name}.wav' exist in Downloads.`
      )
    }

    return {
      movedFiles,
      localPlaybackFiles,
      subfolderPath,
      singleFilePath,
    }
  }
}

module.exports = { AudioProcessor }
