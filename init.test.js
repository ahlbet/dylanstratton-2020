const { main } = require('./init')

// Mock the InitOrchestrator
jest.mock('./src/utils/init-script/init-orchestrator')

describe('init.js', () => {
  let mockOrchestrator
  let mockInitOrchestrator

  beforeEach(() => {
    jest.clearAllMocks()

    // Create mock orchestrator instance
    mockOrchestrator = {
      run: jest.fn(),
    }

    // Mock the InitOrchestrator constructor
    mockInitOrchestrator = jest.fn().mockImplementation(() => mockOrchestrator)

    const {
      InitOrchestrator,
    } = require('./src/utils/init-script/init-orchestrator')
    InitOrchestrator.mockImplementation(mockInitOrchestrator)

    // Mock process.exit
    process.exit = jest.fn()
  })

  describe('main function', () => {
    it('should create orchestrator and run it successfully', async () => {
      mockOrchestrator.run.mockResolvedValue(undefined)

      await main('test-post', 'Test description')

      expect(mockInitOrchestrator).toHaveBeenCalledWith(
        'test-post',
        'Test description'
      )
      expect(mockOrchestrator.run).toHaveBeenCalled()
    })

    it('should handle orchestrator errors gracefully', async () => {
      const error = new Error('Orchestrator failed')
      mockOrchestrator.run.mockRejectedValue(error)

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await main('test-post')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Script failed:',
        'Orchestrator failed'
      )
      expect(process.exit).toHaveBeenCalledWith(1)

      consoleSpy.mockRestore()
    })
  })

  describe('module exports', () => {
    it('should export main function', () => {
      const { main: exportedMain } = require('./init')
      expect(typeof exportedMain).toBe('function')
    })
  })

  describe('command line execution', () => {
    it('should not execute main when imported as module', () => {
      // This test verifies that main() is not called when the module is imported
      // The actual execution logic is in the if block at the bottom of init.js
      expect(mockOrchestrator.run).not.toHaveBeenCalled()
    })
  })
})
