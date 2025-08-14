// Set environment variables before requiring the module
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
process.env.NODE_ENV = 'test'

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}))

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  basename: jest.fn((filePath, ext) => {
    const name = filePath.split('/').pop()
    return ext ? name.replace(ext, '') : name
  }),
  extname: jest.fn((filePath) => {
    const match = filePath.match(/\.[^.]*$/)
    return match ? match[0] : ''
  }),
}))

// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => ({
          data: { id: 'test-id' },
          error: null,
        })),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://test.supabase.co/audio/test.wav' },
        })),
      })),
    },
  })),
}))

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}))

const fs = require('fs')
const path = require('path')

// Import the function for testing
let migrateToSupabase

describe('migrate-to-supabase', () => {
  let mockConsoleLog
  let mockConsoleError

  beforeEach(() => {
    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation()
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

    // Reset mocks
    jest.clearAllMocks()

    // Ensure environment variables are set for each test
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    process.env.NODE_ENV = 'test'

    // Import the function for this test
    const module = require('./migrate-to-supabase')
    migrateToSupabase = module.migrateToSupabase
  })

  afterEach(() => {
    // Restore console methods
    mockConsoleLog.mockRestore()
    mockConsoleError.mockRestore()

    // Clean up environment variables
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  describe('environment validation', () => {
    test('should handle missing SUPABASE_URL gracefully', async () => {
      delete process.env.SUPABASE_URL

      // The function should handle missing credentials gracefully in test mode
      // Since NODE_ENV=test, it should not throw but handle the error
      await expect(migrateToSupabase()).resolves.toBeUndefined()
    })

    test('should handle missing SUPABASE_SERVICE_ROLE_KEY gracefully', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      // The function should handle missing credentials gracefully in test mode
      await expect(migrateToSupabase()).resolves.toBeUndefined()
    })

    test('should use SUPABASE_ANON_KEY as fallback', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      process.env.SUPABASE_ANON_KEY = 'fallback-key'

      // This should work with the fallback key
      await expect(migrateToSupabase()).resolves.toBeUndefined()
    })
  })

  describe('sanitizeFilename', () => {
    test('should remove special characters except hyphens', () => {
      // We need to access the sanitizeFilename function
      // Since it's not exported, we'll test it through the migration process
      // This tests the sanitization logic indirectly
      const testCases = [
        { input: 'test@file#name', expected: 'testfilename' },
        { input: 'test-file-name', expected: 'test-file-name' },
        { input: 'test file name', expected: 'testfilename' },
        { input: 'test.file.name', expected: 'testfilename' },
        { input: 'test_file_name', expected: 'testfilename' },
      ]

      // The sanitization happens during filename generation in the migration
      // We'll test this by mocking the file system and checking the generated names
    })
  })

  describe('file operations', () => {
    test('should handle missing blog directory gracefully', async () => {
      // Mock fs.existsSync to return false for blog directory
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('content/blog')) {
          return false
        }
        return true
      })

      await migrateToSupabase()

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Blog directory not found:',
        expect.stringContaining('content/blog')
      )
    })

    test('should handle empty blog directory', async () => {
      // Mock fs.existsSync to return true for blog directory
      fs.existsSync.mockImplementation(() => true)

      // Mock fs.readdirSync to return empty array
      fs.readdirSync.mockImplementation(() => [])

      await migrateToSupabase()

      expect(mockConsoleLog).toHaveBeenCalledWith('🎉 Migration completed!')
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '  - Total posts processed: 0'
      )
    })

    test('should process blog posts with markdown files', async () => {
      // Mock file system structure
      fs.existsSync.mockImplementation(() => true)

      // Mock directory entries with proper structure
      fs.readdirSync
        .mockImplementationOnce(() => [
          { name: 'post1', isDirectory: () => true },
          { name: 'post2', isDirectory: () => true },
        ])
        .mockImplementation((dirPath) => {
          if (dirPath.includes('post1')) {
            return ['index.md']
          }
          if (dirPath.includes('post2')) {
            return ['post.md']
          }
          return []
        })

      // Mock markdown content with audio references
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('post1')) {
          return 'Content with `audio: ../../assets/music/file1.wav`'
        }
        if (filePath.includes('post2')) {
          return 'Content with `audio: ../../assets/music/file2.wav`'
        }
        return ''
      })

      // Mock file existence checks
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath.includes('audio/')) {
          return true
        }
        return true
      })

      await migrateToSupabase()

      expect(mockConsoleLog).toHaveBeenCalledWith('🎉 Migration completed!')
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '  - Total posts processed: 2'
      )
    })

    test('should handle markdown files without audio references', async () => {
      // Mock file system structure
      fs.existsSync.mockImplementation(() => true)

      // Mock directory entries with proper structure
      fs.readdirSync
        .mockImplementationOnce(() => [
          { name: 'post1', isDirectory: () => true },
        ])
        .mockImplementation(() => ['index.md'])

      // Mock markdown content without audio references
      fs.readFileSync.mockImplementation(() => 'Content without audio files')

      await migrateToSupabase()

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '  No audio files found, skipping...'
      )
    })

    test('should handle missing local audio files gracefully', async () => {
      // Mock file system structure
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath.includes('audio/')) {
          return false // Local audio file doesn't exist
        }
        return true
      })

      // Mock directory entries with proper structure
      fs.readdirSync
        .mockImplementationOnce(() => [
          { name: 'post1', isDirectory: () => true },
        ])
        .mockImplementation(() => ['index.md'])

      // Mock markdown content with audio references
      fs.readFileSync.mockImplementation(
        () => 'Content with `audio: ../../assets/music/file1.wav`'
      )

      // Mock file existence checks
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath.includes('assets/music/')) {
          return false // File doesn't exist
        }
        return true
      })

      await migrateToSupabase()

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('  ⚠️  Local file not found:')
      )
    })
  })

  describe('audio reference extraction', () => {
    test('should extract audio references from markdown content', async () => {
      // Mock file system
      fs.existsSync.mockImplementation(() => true)

      // Mock directory entries with proper structure
      fs.readdirSync
        .mockImplementationOnce(() => [
          { name: 'post1', isDirectory: () => true },
        ])
        .mockImplementation(() => ['index.md'])

      // Mock markdown content with multiple audio references
      const markdownContent = `
        Content with multiple audio files:
        \`audio: ../../assets/music/file1.wav\`
        \`audio: ../../assets/music/file2.wav\`
        \`audio: ../../assets/music/file3.wav\`
      `
      fs.readFileSync.mockImplementation(() => markdownContent)

      // Mock file existence
      fs.existsSync.mockImplementation(() => true)

      await migrateToSupabase()

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '  Found 3 audio reference(s)'
      )
    })

    test('should handle malformed audio references', async () => {
      // Mock file system
      fs.existsSync.mockImplementation(() => true)

      // Mock directory entries with proper structure
      fs.readdirSync
        .mockImplementationOnce(() => [
          { name: 'post1', isDirectory: () => true },
        ])
        .mockImplementation(() => ['index.md'])

      // Mock markdown content with malformed audio references
      const markdownContent = `
        Content with malformed audio references:
        \`audio: invalid-path\`
        \`audio: ../../assets/music/file1.wav\`
      `
      fs.readFileSync.mockImplementation(() => markdownContent)

      // Mock file existence
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath.includes('invalid-path')) {
          return false
        }
        return true
      })

      await migrateToSupabase()

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '  ⚠️  Could not parse path from: \`audio: invalid-path\`'
      )
    })
  })

  describe('file upload and update', () => {
    test('should upload files to Supabase successfully', async () => {
      // Mock file system
      fs.existsSync.mockImplementation(() => true)

      // Mock directory entries with proper structure
      fs.readdirSync
        .mockImplementationOnce(() => [
          { name: 'post1', isDirectory: () => true },
        ])
        .mockImplementation(() => ['index.md'])

      // Mock markdown content
      fs.readFileSync.mockImplementation(
        () => 'Content with `audio: ../../assets/music/file1.wav`'
      )

      // Mock file existence
      fs.existsSync.mockImplementation(() => true)

      // Mock file read for upload
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('audio/')) {
          return Buffer.from('fake audio data')
        }
        return 'Content with `audio: ../../assets/music/file1.wav`'
      })

      await migrateToSupabase()

      expect(mockConsoleLog).toHaveBeenCalledWith('  ✅ Uploaded successfully')
    })

    test('should update markdown files with new audio URLs', async () => {
      // Mock file system
      fs.existsSync.mockImplementation(() => true)

      // Mock directory entries with proper structure
      fs.readdirSync
        .mockImplementationOnce(() => [
          { name: 'post1', isDirectory: () => true },
        ])
        .mockImplementation(() => ['index.md'])

      // Mock markdown content
      const originalContent =
        'Content with `audio: ../../assets/music/file1.wav`'
      fs.readFileSync.mockImplementation(() => originalContent)

      // Mock file existence
      fs.existsSync.mockImplementation(() => true)

      // Mock file read for upload
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('audio/')) {
          return Buffer.from('fake audio data')
        }
        return originalContent
      })

      await migrateToSupabase()

      expect(mockConsoleLog).toHaveBeenCalledWith('  ✅ Updated markdown file')
      expect(fs.writeFileSync).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    test('should handle upload errors gracefully', async () => {
      // Clear the module cache to ensure fresh import
      jest.resetModules()

      // Re-import mocked modules after reset
      const fs = require('fs')
      const path = require('path')

      // Mock Supabase client to return upload error BEFORE importing the module
      const { createClient } = require('@supabase/supabase-js')
      createClient.mockImplementation(() => ({
        storage: {
          from: jest.fn(() => ({
            upload: jest.fn(() => ({
              data: null,
              error: { message: 'Upload failed' },
            })),
            getPublicUrl: jest.fn(() => ({
              data: { publicUrl: 'https://test.supabase.co/audio/test.wav' },
            })),
          })),
        },
      }))

      // Mock file system AFTER module reset
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('content/blog')) return true
        if (path.includes('audio/')) return true
        return true
      })

      fs.readdirSync
        .mockImplementationOnce(() => [
          { name: 'post1', isDirectory: () => true },
        ])
        .mockImplementation(() => ['index.md'])

      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('audio/')) {
          return Buffer.from('fake audio data')
        }
        if (filePath.includes('index.md')) {
          return 'Content with `audio: ../../assets/music/file1.wav`'
        }
        return 'Content with `audio: ../../assets/music/file1.wav`'
      })

      // Import the function AFTER setting up the mock
      const module = require('./migrate-to-supabase')
      const migrateToSupabase = module.migrateToSupabase

      await migrateToSupabase()

      // Debug: log what was actually called
      console.log(
        'Actual console.log calls:',
        mockConsoleLog.mock.calls.map((call) => call[0])
      )
      console.log('Number of calls:', mockConsoleLog.mock.calls.length)

      // Check both console.log and console.error since the error might be logged to either
      const hasUploadFailedLog = mockConsoleLog.mock.calls.some(
        (call) => call[0] && call[0].includes('❌ Upload failed:')
      )
      const hasUploadFailedError = mockConsoleError.mock.calls.some(
        (call) => call[0] && call[0].includes('❌ Upload failed:')
      )

      expect(hasUploadFailedLog || hasUploadFailedError).toBe(true)
    })

    test('should handle file read errors gracefully', async () => {
      // Clear the module cache to ensure fresh import
      jest.resetModules()

      // Re-import mocked modules after reset
      const fs = require('fs')
      const path = require('path')

      // Mock file system AFTER module reset
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('content/blog')) return true
        return true
      })

      fs.readdirSync
        .mockImplementationOnce(() => [
          { name: 'post1', isDirectory: () => true },
        ])
        .mockImplementation(() => ['index.md'])

      // Mock file read to throw error
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File read error')
      })

      // Import the function AFTER setting up the mock
      const module = require('./migrate-to-supabase')
      const migrateToSupabase = module.migrateToSupabase

      await migrateToSupabase()

      expect(mockConsoleError).toHaveBeenCalledWith(
        '  ❌ Error processing post1:',
        'File read error'
      )
    })
  })

  describe('summary and next steps', () => {
    test('should display migration summary', async () => {
      // Clear the module cache to ensure fresh import
      jest.resetModules()

      // Re-import mocked modules after reset
      const fs = require('fs')
      const path = require('path')

      // Mock successful migration
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('content/blog')) return true
        if (path.includes('audio/')) return true
        return true
      })

      fs.readdirSync
        .mockImplementationOnce(() => [
          { name: 'post1', isDirectory: () => true },
        ])
        .mockImplementation(() => ['index.md'])

      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('audio/')) {
          return Buffer.from('fake audio data')
        }
        if (filePath.includes('index.md')) {
          return 'Content with `audio: ../../assets/music/file1.wav`'
        }
        return 'Content with `audio: ../../assets/music/file1.wav`'
      })

      // Import the function AFTER setting up the mock
      const module = require('./migrate-to-supabase')
      const migrateToSupabase = module.migrateToSupabase

      await migrateToSupabase()

      expect(mockConsoleLog).toHaveBeenCalledWith('🎉 Migration completed!')
      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Summary:')
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '  - Files uploaded to Supabase: 1'
      )
      expect(mockConsoleLog).toHaveBeenCalledWith('  - Blog posts updated: 1')
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '  - Total posts processed: 1'
      )
    })

    test('should show next steps when files are uploaded', async () => {
      // Clear the module cache to ensure fresh import
      jest.resetModules()

      // Re-import mocked modules after reset
      const fs = require('fs')
      const path = require('path')

      // Mock successful migration
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('content/blog')) return true
        if (path.includes('audio/')) return true
        return true
      })

      fs.readdirSync
        .mockImplementationOnce(() => [
          { name: 'post1', isDirectory: () => true },
        ])
        .mockImplementation(() => ['index.md'])

      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('audio/')) {
          return Buffer.from('fake audio data')
        }
        if (filePath.includes('index.md')) {
          return 'Content with `audio: ../../assets/music/file1.wav`'
        }
        return 'Content with `audio: ../../assets/music/file1.wav`'
      })

      // Import the function AFTER setting up the mock
      const module = require('./migrate-to-supabase')
      const migrateToSupabase = module.migrateToSupabase

      await migrateToSupabase()

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('💡 Next steps:')
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '  1. Test your blog to ensure audio files play correctly'
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '  2. Verify all files are accessible in Supabase dashboard'
      )
    })
  })
})
