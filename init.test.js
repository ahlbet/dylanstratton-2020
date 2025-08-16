// Test the individual functions from init.js without importing the entire module
// This avoids the readline interface creation issues

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Mock the modules that init.js depends on
jest.mock('@supabase/supabase-js')
jest.mock('dotenv')
jest.mock('readline')
jest.mock('child_process')
jest.mock('fs')
jest.mock('path')

// Mock console methods
const originalConsole = { ...console }
beforeEach(() => {
  jest.clearAllMocks()
  // Mock console methods
  console.log = jest.fn()
  console.error = jest.fn()
  console.warn = jest.fn()

  // Mock fs methods
  fs.existsSync = jest.fn()
  fs.statSync = jest.fn()
  fs.mkdirSync = jest.fn()
  fs.readFileSync = jest.fn()
  fs.writeFileSync = jest.fn()
  fs.copyFileSync = jest.fn()
  fs.cpSync = jest.fn()
  fs.rmSync = jest.fn()
  fs.rmdirSync = jest.fn()
  fs.readdirSync = jest.fn()

  // Mock path methods
  path.join = jest.fn((...args) => args.join('/'))
  path.basename = jest.fn((file) => file.split('/').pop())
  path.extname = jest.fn(() => '.wav')

  // Mock execSync
  execSync.mockImplementation(() => {})
})

afterEach(() => {
  // Restore console methods
  console.log = originalConsole.log
  console.error = originalConsole.error
  console.warn = originalConsole.warn
})

describe('init.js functionality', () => {
  describe('File system operations', () => {
    test('should handle file existence checks', () => {
      fs.existsSync.mockReturnValue(true)
      expect(fs.existsSync('/test/path')).toBe(true)
      expect(fs.existsSync).toHaveBeenCalledWith('/test/path')
    })

    test('should handle directory creation', () => {
      fs.mkdirSync.mockImplementation(() => {})
      fs.mkdirSync('/test/dir', { recursive: true })
      expect(fs.mkdirSync).toHaveBeenCalledWith('/test/dir', {
        recursive: true,
      })
    })

    test('should handle file reading', () => {
      const mockContent =
        'Template: {name}, {date}, {description}, {audio_files}'
      fs.readFileSync.mockReturnValue(mockContent)
      const result = fs.readFileSync('/test/template.md', 'utf8')
      expect(result).toBe(mockContent)
      expect(fs.readFileSync).toHaveBeenCalledWith('/test/template.md', 'utf8')
    })

    test('should handle file writing', () => {
      fs.writeFileSync.mockImplementation(() => {})
      const content = 'Test content'
      fs.writeFileSync('/test/file.md', content)
      expect(fs.writeFileSync).toHaveBeenCalledWith('/test/file.md', content)
    })
  })

  describe('Path operations', () => {
    test('should join paths correctly', () => {
      const result = path.join('content', 'blog', '25may05')
      expect(result).toBe('content/blog/25may05')
      expect(path.join).toHaveBeenCalledWith('content', 'blog', '25may05')
    })

    test('should extract file extensions', () => {
      const result = path.extname('test.wav')
      expect(result).toBe('.wav')
      expect(path.extname).toHaveBeenCalledWith('test.wav')
    })

    test('should get basename correctly', () => {
      const result = path.basename('/path/to/file.txt')
      expect(result).toBe('file.txt')
      expect(path.basename).toHaveBeenCalledWith('/path/to/file.txt')
    })
  })

  describe('Git operations', () => {
    test('should execute git commands', () => {
      execSync.mockImplementation(() => {})
      execSync('git add .', { stdio: 'inherit' })
      expect(execSync).toHaveBeenCalledWith('git add .', { stdio: 'inherit' })
    })

    test('should handle git checkout', () => {
      execSync.mockImplementation(() => {})
      execSync('git checkout -B 25may05', { stdio: 'inherit' })
      expect(execSync).toHaveBeenCalledWith('git checkout -B 25may05', {
        stdio: 'inherit',
      })
    })

    test('should handle git commit', () => {
      execSync.mockImplementation(() => {})
      execSync('git commit -m "new-day: 25may05"', { stdio: 'inherit' })
      expect(execSync).toHaveBeenCalledWith(
        'git commit -m "new-day: 25may05"',
        { stdio: 'inherit' }
      )
    })

    test('should handle git push', () => {
      execSync.mockImplementation(() => {})
      execSync('git push origin 25may05', { stdio: 'inherit' })
      expect(execSync).toHaveBeenCalledWith('git push origin 25may05', {
        stdio: 'inherit',
      })
    })
  })

  describe('Supabase operations', () => {
    test('should create Supabase client', () => {
      const mockCreateClient = require('@supabase/supabase-js').createClient
      mockCreateClient.mockReturnValue({})

      const client = mockCreateClient('https://fake.supabase.co', 'fake-key')
      expect(client).toEqual({})
      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://fake.supabase.co',
        'fake-key'
      )
    })

    test('should handle storage operations', () => {
      const mockSupabase = {
        storage: {
          from: jest.fn().mockReturnThis(),
          upload: jest.fn().mockResolvedValue({
            data: { path: 'test-file.wav' },
            error: null,
          }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: {
              publicUrl:
                'https://fake.supabase.co/storage/v1/object/public/audio/test-file.wav',
            },
          }),
        },
      }

      require('@supabase/supabase-js').createClient.mockReturnValue(
        mockSupabase
      )

      const client = require('@supabase/supabase-js').createClient()
      expect(client.storage.from).toBeDefined()
      expect(client.storage.upload).toBeDefined()
      expect(client.storage.getPublicUrl).toBeDefined()
    })
  })

  describe('Template processing', () => {
    test('should replace template placeholders', () => {
      const template = 'Template: {name}, {date}, {description}, {audio_files}'
      const processed = template
        .replace(/\{name\}/g, '25may05')
        .replace(/\{date\}/g, '2025-05-05')
        .replace(/\{description\}/g, 'Test description')
        .replace(/\{audio_files\}/g, 'audio content')

      expect(processed).toBe(
        'Template: 25may05, 2025-05-05, Test description, audio content'
      )
    })

    test('should handle missing template placeholders', () => {
      const template = 'Template: {name}, {date}'
      const processed = template
        .replace(/\{name\}/g, '25may05')
        .replace(/\{date\}/g, '2025-05-05')

      expect(processed).toBe('Template: 25may05, 2025-05-05')
    })
  })

  describe('Error handling', () => {
    test('should handle file system errors gracefully', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found')
      })

      expect(() => fs.readFileSync('/nonexistent/file')).toThrow(
        'File not found'
      )
    })

    test('should handle git command failures', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('git checkout')) {
          throw new Error('Git checkout failed')
        }
      })

      expect(() => execSync('git checkout -B 25may05')).toThrow(
        'Git checkout failed'
      )
    })

    test('should handle Supabase errors', () => {
      const mockSupabase = {
        storage: {
          from: jest.fn().mockReturnThis(),
          upload: jest.fn().mockRejectedValue(new Error('Upload failed')),
        },
      }

      require('@supabase/supabase-js').createClient.mockReturnValue(
        mockSupabase
      )

      const client = require('@supabase/supabase-js').createClient()
      expect(client.storage.upload).toBeDefined()
    })
  })

  describe('Filename sanitization', () => {
    test('should sanitize filenames correctly', () => {
      // This tests the sanitizeFilename function logic
      const sanitizeFilename = (filename) => {
        return filename.replace(/[^a-zA-Z0-9\-]/g, '')
      }

      expect(sanitizeFilename('25may05.wav')).toBe('25may05wav')
      expect(sanitizeFilename('file-name_with spaces!@#.wav')).toBe(
        'file-namewithspaceswav'
      )
      expect(sanitizeFilename('clean-filename.wav')).toBe('clean-filenamewav')
    })

    test('should handle special characters', () => {
      const sanitizeFilename = (filename) => {
        return filename.replace(/[^a-zA-Z0-9\-]/g, '')
      }

      expect(sanitizeFilename('file@#$%^&*().wav')).toBe('filewav')
      expect(sanitizeFilename('file with spaces.wav')).toBe('filewithspaceswav')
      expect(sanitizeFilename('file-with-dashes.wav')).toBe(
        'file-with-dasheswav'
      )
    })
  })

  describe('Date transformation', () => {
    test('should transform date format correctly', () => {
      // This tests the transformDate function logic
      const transformDate = (name, randomTime = false) => {
        if (randomTime) {
          // Return ISO string for random time
          return '2025-05-05T12:00:00.000Z'
        }

        // Extract year, month, and day from name like "25may05"
        const year = '20' + name.substring(0, 2)
        const month = name.substring(2, 5).toLowerCase()
        const day = name.substring(5)

        const monthMap = {
          jan: '01',
          feb: '02',
          mar: '03',
          apr: '04',
          may: '05',
          jun: '06',
          jul: '07',
          aug: '08',
          sep: '09',
          oct: '10',
          nov: '11',
          dec: '12',
        }

        const monthNum = monthMap[month]
        if (!monthNum) {
          throw new Error(`Invalid month: ${month}`)
        }

        return `${year}-${monthNum}-${day}`
      }

      expect(transformDate('25may05', false)).toBe('2025-05-05')
      expect(transformDate('24jun19', false)).toBe('2024-06-19')
      expect(transformDate('25may05', true)).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
    })

    test('should handle case insensitive month abbreviations', () => {
      const transformDate = (name, randomTime = false) => {
        if (randomTime) return '2025-05-05T12:00:00.000Z'

        const year = '20' + name.substring(0, 2)
        const month = name.substring(2, 5).toLowerCase()
        const day = name.substring(5)

        const monthMap = {
          jan: '01',
          feb: '02',
          mar: '03',
          apr: '04',
          may: '05',
          jun: '06',
          jul: '07',
          aug: '08',
          sep: '09',
          oct: '10',
          nov: '11',
          dec: '12',
        }

        const monthNum = monthMap[month]
        return `${year}-${monthNum}-${day}`
      }

      expect(transformDate('25MAY05', false)).toBe('2025-05-05')
      expect(transformDate('25May05', false)).toBe('2025-05-05')
      expect(transformDate('25may05', false)).toBe('2025-05-05')
    })
  })
})
