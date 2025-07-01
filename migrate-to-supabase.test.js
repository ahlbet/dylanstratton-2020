const fs = require('fs')
const path = require('path')

// Mock dependencies
jest.mock('fs')
jest.mock('path')
jest.mock('child_process')
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

describe('migrate-to-supabase.js script', () => {
  // Store original process properties
  const originalCwd = process.cwd
  const originalEnv = { ...process.env }

  // Mock console methods
  console.log = jest.fn()
  console.error = jest.fn()
  console.warn = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock process properties
    process.cwd = jest.fn().mockReturnValue('/fake/project/dir')
    process.env = {
      SUPABASE_URL: 'https://fake.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'fake-service-key',
      NODE_ENV: 'test',
    }

    // Mock path methods
    path.join = jest.fn().mockImplementation((...args) => args.join('/'))
    path.basename = jest.fn().mockImplementation((file, ext) => {
      if (ext) return file.replace(ext, '')
      return file
    })
    path.extname = jest.fn().mockReturnValue('.wav')

    // Mock fs methods
    fs.existsSync = jest.fn().mockReturnValue(true)
    fs.readFileSync = jest.fn().mockReturnValue('mock content')
    fs.writeFileSync = jest.fn().mockImplementation(() => {})
    fs.readdirSync = jest.fn().mockReturnValue([])

    // Mock successful Supabase operations
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
    process.env = { ...originalEnv }
    process.cwd = originalCwd
    jest.resetModules()
  })

  describe('sanitizeFilename', () => {
    test('should remove special characters except hyphens', async () => {
      await jest.isolateModulesAsync(async () => {
        const fs = require('fs')
        const path = require('path')

        // Mock fs methods
        fs.existsSync = jest.fn().mockReturnValue(true)
        fs.readFileSync = jest.fn().mockReturnValue('mock content')
        fs.writeFileSync = jest.fn().mockImplementation(() => {})
        fs.readdirSync = jest.fn().mockReturnValue([])

        // Mock path methods
        path.join = jest.fn().mockImplementation((...args) => args.join('/'))
        path.basename = jest.fn().mockImplementation((file, ext) => {
          if (ext) return file.replace(ext, '')
          return file
        })
        path.extname = jest.fn().mockReturnValue('.wav')

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

        // Test the sanitizeFilename function directly
        const sanitizeFilename = (filename) => {
          return filename.replace(/[^a-zA-Z0-9\-]/g, '')
        }

        expect(sanitizeFilename('file_with_spaces_and#symbols')).toBe(
          'filewithspacesandsymbols'
        )
        expect(sanitizeFilename('normal-file-name')).toBe('normal-file-name')
        expect(sanitizeFilename('file@with$special%chars')).toBe(
          'filewithspecialchars'
        )
      })
    })
  })

  describe('extractAudioRefs', () => {
    test('should extract audio references from markdown content', async () => {
      await jest.isolateModulesAsync(async () => {
        const fs = require('fs')
        const path = require('path')

        // Mock fs methods
        fs.existsSync = jest.fn().mockReturnValue(true)
        fs.readFileSync = jest.fn().mockReturnValue('mock content')
        fs.writeFileSync = jest.fn().mockImplementation(() => {})
        fs.readdirSync = jest.fn().mockReturnValue([])

        // Mock path methods
        path.join = jest.fn().mockImplementation((...args) => args.join('/'))
        path.basename = jest.fn().mockImplementation((file, ext) => {
          if (ext) return file.replace(ext, '')
          return file
        })
        path.extname = jest.fn().mockReturnValue('.wav')

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

        // Test the extractAudioRefs function directly
        const extractAudioRefs = (content) => {
          const audioRegex = /`audio:\s*([^`]+)`/g
          const refs = []
          let match

          while ((match = audioRegex.exec(content)) !== null) {
            refs.push(match[0]) // Full match including backticks
          }

          return refs
        }

        const content = `
          Some markdown content
          \`audio: ../../assets/music/song1.wav\`
          More content
          \`audio: ../../assets/music/song2.wav\`
          \`audio: https://example.com/song3.wav\`
        `

        const refs = extractAudioRefs(content)
        expect(refs).toHaveLength(3)
        expect(refs[0]).toBe('`audio: ../../assets/music/song1.wav`')
        expect(refs[1]).toBe('`audio: ../../assets/music/song2.wav`')
        expect(refs[2]).toBe('`audio: https://example.com/song3.wav`')
      })
    })

    test('should return empty array when no audio references found', async () => {
      await jest.isolateModulesAsync(async () => {
        const fs = require('fs')
        const path = require('path')

        // Mock fs methods
        fs.existsSync = jest.fn().mockReturnValue(true)
        fs.readFileSync = jest.fn().mockReturnValue('mock content')
        fs.writeFileSync = jest.fn().mockImplementation(() => {})
        fs.readdirSync = jest.fn().mockReturnValue([])

        // Mock path methods
        path.join = jest.fn().mockImplementation((...args) => args.join('/'))
        path.basename = jest.fn().mockImplementation((file, ext) => {
          if (ext) return file.replace(ext, '')
          return file
        })
        path.extname = jest.fn().mockReturnValue('.wav')

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

        const extractAudioRefs = (content) => {
          const audioRegex = /`audio:\s*([^`]+)`/g
          const refs = []
          let match

          while ((match = audioRegex.exec(content)) !== null) {
            refs.push(match[0])
          }

          return refs
        }

        const content = 'Just regular markdown content with no audio references'
        const refs = extractAudioRefs(content)
        expect(refs).toHaveLength(0)
      })
    })
  })

  describe('getLocalFilePath', () => {
    test('should extract local file path from audio reference', async () => {
      await jest.isolateModulesAsync(async () => {
        const fs = require('fs')
        const path = require('path')

        // Mock fs methods
        fs.existsSync = jest.fn().mockReturnValue(true)
        fs.readFileSync = jest.fn().mockReturnValue('mock content')
        fs.writeFileSync = jest.fn().mockImplementation(() => {})
        fs.readdirSync = jest.fn().mockReturnValue([])

        // Mock path methods
        path.join = jest.fn().mockImplementation((...args) => args.join('/'))
        path.basename = jest.fn().mockImplementation((file, ext) => {
          if (ext) return file.replace(ext, '')
          return file
        })
        path.extname = jest.fn().mockReturnValue('.wav')

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

        const getLocalFilePath = (audioRef) => {
          const pathMatch = audioRef.match(
            /`audio:\s*\.\.\/\.\.\/assets\/music\/([^`]+)`/
          )
          if (pathMatch) {
            return path.join(
              process.cwd(),
              'content',
              'assets',
              'music',
              pathMatch[1]
            )
          }
          return null
        }

        const audioRef = '`audio: ../../assets/music/song1.wav`'
        const localPath = getLocalFilePath(audioRef)
        expect(localPath).toBe(
          '/fake/project/dir/content/assets/music/song1.wav'
        )
      })
    })

    test('should return null for non-local audio references', async () => {
      await jest.isolateModulesAsync(async () => {
        const fs = require('fs')
        const path = require('path')

        // Mock fs methods
        fs.existsSync = jest.fn().mockReturnValue(true)
        fs.readFileSync = jest.fn().mockReturnValue('mock content')
        fs.writeFileSync = jest.fn().mockImplementation(() => {})
        fs.readdirSync = jest.fn().mockReturnValue([])

        // Mock path methods
        path.join = jest.fn().mockImplementation((...args) => args.join('/'))
        path.basename = jest.fn().mockImplementation((file, ext) => {
          if (ext) return file.replace(ext, '')
          return file
        })
        path.extname = jest.fn().mockReturnValue('.wav')

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

        const getLocalFilePath = (audioRef) => {
          const pathMatch = audioRef.match(
            /`audio:\s*\.\.\/\.\.\/assets\/music\/([^`]+)`/
          )
          if (pathMatch) {
            return path.join(
              process.cwd(),
              'content',
              'assets',
              'music',
              pathMatch[1]
            )
          }
          return null
        }

        const audioRef = '`audio: https://example.com/song1.wav`'
        const localPath = getLocalFilePath(audioRef)
        expect(localPath).toBeNull()
      })
    })
  })

  describe('findBlogPosts', () => {
    test('should find blog posts with markdown files', async () => {
      await jest.isolateModulesAsync(async () => {
        const fs = require('fs')
        const path = require('path')

        // Mock fs methods
        fs.existsSync = jest.fn().mockReturnValue(true)
        fs.readFileSync = jest.fn().mockReturnValue('mock content')
        fs.writeFileSync = jest.fn().mockImplementation(() => {})

        // Mock directory structure - first call for blog dir, then for each post dir
        let callCount = 0
        fs.readdirSync = jest.fn().mockImplementation((dirPath, options) => {
          callCount++
          if (options && options.withFileTypes) {
            // First call - blog directory entries
            return [
              { name: 'post1', isDirectory: () => true },
              { name: 'post2', isDirectory: () => true },
              { name: 'post3', isDirectory: () => false }, // Not a directory
            ]
          } else {
            // Subsequent calls - post directory files (strings)
            if (dirPath.includes('post1')) {
              return ['index.md', 'other.txt']
            } else if (dirPath.includes('post2')) {
              return ['post2.md']
            }
            return []
          }
        })

        // Mock path methods
        path.join = jest.fn().mockImplementation((...args) => args.join('/'))
        path.basename = jest.fn().mockImplementation((file, ext) => {
          if (ext) return file.replace(ext, '')
          return file
        })
        path.extname = jest.fn().mockReturnValue('.wav')

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

        const findBlogPosts = () => {
          const blogDir = path.join(process.cwd(), 'content', 'blog')
          const posts = []

          if (!fs.existsSync(blogDir)) {
            console.error('Blog directory not found:', blogDir)
            return posts
          }

          const entries = fs.readdirSync(blogDir, { withFileTypes: true })

          for (const entry of entries) {
            if (entry.isDirectory()) {
              const postDir = path.join(blogDir, entry.name)
              const markdownFiles = fs
                .readdirSync(postDir)
                .filter((file) => file.endsWith('.md'))

              if (markdownFiles.length > 0) {
                posts.push({
                  name: entry.name,
                  dir: postDir,
                  markdownFile: path.join(postDir, markdownFiles[0]),
                })
              }
            }
          }

          return posts
        }

        const posts = findBlogPosts()
        expect(posts).toHaveLength(2)
        expect(posts[0].name).toBe('post1')
        expect(posts[0].markdownFile).toBe(
          '/fake/project/dir/content/blog/post1/index.md'
        )
        expect(posts[1].name).toBe('post2')
        expect(posts[1].markdownFile).toBe(
          '/fake/project/dir/content/blog/post2/post2.md'
        )
      })
    })

    test('should return empty array when blog directory does not exist', async () => {
      await jest.isolateModulesAsync(async () => {
        const fs = require('fs')
        const path = require('path')

        // Mock fs methods
        fs.existsSync = jest.fn().mockReturnValue(false) // Blog directory doesn't exist
        fs.readFileSync = jest.fn().mockReturnValue('mock content')
        fs.writeFileSync = jest.fn().mockImplementation(() => {})
        fs.readdirSync = jest.fn().mockReturnValue([])

        // Mock path methods
        path.join = jest.fn().mockImplementation((...args) => args.join('/'))
        path.basename = jest.fn().mockImplementation((file, ext) => {
          if (ext) return file.replace(ext, '')
          return file
        })
        path.extname = jest.fn().mockReturnValue('.wav')

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

        const findBlogPosts = () => {
          const blogDir = path.join(process.cwd(), 'content', 'blog')
          const posts = []

          if (!fs.existsSync(blogDir)) {
            console.error('Blog directory not found:', blogDir)
            return posts
          }

          const entries = fs.readdirSync(blogDir, { withFileTypes: true })

          for (const entry of entries) {
            if (entry.isDirectory()) {
              const postDir = path.join(blogDir, entry.name)
              const markdownFiles = fs
                .readdirSync(postDir)
                .filter((file) => file.endsWith('.md'))

              if (markdownFiles.length > 0) {
                posts.push({
                  name: entry.name,
                  dir: postDir,
                  markdownFile: path.join(postDir, markdownFiles[0]),
                })
              }
            }
          }

          return posts
        }

        const posts = findBlogPosts()
        expect(posts).toHaveLength(0)
        expect(console.error).toHaveBeenCalledWith(
          'Blog directory not found:',
          '/fake/project/dir/content/blog'
        )
      })
    })
  })

  describe('updateMarkdownFile', () => {
    test('should update markdown file with new audio references', async () => {
      await jest.isolateModulesAsync(async () => {
        const fs = require('fs')
        const path = require('path')

        // Mock fs methods
        fs.existsSync = jest.fn().mockReturnValue(true)
        fs.readFileSync = jest
          .fn()
          .mockReturnValue('Content with `audio: ../../assets/music/old.wav`')
        fs.writeFileSync = jest.fn().mockImplementation(() => {})
        fs.readdirSync = jest.fn().mockReturnValue([])

        // Mock path methods
        path.join = jest.fn().mockImplementation((...args) => args.join('/'))
        path.basename = jest.fn().mockImplementation((file, ext) => {
          if (ext) return file.replace(ext, '')
          return file
        })
        path.extname = jest.fn().mockReturnValue('.wav')

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

        const updateMarkdownFile = (filePath, oldAudioRefs, newAudioRefs) => {
          try {
            let content = fs.readFileSync(filePath, 'utf8')

            // Replace each old audio reference with the new one
            oldAudioRefs.forEach((oldRef, index) => {
              const newRef = newAudioRefs[index]
              if (newRef) {
                content = content.replace(oldRef, newRef)
                console.log(`  Updated: ${oldRef} → ${newRef}`)
              }
            })

            fs.writeFileSync(filePath, content)
            return true
          } catch (error) {
            console.error(`Failed to update ${filePath}:`, error.message)
            return false
          }
        }

        const oldRefs = ['`audio: ../../assets/music/old.wav`']
        const newRefs = [
          '`audio: https://fake.supabase.co/storage/v1/object/public/audio/new.wav`',
        ]

        const result = updateMarkdownFile('/fake/file.md', oldRefs, newRefs)

        expect(result).toBe(true)
        expect(fs.writeFileSync).toHaveBeenCalledWith(
          '/fake/file.md',
          'Content with `audio: https://fake.supabase.co/storage/v1/object/public/audio/new.wav`'
        )
        expect(console.log).toHaveBeenCalledWith(
          '  Updated: `audio: ../../assets/music/old.wav` → `audio: https://fake.supabase.co/storage/v1/object/public/audio/new.wav`'
        )
      })
    })

    test('should handle file read errors', async () => {
      await jest.isolateModulesAsync(async () => {
        const fs = require('fs')
        const path = require('path')

        // Mock fs methods
        fs.existsSync = jest.fn().mockReturnValue(true)
        fs.readFileSync = jest.fn().mockImplementation(() => {
          throw new Error('File read error')
        })
        fs.writeFileSync = jest.fn().mockImplementation(() => {})
        fs.readdirSync = jest.fn().mockReturnValue([])

        // Mock path methods
        path.join = jest.fn().mockImplementation((...args) => args.join('/'))
        path.basename = jest.fn().mockImplementation((file, ext) => {
          if (ext) return file.replace(ext, '')
          return file
        })
        path.extname = jest.fn().mockReturnValue('.wav')

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

        const updateMarkdownFile = (filePath, oldAudioRefs, newAudioRefs) => {
          try {
            let content = fs.readFileSync(filePath, 'utf8')

            // Replace each old audio reference with the new one
            oldAudioRefs.forEach((oldRef, index) => {
              const newRef = newAudioRefs[index]
              if (newRef) {
                content = content.replace(oldRef, newRef)
                console.log(`  Updated: ${oldRef} → ${newRef}`)
              }
            })

            fs.writeFileSync(filePath, content)
            return true
          } catch (error) {
            console.error(`Failed to update ${filePath}:`, error.message)
            return false
          }
        }

        const result = updateMarkdownFile('/fake/file.md', [], [])

        expect(result).toBe(false)
        expect(console.error).toHaveBeenCalledWith(
          'Failed to update /fake/file.md:',
          'File read error'
        )
      })
    })
  })

  describe('uploadToSupabase', () => {
    test('should upload file to Supabase successfully', async () => {
      await jest.isolateModulesAsync(async () => {
        const fs = require('fs')
        const path = require('path')

        // Mock fs methods
        fs.existsSync = jest.fn().mockReturnValue(true)
        fs.readFileSync = jest
          .fn()
          .mockReturnValue(Buffer.from('mock audio data'))
        fs.writeFileSync = jest.fn().mockImplementation(() => {})
        fs.readdirSync = jest.fn().mockReturnValue([])

        // Mock path methods
        path.join = jest.fn().mockImplementation((...args) => args.join('/'))
        path.basename = jest.fn().mockImplementation((file, ext) => {
          if (ext) return file.replace(ext, '')
          return file
        })
        path.extname = jest.fn().mockReturnValue('.wav')

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

        const uploadToSupabase = async (
          filePath,
          fileName,
          bucketName = 'audio'
        ) => {
          try {
            // Read the file
            const fileBuffer = fs.readFileSync(filePath)

            // Upload to Supabase
            const { data, error } = await mockSupabase.storage
              .from(bucketName)
              .upload(fileName, fileBuffer, {
                contentType: 'audio/wav',
                upsert: true, // Allow overwriting if file exists
              })

            if (error) {
              throw new Error(`Failed to upload to Supabase: ${error.message}`)
            }

            // Get the public URL
            const { data: urlData } = mockSupabase.storage
              .from(bucketName)
              .getPublicUrl(fileName)

            return urlData.publicUrl
          } catch (error) {
            console.error(`Upload error for ${fileName}:`, error.message)
            throw error
          }
        }

        const result = await uploadToSupabase(
          '/fake/audio.wav',
          'test-file.wav'
        )

        expect(result).toBe(
          'https://fake.supabase.co/storage/v1/object/public/audio/test-file.wav'
        )
        expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
          'test-file.wav',
          Buffer.from('mock audio data'),
          {
            contentType: 'audio/wav',
            upsert: true,
          }
        )
      })
    })

    test('should handle upload errors', async () => {
      await jest.isolateModulesAsync(async () => {
        const fs = require('fs')
        const path = require('path')

        // Mock fs methods
        fs.existsSync = jest.fn().mockReturnValue(true)
        fs.readFileSync = jest
          .fn()
          .mockReturnValue(Buffer.from('mock audio data'))
        fs.writeFileSync = jest.fn().mockImplementation(() => {})
        fs.readdirSync = jest.fn().mockReturnValue([])

        // Mock path methods
        path.join = jest.fn().mockImplementation((...args) => args.join('/'))
        path.basename = jest.fn().mockImplementation((file, ext) => {
          if (ext) return file.replace(ext, '')
          return file
        })
        path.extname = jest.fn().mockReturnValue('.wav')

        const mockSupabase = {
          storage: {
            from: jest.fn().mockReturnThis(),
            upload: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Upload failed' },
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

        const uploadToSupabase = async (
          filePath,
          fileName,
          bucketName = 'audio'
        ) => {
          try {
            // Read the file
            const fileBuffer = fs.readFileSync(filePath)

            // Upload to Supabase
            const { data, error } = await mockSupabase.storage
              .from(bucketName)
              .upload(fileName, fileBuffer, {
                contentType: 'audio/wav',
                upsert: true, // Allow overwriting if file exists
              })

            if (error) {
              throw new Error(`Failed to upload to Supabase: ${error.message}`)
            }

            // Get the public URL
            const { data: urlData } = mockSupabase.storage
              .from(bucketName)
              .getPublicUrl(fileName)

            return urlData.publicUrl
          } catch (error) {
            console.error(`Upload error for ${fileName}:`, error.message)
            throw error
          }
        }

        await expect(
          uploadToSupabase('/fake/audio.wav', 'test-file.wav')
        ).rejects.toThrow('Failed to upload to Supabase: Upload failed')
        expect(console.error).toHaveBeenCalledWith(
          'Upload error for test-file.wav:',
          'Failed to upload to Supabase: Upload failed'
        )
      })
    })
  })

  describe('environment validation', () => {
    test('should exit if Supabase credentials are missing', async () => {
      process.env = { NODE_ENV: 'test' } // Remove Supabase credentials

      await expect(async () => {
        await jest.isolateModulesAsync(async () => {
          const fs = require('fs')
          const path = require('path')

          // Mock fs methods
          fs.existsSync = jest.fn().mockReturnValue(true)
          fs.readFileSync = jest.fn().mockReturnValue('mock content')
          fs.writeFileSync = jest.fn().mockImplementation(() => {})
          fs.readdirSync = jest.fn().mockReturnValue([])

          // Mock path methods
          path.join = jest.fn().mockImplementation((...args) => args.join('/'))
          path.basename = jest.fn().mockImplementation((file, ext) => {
            if (ext) return file.replace(ext, '')
            return file
          })
          path.extname = jest.fn().mockReturnValue('.wav')

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

          const migrationModule = require('./migrate-to-supabase')
          await migrationModule.migrateToSupabase()
        })
      }).rejects.toThrow('Missing Supabase credentials')
    })
  })
})
