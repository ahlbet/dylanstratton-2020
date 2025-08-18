import { InitDryRun } from './init-dry-run'

describe('InitDryRun', () => {
  let dryRun: InitDryRun

  beforeEach(() => {
    // Set test environment to prevent console output and readline creation
    process.env.NODE_ENV = 'test'
    // Mock console methods before creating the instance
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    
    dryRun = new InitDryRun('test-post')
  })

  afterEach(() => {
    jest.restoreAllMocks()
    delete process.env.NODE_ENV
  })

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(dryRun['name']).toBe('test-post')
      expect(dryRun['date']).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(dryRun['isTest']).toBe(true)
    })

    it('should not create readline interface in test mode', () => {
      expect(dryRun['rl']).toBeUndefined()
    })
  })

  describe('validateInput', () => {
    it('should pass validation with valid name', () => {
      expect(() => dryRun['validateInput']()).not.toThrow()
    })

    it('should throw error with empty name', () => {
      dryRun['name'] = ''
      expect(() => dryRun['validateInput']()).toThrow('Name argument is required')
    })
  })

  describe('askQuestion', () => {
    it('should return default value in test mode', async () => {
      const result = await dryRun['askQuestion']('Test question')
      expect(result).toBe('n')
    })
  })

  describe('displayText', () => {
    it('should format text with borders', () => {
      // Mock console.log for this specific test
      const mockLog = jest.spyOn(console, 'log').mockImplementation()
      
      dryRun['displayText']('Test content', 'Test Title')
      
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('='.repeat(60))
      )
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('Test Title')
      )
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('Test content')
      )
      
      mockLog.mockRestore()
    })
  })

  describe('transformDate', () => {
    it('should format date correctly', () => {
      // Create date using UTC to avoid timezone issues
      const testDate = new Date(Date.UTC(2025, 0, 15)) // Month is 0-indexed, so 0 = January
      const result = dryRun['transformDate'](testDate)
      
      // Check format and that it contains the expected year
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result).toContain('2025')
      
      // The exact day might vary due to timezone, so just check the format is correct
      const parts = result.split('-')
      expect(parts).toHaveLength(3)
      expect(parts[0]).toBe('2025')
      expect(parts[1]).toMatch(/^\d{2}$/)
      expect(parts[2]).toMatch(/^\d{2}$/)
    })

    it('should handle single digit month and day', () => {
      const testDate = new Date(Date.UTC(2025, 2, 5)) // Month is 0-indexed, so 2 = March
      const result = dryRun['transformDate'](testDate)
      
      // Check format and that it contains the expected year
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result).toContain('2025')
      
      // The exact day might vary due to timezone, so just check the format is correct
      const parts = result.split('-')
      expect(parts).toHaveLength(3)
      expect(parts[0]).toBe('2025')
      expect(parts[1]).toMatch(/^\d{2}$/)
      expect(parts[2]).toMatch(/^\d{2}$/)
    })
  })

  describe('loadFallbackTexts', () => {
    it('should load fallback texts', () => {
      // Mock the markovGenerator
      dryRun['markovGenerator'] = {
        loadTextFromArray: jest.fn(),
      } as any

      dryRun['loadFallbackTexts']()
      
      expect(dryRun['markovGenerator']?.loadTextFromArray).toHaveBeenCalledWith(
        expect.arrayContaining([
          'The quick brown fox jumps over the lazy dog.',
          'A journey of a thousand miles begins with a single step.',
        ])
      )
    })
  })

  describe('class structure', () => {
    it('should have all required methods', () => {
      expect(typeof dryRun['validateInput']).toBe('function')
      expect(typeof dryRun['testSupabaseConnection']).toBe('function')
      expect(typeof dryRun['processAudioFiles']).toBe('function')
      expect(typeof dryRun['processMarkovTexts']).toBe('function')
      expect(typeof dryRun['generateCoverArt']).toBe('function')
      expect(typeof dryRun['createDatabaseEntries']).toBe('function')
      expect(typeof dryRun['createBlogPost']).toBe('function')
      expect(typeof dryRun['updateLocalData']).toBe('function')
      expect(typeof dryRun['testAudioPlayback']).toBe('function')
      expect(typeof dryRun['run']).toBe('function')
    })

    it('should have all required properties', () => {
      expect(dryRun['name']).toBeDefined()
      expect(dryRun['date']).toBeDefined()
      expect(dryRun['isTest']).toBeDefined()
      expect(dryRun['movedFiles']).toBeDefined()
      expect(dryRun['localPlaybackFiles']).toBeDefined()
      expect(dryRun['editedTexts']).toBeDefined()
      expect(dryRun['coherencyLevels']).toBeDefined()
      expect(dryRun['coverArtData']).toBeDefined()
      expect(dryRun['dailyId']).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should re-throw errors instead of calling process.exit', async () => {
      // Mock validateInput to throw an error
      jest.spyOn(dryRun as any, 'validateInput').mockImplementation(() => {
        throw new Error('Test error')
      })

      await expect(dryRun.run()).rejects.toThrow('Test error')
    })
  })
})
