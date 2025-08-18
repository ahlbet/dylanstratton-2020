import { SupabaseManager } from './supabase-manager'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js')
const MockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock fs module
jest.mock('fs')
const mockFs = fs as jest.Mocked<typeof fs>

// Mock path module
jest.mock('path')
const mockPath = path as jest.Mocked<typeof path>

describe('SupabaseManager', () => {
  let supabaseManager: SupabaseManager
  let mockSupabaseClient: jest.Mocked<SupabaseClient>
  let mockStorage: any
  let mockFrom: any
  let mockUpload: any
  let mockGetPublicUrl: any
  let mockTable: any
  let mockInsert: any
  let mockSelect: any
  let mockSingle: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    
    // Mock path.extname
    mockPath.extname.mockImplementation((filePath) => {
      const match = filePath.match(/\.(\w+)$/)
      return match ? `.${match[1]}` : ''
    })
    
    // Create mock Supabase client
    mockStorage = {
      from: jest.fn(),
      getBucket: jest.fn()
    }
    
    mockFrom = jest.fn()
    mockUpload = jest.fn()
    mockGetPublicUrl = jest.fn()
    
    mockTable = jest.fn()
    mockInsert = jest.fn()
    mockSelect = jest.fn()
    mockSingle = jest.fn()
    
    mockSupabaseClient = {
      storage: mockStorage,
      from: mockTable
    } as any
    
    MockCreateClient.mockReturnValue(mockSupabaseClient)
    
    // Setup default mock implementations
    mockStorage.from.mockReturnValue(mockFrom)
    mockFrom.upload = mockUpload
    mockFrom.getPublicUrl = mockGetPublicUrl
    
    mockTable.mockReturnValue({
      insert: mockInsert,
      select: mockSelect
    })
    
    mockSelect.mockReturnValue({
      limit: jest.fn().mockReturnValue({
        data: [{ count: 1 }],
        error: null
      })
    })
  })

  afterEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  describe('constructor', () => {
    it('should create Supabase client with environment variables', () => {
      supabaseManager = new SupabaseManager()
      
      expect(MockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key'
      )
      expect(supabaseManager.client).toBe(mockSupabaseClient)
    })

    it('should throw error when SUPABASE_URL is missing', () => {
      delete process.env.SUPABASE_URL
      
      expect(() => new SupabaseManager()).toThrow(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required'
      )
    })

    it('should throw error when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      
      expect(() => new SupabaseManager()).toThrow(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required'
      )
    })
  })

  describe('uploadToStorage', () => {
    beforeEach(() => {
      supabaseManager = new SupabaseManager()
    })

    it('should upload buffer to storage successfully', async () => {
      const mockBuffer = Buffer.from('test data')
      const mockUploadResult = { data: { path: 'test.wav' }, error: null }
      const mockUrlResult = { data: { publicUrl: 'https://example.com/test.wav' } }
      
      mockUpload.mockResolvedValue(mockUploadResult)
      mockGetPublicUrl.mockReturnValue(mockUrlResult)
      
      const result = await supabaseManager.uploadToStorage(mockBuffer, 'test.wav', 'audio')
      
      expect(mockUpload).toHaveBeenCalledWith('test.wav', mockBuffer, {
        contentType: 'audio/wav',
        upsert: false
      })
      expect(result).toBe('https://example.com/test.wav')
    })

    it('should upload file from path to storage successfully', async () => {
      const mockBuffer = Buffer.from('test data')
      const mockUploadResult = { data: { path: 'test.wav' }, error: null }
      const mockUrlResult = { data: { publicUrl: 'https://example.com/test.wav' } }
      
      mockFs.readFileSync.mockReturnValue(mockBuffer)
      mockUpload.mockResolvedValue(mockUploadResult)
      mockGetPublicUrl.mockReturnValue(mockUrlResult)
      
      const result = await supabaseManager.uploadToStorage('/path/to/test.wav', 'test.wav', 'audio')
      
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/path/to/test.wav')
      expect(mockUpload).toHaveBeenCalledWith('test.wav', mockBuffer, {
        contentType: 'audio/wav',
        upsert: false
      })
      expect(result).toBe('https://example.com/test.wav')
    })

    it('should use custom bucket name and content type', async () => {
      const mockBuffer = Buffer.from('test data')
      const mockUploadResult = { data: { path: 'test.png' }, error: null }
      const mockUrlResult = { data: { publicUrl: 'https://example.com/test.png' } }
      
      mockUpload.mockResolvedValue(mockUploadResult)
      mockGetPublicUrl.mockReturnValue(mockUrlResult)
      
      await supabaseManager.uploadToStorage(mockBuffer, 'test.png', 'cover-art', 'image/png')
      
      expect(mockUpload).toHaveBeenCalledWith('test.png', mockBuffer, {
        contentType: 'image/png',
        upsert: false
      })
    })

    it('should handle upload errors', async () => {
      const mockBuffer = Buffer.from('test data')
      const mockUploadResult = { data: null, error: { message: 'Upload failed' } }
      
      mockUpload.mockResolvedValue(mockUploadResult)
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      await expect(
        supabaseManager.uploadToStorage(mockBuffer, 'test.wav')
      ).rejects.toThrow('Failed to upload to Supabase: Upload failed')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Upload error for test.wav:',
        'Failed to upload to Supabase: Upload failed'
      )
      
      consoleSpy.mockRestore()
    })

    it('should handle file read errors', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found')
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      await expect(
        supabaseManager.uploadToStorage('/nonexistent/file.wav', 'test.wav')
      ).rejects.toThrow('File not found')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Upload error for test.wav:',
        'File not found'
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('createDailyEntry', () => {
    beforeEach(() => {
      supabaseManager = new SupabaseManager()
    })

    it('should create daily entry successfully', async () => {
      const mockInsertResult = { data: { id: '123' }, error: null }
      
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockInsertResult)
        })
      })
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const result = await supabaseManager.createDailyEntry('Test Post', 'cover.png', '2025-08-15')
      
      expect(mockTable).toHaveBeenCalledWith('daily')
      expect(mockInsert).toHaveBeenCalledWith([{
        title: 'Test Post',
        cover_art: 'cover.png',
        date: '2025-08-15'
      }])
      expect(result).toBe('123')
      expect(consoleSpy).toHaveBeenCalledWith('✅ Created daily entry with ID: 123')
      
      consoleSpy.mockRestore()
    })

    it('should handle database errors', async () => {
      const mockInsertResult = { data: null, error: { message: 'Database error' } }
      
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockInsertResult)
        })
      })
      
      await expect(
        supabaseManager.createDailyEntry('Test Post', null, '2025-08-15')
      ).rejects.toThrow('Failed to create daily entry: Database error')
    })

    it('should handle missing data response', async () => {
      const mockInsertResult = { data: null, error: null }
      
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockInsertResult)
        })
      })
      
      await expect(
        supabaseManager.createDailyEntry('Test Post', null, '2025-08-15')
      ).rejects.toThrow('No data returned from daily entry creation')
    })
  })

  describe('uploadMarkovTexts', () => {
    beforeEach(() => {
      supabaseManager = new SupabaseManager()
    })

    it('should upload Markov texts successfully', async () => {
      const mockTexts = [
        { text_content: 'Text 1', coherency_level: 0.8, daily_id: '123', text_length: 6 }
      ]
      const mockInsertResult = { error: null }
      
      mockInsert.mockResolvedValue(mockInsertResult)
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await supabaseManager.uploadMarkovTexts(mockTexts)
      
      expect(mockTable).toHaveBeenCalledWith('markov_texts')
      expect(mockInsert).toHaveBeenCalledWith(mockTexts)
      expect(consoleSpy).toHaveBeenCalledWith('✅ Successfully uploaded 1 Markov texts')
      
      consoleSpy.mockRestore()
    })

    it('should handle empty texts array', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await supabaseManager.uploadMarkovTexts([])
      
      expect(mockTable).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('No Markov texts to upload')
      
      consoleSpy.mockRestore()
    })

    it('should handle database errors', async () => {
      const mockTexts = [{ text_content: 'Text 1', coherency_level: 0.8, daily_id: '123', text_length: 6 }]
      const mockInsertResult = { error: { message: 'Database error' } }
      
      mockInsert.mockResolvedValue(mockInsertResult)
      
      await expect(
        supabaseManager.uploadMarkovTexts(mockTexts)
      ).rejects.toThrow('Failed to upload Markov texts: Database error')
    })
  })

  describe('testConnection', () => {
    beforeEach(() => {
      supabaseManager = new SupabaseManager()
    })

    it('should return true for successful connection', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const result = await supabaseManager.testConnection()
      
      expect(mockTable).toHaveBeenCalledWith('daily')
      expect(result).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('✅ Supabase connection successful')
      
      consoleSpy.mockRestore()
    })

    it('should return false for failed connection', async () => {
      const mockSelectResult = { data: null, error: { message: 'Connection failed' } }
      
      mockSelect.mockReturnValue({
        limit: jest.fn().mockReturnValue(mockSelectResult)
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const result = await supabaseManager.testConnection()
      
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('❌ Supabase connection failed:', 'Connection test failed: Connection failed')
      
      consoleSpy.mockRestore()
    })
  })

  describe('getBucketInfo', () => {
    beforeEach(() => {
      supabaseManager = new SupabaseManager()
    })

    it('should return bucket information successfully', async () => {
      const mockBucketInfo = { name: 'audio', public: false }
      const mockGetBucketResult = { data: mockBucketInfo, error: null }
      
      mockStorage.getBucket.mockResolvedValue(mockGetBucketResult)
      
      const result = await supabaseManager.getBucketInfo('audio')
      
      expect(mockStorage.getBucket).toHaveBeenCalledWith('audio')
      expect(result).toEqual(mockBucketInfo)
    })

    it('should handle bucket info errors', async () => {
      const mockGetBucketResult = { data: null, error: { message: 'Bucket not found' } }
      
      mockStorage.getBucket.mockResolvedValue(mockGetBucketResult)
      
      await expect(
        supabaseManager.getBucketInfo('nonexistent')
      ).rejects.toThrow('Failed to get bucket info: Bucket not found')
    })
  })

  describe('private methods', () => {
    beforeEach(() => {
      supabaseManager = new SupabaseManager()
    })

    describe('getStoragePath', () => {
      it('should generate storage path with timestamp and sanitized filename', () => {
        // Access private method using bracket notation
        const result = (supabaseManager as any).getStoragePath('test file.wav')
        
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-test_file\.wav$/)
      })
    })

    describe('getContentTypeFromPath', () => {
      it('should return correct content type for audio files', () => {
        const result = (supabaseManager as any).getContentTypeFromPath('test.wav')
        expect(result).toBe('audio/wav')
      })

      it('should return correct content type for image files', () => {
        const result = (supabaseManager as any).getContentTypeFromPath('test.png')
        expect(result).toBe('image/png')
      })

      it('should return default content type for unknown extensions', () => {
        const result = (supabaseManager as any).getContentTypeFromPath('test.xyz')
        expect(result).toBe('application/octet-stream')
      })
    })

    describe('getBucketName', () => {
      it('should return cover-art bucket for image files', () => {
        const result = (supabaseManager as any).getBucketName('test.png')
        expect(result).toBe('cover-art')
      })

      it('should return audio bucket for audio files', () => {
        const result = (supabaseManager as any).getBucketName('test.wav')
        expect(result).toBe('audio')
      })
    })

    describe('sanitizeFileName', () => {
      it('should sanitize filename by replacing special characters', () => {
        const result = (supabaseManager as any).sanitizeFileName('test file@#$%.wav')
        expect(result).toBe('test_file_.wav')
      })

      it('should remove multiple consecutive underscores', () => {
        const result = (supabaseManager as any).sanitizeFileName('test___file.wav')
        expect(result).toBe('test_file.wav')
      })

      it('should remove leading and trailing underscores', () => {
        const result = (supabaseManager as any).sanitizeFileName('_test_file_.wav')
        expect(result).toBe('test_file_.wav')
      })
    })
  })
})
