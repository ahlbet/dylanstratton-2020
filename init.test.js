const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const childProcess = require('child_process')

// Mock dependencies
jest.mock('fs')
jest.mock('child_process')
jest.mock('path')
jest.mock('dotenv', () => ({
  config: jest.fn(),
}))

// Mock Supabase client
const mockSupabase = {
  storage: {
    from: jest.fn().mockReturnThis(),
    upload: jest.fn(),
    getPublicUrl: jest.fn(),
  },
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue(mockSupabase),
}))

describe('transformDate function', () => {
  let transformDate

  beforeEach(() => {
    // Import the function for testing
    const {
      transformDate: transformDateUtil,
    } = require('./src/utils/date-utils')
    transformDate = transformDateUtil
  })

  test('should transform 25may05 to 2025-05-05', () => {
    const result = transformDate('25may05', false)
    expect(result).toBe('2025-05-05')
  })

  test('should transform 24jun19 to 2024-06-19', () => {
    const result = transformDate('24jun19', false)
    expect(result).toBe('2024-06-19')
  })

  test('should transform 99dec31 to 1999-12-31', () => {
    const result = transformDate('99dec31', false)
    expect(result).toBe('1999-12-31')
  })

  test('should transform 00jan01 to 2000-01-01', () => {
    const result = transformDate('00jan01', false)
    expect(result).toBe('2000-01-01')
  })

  test('should transform 50jan01 to 1950-01-01', () => {
    const result = transformDate('50jan01', false)
    expect(result).toBe('1950-01-01')
  })

  test('should handle all months correctly', () => {
    const months = [
      { abbr: 'jan', num: 1 },
      { abbr: 'feb', num: 2 },
      { abbr: 'mar', num: 3 },
      { abbr: 'apr', num: 4 },
      { abbr: 'may', num: 5 },
      { abbr: 'jun', num: 6 },
      { abbr: 'jul', num: 7 },
      { abbr: 'aug', num: 8 },
      { abbr: 'sep', num: 9 },
      { abbr: 'oct', num: 10 },
      { abbr: 'nov', num: 11 },
      { abbr: 'dec', num: 12 },
    ]

    months.forEach(({ abbr, num }) => {
      const result = transformDate(`25${abbr}15`, false)
      const expected = `2025-${num.toString().padStart(2, '0')}-15`
      expect(result).toBe(expected)
    })
  })

  test('should handle case insensitive month abbreviations', () => {
    expect(transformDate('25MAY05', false)).toBe('2025-05-05')
    expect(transformDate('25May05', false)).toBe('2025-05-05')
    expect(transformDate('25mAy05', false)).toBe('2025-05-05')
  })

  test('should throw error for invalid format', () => {
    expect(() => transformDate('invalid')).toThrow(
      'Invalid name format. Expected format like "25may05" or "24jun19", got "invalid"'
    )
  })

  test('should throw error for invalid month', () => {
    expect(() => transformDate('25xyz05')).toThrow('Invalid month: xyz')
  })

  test('should throw error for too short input', () => {
    expect(() => transformDate('25may')).toThrow(
      'Invalid name format. Expected format like "25may05" or "24jun19", got "25may"'
    )
  })

  test('should throw error for too long input', () => {
    expect(() => transformDate('25may051')).toThrow(
      'Invalid name format. Expected format like "25may05" or "24jun19", got "25may051"'
    )
  })

  test('should throw error for non-alphanumeric characters', () => {
    expect(() => transformDate('25-may-05')).toThrow(
      'Invalid name format. Expected format like "25may05" or "24jun19", got "25-may-05"'
    )
  })

  test('should handle random time parameter', () => {
    const result = transformDate('25may05', true)
    // Should return a valid date format regardless of random time
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('should return consistent date when randomTime is false', () => {
    const result1 = transformDate('25may05', false)
    const result2 = transformDate('25may05', false)
    expect(result1).toBe('2025-05-05')
    expect(result2).toBe('2025-05-05')
    expect(result1).toBe(result2)
  })

  test('should handle edge case years correctly', () => {
    expect(transformDate('49dec31', false)).toBe('2049-12-31') // 49 -> 2049
    expect(transformDate('50jan01', false)).toBe('1950-01-01') // 50 -> 1950
  })
})

describe('init.js script', () => {
  // Store original process properties
  const originalArgv = process.argv
  const originalExit = process.exit
  const originalCwd = process.cwd
  const originalEnv = { ...process.env }

  // Mock console methods
  console.log = jest.fn()
  console.error = jest.fn()
  console.warn = jest.fn()

  beforeEach(() => {
    // Reset specific mocks that need to be reset
    jest.clearAllMocks()

    // Mock process properties
    process.argv = ['node', 'init.js', 'test-post', 'test_description']
    process.exit = jest.fn().mockImplementation((code) => {
      throw new Error(`Process exit called with code: ${code}`)
    })
    process.cwd = jest.fn().mockReturnValue('/fake/project/dir')
    process.env = {
      HOME: '/fake/home',
      SUPABASE_URL: 'https://fake.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'fake-service-key',
      NODE_ENV: 'test',
    }

    // Mock path methods
    path.basename.mockReturnValue('init.js')
    path.join.mockImplementation((...args) => args.join('/'))
    path.extname.mockReturnValue('.wav')
    path.basename.mockImplementation((file, ext) => {
      if (ext) return file.replace(ext, '')
      return file
    })

    // Mock fs methods - ensure readFileSync is always mocked
    fs.readFileSync.mockReturnValue(
      'Template: {name}, {date}, {description}, {audio_files}'
    )
    fs.existsSync.mockReturnValue(true)
    fs.statSync.mockReturnValue({ isDirectory: () => true })
    fs.mkdirSync.mockImplementation(() => {})
    fs.writeFileSync.mockImplementation(() => {})
    fs.copyFileSync.mockImplementation(() => {})
    fs.renameSync.mockImplementation(() => {})
    fs.cpSync.mockImplementation(() => {})
    fs.rmSync.mockImplementation(() => {})
    fs.rmdirSync.mockImplementation(() => {})
    fs.readdirSync.mockReturnValue([])

    // Mock execSync
    childProcess.execSync.mockImplementation(() => {})

    // Mock successful upload
    mockSupabase.storage.upload.mockResolvedValue({
      data: { path: 'test-file.wav' },
      error: null,
    })
    mockSupabase.storage.getPublicUrl.mockReturnValue({
      data: {
        publicUrl:
          'https://fake.supabase.co/storage/v1/object/public/audio/test-file.wav',
      },
    })
  })

  afterEach(() => {
    // Restore process properties
    process.env = { ...originalEnv }
    process.argv = [...originalArgv]
    process.exit = originalExit
    process.cwd = originalCwd
    jest.resetModules()
  })

  test('should exit if name is not provided', async () => {
    await jest.isolateModulesAsync(async () => {
      // Mock process.argv inside the isolated context
      process.argv = ['node', 'init.js'] // No name argument
      process.env.NODE_ENV = 'test' // Ensure test mode is set

      const initModule = require('./init')
      await expect(initModule.main()).rejects.toThrow('Missing name argument')

      expect(console.log).toHaveBeenCalledWith('Usage: node init.js <name>')
    })
  })

  test('should exit if Supabase credentials are missing', async () => {
    process.env = { HOME: '/fake/home', NODE_ENV: 'test' } // Remove Supabase credentials
    process.argv = ['node', 'init.js', '25may05'] // Provide name argument

    const initModule = require('./init')
    await expect(initModule.main()).rejects.toThrow(
      'Missing Supabase credentials'
    )

    expect(console.error).toHaveBeenCalledWith(
      'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    )
  })

  test('should read template file and create blog post', async () => {
    await jest.isolateModulesAsync(async () => {
      // Set up all necessary mocks inside the isolated context
      const fs = require('fs')
      const path = require('path')
      const childProcess = require('child_process')

      // Mock fs methods - ensure readFileSync is properly mocked
      fs.readFileSync = jest
        .fn()
        .mockReturnValue(
          'Template: {name}, {date}, {description}, {audio_files}'
        )
      fs.existsSync = jest.fn().mockImplementation((path) => {
        if (path.includes('25may05') && !path.includes('.wav')) {
          return true // Subfolder exists
        }
        return false // Single file doesn't exist
      })
      fs.statSync = jest.fn().mockReturnValue({ isDirectory: () => true })
      fs.mkdirSync = jest.fn().mockImplementation(() => {})
      fs.writeFileSync = jest.fn().mockImplementation(() => {})
      fs.copyFileSync = jest.fn().mockImplementation(() => {})
      fs.cpSync = jest.fn().mockImplementation(() => {})
      fs.rmSync = jest.fn().mockImplementation(() => {})
      fs.rmdirSync = jest.fn().mockImplementation(() => {})
      fs.readdirSync = jest.fn().mockReturnValue(['test-audio.wav'])

      // Mock path methods
      path.basename = jest.fn().mockReturnValue('init.js')
      path.join = jest.fn().mockImplementation((...args) => args.join('/'))
      path.extname = jest.fn().mockReturnValue('.wav')
      path.basename = jest.fn().mockImplementation((file, ext) => {
        if (ext) return file.replace(ext, '')
        return file
      })

      // Mock childProcess
      childProcess.execSync = jest.fn().mockImplementation(() => {})

      // Mock Supabase
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

      // Mock the Supabase module
      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn().mockReturnValue(mockSupabase),
      }))

      // Mock the transformDate function to return a consistent date
      jest.doMock('./init', () => {
        const originalModule = jest.requireActual('./init')
        return {
          ...originalModule,
          transformDate: jest.fn().mockReturnValue('2025-05-05'),
        }
      })

      process.argv = ['node', 'init.js', '25may05', 'test_description']
      process.env.NODE_ENV = 'test'

      const initModule = require('./init')
      await initModule.main()

      const expectedDate = '2025-05-05'
      expect(fs.readFileSync).toHaveBeenCalledWith(
        '/fake/project/dir/src/template.md',
        'utf8'
      )
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        '/fake/project/dir/content/blog/25may05',
        { recursive: true }
      )
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/fake/project/dir/content/blog/25may05/25may05.md',
        `Template: 25may05, ${expectedDate}, test description, \`audio: https://fake.supabase.co/storage/v1/object/public/audio/test-file.wav\``
      )
    })
  })

  test('should handle missing template file', async () => {
    await expect(async () => {
      await jest.isolateModulesAsync(async () => {
        // Set up all necessary mocks inside the isolated context
        const fs = require('fs')
        const path = require('path')
        const childProcess = require('child_process')

        fs.readFileSync = jest.fn().mockImplementation((path) => {
          if (path.includes('template.md')) {
            throw new Error('File not found')
          }
          return 'Template: {name}, {date}, {description}, {audio_files}'
        })
        fs.existsSync = jest.fn().mockReturnValue(true)
        fs.statSync = jest.fn().mockReturnValue({ isDirectory: () => true })
        fs.mkdirSync = jest.fn().mockImplementation(() => {})
        fs.writeFileSync = jest.fn().mockImplementation(() => {})
        fs.copyFileSync = jest.fn().mockImplementation(() => {})
        fs.cpSync = jest.fn().mockImplementation(() => {})
        fs.rmSync = jest.fn().mockImplementation(() => {})
        fs.rmdirSync = jest.fn().mockImplementation(() => {})
        fs.readdirSync = jest.fn().mockReturnValue([])

        path.basename = jest.fn().mockReturnValue('init.js')
        path.join = jest.fn().mockImplementation((...args) => args.join('/'))
        path.extname = jest.fn().mockReturnValue('.wav')
        path.basename = jest.fn().mockImplementation((file, ext) => {
          if (ext) return file.replace(ext, '')
          return file
        })

        childProcess.execSync = jest.fn().mockImplementation(() => {})

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

        jest.doMock('@supabase/supabase-js', () => ({
          createClient: jest.fn().mockReturnValue(mockSupabase),
        }))

        process.argv = ['node', 'init.js', '25may05']
        process.env.NODE_ENV = 'test'

        const initModule = require('./init')
        await initModule.main()
      })
    }).rejects.toThrow(
      'Template file not found at /fake/project/dir/src/template.md'
    )
  })

  test('should handle multiple WAV files from subfolder', async () => {
    await jest.isolateModulesAsync(async () => {
      // Set up all necessary mocks inside the isolated context
      const fs = require('fs')
      const path = require('path')
      const childProcess = require('child_process')

      // Mock fs.readFileSync to return different content based on the file path
      fs.readFileSync = jest.fn().mockImplementation((filePath) => {
        if (filePath.includes('template.md')) {
          return 'Template: {name}, {date}, {description}, {audio_files}'
        } else if (filePath.includes('.wav')) {
          // Return a mock buffer for audio files
          return Buffer.from('mock audio data')
        }
        return 'default content'
      })
      fs.existsSync = jest.fn().mockImplementation((path) => {
        if (path.includes('25may05') && !path.includes('.wav')) {
          return true // Subfolder exists
        }
        return false // Single file doesn't exist
      })
      fs.statSync = jest.fn().mockReturnValue({ isDirectory: () => true })
      fs.readdirSync = jest
        .fn()
        .mockReturnValue(['track1.wav', 'track2.wav', 'track3.wav'])
      fs.mkdirSync = jest.fn().mockImplementation(() => {})
      fs.writeFileSync = jest.fn().mockImplementation(() => {})
      fs.copyFileSync = jest.fn().mockImplementation(() => {})
      fs.cpSync = jest.fn().mockImplementation(() => {})
      fs.rmSync = jest.fn().mockImplementation(() => {})
      fs.rmdirSync = jest.fn().mockImplementation(() => {})

      path.basename = jest.fn().mockReturnValue('init.js')
      path.join = jest.fn().mockImplementation((...args) => args.join('/'))
      path.extname = jest.fn().mockReturnValue('.wav')
      path.basename = jest.fn().mockImplementation((file, ext) => {
        if (ext) return file.replace(ext, '')
        return file
      })

      childProcess.execSync = jest.fn().mockImplementation(() => {})

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

      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn().mockReturnValue(mockSupabase),
      }))

      process.argv = ['node', 'init.js', '25may05']
      process.env.NODE_ENV = 'test'

      const initModule = require('./init')
      await initModule.main()

      // Check that all files were uploaded
      expect(mockSupabase.storage.upload).toHaveBeenCalledTimes(3)
      expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
        '25may05-1.wav',
        expect.any(Buffer),
        expect.any(Object)
      )
      expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
        '25may05-2.wav',
        expect.any(Buffer),
        expect.any(Object)
      )
      expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
        '25may05-3.wav',
        expect.any(Buffer),
        expect.any(Object)
      )
    })
  })

  test('should handle upload errors gracefully', async () => {
    await jest.isolateModulesAsync(async () => {
      // Set up all necessary mocks inside the isolated context
      const fs = require('fs')
      const path = require('path')
      const childProcess = require('child_process')

      // Mock fs.readFileSync to return different content based on the file path
      fs.readFileSync = jest.fn().mockImplementation((filePath) => {
        if (filePath.includes('template.md')) {
          return 'Template: {name}, {date}, {description}, {audio_files}'
        } else if (filePath.includes('.wav')) {
          // Return a mock buffer for audio files
          return Buffer.from('mock audio data')
        }
        return 'default content'
      })
      fs.existsSync = jest.fn().mockReturnValue(true)
      fs.statSync = jest.fn().mockReturnValue({ isDirectory: () => false })
      fs.mkdirSync = jest.fn().mockImplementation(() => {})
      fs.writeFileSync = jest.fn().mockImplementation(() => {})
      fs.copyFileSync = jest.fn().mockImplementation(() => {})
      fs.cpSync = jest.fn().mockImplementation(() => {})
      fs.rmSync = jest.fn().mockImplementation(() => {})
      fs.rmdirSync = jest.fn().mockImplementation(() => {})
      fs.readdirSync = jest.fn().mockReturnValue([])

      path.basename = jest.fn().mockReturnValue('init.js')
      path.join = jest.fn().mockImplementation((...args) => args.join('/'))
      path.extname = jest.fn().mockReturnValue('.wav')
      path.basename = jest.fn().mockImplementation((file, ext) => {
        if (ext) return file.replace(ext, '')
        return file
      })

      childProcess.execSync = jest.fn().mockImplementation(() => {})

      const mockSupabase = {
        storage: {
          from: jest.fn().mockReturnThis(),
          upload: jest.fn().mockRejectedValue(new Error('Upload failed')),
          getPublicUrl: jest.fn().mockReturnValue({
            data: {
              publicUrl:
                'https://fake.supabase.co/storage/v1/object/public/audio/test-file.wav',
            },
          }),
        },
      }

      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn().mockReturnValue(mockSupabase),
      }))

      process.argv = ['node', 'init.js', '25may05']
      process.env.NODE_ENV = 'test'

      const initModule = require('./init')
      await initModule.main()

      expect(console.error).toHaveBeenCalledWith(
        'Failed to upload 25may05.wav:',
        'Upload failed'
      )
    })
  })

  test('should sanitize filenames correctly', async () => {
    await jest.isolateModulesAsync(async () => {
      // Set up all necessary mocks inside the isolated context
      const fs = require('fs')
      const path = require('path')
      const childProcess = require('child_process')

      // Mock fs.readFileSync to return different content based on the file path
      fs.readFileSync = jest.fn().mockImplementation((filePath) => {
        if (filePath.includes('template.md')) {
          return 'Template: {name}, {date}, {description}, {audio_files}'
        } else if (filePath.includes('.wav')) {
          // Return a mock buffer for audio files
          return Buffer.from('mock audio data')
        }
        return 'default content'
      })
      fs.existsSync = jest.fn().mockImplementation((path) => {
        if (path.includes('25may05') && !path.includes('.wav')) {
          return true
        }
        return false
      })
      fs.statSync = jest.fn().mockReturnValue({ isDirectory: () => true })
      fs.readdirSync = jest
        .fn()
        .mockReturnValue(['file_with_spaces_and#symbols.wav'])
      fs.mkdirSync = jest.fn().mockImplementation(() => {})
      fs.writeFileSync = jest.fn().mockImplementation(() => {})
      fs.copyFileSync = jest.fn().mockImplementation(() => {})
      fs.cpSync = jest.fn().mockImplementation(() => {})
      fs.rmSync = jest.fn().mockImplementation(() => {})
      fs.rmdirSync = jest.fn().mockImplementation(() => {})

      path.basename = jest.fn().mockReturnValue('init.js')
      path.join = jest.fn().mockImplementation((...args) => args.join('/'))
      path.extname = jest.fn().mockReturnValue('.wav')
      path.basename = jest.fn().mockImplementation((file, ext) => {
        if (ext) return file.replace(ext, '')
        return file
      })

      childProcess.execSync = jest.fn().mockImplementation(() => {})

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

      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn().mockReturnValue(mockSupabase),
      }))

      process.argv = ['node', 'init.js', '25may05']
      process.env.NODE_ENV = 'test'

      const initModule = require('./init')
      await initModule.main()

      // Check that filename was sanitized
      expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
        '25may05.wav',
        expect.any(Buffer),
        expect.any(Object)
      )
    })
  })

  test('should commit and push changes to git', async () => {
    await jest.isolateModulesAsync(async () => {
      // Set up all necessary mocks inside the isolated context
      const fs = require('fs')
      const path = require('path')
      const childProcess = require('child_process')

      fs.readFileSync = jest.fn().mockImplementation((filePath) => {
        if (filePath.includes('template.md')) {
          return 'Template: {name}, {date}, {description}, {audio_files}'
        } else if (filePath.includes('.wav')) {
          return Buffer.from('mock audio data')
        }
        return 'default content'
      })
      fs.existsSync = jest.fn().mockImplementation((path) => {
        if (path.includes('25may05') && !path.includes('.wav')) {
          return true // Subfolder exists
        }
        return false // Single file doesn't exist
      })
      fs.statSync = jest.fn().mockReturnValue({ isDirectory: () => true })
      fs.mkdirSync = jest.fn().mockImplementation(() => {})
      fs.writeFileSync = jest.fn().mockImplementation(() => {})
      fs.copyFileSync = jest.fn().mockImplementation(() => {})
      fs.cpSync = jest.fn().mockImplementation(() => {})
      fs.rmSync = jest.fn().mockImplementation(() => {})
      fs.rmdirSync = jest.fn().mockImplementation(() => {})
      fs.readdirSync = jest.fn().mockReturnValue(['test-audio.wav'])

      path.basename = jest.fn().mockReturnValue('init.js')
      path.join = jest.fn().mockImplementation((...args) => args.join('/'))
      path.extname = jest.fn().mockReturnValue('.wav')
      path.basename = jest.fn().mockImplementation((file, ext) => {
        if (ext) return file.replace(ext, '')
        return file
      })

      childProcess.execSync = jest.fn().mockImplementation(() => {})

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

      jest.doMock('@supabase/supabase-js', () => ({
        createClient: jest.fn().mockReturnValue(mockSupabase),
      }))

      process.argv = ['node', 'init.js', '25may05']
      process.env.NODE_ENV = 'test'

      const initModule = require('./init')
      await initModule.main()

      // Check that git commands were called
      const calls = childProcess.execSync.mock.calls
      const callStrings = calls.map((call) => call[0])

      expect(callStrings).toContain('git add .')
      expect(callStrings).toContain('git commit -m "new-day: 25may05"')
      expect(callStrings).toContain('git push origin 25may05 --tags')
      expect(callStrings).toContain('git push origin 25may05')
    })
  })
})
