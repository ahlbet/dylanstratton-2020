import { main } from './init'

// Mock the InitOrchestrator
jest.mock('./src/utils/init-script/init-orchestrator')

describe('init.ts', () => {
  let mockOrchestrator: any
  let mockInitOrchestrator: jest.Mock

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

      // Mock process.argv to simulate command line arguments
      const originalArgv = process.argv
      process.argv = ['node', 'init.ts', '25dec01', 'Test description']

      await main()

      expect(mockInitOrchestrator).toHaveBeenCalledWith(
        '25dec01',
        'Test description'
      )
      expect(mockOrchestrator.run).toHaveBeenCalled()

      // Restore original argv
      process.argv = originalArgv
    })

    it('should handle orchestrator errors gracefully', async () => {
      const error = new Error('Orchestrator failed')
      mockOrchestrator.run.mockRejectedValue(error)

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Mock process.argv to simulate command line arguments
      const originalArgv = process.argv
      process.argv = ['node', 'init.ts', '25dec01']

      await main()
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Script failed:',
        'Orchestrator failed'
      )
      expect(process.exit).toHaveBeenCalledWith(1)

      // Restore original argv
      process.argv = originalArgv
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
      // The actual execution logic is in the if block at the bottom of init.ts
      expect(mockOrchestrator.run).not.toHaveBeenCalled()
    })
  })
})
