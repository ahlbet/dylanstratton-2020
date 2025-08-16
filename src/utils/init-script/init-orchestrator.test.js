const { InitOrchestrator } = require('./init-orchestrator')

// Mock all dependencies
jest.mock('./git-operations')
jest.mock('./user-interaction')
jest.mock('./audio-processor')
jest.mock('./supabase-manager')
jest.mock('./markov-manager')
jest.mock('./local-data-manager')
jest.mock('./template-processor')
jest.mock('../date-utils')
jest.mock('../audio-tools')

describe('InitOrchestrator', () => {
  let orchestrator
  let mockUserInteraction
  let mockSupabaseManager
  let mockMarkovManager

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock environment
    process.env.NODE_ENV = 'test'

    // Create mock instances
    mockUserInteraction = {
      close: jest.fn(),
      editText: jest.fn(),
      getTextCoherencyLevel: jest.fn(),
      getAudioCoherencyLevel: jest.fn(),
    }

    mockSupabaseManager = {
      client: {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            error: null,
          }),
        }),
      },
      uploadToStorage: jest.fn(),
      createDailyEntry: jest.fn(),
      uploadMarkovTexts: jest.fn(),
    }

    mockMarkovManager = {
      initialize: jest.fn(),
      generateInitialTexts: jest.fn(),
      processTexts: jest.fn(),
      formatForMarkdown: jest.fn(),
      prepareTextsData: jest.fn(),
    }

    // Mock constructor dependencies
    const { UserInteraction } = require('./user-interaction')
    const { SupabaseManager } = require('./supabase-manager')
    const { MarkovManager } = require('./markov-manager')

    UserInteraction.mockImplementation(() => mockUserInteraction)
    SupabaseManager.mockImplementation(() => mockSupabaseManager)
    MarkovManager.mockImplementation(() => mockMarkovManager)

    // Mock date-utils
    const { transformDate } = require('../date-utils')
    transformDate.mockReturnValue('2025-01-01')

    // Mock audio-tools
    const { getAudioPlayer } = require('../audio-tools')
    getAudioPlayer.mockReturnValue({
      tool: 'afplay',
      description: 'macOS audio player',
    })

    orchestrator = new InitOrchestrator('test-post', 'Test description')
  })

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(orchestrator.name).toBe('test-post')
      expect(orchestrator.description).toBe('Test description')
      expect(orchestrator.date).toBe('2025-01-01')
      expect(orchestrator.isTest).toBe(true)
      expect(orchestrator.movedFiles).toEqual([])
      expect(orchestrator.localPlaybackFiles).toEqual([])
    })
  })

  describe('validateInput', () => {
    it('should not throw error when name is provided', () => {
      expect(() => orchestrator.validateInput()).not.toThrow()
    })

    it('should throw error when name is missing', () => {
      orchestrator.name = null
      expect(() => orchestrator.validateInput()).toThrow(
        'Name argument is required'
      )
    })
  })

  describe('run', () => {
    it('should execute all steps in correct order', async () => {
      // Mock all the step methods
      const validateInputSpy = jest.spyOn(orchestrator, 'validateInput')
      const initializeGitSpy = jest.spyOn(orchestrator, 'initializeGit')
      const processAudioFilesSpy = jest.spyOn(orchestrator, 'processAudioFiles')
      const processMarkovTextsSpy = jest.spyOn(
        orchestrator,
        'processMarkovTexts'
      )
      const generateCoverArtSpy = jest.spyOn(orchestrator, 'generateCoverArt')
      const createDatabaseEntriesSpy = jest.spyOn(
        orchestrator,
        'createDatabaseEntries'
      )
      const createBlogPostSpy = jest.spyOn(orchestrator, 'createBlogPost')
      const pushToGitSpy = jest.spyOn(orchestrator, 'pushToGit')
      const updateLocalDataSpy = jest.spyOn(orchestrator, 'updateLocalData')

      // Mock successful execution
      orchestrator.movedFiles = [{ fileName: 'test.wav' }] // Ensure Git push happens

      // Mock AudioProcessor.findAudioFiles to return proper structure
      const { AudioProcessor } = require('./audio-processor')
      AudioProcessor.findAudioFiles.mockReturnValue({
        localPlaybackFiles: [],
      })

      // Mock TemplateProcessor.getAssetsDir
      const { TemplateProcessor } = require('./template-processor')
      TemplateProcessor.getAssetsDir.mockReturnValue('/content/assets/music')

      // Mock fs.mkdirSync
      const fs = require('fs')
      fs.mkdirSync = jest.fn()

      // Mock Markov manager methods for the run
      mockMarkovManager.initialize.mockResolvedValue(true)
      mockMarkovManager.generateInitialTexts.mockReturnValue([
        'Text 1',
        'Text 2',
      ])
      mockMarkovManager.processTexts.mockResolvedValue({
        editedTexts: ['Edited 1', 'Edited 2'],
        coherencyLevels: [75, 80],
      })
      mockMarkovManager.formatForMarkdown.mockReturnValue(
        '> Text 1\n\n> Text 2'
      )
      mockMarkovManager.prepareTextsData.mockReturnValue([
        { text_content: 'Edited 1', coherency_level: 75 },
        { text_content: 'Edited 2', coherency_level: 80 },
      ])

      await orchestrator.run()

      expect(validateInputSpy).toHaveBeenCalled()
      expect(initializeGitSpy).toHaveBeenCalled()
      expect(processAudioFilesSpy).toHaveBeenCalled()
      expect(processMarkovTextsSpy).toHaveBeenCalled()
      expect(generateCoverArtSpy).toHaveBeenCalled()
      expect(createDatabaseEntriesSpy).toHaveBeenCalled()
      expect(createBlogPostSpy).toHaveBeenCalled()
      expect(pushToGitSpy).toHaveBeenCalled()
      expect(updateLocalDataSpy).toHaveBeenCalled()
      expect(mockUserInteraction.close).toHaveBeenCalled()
    })

    it('should skip Git push when no audio files uploaded', async () => {
      // Mock all the step methods
      jest.spyOn(orchestrator, 'validateInput')
      jest.spyOn(orchestrator, 'initializeGit')
      jest.spyOn(orchestrator, 'processAudioFiles')
      jest.spyOn(orchestrator, 'processMarkovTexts')
      jest.spyOn(orchestrator, 'generateCoverArt')
      jest.spyOn(orchestrator, 'createDatabaseEntries')
      jest.spyOn(orchestrator, 'createBlogPost')
      const pushToGitSpy = jest.spyOn(orchestrator, 'pushToGit')
      jest.spyOn(orchestrator, 'updateLocalData')

      // Ensure no audio files
      orchestrator.movedFiles = []

      // Mock AudioProcessor.findAudioFiles to return proper structure
      const { AudioProcessor } = require('./audio-processor')
      AudioProcessor.findAudioFiles.mockReturnValue({
        localPlaybackFiles: [],
      })

      // Mock TemplateProcessor.getAssetsDir
      const { TemplateProcessor } = require('./template-processor')
      TemplateProcessor.getAssetsDir.mockReturnValue('/content/assets/music')

      // Mock fs.mkdirSync
      const fs = require('fs')
      fs.mkdirSync = jest.fn()

      // Mock Markov manager methods for the run
      mockMarkovManager.initialize.mockResolvedValue(true)
      mockMarkovManager.generateInitialTexts.mockReturnValue([
        'Text 1',
        'Text 2',
      ])
      mockMarkovManager.processTexts.mockResolvedValue({
        editedTexts: ['Edited 1', 'Edited 2'],
        coherencyLevels: [75, 80],
      })
      mockMarkovManager.formatForMarkdown.mockReturnValue(
        '> Text 1\n\n> Text 2'
      )
      mockMarkovManager.prepareTextsData.mockReturnValue([
        { text_content: 'Edited 1', coherency_level: 75 },
        { text_content: 'Edited 2', coherency_level: 80 },
      ])

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await orchestrator.run()

      expect(pushToGitSpy).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'No audio files were uploaded to Supabase. Skipping git push to avoid incomplete commits.'
      )

      consoleSpy.mockRestore()
    })

    it('should handle errors gracefully', async () => {
      // Mock error in one of the steps
      jest.spyOn(orchestrator, 'validateInput')
      jest.spyOn(orchestrator, 'initializeGit').mockImplementation(() => {
        throw new Error('Git error')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await expect(orchestrator.run()).rejects.toThrow('Git error')
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Initialization failed:',
        'Git error'
      )
      expect(mockUserInteraction.close).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('processAudioFiles', () => {
    it('should process audio files and upload to Supabase', async () => {
      const { AudioProcessor } = require('./audio-processor')
      const { TemplateProcessor } = require('./template-processor')

      // Mock audio processor
      AudioProcessor.findAudioFiles.mockReturnValue({
        localPlaybackFiles: [
          { fileName: 'test-1.wav', localPath: '/path/to/test-1.wav' },
          { fileName: 'test-2.wav', localPath: '/path/to/test-2.wav' },
        ],
      })

      AudioProcessor.extractAudioDuration.mockResolvedValue(120)

      // Mock Supabase upload
      mockSupabaseManager.uploadToStorage.mockResolvedValue(
        'https://supabase.url/test.wav'
      )

      // Mock template processor
      TemplateProcessor.getAssetsDir.mockReturnValue('/content/assets/music')

      // Mock fs.mkdirSync
      const fs = require('fs')
      fs.mkdirSync = jest.fn()

      await orchestrator.processAudioFiles()

      expect(orchestrator.localPlaybackFiles).toHaveLength(2)
      expect(orchestrator.movedFiles).toHaveLength(2)
      expect(mockSupabaseManager.uploadToStorage).toHaveBeenCalledTimes(2)
    })
  })

  describe('processMarkovTexts', () => {
    it('should initialize and process Markov texts', async () => {
      // Mock Markov manager methods
      mockMarkovManager.initialize.mockResolvedValue(true)
      mockMarkovManager.generateInitialTexts.mockReturnValue([
        'Text 1',
        'Text 2',
      ])
      mockMarkovManager.processTexts.mockResolvedValue({
        editedTexts: ['Edited 1', 'Edited 2'],
        coherencyLevels: [75, 80],
      })
      mockMarkovManager.formatForMarkdown.mockReturnValue(
        '> Text 1\n\n> Text 2'
      )
      mockMarkovManager.prepareTextsData.mockReturnValue([
        { text_content: 'Edited 1', coherency_level: 75 },
        { text_content: 'Edited 2', coherency_level: 80 },
      ])

      await orchestrator.processMarkovTexts()

      expect(mockMarkovManager.initialize).toHaveBeenCalled()
      expect(mockMarkovManager.generateInitialTexts).toHaveBeenCalledWith(5)
      expect(mockMarkovManager.processTexts).toHaveBeenCalled()
      expect(orchestrator.editedTexts).toEqual(['Edited 1', 'Edited 2'])
      expect(orchestrator.coherencyLevels).toEqual([75, 80])
    })
  })

  describe('createDatabaseEntries', () => {
    it('should create daily entry and related data', async () => {
      // Mock daily entry creation
      mockSupabaseManager.createDailyEntry.mockResolvedValue(123)

      // Mock audio files
      orchestrator.movedFiles = [
        { fileName: 'test.wav', localPath: '/path/to/test.wav' },
      ]

      // Mock user interaction for coherency level
      mockUserInteraction.getAudioCoherencyLevel.mockResolvedValue(75)

      await orchestrator.createDatabaseEntries()

      expect(mockSupabaseManager.createDailyEntry).toHaveBeenCalledWith(
        'test-post',
        null, // cover art path
        '2025-01-01'
      )
      expect(orchestrator.dailyId).toBe(123)
    })

    it('should skip daily audio entries when no files exist', async () => {
      // Mock daily entry creation
      mockSupabaseManager.createDailyEntry.mockResolvedValue(123)

      // No audio files
      orchestrator.movedFiles = []

      await orchestrator.createDatabaseEntries()

      expect(orchestrator.dailyId).toBe(123)
      // Should not call getAudioCoherencyLevel
      expect(mockUserInteraction.getAudioCoherencyLevel).not.toHaveBeenCalled()
    })
  })

  describe('createBlogPost', () => {
    it('should create blog post with processed template', async () => {
      const { TemplateProcessor } = require('./template-processor')

      // Mock template processor methods
      TemplateProcessor.getTemplatePath.mockReturnValue('/src/template.md')
      TemplateProcessor.readTemplate.mockReturnValue(
        'Template content {name} {date}'
      )
      TemplateProcessor.generateAudioFilesContent.mockReturnValue(
        'audio: test.wav'
      )
      TemplateProcessor.processTemplate.mockReturnValue('Processed template')
      TemplateProcessor.createBlogPost.mockReturnValue(
        '/content/blog/test-post/test-post.md'
      )

      // Mock Markov manager
      mockMarkovManager.formatForMarkdown.mockReturnValue(
        '> Text 1\n\n> Text 2'
      )

      // Set required properties
      orchestrator.movedFiles = [{ fileName: 'test.wav' }]
      orchestrator.editedTexts = ['Text 1', 'Text 2']
      orchestrator.coverArtData = { url: 'https://cover.art' }
      orchestrator.dailyId = 123

      await orchestrator.createBlogPost()

      expect(TemplateProcessor.readTemplate).toHaveBeenCalled()
      expect(TemplateProcessor.processTemplate).toHaveBeenCalledWith(
        'Template content {name} {date}',
        {
          name: 'test-post',
          date: '2025-01-01',
          description: 'Test description',
          audio_files: 'audio: test.wav',
          cover_art: 'https://cover.art',
          daily_id: 123,
          markov_text: '> Text 1\n\n> Text 2',
        }
      )
      expect(TemplateProcessor.createBlogPost).toHaveBeenCalled()
    })
  })
})
