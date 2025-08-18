import { UserInteraction } from './user-interaction'
import * as readline from 'readline'
import { spawn } from 'child_process'

// Mock readline module
jest.mock('readline')
const MockReadline = readline as jest.Mocked<typeof readline>

// Mock child_process module
jest.mock('child_process')
const MockSpawn = spawn as jest.MockedFunction<typeof spawn>

describe('UserInteraction', () => {
  let userInteraction: UserInteraction
  let mockRl: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create mock readline interface
    mockRl = {
      question: jest.fn(),
      close: jest.fn()
    }
    
    MockReadline.createInterface.mockReturnValue(mockRl)
    
    userInteraction = new UserInteraction()
  })

  afterEach(() => {
    userInteraction.close()
  })

  describe('constructor and close', () => {
    it('should create readline interface on construction', () => {
      expect(MockReadline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
      })
    })

    it('should close readline interface', () => {
      userInteraction.close()
      expect(mockRl.close).toHaveBeenCalled()
    })
  })

  describe('displayText', () => {
    it('should display text with formatted borders', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      userInteraction.displayText('Test content', 'Test Title')
      
      expect(consoleSpy).toHaveBeenCalledWith('============================================================')
      expect(consoleSpy).toHaveBeenCalledWith('Test Title')
      expect(consoleSpy).toHaveBeenCalledWith('Test content')
      
      consoleSpy.mockRestore()
    })
  })

  describe('editText', () => {
    it('should return REGENERATE when user chooses regenerate', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('r'))
      
      const result = await userInteraction.editText('Original text', 0)
      
      expect(result).toBe('REGENERATE')
    })

    it('should return original text when user chooses not to edit', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('n'))
      
      const result = await userInteraction.editText('Original text', 0)
      
      expect(result).toBe('Original text')
    })

    it('should return original text when user chooses yes but then skips', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('y'))
        .mockImplementationOnce((question, callback) => callback('skip'))
      
      const result = await userInteraction.editText('Original text', 0)
      
      expect(result).toBe('Original text')
    })

    it('should return REGENERATE when user chooses yes but then regenerates', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('y'))
        .mockImplementationOnce((question, callback) => callback('regenerate'))
      
      const result = await userInteraction.editText('Original text', 0)
      
      expect(result).toBe('REGENERATE')
    })

    it('should return edited text when user provides input', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('y'))
        .mockImplementationOnce((question, callback) => callback('Line 1'))
        .mockImplementationOnce((question, callback) => callback('Line 2'))
        .mockImplementationOnce((question, callback) => callback(''))
      
      const result = await userInteraction.editText('Original text', 0)
      
      expect(result).toBe('Line 1\nLine 2')
    })

    it('should handle empty lines correctly', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('y'))
        .mockImplementationOnce((question, callback) => callback(''))
        .mockImplementationOnce((question, callback) => callback('Line 1'))
        .mockImplementationOnce((question, callback) => callback(''))
      
      const result = await userInteraction.editText('Original text', 0)
      
      expect(result).toBe('Line 1')
    })
  })

  describe('getTextCoherencyLevel', () => {
    it('should return user input coherency level', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('75'))
      
      const result = await userInteraction.getTextCoherencyLevel('Test text', 0)
      
      expect(result).toBe(75)
      expect(consoleSpy).toHaveBeenCalledWith('✅ Coherency level set to 75')
      
      consoleSpy.mockRestore()
    })

    it('should retry on invalid input', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('invalid'))
        .mockImplementationOnce((question, callback) => callback('50'))
      
      const result = await userInteraction.getTextCoherencyLevel('Test text', 0)
      
      expect(result).toBe(50)
      expect(consoleSpy).toHaveBeenCalledWith('Please enter a number between 1 and 100')
      
      consoleSpy.mockRestore()
    })
  })

  describe('getAudioCoherencyLevel', () => {
    const mockAudioPlayer = {
      tool: 'afplay',
      description: 'macOS audio player'
    }

    it('should return default value when user presses Enter', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('n')) // Don't listen
        .mockImplementationOnce((question, callback) => callback('')) // Press Enter for default
      
      const result = await userInteraction.getAudioCoherencyLevel(1, 3, '/path/to/audio.wav', mockAudioPlayer)
      
      expect(result).toBe(50)
    })

    it('should return user input coherency level', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('n')) // Don't listen
        .mockImplementationOnce((question, callback) => callback('80'))
      
      const result = await userInteraction.getAudioCoherencyLevel(1, 3, '/path/to/audio.wav', mockAudioPlayer)
      
      expect(result).toBe(80)
    })

    it('should retry on invalid input', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('n')) // Don't listen
        .mockImplementationOnce((question, callback) => callback('150')) // Invalid
        .mockImplementationOnce((question, callback) => callback('75')) // Valid
      
      const result = await userInteraction.getAudioCoherencyLevel(1, 3, '/path/to/audio.wav', mockAudioPlayer)
      
      expect(result).toBe(75)
      expect(consoleSpy).toHaveBeenCalledWith('❌ Please enter a number between 1 and 100')
      
      consoleSpy.mockRestore()
    })

    it('should handle audio playback when user chooses to listen', async () => {
      const mockProcess = {
        on: jest.fn(),
        kill: jest.fn(),
        killed: false
      }
      
      MockSpawn.mockReturnValue(mockProcess as any)
      
      // Mock the askQuestion method to handle both calls
      const mockAskQuestion = jest.spyOn(userInteraction as any, 'askQuestion')
        .mockImplementationOnce(() => Promise.resolve('y')) // Listen to audio
        .mockImplementationOnce(() => Promise.resolve('60')) // Coherency level
      
      // Mock process events
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100)
        }
        return mockProcess
      })
      
      const result = await userInteraction.getAudioCoherencyLevel(1, 3, '/path/to/audio.wav', mockAudioPlayer)
      
      expect(result).toBe(60)
      expect(MockSpawn).toHaveBeenCalledWith('afplay', ['/path/to/audio.wav'], {
        stdio: 'pipe',
        detached: false,
      })
      
      mockAskQuestion.mockRestore()
    })

    it('should handle missing audio player gracefully', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('')) // Press Enter for default
      
      const result = await userInteraction.getAudioCoherencyLevel(1, 3, '/path/to/audio.wav', null)
      
      expect(result).toBe(50)
    })
  })

  describe('askToContinue', () => {
    it('should return true for yes responses', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('y'))
      
      const result = await userInteraction.askToContinue('Continue?')
      
      expect(result).toBe(true)
    })

    it('should return true for yes responses with different casing', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('YES'))
      
      const result = await userInteraction.askToContinue('Continue?')
      
      expect(result).toBe(true)
    })

    it('should return false for no responses', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('n'))
      
      const result = await userInteraction.askToContinue('Continue?')
      
      expect(result).toBe(false)
    })

    it('should return false for no responses with different casing', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('NO'))
      
      const result = await userInteraction.askToContinue('Continue?')
      
      expect(result).toBe(false)
    })

    it('should return false for other responses', async () => {
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('maybe'))
      
      const result = await userInteraction.askToContinue('Continue?')
      
      expect(result).toBe(false)
    })
  })

  describe('askForConfirmation', () => {
    it('should display warning message and ask for confirmation', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      mockRl.question
        .mockImplementationOnce((question, callback) => callback('y'))
      
      const result = await userInteraction.askForConfirmation('This is dangerous!')
      
      expect(result).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('\n⚠️  This is dangerous!')
      
      consoleSpy.mockRestore()
    })
  })

  describe('playAudioWithStop', () => {
    it('should handle different audio player tools correctly', async () => {
      const mockProcess = {
        on: jest.fn(),
        kill: jest.fn(),
        killed: false
      }
      
      MockSpawn.mockReturnValue(mockProcess as any)
      
      // Mock process events
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 100)
        }
        return mockProcess
      })
      
      const audioPlayer = { tool: 'mpv', description: 'Cross-platform player' }
      
      // Mock the askQuestion method to simulate user not stopping
      jest.spyOn(userInteraction as any, 'askQuestion').mockResolvedValue('')
      
      await (userInteraction as any).playAudioWithStop('/path/to/audio.wav', audioPlayer)
      
      expect(MockSpawn).toHaveBeenCalledWith('mpv', ['--no-video', '--quiet', '/path/to/audio.wav'], {
        stdio: 'pipe',
        detached: false,
      })
    })

    it('should handle process errors', async () => {
      const mockProcess = {
        on: jest.fn(),
        kill: jest.fn(),
        killed: false
      }
      
      MockSpawn.mockReturnValue(mockProcess as any)
      
      // Mock process events
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Process error')), 100)
        }
        return mockProcess
      })
      
      const audioPlayer = { tool: 'afplay', description: 'macOS player' }
      
      await expect(
        (userInteraction as any).playAudioWithStop('/path/to/audio.wav', audioPlayer)
      ).rejects.toThrow('Process error')
    })
  })
})
