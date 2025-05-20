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
    process.exit = jest.fn()
    process.cwd = jest.fn().mockReturnValue('/fake/project/dir')
    process.env = { HOME: '/fake/home' }

    // Mock path methods
    path.basename.mockReturnValue('init.js')
    path.join.mockImplementation((...args) => args.join('/'))

    // Mock fs methods
    fs.readFileSync.mockReturnValue('Template: {name}, {date}, {description}')
    fs.existsSync.mockReturnValue(true)
    fs.mkdirSync.mockImplementation(() => {})
    fs.writeFileSync.mockImplementation(() => {})
    fs.copyFileSync.mockImplementation(() => {})
    fs.renameSync.mockImplementation(() => {})

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

    // Execute the script
    jest.isolateModules(() => {
      require('./init')
    })

    expect(process.exit).toHaveBeenCalledWith(1)
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

    // Execute the script
    jest.isolateModules(() => {
      require('./init')
    })

    expect(process.exit).toHaveBeenCalledWith(1)
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
      `Template: test-post, ${today}, test description`
    )
  })

  // TODO: fix test
  test.skip('should handle missing template file', () => {
    // Then add the implementation that throws
    fs.readFileSync.mockImplementationOnce(() => {
      throw new Error('File not found')
    })

    // Execute the script
    jest.isolateModules(() => {
      require('./init')
    })

    expect(process.exit).toHaveBeenCalledWith(1)
    expect(console.error).toHaveBeenCalledWith(
      'Template file not found at /fake/project/dir/src/template.md'
    )
  })

  test('should backup and move audio file if it exists', () => {
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
  })

  test('should warn if audio file does not exist', () => {
    fs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false)

    // Execute the script
    jest.isolateModules(() => {
      require('./init')
    })

    expect(console.warn).toHaveBeenCalledWith(
      "File '/fake/home/Downloads/test-post.wav' not found. Skipping move."
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
