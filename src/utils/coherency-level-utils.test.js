const {
  getCoherencyLevel,
  editCoherencyLevel,
} = require('./coherency-level-utils')

describe('coherency-level-utils', () => {
  let mockAskQuestion
  let mockQuestion
  let mockSaveCoherencyLevel
  let mockConsoleLog

  beforeEach(() => {
    mockAskQuestion = jest.fn()
    mockQuestion = jest.fn()
    mockSaveCoherencyLevel = jest.fn()
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    mockConsoleLog.mockRestore()
    jest.clearAllMocks()
  })

  describe('getCoherencyLevel', () => {
    test('should return default value 1 when user presses Enter', async () => {
      mockAskQuestion.mockResolvedValue('')

      const result = await getCoherencyLevel(mockAskQuestion, 5)

      expect(result).toBe(1)
      expect(mockAskQuestion).toHaveBeenCalledWith(
        'Enter coherency level (1-100, or press Enter for default 1): '
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '\n📊 Coherency Level for Text #5'
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '1 = Least coherent (random/jumbled)'
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '100 = Fully coherent (clear, logical flow)'
      )
    })

    test('should return valid coherency level when user enters a number', async () => {
      mockAskQuestion.mockResolvedValue('75')

      const result = await getCoherencyLevel(mockAskQuestion, 3)

      expect(result).toBe(75)
      expect(mockAskQuestion).toHaveBeenCalledWith(
        'Enter coherency level (1-100, or press Enter for default 1): '
      )
    })

    test('should return minimum valid coherency level (1)', async () => {
      mockAskQuestion.mockResolvedValue('1')

      const result = await getCoherencyLevel(mockAskQuestion, 7)

      expect(result).toBe(1)
    })

    test('should return maximum valid coherency level (100)', async () => {
      mockAskQuestion.mockResolvedValue('100')

      const result = await getCoherencyLevel(mockAskQuestion, 2)

      expect(result).toBe(100)
    })

    test('should handle decimal numbers by parsing as integer', async () => {
      mockAskQuestion.mockResolvedValue('50.7')

      const result = await getCoherencyLevel(mockAskQuestion, 4)

      expect(result).toBe(50)
    })

    test('should retry when user enters invalid input (NaN)', async () => {
      mockAskQuestion
        .mockResolvedValueOnce('invalid')
        .mockResolvedValueOnce('75')

      const result = await getCoherencyLevel(mockAskQuestion, 6)

      expect(result).toBe(75)
      expect(mockAskQuestion).toHaveBeenCalledTimes(2)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '❌ Please enter a number between 1 and 100'
      )
    })

    test('should retry when user enters number below 1', async () => {
      mockAskQuestion.mockResolvedValueOnce('0').mockResolvedValueOnce('25')

      const result = await getCoherencyLevel(mockAskQuestion, 8)

      expect(result).toBe(25)
      expect(mockAskQuestion).toHaveBeenCalledTimes(2)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '❌ Please enter a number between 1 and 100'
      )
    })

    test('should retry when user enters number above 100', async () => {
      mockAskQuestion.mockResolvedValueOnce('101').mockResolvedValueOnce('80')

      const result = await getCoherencyLevel(mockAskQuestion, 9)

      expect(result).toBe(80)
      expect(mockAskQuestion).toHaveBeenCalledTimes(2)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '❌ Please enter a number between 1 and 100'
      )
    })

    test('should retry multiple times until valid input is provided', async () => {
      mockAskQuestion
        .mockResolvedValueOnce('invalid')
        .mockResolvedValueOnce('-5')
        .mockResolvedValueOnce('150')
        .mockResolvedValueOnce('60')

      const result = await getCoherencyLevel(mockAskQuestion, 10)

      expect(result).toBe(60)
      expect(mockAskQuestion).toHaveBeenCalledTimes(4)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '❌ Please enter a number between 1 and 100'
      )
    })

    test('should display correct text number in prompt', async () => {
      mockAskQuestion.mockResolvedValue('50')

      await getCoherencyLevel(mockAskQuestion, 42)

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '\n📊 Coherency Level for Text #42'
      )
    })

    test('should handle edge case of text number 0', async () => {
      mockAskQuestion.mockResolvedValue('75')

      const result = await getCoherencyLevel(mockAskQuestion, 0)

      expect(result).toBe(75)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '\n📊 Coherency Level for Text #0'
      )
    })

    test('should handle edge case of negative text number', async () => {
      mockAskQuestion.mockResolvedValue('25')

      const result = await getCoherencyLevel(mockAskQuestion, -5)

      expect(result).toBe(25)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '\n📊 Coherency Level for Text #-5'
      )
    })
  })

  describe('editCoherencyLevel', () => {
    const mockText = {
      id: 1,
      title: 'Test Text',
      coherency_level: 50,
    }

    test('should return null when user cancels by pressing Enter', async () => {
      mockQuestion.mockResolvedValue('')

      const result = await editCoherencyLevel(
        mockQuestion,
        mockText,
        mockSaveCoherencyLevel
      )

      expect(result).toBeNull()
      expect(mockQuestion).toHaveBeenCalledWith(
        'Enter new coherency level (1-100, or press Enter to cancel): '
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '⏭️  Cancelled coherency level edit'
      )
    })

    test('should return null when user cancels confirmation', async () => {
      mockQuestion.mockResolvedValueOnce('75').mockResolvedValueOnce('n')

      const result = await editCoherencyLevel(
        mockQuestion,
        mockText,
        mockSaveCoherencyLevel
      )

      expect(result).toBeNull()
      expect(mockQuestion).toHaveBeenCalledTimes(2)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📊 Setting coherency level to 75'
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '⏭️  Cancelled coherency level edit'
      )
    })

    test('should save coherency level when user confirms with "y"', async () => {
      const savedResult = { success: true }
      mockQuestion.mockResolvedValueOnce('80').mockResolvedValueOnce('y')
      mockSaveCoherencyLevel.mockResolvedValue(savedResult)

      const result = await editCoherencyLevel(
        mockQuestion,
        mockText,
        mockSaveCoherencyLevel
      )

      expect(result).toBe(savedResult)
      expect(mockSaveCoherencyLevel).toHaveBeenCalledWith(mockText, 80)
      expect(mockQuestion).toHaveBeenCalledWith(
        'Save this coherency level? (y/n): '
      )
    })

    test('should save coherency level when user confirms with "yes"', async () => {
      const savedResult = { success: true }
      mockQuestion.mockResolvedValueOnce('90').mockResolvedValueOnce('yes')
      mockSaveCoherencyLevel.mockResolvedValue(savedResult)

      const result = await editCoherencyLevel(
        mockQuestion,
        mockText,
        mockSaveCoherencyLevel
      )

      expect(result).toBe(savedResult)
      expect(mockSaveCoherencyLevel).toHaveBeenCalledWith(mockText, 90)
    })

    test('should save coherency level when user confirms with "YES" (case insensitive)', async () => {
      const savedResult = { success: true }
      mockQuestion.mockResolvedValueOnce('70').mockResolvedValueOnce('YES')
      mockSaveCoherencyLevel.mockResolvedValue(savedResult)

      const result = await editCoherencyLevel(
        mockQuestion,
        mockText,
        mockSaveCoherencyLevel
      )

      expect(result).toBe(savedResult)
      expect(mockSaveCoherencyLevel).toHaveBeenCalledWith(mockText, 70)
    })

    test('should retry when user enters invalid input (NaN)', async () => {
      mockQuestion
        .mockResolvedValueOnce('invalid')
        .mockResolvedValueOnce('85')
        .mockResolvedValueOnce('y')

      const result = await editCoherencyLevel(
        mockQuestion,
        mockText,
        mockSaveCoherencyLevel
      )

      expect(result).toBe(await mockSaveCoherencyLevel(mockText, 85))
      expect(mockQuestion).toHaveBeenCalledTimes(3)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '❌ Please enter a number between 1 and 100'
      )
    })

    test('should retry when user enters number below 1', async () => {
      mockQuestion
        .mockResolvedValueOnce('0')
        .mockResolvedValueOnce('65')
        .mockResolvedValueOnce('y')

      const result = await editCoherencyLevel(
        mockQuestion,
        mockText,
        mockSaveCoherencyLevel
      )

      expect(result).toBe(await mockSaveCoherencyLevel(mockText, 65))
      expect(mockQuestion).toHaveBeenCalledTimes(3)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '❌ Please enter a number between 1 and 100'
      )
    })

    test('should retry when user enters number above 100', async () => {
      mockQuestion
        .mockResolvedValueOnce('150')
        .mockResolvedValueOnce('95')
        .mockResolvedValueOnce('y')

      const result = await editCoherencyLevel(
        mockQuestion,
        mockText,
        mockSaveCoherencyLevel
      )

      expect(result).toBe(await mockSaveCoherencyLevel(mockText, 95))
      expect(mockQuestion).toHaveBeenCalledTimes(3)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '❌ Please enter a number between 1 and 100'
      )
    })

    test('should display current coherency level when editing', async () => {
      mockQuestion.mockResolvedValue('')

      await editCoherencyLevel(mockQuestion, mockText, mockSaveCoherencyLevel)

      expect(mockConsoleLog).toHaveBeenCalledWith('Current level: 50')
    })

    test('should display "Not set" when coherency level is undefined', async () => {
      const textWithoutLevel = { ...mockText, coherency_level: undefined }
      mockQuestion.mockResolvedValue('')

      await editCoherencyLevel(
        mockQuestion,
        textWithoutLevel,
        mockSaveCoherencyLevel
      )

      expect(mockConsoleLog).toHaveBeenCalledWith('Current level: Not set')
    })

    test('should display "Not set" when coherency level is null', async () => {
      const textWithoutLevel = { ...mockText, coherency_level: null }
      mockQuestion.mockResolvedValue('')

      await editCoherencyLevel(
        mockQuestion,
        textWithoutLevel,
        mockSaveCoherencyLevel
      )

      expect(mockConsoleLog).toHaveBeenCalledWith('Current level: Not set')
    })

    test('should display "Not set" when coherency level is 0', async () => {
      const textWithZeroLevel = { ...mockText, coherency_level: 0 }
      mockQuestion.mockResolvedValue('')

      await editCoherencyLevel(
        mockQuestion,
        textWithZeroLevel,
        mockSaveCoherencyLevel
      )

      expect(mockConsoleLog).toHaveBeenCalledWith('Current level: Not set')
    })

    test('should handle multiple retries until valid input is provided', async () => {
      mockQuestion
        .mockResolvedValueOnce('invalid')
        .mockResolvedValueOnce('-10')
        .mockResolvedValueOnce('200')
        .mockResolvedValueOnce('55')
        .mockResolvedValueOnce('y')

      const result = await editCoherencyLevel(
        mockQuestion,
        mockText,
        mockSaveCoherencyLevel
      )

      expect(result).toBe(await mockSaveCoherencyLevel(mockText, 55))
      expect(mockQuestion).toHaveBeenCalledTimes(5)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '❌ Please enter a number between 1 and 100'
      )
    })

    test('should handle edge case of minimum valid coherency level (1)', async () => {
      mockQuestion.mockResolvedValueOnce('1').mockResolvedValueOnce('y')

      const result = await editCoherencyLevel(
        mockQuestion,
        mockText,
        mockSaveCoherencyLevel
      )

      expect(result).toBe(await mockSaveCoherencyLevel(mockText, 1))
    })

    test('should handle edge case of maximum valid coherency level (100)', async () => {
      mockQuestion.mockResolvedValueOnce('100').mockResolvedValueOnce('y')

      const result = await editCoherencyLevel(
        mockQuestion,
        mockText,
        mockSaveCoherencyLevel
      )

      expect(result).toBe(await mockSaveCoherencyLevel(mockText, 100))
    })

    test('should handle decimal numbers by parsing as integer', async () => {
      mockQuestion.mockResolvedValueOnce('75.8').mockResolvedValueOnce('y')

      const result = await editCoherencyLevel(
        mockQuestion,
        mockText,
        mockSaveCoherencyLevel
      )

      expect(result).toBe(await mockSaveCoherencyLevel(mockText, 75))
    })

    test('should display correct editor header', async () => {
      mockQuestion.mockResolvedValue('')

      await editCoherencyLevel(mockQuestion, mockText, mockSaveCoherencyLevel)

      expect(mockConsoleLog).toHaveBeenCalledWith('\n📊 Coherency Level Editor')
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '1 = Least coherent (random/jumbled)'
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '100 = Fully coherent (clear, logical flow)'
      )
    })
  })

  describe('integration', () => {
    test('should handle complete workflow from getCoherencyLevel to editCoherencyLevel', async () => {
      // First, get a coherency level
      mockAskQuestion.mockResolvedValue('75')
      const initialLevel = await getCoherencyLevel(mockAskQuestion, 1)
      expect(initialLevel).toBe(75)

      // Then, edit the coherency level
      const mockText = { id: 1, coherency_level: initialLevel }
      mockQuestion.mockResolvedValueOnce('85').mockResolvedValueOnce('y')
      mockSaveCoherencyLevel.mockResolvedValue({ success: true, new_level: 85 })

      const editResult = await editCoherencyLevel(
        mockQuestion,
        mockText,
        mockSaveCoherencyLevel
      )
      expect(editResult).toEqual({ success: true, new_level: 85 })
      expect(mockSaveCoherencyLevel).toHaveBeenCalledWith(mockText, 85)
    })

    test('should handle error scenarios gracefully', async () => {
      // Test invalid input handling
      mockAskQuestion
        .mockResolvedValueOnce('invalid')
        .mockResolvedValueOnce('50')

      const result = await getCoherencyLevel(mockAskQuestion, 1)
      expect(result).toBe(50)

      // Test cancellation in edit mode
      mockQuestion.mockResolvedValue('')
      const editResult = await editCoherencyLevel(
        mockQuestion,
        { id: 1 },
        mockSaveCoherencyLevel
      )
      expect(editResult).toBeNull()
    })
  })
})
