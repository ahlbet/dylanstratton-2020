const { UserInteraction } = require('./user-interaction')

// Mock readline
jest.mock('readline')

// Mock coherency level utilities
jest.mock('../coherency-level-utils', () => ({
  getCoherencyLevel: jest.fn(),
}))

// Mock audio tools
jest.mock('../audio-tools', () => ({
  COHERENCY_MIN_LEVEL: 1,
  COHERENCY_MAX_LEVEL: 100,
}))

describe('UserInteraction', () => {
  let userInteraction
  let mockRl

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock readline interface
    mockRl = {
      question: jest.fn(),
      close: jest.fn(),
    }

    // Mock readline.createInterface
    const readline = require('readline')
    readline.createInterface.mockReturnValue(mockRl)

    userInteraction = new UserInteraction()
  })

  describe('constructor', () => {
    it('should create readline interface', () => {
      const readline = require('readline')
      expect(readline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
      })
    })
  })

  describe('close', () => {
    it('should close readline interface', () => {
      userInteraction.close()
      expect(mockRl.close).toHaveBeenCalled()
    })
  })

  describe('askQuestion', () => {
    it('should resolve with user answer', async () => {
      const question = 'What is your name?'
      const answer = 'John'

      mockRl.question.mockImplementation((q, callback) => {
        expect(q).toBe(question)
        callback(answer)
      })

      const result = await userInteraction.askQuestion(question)
      expect(result).toBe(answer)
    })
  })

  describe('displayText', () => {
    it('should display formatted text with title', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const text = 'Sample text content'
      const title = 'Sample Title'

      userInteraction.displayText(text, title)

      expect(consoleSpy).toHaveBeenCalledWith('\n' + '='.repeat(60))
      expect(consoleSpy).toHaveBeenCalledWith(title)
      expect(consoleSpy).toHaveBeenCalledWith('='.repeat(60))
      expect(consoleSpy).toHaveBeenCalledWith(text)
      expect(consoleSpy).toHaveBeenCalledWith('='.repeat(60) + '\n')

      consoleSpy.mockRestore()
    })
  })

  describe('editText', () => {
    it('should return original text when user chooses not to edit', async () => {
      const originalText = 'Original text'
      const textNumber = 1

      // Mock displayText
      const displayTextSpy = jest.spyOn(userInteraction, 'displayText')

      // Mock askQuestion to return 'n'
      mockRl.question.mockImplementation((q, callback) => {
        if (q.includes('edit this text')) {
          callback('n')
        }
      })

      const result = await userInteraction.editText(originalText, textNumber)

      expect(result).toBe(originalText)
      expect(displayTextSpy).toHaveBeenCalledWith(
        originalText,
        'Original Markov Text #1'
      )
    })

    it('should return REGENERATE when user chooses to regenerate', async () => {
      const originalText = 'Original text'
      const textNumber = 1

      // Mock displayText
      const displayTextSpy = jest.spyOn(userInteraction, 'displayText')

      // Mock askQuestion to return 'r'
      mockRl.question.mockImplementation((q, callback) => {
        if (q.includes('edit this text')) {
          callback('r')
        }
      })

      const result = await userInteraction.editText(originalText, textNumber)

      expect(result).toBe('REGENERATE')
      expect(displayTextSpy).toHaveBeenCalledWith(
        originalText,
        'Original Markov Text #1'
      )
    })

    it('should handle user editing text line by line', async () => {
      const originalText = 'Original text'
      const textNumber = 1

      // Mock displayText
      const displayTextSpy = jest.spyOn(userInteraction, 'displayText')

      // Mock askQuestion to simulate editing
      let callCount = 0
      mockRl.question.mockImplementation((q, callback) => {
        if (q.includes('edit this text')) {
          callback('y')
        } else if (q.includes('Line 1')) {
          callback('First edited line')
        } else if (q.includes('Line 2')) {
          callback('Second edited line')
        } else if (q.includes('Line 3')) {
          callback('') // Empty line to finish
        }
      })

      const result = await userInteraction.editText(originalText, textNumber)

      expect(result).toBe('First edited line\nSecond edited line')
      expect(displayTextSpy).toHaveBeenCalledWith(
        originalText,
        'Original Markov Text #1'
      )
    })

    it('should handle skip command', async () => {
      const originalText = 'Original text'
      const textNumber = 1

      // Mock askQuestion to return 'y' then 'skip'
      mockRl.question.mockImplementation((q, callback) => {
        if (q.includes('edit this text')) {
          callback('y')
        } else if (q.includes('Line 1')) {
          callback('skip')
        }
      })

      const result = await userInteraction.editText(originalText, textNumber)

      expect(result).toBe(originalText)
    })

    it('should handle regenerate command during editing', async () => {
      const originalText = 'Original text'
      const textNumber = 1

      // Mock askQuestion to return 'y' then 'regenerate'
      mockRl.question.mockImplementation((q, callback) => {
        if (q.includes('edit this text')) {
          callback('y')
        } else if (q.includes('Line 1')) {
          callback('regenerate')
        }
      })

      const result = await userInteraction.editText(originalText, textNumber)

      expect(result).toBe('REGENERATE')
    })
  })

  describe('getTextCoherencyLevel', () => {
    it('should call getCoherencyLevel with bound askQuestion function', async () => {
      const { getCoherencyLevel } = require('../coherency-level-utils')
      getCoherencyLevel.mockResolvedValue(75)

      const result = await userInteraction.getTextCoherencyLevel(1)

      expect(getCoherencyLevel).toHaveBeenCalledWith(expect.any(Function), 1)
      expect(result).toBe(75)
    })
  })

  describe('getAudioCoherencyLevel', () => {
    it('should return default value when no input provided', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      // Mock askQuestion to return empty string
      mockRl.question.mockImplementation((q, callback) => {
        if (q.includes('coherency level')) {
          callback('')
        }
      })

      const result = await userInteraction.getAudioCoherencyLevel(1, 3)

      expect(result).toBe(50)
      expect(consoleSpy).toHaveBeenCalledWith(
        '\n🎵 Audio Track #1 Coherency Level'
      )

      consoleSpy.mockRestore()
    })

    it('should validate coherency level input', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      // Mock askQuestion to return invalid input first, then valid
      let callCount = 0
      mockRl.question.mockImplementation((q, callback) => {
        if (q.includes('coherency level')) {
          if (callCount === 0) {
            callback('150') // Invalid
            callCount++
          } else {
            callback('75') // Valid
          }
        }
      })

      const result = await userInteraction.getAudioCoherencyLevel(1, 3)

      expect(result).toBe(75)
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Please enter a number between 1 and 100'
      )

      consoleSpy.mockRestore()
    })

    it('should offer audio preview when available', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      // Mock askQuestion for preview choice and coherency input
      mockRl.question.mockImplementation((q, callback) => {
        if (q.includes('listen to this track')) {
          callback('y')
        } else if (q.includes('coherency level')) {
          callback('80')
        }
      })

      const audioPlayer = { tool: 'afplay', description: 'macOS audio player' }

      const result = await userInteraction.getAudioCoherencyLevel(
        1,
        3,
        '/path/to/audio.wav',
        audioPlayer
      )

      expect(result).toBe(80)
      expect(consoleSpy).toHaveBeenCalledWith('\n🎧 Playing audio track...')

      consoleSpy.mockRestore()
    })
  })
})
