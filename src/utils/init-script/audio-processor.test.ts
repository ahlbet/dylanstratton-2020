import { AudioProcessor } from './audio-processor'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

// Mock fs module
jest.mock('fs')
const mockFs = fs as jest.Mocked<typeof fs>

// Mock path module
jest.mock('path')
const mockPath = path as jest.Mocked<typeof path>

// Mock child_process module
jest.mock('child_process')
const MockExecSync = execSync as jest.MockedFunction<typeof execSync>

describe('AudioProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock path.join to return predictable paths
    mockPath.join.mockImplementation((...args) => args.join('/'))
    
    // Mock process.env
    process.env.HOME = '/Users/test'
    process.env.USERPROFILE = undefined
  })

  describe('sanitizeFilename', () => {
    it('should remove special characters except allowed ones', () => {
      const result = AudioProcessor.sanitizeFilename('test@file#name!.txt')
      expect(result).toBe('test_file_name_.txt')
    })

    it('should replace multiple underscores with single', () => {
      const result = AudioProcessor.sanitizeFilename('test___file___name')
      expect(result).toBe('test_file_name')
    })

    it('should remove leading and trailing underscores', () => {
      const result = AudioProcessor.sanitizeFilename('_test_file_name_')
      expect(result).toBe('test_file_name')
    })

    it('should preserve allowed characters', () => {
      const result = AudioProcessor.sanitizeFilename('test-file.name_123')
      expect(result).toBe('test-file.name_123')
    })

    it('should handle empty string', () => {
      const result = AudioProcessor.sanitizeFilename('')
      expect(result).toBe('')
    })
  })

  describe('findAudioFiles', () => {
    it('should find audio files in subfolder', () => {
      const mockFiles = ['audio1.wav', 'audio2.wav', 'readme.txt']
      mockFs.existsSync.mockImplementation((path) => {
        const pathStr = String(path)
        return pathStr.includes('test-post') && !pathStr.includes('.wav')
      })
      mockFs.statSync.mockImplementation((path) => {
        const pathStr = String(path)
        if (pathStr.includes('test-post') && !pathStr.includes('.wav')) {
          return { isDirectory: () => true } as any
        }
        return { size: 1024 } as any
      })
      mockFs.readdirSync.mockReturnValue(mockFiles as any)
      mockPath.extname.mockReturnValue('.wav')

      const result = AudioProcessor.findAudioFiles('test-post')

      expect(result.localPlaybackFiles).toHaveLength(2)
      expect(result.localPlaybackFiles[0].fileName).toBe('test-post-1.wav')
      expect(result.localPlaybackFiles[1].fileName).toBe('test-post-2.wav')
    })

    it('should handle single file case', () => {
      mockFs.existsSync.mockImplementation((path) => {
        const pathStr = String(path)
        return pathStr.includes('test-post.wav')
      })
      mockFs.statSync.mockReturnValue({ size: 2048 } as any)

      const result = AudioProcessor.findAudioFiles('test-post')

      expect(result.localPlaybackFiles).toHaveLength(1)
      expect(result.localPlaybackFiles[0].fileName).toBe('test-post.wav')
    })

    it('should handle no files found', () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = AudioProcessor.findAudioFiles('test-post')

      expect(result.localPlaybackFiles).toHaveLength(0)
    })

    it('should handle subfolder with no WAV files', () => {
      const mockFiles = ['readme.txt', 'image.jpg']
      mockFs.existsSync.mockImplementation((path) => {
        const pathStr = String(path)
        return pathStr.includes('test-post') && !pathStr.includes('.wav')
      })
      mockFs.statSync.mockImplementation((path) => {
        const pathStr = String(path)
        if (pathStr.includes('test-post') && !pathStr.includes('.wav')) {
          return { isDirectory: () => true } as any
        }
        return { size: 1024 } as any
      })
      mockFs.readdirSync.mockReturnValue(mockFiles as any)

      const result = AudioProcessor.findAudioFiles('test-post')

      expect(result.localPlaybackFiles).toHaveLength(0)
    })
  })

  describe('extractAudioDuration', () => {
    it('should extract duration using ffprobe', async () => {
      MockExecSync.mockReturnValue('120.5' as any)

      const result = await AudioProcessor.extractAudioDuration('/path/to/audio.wav')

      expect(result).toBe(121) // Rounded
      expect(MockExecSync).toHaveBeenCalledWith(
        'ffprobe -v quiet -show_entries format=duration -of csv=p=0 "/path/to/audio.wav"',
        { encoding: 'utf8', stdio: 'pipe' }
      )
    })

    it('should fallback to soxi when ffprobe fails', async () => {
      MockExecSync
        .mockImplementationOnce(() => { throw new Error('ffprobe not found') })
        .mockReturnValue('180.2' as any)

      const result = await AudioProcessor.extractAudioDuration('/path/to/audio.wav')

      expect(result).toBe(180)
      expect(MockExecSync).toHaveBeenCalledTimes(2)
    })

    it('should fallback to mediainfo when soxi fails', async () => {
      MockExecSync
        .mockImplementationOnce(() => { throw new Error('ffprobe not found') })
        .mockImplementationOnce(() => { throw new Error('soxi not found') })
        .mockReturnValue('90000' as any) // 90 seconds in milliseconds

      const result = await AudioProcessor.extractAudioDuration('/path/to/audio.wav')

      expect(result).toBe(90)
      expect(MockExecSync).toHaveBeenCalledTimes(3)
    })

    it('should estimate duration from file size when all tools fail', async () => {
      MockExecSync
        .mockImplementationOnce(() => { throw new Error('ffprobe not found') })
        .mockImplementationOnce(() => { throw new Error('soxi not found') })
        .mockImplementationOnce(() => { throw new Error('mediainfo not found') })

      mockFs.statSync.mockReturnValue({ size: 44100 * 2 * 2 * 60 } as any) // 1 minute of audio

      const result = await AudioProcessor.extractAudioDuration('/path/to/audio.wav')

      expect(result).toBe(60)
    })

    it('should return minimum 1 second for very small files', async () => {
      MockExecSync
        .mockImplementationOnce(() => { throw new Error('ffprobe not found') })
        .mockImplementationOnce(() => { throw new Error('soxi not found') })
        .mockImplementationOnce(() => { throw new Error('mediainfo not found') })

      mockFs.statSync.mockReturnValue({ size: 1024 } as any) // Very small file

      const result = await AudioProcessor.extractAudioDuration('/path/to/audio.wav')

      expect(result).toBe(1)
    })
  })

  describe('validateAudioFile', () => {
    it('should return true for valid audio file', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.statSync.mockReturnValue({ size: 1024 * 1024 } as any) // 1MB
      MockExecSync.mockReturnValue('120.5' as any)

      const result = await AudioProcessor.validateAudioFile('/path/to/audio.wav')

      expect(result).toBe(true)
    })

    it('should return false for non-existent file', async () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = await AudioProcessor.validateAudioFile('/path/to/nonexistent.wav')

      expect(result).toBe(false)
    })

    it('should return false for very small file', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.statSync.mockReturnValue({ size: 512 } as any) // Less than 1KB

      const result = await AudioProcessor.validateAudioFile('/path/to/small.wav')

      expect(result).toBe(false)
    })

    it('should return false when duration extraction fails', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.statSync.mockReturnValue({ size: 1024 * 1024 } as any)
      // Mock extractAudioDuration to throw an error
      const mockExtractDuration = jest.spyOn(AudioProcessor, 'extractAudioDuration').mockRejectedValue(new Error('Duration extraction failed'))

      const result = await AudioProcessor.validateAudioFile('/path/to/audio.wav')

      expect(result).toBe(false)
      mockExtractDuration.mockRestore()
    })
  })

  describe('getAudioMetadata', () => {
    it('should return detailed metadata when ffprobe succeeds', async () => {
      MockExecSync
        .mockReturnValueOnce('120.5' as any) // Duration
        .mockReturnValueOnce('44100,2,16' as any) // Sample rate, channels, bit depth

      const result = await AudioProcessor.getAudioMetadata('/path/to/audio.wav')

      expect(result).toEqual({
        duration: 121,
        format: 'audio/wav',
        sampleRate: 44100,
        channels: 2,
        bitDepth: 16
      })
    })

    it('should return basic metadata when ffprobe fails', async () => {
      MockExecSync
        .mockReturnValueOnce('180.2' as any) // Duration
        .mockImplementationOnce(() => { throw new Error('ffprobe failed') })

      const result = await AudioProcessor.getAudioMetadata('/path/to/audio.wav')

      expect(result).toEqual({
        duration: 180,
        format: 'audio/wav'
      })
    })
  })

  describe('isFileCorrupted', () => {
    it('should return true for corrupted file with zero duration', async () => {
      MockExecSync.mockReturnValue('0' as any)

      const result = await AudioProcessor.isFileCorrupted('/path/to/corrupted.wav')

      expect(result).toBe(true)
    })

    it('should return true for corrupted file with excessive duration', async () => {
      MockExecSync.mockReturnValue('7200' as any) // 2 hours

      const result = await AudioProcessor.isFileCorrupted('/path/to/corrupted.wav')

      expect(result).toBe(true)
    })

    it('should return false for valid file', async () => {
      MockExecSync.mockReturnValue('120.5' as any) // 2 minutes

      const result = await AudioProcessor.isFileCorrupted('/path/to/valid.wav')

      expect(result).toBe(false)
    })

    it('should return true when duration extraction fails', async () => {
      // Mock extractAudioDuration to throw an error
      const mockExtractDuration = jest.spyOn(AudioProcessor, 'extractAudioDuration').mockRejectedValue(new Error('Extraction failed'))

      const result = await AudioProcessor.isFileCorrupted('/path/to/audio.wav')

      expect(result).toBe(true)
      mockExtractDuration.mockRestore()
    })
  })
})
