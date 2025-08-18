import { LocalDataManager } from './local-data-manager'
import * as fs from 'fs'
import * as path from 'path'

// Mock fs module
jest.mock('fs')
const mockFs = fs as jest.Mocked<typeof fs>

// Mock path module
jest.mock('path')
const mockPath = path as jest.Mocked<typeof path>

describe('LocalDataManager', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock path.join to return predictable paths
    mockPath.join.mockImplementation((...args) => args.join('/'))
    
    // Mock Supabase client
    mockSupabase = {
      storage: {
        from: jest.fn().mockReturnValue({
          download: jest.fn()
        })
      }
    }
  })

  describe('sanitizeFilename', () => {
    it('should remove special characters except hyphens', () => {
      expect(LocalDataManager.sanitizeFilename('test-file.txt')).toBe('test-filetxt')
      expect(LocalDataManager.sanitizeFilename('file with spaces')).toBe('filewithspaces')
      expect(LocalDataManager.sanitizeFilename('file@#$%^&*()')).toBe('file')
      expect(LocalDataManager.sanitizeFilename('file-with-hyphens')).toBe('file-with-hyphens')
      expect(LocalDataManager.sanitizeFilename('file_with_underscores')).toBe('filewithunderscores')
    })

    it('should handle empty string', () => {
      expect(LocalDataManager.sanitizeFilename('')).toBe('')
    })

    it('should handle string with only special characters', () => {
      expect(LocalDataManager.sanitizeFilename('@#$%^&*()')).toBe('')
    })
  })

  describe('updateLocalAudioFiles', () => {
    it('should do nothing when no files provided', async () => {
      await LocalDataManager.updateLocalAudioFiles([], mockSupabase)
      expect(mockFs.existsSync).not.toHaveBeenCalled()
    })

    it('should do nothing when files array is null', async () => {
      await LocalDataManager.updateLocalAudioFiles(null as any, mockSupabase)
      expect(mockFs.existsSync).not.toHaveBeenCalled()
    })

    it('should create local audio directory if it does not exist', async () => {
      const mockFiles = [{ fileName: 'test.wav' }]
      mockFs.existsSync.mockReturnValue(false)
      mockSupabase.storage.from.mockReturnValue({
        download: jest.fn().mockResolvedValue({
          data: { arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)) },
          error: null
        })
      })

      await LocalDataManager.updateLocalAudioFiles(mockFiles, mockSupabase)

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('static/local-audio'),
        { recursive: true }
      )
    })

    it('should download and save audio files successfully', async () => {
      const mockFiles = [{ fileName: 'test.wav' }]
      const mockBuffer = Buffer.from('test audio data')
      
      mockFs.existsSync.mockReturnValue(true)
      mockSupabase.storage.from.mockReturnValue({
        download: jest.fn().mockResolvedValue({
          data: { arrayBuffer: jest.fn().mockResolvedValue(mockBuffer.buffer) },
          error: null
        })
      })

      await LocalDataManager.updateLocalAudioFiles(mockFiles, mockSupabase)

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('static/local-audio/test.wav'),
        expect.any(Buffer)
      )
    })

    it('should handle download errors gracefully', async () => {
      const mockFiles = [{ fileName: 'test.wav' }]
      mockFs.existsSync.mockReturnValue(true)
      mockSupabase.storage.from.mockReturnValue({
        download: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Download failed' }
        })
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      await LocalDataManager.updateLocalAudioFiles(mockFiles, mockSupabase)

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ Failed to download test.wav:',
        'Download failed'
      )
      consoleSpy.mockRestore()
    })

    it('should handle file write errors gracefully', async () => {
      const mockFiles = [{ fileName: 'test.wav' }]
      mockFs.existsSync.mockReturnValue(true)
      mockSupabase.storage.from.mockReturnValue({
        download: jest.fn().mockResolvedValue({
          data: { arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)) },
          error: null
        })
      })
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed')
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      await LocalDataManager.updateLocalAudioFiles(mockFiles, mockSupabase)

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ Failed to add test.wav to local audio:',
        'Write failed'
      )
      consoleSpy.mockRestore()
    })
  })

  describe('updateLocalMarkovTexts', () => {
    it('should do nothing when no texts provided', async () => {
      await LocalDataManager.updateLocalMarkovTexts([], 'test-post')
      expect(mockFs.existsSync).not.toHaveBeenCalled()
    })

    it('should do nothing when texts array is null', async () => {
      await LocalDataManager.updateLocalMarkovTexts(null as any, 'test-post')
      expect(mockFs.existsSync).not.toHaveBeenCalled()
    })

    it('should create local data directory if it does not exist', async () => {
      const mockTexts = [{ text_content: 'Test text', text_length: 10, coherency_level: 0.8 }]
      mockFs.existsSync.mockReturnValue(false)

      await LocalDataManager.updateLocalMarkovTexts(mockTexts, 'test-post')

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('static/local-data'),
        { recursive: true }
      )
    })

    it('should create new markov-texts.json file when none exists', async () => {
      const mockTexts = [{ text_content: 'Test text', text_length: 10, coherency_level: 0.8 }]
      mockFs.existsSync.mockReturnValue(false)

      await LocalDataManager.updateLocalMarkovTexts(mockTexts, 'test-post')

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('static/local-data/markov-texts.json'),
        expect.stringContaining('"texts":')
      )
    })

    it('should append to existing markov-texts.json file', async () => {
      const mockTexts = [{ text_content: 'New text', text_length: 8, coherency_level: 0.9 }]
      const existingData = {
        texts: [
          { id: 1, text_content: 'Existing text', text_length: 12, coherency_level: 0.7 }
        ]
      }
      
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingData))

      await LocalDataManager.updateLocalMarkovTexts(mockTexts, 'test-post')

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('static/local-data/markov-texts.json'),
        expect.stringContaining('"id": 2')
      )
    })

    it('should handle JSON parse errors gracefully', async () => {
      const mockTexts = [{ text_content: 'Test text', text_length: 10, coherency_level: 0.8 }]
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue('invalid json')

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      await LocalDataManager.updateLocalMarkovTexts(mockTexts, 'test-post')

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ Failed to update local Markov texts:',
        expect.any(String)
      )
      consoleSpy.mockRestore()
    })
  })

  describe('updateLocalCoverArt', () => {
    it('should do nothing when no cover art buffer provided', async () => {
      await LocalDataManager.updateLocalCoverArt('test-post', null as any)
      expect(mockFs.existsSync).not.toHaveBeenCalled()
    })

    it('should create local cover art directory if it does not exist', async () => {
      const mockBuffer = Buffer.from('test image data')
      mockFs.existsSync.mockReturnValue(false)

      await LocalDataManager.updateLocalCoverArt('test-post', mockBuffer)

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('static/local-cover-art'),
        { recursive: true }
      )
    })

    it('should save cover art with sanitized filename', async () => {
      const mockBuffer = Buffer.from('test image data')
      mockFs.existsSync.mockReturnValue(true)

      await LocalDataManager.updateLocalCoverArt('test-post with spaces!', mockBuffer)

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('static/local-cover-art/test-postwithspaces.png'),
        mockBuffer
      )
    })

    it('should handle file write errors gracefully', async () => {
      const mockBuffer = Buffer.from('test image data')
      mockFs.existsSync.mockReturnValue(true)
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed')
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      await LocalDataManager.updateLocalCoverArt('test-post', mockBuffer)

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ Failed to update local cover art:',
        'Write failed'
      )
      consoleSpy.mockRestore()
    })
  })

  describe('updateAllLocalData', () => {
    it('should call all update methods successfully', async () => {
      const mockFiles = [{ fileName: 'test.wav' }]
      const mockTexts = [{ text_content: 'Test text', text_length: 10, coherency_level: 0.8 }]
      const mockCoverArt = Buffer.from('test image data')
      
      mockFs.existsSync.mockReturnValue(true)
      mockSupabase.storage.from.mockReturnValue({
        download: jest.fn().mockResolvedValue({
          data: { arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)) },
          error: null
        })
      })

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await LocalDataManager.updateAllLocalData(mockFiles, mockTexts, 'test-post', mockCoverArt, mockSupabase)

      // Check that the first call contains the start message
      expect(consoleSpy.mock.calls[0][0]).toContain('🔄 Updating local development data...')
      // Check that the last call contains the success message
      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toContain('✅ Local development data updated successfully!')
      consoleSpy.mockRestore()
    })

    it('should handle errors gracefully and show manual update message', async () => {
      const mockFiles = [{ fileName: 'test.wav' }]
      const mockTexts = [{ text_content: 'Test text', text_length: 10, coherency_level: 0.8 }]
      const mockCoverArt = Buffer.from('test image data')
      
      // Mock fs.existsSync to throw an error in the main method
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system error')
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const logSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await LocalDataManager.updateAllLocalData(mockFiles, mockTexts, 'test-post', mockCoverArt, mockSupabase)

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ Failed to update local development data:',
        'File system error'
      )
      // Check that one of the log calls contains the manual update message
      const manualUpdateCall = logSpy.mock.calls.find(call => 
        call[0] && call[0].includes('You can manually update local data with: yarn generate-local-data')
      )
      expect(manualUpdateCall).toBeDefined()
      consoleSpy.mockRestore()
      logSpy.mockRestore()
    })

    it('should skip cover art update when no buffer provided', async () => {
      const mockFiles = [{ fileName: 'test.wav' }]
      const mockTexts = [{ text_content: 'Test text', text_length: 10, coherency_level: 0.8 }]
      
      mockFs.existsSync.mockReturnValue(true)
      mockSupabase.storage.from.mockReturnValue({
        download: jest.fn().mockResolvedValue({
          data: { arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)) },
          error: null
        })
      })

      await LocalDataManager.updateAllLocalData(mockFiles, mockTexts, 'test-post', null, mockSupabase)

      // Should still update audio files and texts, but not cover art
      expect(mockFs.writeFileSync).toHaveBeenCalled()
    })
  })
})
