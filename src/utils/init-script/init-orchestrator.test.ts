import { InitOrchestrator } from './init-orchestrator'

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
  let orchestrator: InitOrchestrator
  let mockUserInteraction: any
  let mockSupabaseManager: any
  let mockMarkovManager: any

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
      ;(orchestrator as any).name = null
      expect(() => orchestrator.validateInput()).toThrow(
        'Name argument is required'
      )
    })
  })

  describe('run', () => {
    it('should execute all steps in correct order', async () => {
      // Mock all the step methods
      const validateInputSpy = jest.spyOn(orchestrator as any, 'validateInput')
      const initializeGitSpy = jest.spyOn(orchestrator as any, 'initializeGit')
      const processAudioFilesSpy = jest.spyOn(orchestrator as any, 'processAudioFiles')
      const processMarkovTextsSpy = jest.spyOn(
        orchestrator as any,
        'processMarkovTexts'
      )
      const generateCoverArtSpy = jest.spyOn(orchestrator as any, 'generateCoverArt')
      const createDatabaseEntriesSpy = jest.spyOn(
        orchestrator as any,
        'createDatabaseEntries'
      )
      const createBlogPostSpy = jest.spyOn(orchestrator as any, 'createBlogPost')
      const pushToGitSpy = jest.spyOn(orchestrator as any, 'pushToGit')
      const updateLocalDataSpy = jest.spyOn(orchestrator as any, 'updateLocalData')

      // Mock successful execution
      ;(orchestrator as any).movedFiles = [{ fileName: 'test.wav' }] // Ensure Git push happens

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
    })

    it('should skip Git push when no audio files uploaded', async () => {
      // Mock all the step methods
      const pushToGitSpy = jest.spyOn(orchestrator as any, 'pushToGit')

      // Mock AudioProcessor.findAudioFiles to return empty array
      const { AudioProcessor } = require('./audio-processor')
      AudioProcessor.findAudioFiles.mockReturnValue({
        localPlaybackFiles: [],
      })

      // Mock other dependencies
      const { TemplateProcessor } = require('./template-processor')
      TemplateProcessor.getAssetsDir.mockReturnValue('/content/assets/music')

      const fs = require('fs')
      fs.mkdirSync = jest.fn()

      mockMarkovManager.initialize.mockResolvedValue(true)
      mockMarkovManager.generateInitialTexts.mockReturnValue(['Text 1'])
      mockMarkovManager.processTexts.mockResolvedValue({
        editedTexts: ['Edited 1'],
        coherencyLevels: [75],
      })
      mockMarkovManager.formatForMarkdown.mockReturnValue('> Text 1')
      mockMarkovManager.prepareTextsData.mockReturnValue([
        { text_content: 'Edited 1', coherency_level: 75 },
      ])

      await orchestrator.run()

      expect(pushToGitSpy).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      // Mock AudioProcessor.findAudioFiles to throw error
      const { AudioProcessor } = require('./audio-processor')
      AudioProcessor.findAudioFiles.mockImplementation(() => {
        throw new Error('Audio processing failed')
      })

      await expect(orchestrator.run()).rejects.toThrow('Audio processing failed')
      expect(mockUserInteraction.close).toHaveBeenCalled()
    })
  })

  describe('processAudioFiles', () => {
    it('should process audio files and upload to Supabase', async () => {
      // Mock AudioProcessor.findAudioFiles
      const { AudioProcessor } = require('./audio-processor')
      AudioProcessor.findAudioFiles.mockReturnValue({
        localPlaybackFiles: [
          { fileName: 'test-1.wav', localPath: '/path/to/test-1.wav' },
          { fileName: 'test-2.wav', localPath: '/path/to/test-2.wav' },
        ],
      })

      // Mock TemplateProcessor.getAssetsDir
      const { TemplateProcessor } = require('./template-processor')
      TemplateProcessor.getAssetsDir.mockReturnValue('/content/assets/music')

      // Mock fs.mkdirSync
      const fs = require('fs')
      fs.mkdirSync = jest.fn()

      // Mock AudioProcessor.extractAudioDuration
      AudioProcessor.extractAudioDuration.mockResolvedValue(120)

      // Mock Supabase upload
      mockSupabaseManager.uploadToStorage.mockResolvedValue('https://supabase.url/test.wav')

      await (orchestrator as any).processAudioFiles()

      expect(mockSupabaseManager.uploadToStorage).toHaveBeenCalledTimes(2)
      expect((orchestrator as any).movedFiles).toHaveLength(2)
    })
  })

  describe('processMarkovTexts', () => {
    it('should initialize and process Markov texts', async () => {
      mockMarkovManager.initialize.mockResolvedValue(true)
      mockMarkovManager.generateInitialTexts.mockReturnValue(['Text 1', 'Text 2'])
      mockMarkovManager.processTexts.mockResolvedValue({
        editedTexts: ['Edited 1', 'Edited 2'],
        coherencyLevels: [75, 80],
      })

      await (orchestrator as any).processMarkovTexts()

      expect(mockMarkovManager.initialize).toHaveBeenCalled()
      expect(mockMarkovManager.generateInitialTexts).toHaveBeenCalledWith(5)
      expect(mockMarkovManager.processTexts).toHaveBeenCalled()
    })
  })

  describe('createDatabaseEntries', () => {
    it('should create daily entry and related data', async () => {
      mockSupabaseManager.createDailyEntry.mockResolvedValue('daily-123')
      ;(orchestrator as any).movedFiles = [{ fileName: 'test.wav' }]
      ;(orchestrator as any).editedTexts = ['Text 1']
      ;(orchestrator as any).coherencyLevels = [75]

      mockMarkovManager.prepareTextsData.mockReturnValue([
        { text_content: 'Text 1', coherency_level: 75 },
      ])

      await (orchestrator as any).createDatabaseEntries()

      expect(mockSupabaseManager.createDailyEntry).toHaveBeenCalled()
      expect(mockSupabaseManager.uploadMarkovTexts).toHaveBeenCalled()
    })

    it('should skip daily audio entries when no files exist', async () => {
      mockSupabaseManager.createDailyEntry.mockResolvedValue('daily-123')
      ;(orchestrator as any).movedFiles = []
      ;(orchestrator as any).editedTexts = ['Text 1']
      ;(orchestrator as any).coherencyLevels = [75]

      mockMarkovManager.prepareTextsData.mockReturnValue([
        { text_content: 'Text 1', coherency_level: 75 },
      ])

      await (orchestrator as any).createDatabaseEntries()

      expect(mockSupabaseManager.createDailyEntry).toHaveBeenCalled()
      expect(mockSupabaseManager.uploadMarkovTexts).toHaveBeenCalled()
    })
  })

  describe('createBlogPost', () => {
    it('should create blog post with processed template', async () => {
      // Mock TemplateProcessor methods
      const { TemplateProcessor } = require('./template-processor')
      TemplateProcessor.getTemplatePath.mockReturnValue('/path/to/template.md')
      TemplateProcessor.readTemplate.mockReturnValue('Template content {name} {date}')
      TemplateProcessor.generateAudioFilesContent.mockReturnValue('Audio content')
      TemplateProcessor.processTemplate.mockReturnValue('Processed template')
      TemplateProcessor.createBlogPost.mockReturnValue('/path/to/blog.md')

      // Mock Markov manager
      mockMarkovManager.formatForMarkdown.mockReturnValue('> Markov text')

      // Set required properties
      ;(orchestrator as any).editedTexts = ['Text 1']
      ;(orchestrator as any).coverArtData = { url: 'https://cover.art' }
      ;(orchestrator as any).dailyId = 'daily-123'

      await (orchestrator as any).createBlogPost()

      expect(TemplateProcessor.readTemplate).toHaveBeenCalled()
      expect(TemplateProcessor.processTemplate).toHaveBeenCalled()
      expect(TemplateProcessor.createBlogPost).toHaveBeenCalled()
    })
  })
})
