const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const childProcess = require('child_process')

// Mock dependencies
jest.mock('fs')
jest.mock('child_process')
jest.mock('path')

describe('init.js script', () => {
  // Store original process properties
  const originalArgv = process.argv
  const originalExit = process.exit
  const originalCwd = process.cwd
  const originalEnv = process.env

  // Mock console methods
  console.log = jest.fn()
  console.error = jest.fn()
  console.warn = jest.fn()

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks()

    // Mock process properties
    process.argv = ['node', 'init.js', 'test-post', 'test_description']
    process.exit = jest.fn().mockImplementation((code) => {
      throw new Error(`Process exit called with code: ${code}`)
    })
    process.cwd = jest.fn().mockReturnValue('/fake/project/dir')
    process.env = { HOME: '/fake/home' }

    // Mock path methods
    path.basename.mockReturnValue('init.js')
    path.join.mockImplementation((...args) => args.join('/'))
    path.extname.mockReturnValue('.wav')
    path.basename.mockImplementation((file, ext) => {
      if (ext) return file.replace(ext, '')
      return file
    })

    // Mock fs methods
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
  })

  afterEach(() => {
    // Restore process properties
    process.argv = originalArgv
    process.exit = originalExit
    process.cwd = originalCwd
    process.env = originalEnv
  })

  test('should exit if name is not provided', () => {
    process.argv = ['node', 'init.js'] // No name argument

    // Execute the script and expect it to throw due to process.exit
    expect(() => {
      jest.isolateModules(() => {
        require('./init')
      })
    }).toThrow('Process exit called with code: 1')

    expect(console.log).toHaveBeenCalledWith('Usage: node init.js <name>')
  })

  test('should checkout to a git branch with the provided name', () => {
    // Execute the script
    jest.isolateModules(() => {
      require('./init')
    })

    expect(childProcess.execSync).toHaveBeenCalledWith(
      'git checkout -B test-post',
      { stdio: 'inherit' }
    )
    expect(console.log).toHaveBeenCalledWith(
      "Checked out to branch 'test-post'."
    )
  })

  test('should handle git checkout errors', () => {
    const errorMsg = 'Command failed'
    childProcess.execSync.mockImplementationOnce(() => {
      throw new Error(errorMsg)
    })

    // Execute the script and expect it to throw due to process.exit
    expect(() => {
      jest.isolateModules(() => {
        require('./init')
      })
    }).toThrow('Process exit called with code: 1')

    expect(console.error).toHaveBeenCalledWith(
      "Failed to checkout to branch 'test-post':",
      errorMsg
    )
  })

  test('should read template file and create blog post', () => {
    const today = new Date().toISOString().slice(0, 10)

    // Execute the script
    jest.isolateModules(() => {
      require('./init')
    })

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

  test('should handle missing template file', () => {
    // Mock readFileSync to throw an error only for the template file read
    fs.readFileSync.mockImplementationOnce(() => {
      throw new Error('File not found')
    })

    // Execute the script and expect it to throw due to process.exit
    expect(() => {
      jest.isolateModules(() => {
        require('./init')
      })
    }).toThrow('Process exit called with code: 1')

    expect(console.error).toHaveBeenCalledWith(
      'Template file not found at /fake/project/dir/src/template.md'
    )
  })

  test('should handle multiple WAV files from subfolder', () => {
    // Mock subfolder exists with WAV files
    fs.existsSync.mockImplementation((path) => {
      if (path.includes('test-post') && !path.includes('.wav')) {
        return true // Subfolder exists
      }
      return false // Single file doesn't exist
    })
    fs.statSync.mockReturnValue({ isDirectory: () => true })
    fs.readdirSync.mockReturnValue(['track1.wav', 'track2.wav', 'track3.wav'])

    // Execute the script
    jest.isolateModules(() => {
      require('./init')
    })

    expect(fs.cpSync).toHaveBeenCalledWith(
      '/fake/home/Downloads/test-post',
      '/fake/home/Downloads/test-post-backup',
      { recursive: true }
    )
    expect(fs.renameSync).toHaveBeenCalledTimes(3)
    expect(console.log).toHaveBeenCalledWith(
      "Found 3 WAV file(s) in subfolder 'test-post'."
    )
  })

  test('should handle single WAV file', () => {
    // Mock single file exists, subfolder doesn't
    fs.existsSync.mockImplementation((path) => {
      if (path.includes('test-post.wav')) {
        return true // Single file exists
      }
      return false // Subfolder doesn't exist
    })

    // Execute the script
    jest.isolateModules(() => {
      require('./init')
    })

    expect(fs.copyFileSync).toHaveBeenCalledWith(
      '/fake/home/Downloads/test-post.wav',
      '/fake/home/Downloads/test-post-backup.wav'
    )
    expect(fs.renameSync).toHaveBeenCalledWith(
      '/fake/home/Downloads/test-post.wav',
      '/fake/project/dir/content/assets/music/test-post.wav'
    )
    expect(console.log).toHaveBeenCalledWith(
      "Found single WAV file 'test-post.wav'."
    )
  })

  test('should warn if no audio files found', () => {
    // Mock neither subfolder nor single file exist
    fs.existsSync.mockReturnValue(false)

    // Execute the script
    jest.isolateModules(() => {
      require('./init')
    })

    expect(console.warn).toHaveBeenCalledWith(
      "No WAV files found. Neither subfolder 'test-post' nor single file 'test-post.wav' exist in Downloads."
    )
  })

  test('should generate correct audio content for multiple files', () => {
    // Mock subfolder with WAV files
    fs.existsSync.mockImplementation((path) => {
      if (path.includes('test-post') && !path.includes('.wav')) {
        return true
      }
      return false
    })
    fs.statSync.mockReturnValue({ isDirectory: () => true })
    fs.readdirSync.mockReturnValue(['track1.wav', 'track2.wav'])

    // Execute the script
    jest.isolateModules(() => {
      require('./init')
    })

    // Check that the template was processed with audio content
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/fake/project/dir/content/blog/test-post/test-post.md',
      expect.stringContaining(
        'audio: ../../assets/music/test-post-1-track1.wav'
      )
    )
  })

  test('should create unique filenames for multiple files', () => {
    // Mock subfolder with WAV files
    fs.existsSync.mockImplementation((path) => {
      if (path.includes('test-post') && !path.includes('.wav')) {
        return true
      }
      return false
    })
    fs.statSync.mockReturnValue({ isDirectory: () => true })
    fs.readdirSync.mockReturnValue(['original1.wav', 'original2.wav'])

    // Execute the script
    jest.isolateModules(() => {
      require('./init')
    })

    // Check that unique filenames were created
    expect(fs.renameSync).toHaveBeenCalledWith(
      '/fake/home/Downloads/test-post/original1.wav',
      '/fake/project/dir/content/assets/music/test-post-1-original1.wav'
    )
    expect(fs.renameSync).toHaveBeenCalledWith(
      '/fake/home/Downloads/test-post/original2.wav',
      '/fake/project/dir/content/assets/music/test-post-2-original2.wav'
    )
  })

  test('should remove empty subfolder after moving files', () => {
    // Mock subfolder with WAV files
    fs.existsSync.mockImplementation((path) => {
      if (path.includes('test-post') && !path.includes('.wav')) {
        return true
      }
      return false
    })
    fs.statSync.mockReturnValue({ isDirectory: () => true })
    fs.readdirSync.mockReturnValueOnce(['track1.wav']).mockReturnValueOnce([])

    // Execute the script
    jest.isolateModules(() => {
      require('./init')
    })

    expect(fs.rmdirSync).toHaveBeenCalledWith('/fake/home/Downloads/test-post')
    expect(console.log).toHaveBeenCalledWith(
      "Removed empty subfolder '/fake/home/Downloads/test-post'."
    )
  })

  test('should commit and push changes to git', () => {
    // Execute the script
    jest.isolateModules(() => {
      require('./init')
    })

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
