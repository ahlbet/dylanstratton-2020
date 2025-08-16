const { createClient } = require('@supabase/supabase-js')

// Mock modules
jest.mock('@supabase/supabase-js')
jest.mock('dotenv')

// Mock console methods to capture output
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}
global.console = mockConsole

// Mock process.argv and process.exit
const mockProcess = {
  argv: ['node', 'scripts/fetch-all-audio-from-supabase.js'],
  exit: jest.fn(),
  cwd: jest.fn().mockReturnValue('/mock/cwd'),
}
global.process = mockProcess

// Mock process.env
global.process.env = {}

describe('fetch-all-audio-from-supabase.js', () => {
  let mockSupabaseClient
  let mockStorage

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset process.argv
    mockProcess.argv = ['node', 'scripts/fetch-all-audio-from-supabase.js']

    // Mock Supabase client
    mockStorage = {
      from: jest.fn().mockReturnThis(),
      download: jest.fn(),
      list: jest.fn(),
    }

    mockSupabaseClient = {
      storage: mockStorage,
    }

    createClient.mockReturnValue(mockSupabaseClient)

    // Mock environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

    // Clear module cache to ensure fresh imports
    jest.resetModules()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('help functionality', () => {
    it('should show help when --help flag is used', () => {
      mockProcess.argv = [
        'node',
        'scripts/fetch-all-audio-from-supabase.js',
        '--help',
      ]

      // Import the script to trigger help
      require('./fetch-all-audio-from-supabase.js')

      expect(mockConsole.log).toHaveBeenCalledWith(
        '🎵 Fetch Missing Audio from Supabase'
      )
      expect(mockConsole.log).toHaveBeenCalledWith('')
      expect(mockConsole.log).toHaveBeenCalledWith('Usage:')
      expect(mockProcess.exit).toHaveBeenCalledWith(0)
    })

    it('should show help when -h flag is used', () => {
      mockProcess.argv = [
        'node',
        'scripts/fetch-all-audio-from-supabase.js',
        '-h',
      ]

      require('./fetch-all-audio-from-supabase.js')

      expect(mockConsole.log).toHaveBeenCalledWith(
        '🎵 Fetch Missing Audio from Supabase'
      )
      expect(mockProcess.exit).toHaveBeenCalledWith(0)
    })
  })

  describe('dry run mode', () => {
    it('should detect dry run mode', async () => {
      mockProcess.argv = [
        'node',
        'scripts/fetch-all-audio-from-supabase.js',
        '--dry-run',
      ]

      const {
        fetchMissingAudioFromSupabase,
      } = require('./fetch-all-audio-from-supabase.js')
      await fetchMissingAudioFromSupabase()

      expect(mockConsole.log).toHaveBeenCalledWith(
        '🔍 DRY RUN MODE - No files will be downloaded'
      )
    })
  })

  describe('error handling', () => {
    it('should handle missing Supabase credentials', async () => {
      delete process.env.SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      const {
        fetchMissingAudioFromSupabase,
      } = require('./fetch-all-audio-from-supabase.js')
      await fetchMissingAudioFromSupabase()

      expect(mockConsole.error).toHaveBeenCalledWith(
        '❌ Missing Supabase credentials'
      )
      expect(mockConsole.log).toHaveBeenCalledWith(
        'Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file'
      )
    })
  })

  describe('script structure', () => {
    it('should export the main function', () => {
      const script = require('./fetch-all-audio-from-supabase.js')
      expect(script).toHaveProperty('fetchMissingAudioFromSupabase')
      expect(typeof script.fetchMissingAudioFromSupabase).toBe('function')
    })

    it('should have proper module structure', () => {
      const script = require('./fetch-all-audio-from-supabase.js')
      expect(script).toBeDefined()
      expect(typeof script).toBe('object')
    })
  })
})
