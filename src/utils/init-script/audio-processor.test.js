const fs = require('fs')
const path = require('path')
const { AudioProcessor } = require('./audio-processor')

// Mock fs module
jest.mock('fs')
jest.mock('path')

describe('AudioProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock path.join to return predictable paths
    path.join.mockImplementation((...args) => args.join('/'))

    // Mock process.env
    process.env.HOME = '/home/user'
    process.env.USERPROFILE = '/home/user'
  })

  describe('extractAudioDuration', () => {
    it('should extract duration from valid WAV file', async () => {
      // Mock valid WAV file data
      const mockWavData = Buffer.alloc(100)

      // Set RIFF header
      mockWavData.write('RIFF', 0)

      // Set fmt chunk at position 12
      mockWavData.write('fmt ', 12)

      // Set data chunk at position 36
      mockWavData.write('data', 36)

      // Set sample rate (44100) at position 24
      mockWavData.writeUInt32LE(44100, 24)

      // Set byte rate (176400) at position 28
      mockWavData.writeUInt32LE(176400, 28)

      // Set data size (176400) at position 40 to get 1 second duration
      mockWavData.writeUInt32LE(176400, 40)

      fs.readFileSync.mockReturnValue(mockWavData)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const result =
        await AudioProcessor.extractAudioDuration('/path/to/audio.wav')

      expect(result).toBe(1) // 176400 / 176400 = 1 second
      expect(consoleSpy).toHaveBeenCalledWith('   ✅ Duration: 1.00 seconds')

      consoleSpy.mockRestore()
    })

    it('should return null for file too small', async () => {
      const mockWavData = Buffer.alloc(50) // Too small
      fs.readFileSync.mockReturnValue(mockWavData)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const result =
        await AudioProcessor.extractAudioDuration('/path/to/audio.wav')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        '   ⚠️ File too small, using null'
      )

      consoleSpy.mockRestore()
    })

    it('should return null for file without RIFF header', async () => {
      const mockWavData = Buffer.alloc(100)
      mockWavData.write('WAVE', 0) // Wrong header
      fs.readFileSync.mockReturnValue(mockWavData)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const result =
        await AudioProcessor.extractAudioDuration('/path/to/audio.wav')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        '   ⚠️ Not a valid WAV file (no RIFF header), using null'
      )

      consoleSpy.mockRestore()
    })

    it('should return null for file without fmt chunk', async () => {
      const mockWavData = Buffer.alloc(100)
      mockWavData.write('RIFF', 0)
      // No fmt chunk
      mockWavData.write('data', 36)
      fs.readFileSync.mockReturnValue(mockWavData)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const result =
        await AudioProcessor.extractAudioDuration('/path/to/audio.wav')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        '   ⚠️ No format chunk found, using null'
      )

      consoleSpy.mockRestore()
    })

    it('should return null for file without data chunk', async () => {
      const mockWavData = Buffer.alloc(100)
      mockWavData.write('RIFF', 0)
      mockWavData.write('fmt ', 12)
      // No data chunk
      fs.readFileSync.mockReturnValue(mockWavData)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const result =
        await AudioProcessor.extractAudioDuration('/path/to/audio.wav')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        '   ⚠️ No data chunk found, using null'
      )

      consoleSpy.mockRestore()
    })

    it('should return null for duration out of reasonable range', async () => {
      const mockWavData = Buffer.alloc(100)
      mockWavData.write('RIFF', 0)
      mockWavData.write('fmt ', 12)
      mockWavData.write('data', 36)
      mockWavData.writeUInt32LE(44100, 24)
      mockWavData.writeUInt32LE(176400, 28)
      mockWavData.writeUInt32LE(1000000000, 40) // Very large data size
      fs.readFileSync.mockReturnValue(mockWavData)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const result =
        await AudioProcessor.extractAudioDuration('/path/to/audio.wav')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        '   ⚠️ Duration out of reasonable range (5668.934240362812s), using null'
      )

      consoleSpy.mockRestore()
    })

    it('should handle read errors gracefully', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File read error')
      })

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const result =
        await AudioProcessor.extractAudioDuration('/path/to/audio.wav')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        '   ⚠️ Duration extraction failed: File read error'
      )

      consoleSpy.mockRestore()
    })
  })

  describe('sanitizeFilename', () => {
    it('should remove special characters except hyphens', () => {
      const testCases = [
        ['test-file.wav', 'test-filewav'],
        ['file with spaces.wav', 'filewithspaceswav'],
        ['file@#$%^&*().wav', 'filewav'],
        ['file_with_underscores.wav', 'filewithunderscoreswav'],
        ['file-with-hyphens.wav', 'file-with-hyphenswav'],
        ['FILE.WAV', 'FILEWAV'],
        ['123-file-456.wav', '123-file-456wav'],
      ]

      testCases.forEach(([input, expected]) => {
        expect(AudioProcessor.sanitizeFilename(input)).toBe(expected)
      })
    })
  })

  describe('findAudioFiles', () => {
    beforeEach(() => {
      // Mock fs.existsSync and fs.statSync
      fs.existsSync.mockReturnValue(false)
      fs.statSync.mockReturnValue({ isDirectory: () => false })
      fs.readdirSync.mockReturnValue([])

      // Mock path.extname to return .wav
      path.extname.mockReturnValue('.wav')
    })

    it('should handle subfolder with WAV files', () => {
      const name = 'test-post'

      // Mock subfolder exists and is directory
      fs.existsSync.mockImplementation((path) => {
        return path.includes('test-post') && !path.includes('test-post.wav')
      })
      fs.statSync.mockReturnValue({ isDirectory: () => true })

      // Mock subfolder contains WAV files
      fs.readdirSync.mockReturnValue(['audio1.wav', 'audio2.wav', 'readme.txt'])

      // Mock backup operations
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('test-post-backup')) return false
        return path.includes('test-post') && !path.includes('test-post.wav')
      })
      fs.cpSync.mockReturnValue(undefined)
      fs.rmdirSync.mockReturnValue(undefined)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const result = AudioProcessor.findAudioFiles(name)

      expect(result.localPlaybackFiles).toHaveLength(2)
      expect(result.localPlaybackFiles[0].fileName).toBe('test-post-1.wav')
      expect(result.localPlaybackFiles[1].fileName).toBe('test-post-2.wav')
      expect(consoleSpy).toHaveBeenCalledWith(
        "Found 2 WAV file(s) in subfolder 'test-post'."
      )

      consoleSpy.mockRestore()
    })

    it('should handle single WAV file', () => {
      const name = 'test-post'

      // Mock single file exists
      fs.existsSync.mockImplementation((path) => {
        return path.includes('test-post.wav')
      })

      // Mock backup operations
      fs.copyFileSync.mockReturnValue(undefined)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const result = AudioProcessor.findAudioFiles(name)

      expect(result.localPlaybackFiles).toHaveLength(1)
      expect(result.localPlaybackFiles[0].fileName).toBe('test-post.wav')
      expect(consoleSpy).toHaveBeenCalledWith(
        "Found single WAV file 'test-post.wav'."
      )

      consoleSpy.mockRestore()
    })

    it('should handle no audio files found', () => {
      const name = 'test-post'

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const result = AudioProcessor.findAudioFiles(name)

      expect(result.localPlaybackFiles).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        "No WAV files found. Neither subfolder 'test-post' nor single file 'test-post.wav' exist in Downloads."
      )

      consoleSpy.mockRestore()
    })

    it('should handle subfolder with no WAV files', () => {
      const name = 'test-post'

      // Mock subfolder exists and is directory
      fs.existsSync.mockImplementation((path) => {
        return path.includes('test-post') && !path.includes('test-post.wav')
      })
      fs.statSync.mockReturnValue({ isDirectory: () => true })

      // Mock subfolder contains no WAV files
      fs.readdirSync.mockReturnValue(['readme.txt', 'metadata.json'])

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const result = AudioProcessor.findAudioFiles(name)

      expect(result.localPlaybackFiles).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        "Subfolder 'test-post' exists but contains no WAV files."
      )

      consoleSpy.mockRestore()
    })
  })
})
