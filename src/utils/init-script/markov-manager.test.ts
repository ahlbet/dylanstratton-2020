import { MarkovManager } from './markov-manager'
import type { EditTextFunction, GetCoherencyFunction } from './markov-manager'
import { MarkovGenerator } from '../markov-generator'

// Mock MarkovGenerator
jest.mock('../markov-generator')
const MockMarkovGenerator = MarkovGenerator as jest.MockedClass<typeof MarkovGenerator>

describe('MarkovManager', () => {
  let markovManager: MarkovManager
  let mockGenerator: jest.Mocked<MarkovGenerator>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create mock generator instance
    mockGenerator = {
      loadTextFromSupabaseWithCredentials: jest.fn(),
      loadTextFromArray: jest.fn(),
      getLines: jest.fn(),
      generateMultipleLines: jest.fn(),
    } as any
    
    MockMarkovGenerator.mockImplementation(() => mockGenerator)
    
    markovManager = new MarkovManager()
  })

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(markovManager['markovTexts']).toEqual([])
      expect(markovManager['markovChains']).toEqual({})
      expect(markovManager['isInitialized']).toBe(false)
      expect(markovManager['generator']).toBeUndefined()
    })
  })

  describe('initialize', () => {
    beforeEach(() => {
      // Mock environment variables
      process.env.SUPABASE_URL = 'https://test.supabase.co'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    })

    afterEach(() => {
      delete process.env.SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    it('should not reinitialize if already initialized', async () => {
      markovManager['isInitialized'] = true
      markovManager['generator'] = mockGenerator
      
      await markovManager.initialize()
      
      expect(MockMarkovGenerator).not.toHaveBeenCalled()
    })

    it('should successfully load from Supabase', async () => {
      mockGenerator.loadTextFromSupabaseWithCredentials.mockResolvedValue(true)
      mockGenerator.getLines.mockReturnValue(['Text 1', 'Text 2'])
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await markovManager.initialize()
      
      expect(MockMarkovGenerator).toHaveBeenCalledWith(7)
      expect(mockGenerator.loadTextFromSupabaseWithCredentials).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key',
        'markov-text'
      )
      expect(markovManager['isInitialized']).toBe(true)
      expect(markovManager['markovTexts']).toEqual(['Text 1', 'Text 2'])
      expect(consoleSpy).toHaveBeenCalledWith('✅ Successfully loaded markov texts from Supabase')
      
      consoleSpy.mockRestore()
    })

    it('should fallback to sample texts when Supabase fails', async () => {
      mockGenerator.loadTextFromSupabaseWithCredentials.mockResolvedValue(false)
      mockGenerator.getLines.mockReturnValue(['Sample 1', 'Sample 2'])
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      await markovManager.initialize()
      
      expect(mockGenerator.loadTextFromArray).toHaveBeenCalledWith([
        "The quick brown fox jumps over the lazy dog.",
        "All work and no play makes Jack a dull boy.",
        "To be or not to be, that is the question.",
        "It was the best of times, it was the worst of times.",
        "In a hole in the ground there lived a hobbit."
      ])
      expect(markovManager['isInitialized']).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Failed to load from Supabase, using fallback text')
      
      consoleSpy.mockRestore()
    })

    it('should use fallback when Supabase credentials are missing', async () => {
      delete process.env.SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      
      mockGenerator.getLines.mockReturnValue(['Sample 1', 'Sample 2'])
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      await markovManager.initialize()
      
      expect(mockGenerator.loadTextFromArray).toHaveBeenCalled()
      expect(markovManager['isInitialized']).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Missing Supabase credentials, using fallback text')
      
      consoleSpy.mockRestore()
    })

    it('should handle initialization errors gracefully', async () => {
      mockGenerator.loadTextFromSupabaseWithCredentials.mockRejectedValue(new Error('Network error'))
      mockGenerator.getLines.mockReturnValue(['Sample 1', 'Sample 2'])
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      await markovManager.initialize()
      
      expect(mockGenerator.loadTextFromArray).toHaveBeenCalled()
      expect(markovManager['isInitialized']).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to initialize markov generator:', 'Network error')
      
      consoleSpy.mockRestore()
    })
  })

  describe('generateInitialTexts', () => {
    it('should return sample texts when generator is not available', () => {
      const result = markovManager.generateInitialTexts(3)
      
      expect(result).toEqual([
        "The quick brown fox jumps over the lazy dog.",
        "All work and no play makes Jack a dull boy.",
        "To be or not to be, that is the question."
      ])
    })

    it('should generate texts using MarkovGenerator when available', () => {
      markovManager['generator'] = mockGenerator
      mockGenerator.generateMultipleLines.mockReturnValue(['Generated 1', 'Generated 2'])
      
      const result = markovManager.generateInitialTexts(2)
      
      expect(mockGenerator.generateMultipleLines).toHaveBeenCalledWith(2, 1000, 2)
      expect(result).toEqual(['Generated 1', 'Generated 2'])
    })

    it('should fallback to sample texts when generation fails', () => {
      markovManager['generator'] = mockGenerator
      mockGenerator.generateMultipleLines.mockImplementation(() => {
        throw new Error('Generation failed')
      })
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const result = markovManager.generateInitialTexts(2)
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to generate with MarkovGenerator, using sample texts')
      expect(result).toEqual([
        "The quick brown fox jumps over the lazy dog.",
        "All work and no play makes Jack a dull boy."
      ])
      
      consoleSpy.mockRestore()
    })
  })

  describe('processTexts', () => {
    let mockEditTextFn: jest.MockedFunction<EditTextFunction>
    let mockGetCoherencyFn: jest.MockedFunction<GetCoherencyFunction>

    beforeEach(() => {
      mockEditTextFn = jest.fn()
      mockGetCoherencyFn = jest.fn()
      markovManager['generator'] = mockGenerator
    })

    it('should process texts successfully without regeneration', async () => {
      const texts = ['Text 1', 'Text 2']
      mockEditTextFn.mockResolvedValue('Edited 1')
      mockGetCoherencyFn.mockResolvedValue(0.8)
      
      const result = await markovManager.processTexts(texts, mockEditTextFn, mockGetCoherencyFn)
      
      expect(result.editedTexts).toEqual(['Edited 1', 'Edited 1'])
      expect(result.coherencyLevels).toEqual([0.8, 0.8])
      expect(mockEditTextFn).toHaveBeenCalledTimes(2)
      expect(mockGetCoherencyFn).toHaveBeenCalledTimes(2)
    })

    it('should handle text regeneration when requested', async () => {
      const texts = ['Text 1']
      mockEditTextFn
        .mockResolvedValueOnce('REGENERATE')
        .mockResolvedValueOnce('Final text')
      mockGenerator.generateMultipleLines.mockReturnValue(['New text'])
      mockGetCoherencyFn.mockResolvedValue(0.9)
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const result = await markovManager.processTexts(texts, mockEditTextFn, mockGetCoherencyFn)
      
      expect(result.editedTexts).toEqual(['Final text'])
      expect(result.coherencyLevels).toEqual([0.9])
      expect(mockEditTextFn).toHaveBeenCalledTimes(2)
      expect(consoleSpy).toHaveBeenCalledWith('🔄 Regenerated text 1')
      
      consoleSpy.mockRestore()
    })

    it('should handle regeneration errors gracefully', async () => {
      const texts = ['Text 1']
      mockEditTextFn.mockResolvedValue('REGENERATE')
      mockGenerator.generateMultipleLines.mockImplementation(() => {
        throw new Error('Generation failed')
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const result = await markovManager.processTexts(texts, mockEditTextFn, mockGetCoherencyFn)
      
      expect(result.editedTexts).toEqual(['Generated text 1 could not be created.'])
      expect(consoleSpy).toHaveBeenCalledWith('Error regenerating text 1:', 'Generation failed')
      
      consoleSpy.mockRestore()
    })
  })

  describe('formatForMarkdown', () => {
    it('should format texts with blockquote syntax', () => {
      const texts = ['Text 1', 'Text 2']
      const result = markovManager.formatForMarkdown(texts)
      
      expect(result).toBe('> Text 1\n\n> Text 2')
    })

    it('should handle empty array', () => {
      const result = markovManager.formatForMarkdown([])
      expect(result).toBe('')
    })

    it('should handle single text', () => {
      const result = markovManager.formatForMarkdown(['Single text'])
      expect(result).toBe('> Single text')
    })
  })

  describe('prepareTextsData', () => {
    it('should prepare data for database insertion', () => {
      const editedTexts = ['Text 1', 'Text 2']
      const coherencyLevels = [0.8, 0.9]
      const name = 'test-post'
      const dailyId = '25aug15'
      
      const result = markovManager.prepareTextsData(editedTexts, coherencyLevels, name, dailyId)
      
      expect(result).toEqual([
        {
          text_content: 'Text 1',
          coherency_level: 0.8,
          daily_id: '25aug15',
          text_length: 6
        },
        {
          text_content: 'Text 2',
          coherency_level: 0.9,
          daily_id: '25aug15',
          text_length: 6
        }
      ])
    })
  })

  describe('getStatistics', () => {
    it('should return correct statistics', () => {
      markovManager['markovTexts'] = ['Hello world', 'Good morning']
      markovManager['markovChains'] = { 'Hello': ['world'], 'Good': ['morning'] }
      
      const result = markovManager.getStatistics()
      
      expect(result).toEqual({
        totalTexts: 2,
        totalWords: 4,
        uniqueWords: 2,
        averageTextLength: 2
      })
    })

    it('should handle empty data', () => {
      const result = markovManager.getStatistics()
      
      expect(result).toEqual({
        totalTexts: 0,
        totalWords: 0,
        uniqueWords: 0,
        averageTextLength: 0
      })
    })
  })

  describe('validateTextCoherency', () => {
    it('should calculate coherency score correctly', () => {
      markovManager['markovChains'] = {
        'Hello': ['world'],
        'world': ['how'],
        'how': ['are']
      }
      
      const result = markovManager.validateTextCoherency('Hello world how are you')
      
      expect(result).toBe(75) // 3 out of 4 pairs are coherent
    })

    it('should return 0 for empty text', () => {
      const result = markovManager.validateTextCoherency('')
      expect(result).toBe(0)
    })

    it('should return 0 for single word', () => {
      const result = markovManager.validateTextCoherency('Hello')
      expect(result).toBe(0)
    })

    it('should handle text with no coherent pairs', () => {
      markovManager['markovChains'] = {}
      
      const result = markovManager.validateTextCoherency('Hello world how are you')
      
      expect(result).toBe(0)
    })
  })
})
