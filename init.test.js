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
    process.argv = ['node', 'init.js'] // No name argument
    process.env.NODE_ENV = 'test' // Ensure test mode is set

    const initModule = require('./init')
    await expect(initModule.main()).rejects.toThrow('Missing name argument')

    expect(console.log).toHaveBeenCalledWith('Usage: node init.js <name>')
  })

  test('should exit if Supabase credentials are missing', async () => {
    process.env = { HOME: '/fake/home', NODE_ENV: 'test' } // Remove Supabase credentials
    process.argv = ['node', 'init.js', 'test-post'] // Provide name argument

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
      fs.existsSync = jest.fn().mockReturnValue(true)
      fs.statSync = jest.fn().mockReturnValue({ isDirectory: () => true })
      fs.mkdirSync = jest.fn().mockImplementation(() => {})
      fs.writeFileSync = jest.fn().mockImplementation(() => {})
      fs.copyFileSync = jest.fn().mockImplementation(() => {})
      fs.cpSync = jest.fn().mockImplementation(() => {})
      fs.rmSync = jest.fn().mockImplementation(() => {})
      fs.rmdirSync = jest.fn().mockImplementation(() => {})
      fs.readdirSync = jest.fn().mockReturnValue([])

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

      process.argv = ['node', 'init.js', 'test-post', 'test_description']
      process.env.NODE_ENV = 'test'

      const initModule = require('./init')
      await initModule.main()

      const today = new Date().toISOString().slice(0, 10)
      expect(fs.readFileSync).toHaveBeenCalledWith(
        '/fake/project/dir/src/template.md',
        'utf8'
      )
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        '/fake/project/dir/content/blog/test-post',
        { recursive: true }
      )
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/fake/project/dir/content/blog/test-post/test-post.md',
        `Template: test-post, ${today}, test description, `
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

        process.argv = ['node', 'init.js', 'test-post']
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
        if (path.includes('test-post') && !path.includes('.wav')) {
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

      process.argv = ['node', 'init.js', 'test-post']
      process.env.NODE_ENV = 'test'

      const initModule = require('./init')
      await initModule.main()

      // Check that all files were uploaded
      expect(mockSupabase.storage.upload).toHaveBeenCalledTimes(3)
      expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
        'test-post-1-track1.wav',
        expect.any(Buffer),
        expect.any(Object)
      )
      expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
        'test-post-2-track2.wav',
        expect.any(Buffer),
        expect.any(Object)
      )
      expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
        'test-post-3-track3.wav',
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

      process.argv = ['node', 'init.js', 'test-post']
      process.env.NODE_ENV = 'test'

      const initModule = require('./init')
      await initModule.main()

      expect(console.error).toHaveBeenCalledWith(
        'Failed to upload test-post.wav:',
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
        if (path.includes('test-post') && !path.includes('.wav')) {
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

      process.argv = ['node', 'init.js', 'test-post']
      process.env.NODE_ENV = 'test'

      const initModule = require('./init')
      await initModule.main()

      // Check that filename was sanitized
      expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
        'test-post-1-filewithspacesandsymbols.wav',
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

      fs.readFileSync = jest
        .fn()
        .mockReturnValue(
          'Template: {name}, {date}, {description}, {audio_files}'
        )
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

      process.argv = ['node', 'init.js', 'test-post']
      process.env.NODE_ENV = 'test'

      const initModule = require('./init')
      await initModule.main()

      expect(childProcess.execSync).toHaveBeenCalledWith('git add .', {
        stdio: 'inherit',
      })
      expect(childProcess.execSync).toHaveBeenCalledWith(
        'git commit -m "new-day: test-post"',
        { stdio: 'inherit' }
      )
      expect(childProcess.execSync).toHaveBeenCalledWith(
        'git push origin test-post --tags',
        { stdio: 'inherit' }
      )
      expect(childProcess.execSync).toHaveBeenCalledWith(
        'git push origin test-post',
        { stdio: 'inherit' }
      )
    })
  })
})
