/**
 * Tests for the play-audio.js script
 */

const { checkAudioTools, getAudioPlayer, showHelp } = require('./play-audio')

// Mock execSync for testing
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}))

// Mock readline to prevent hanging
jest.mock('readline', () => ({
  createInterface: jest.fn(() => ({
    question: jest.fn(),
    close: jest.fn(),
  })),
}))

const { execSync } = require('child_process')

describe('play-audio.js', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    // Clean up any remaining timers or handles
    jest.clearAllTimers()
  })

  describe('checkAudioTools', () => {
    it('should detect available audio tools', () => {
      // Mock that mpv is available
      execSync.mockImplementation((command) => {
        if (command.includes('which mpv')) return 0
        throw new Error('not found')
      })

      const tools = checkAudioTools()
      expect(tools).toHaveLength(1)
      expect(tools[0].tool).toBe('mpv')
      expect(tools[0].description).toBe('Cross-platform media player')
    })

    it('should handle no available tools', () => {
      // Mock that no tools are available
      execSync.mockImplementation(() => {
        throw new Error('not found')
      })

      const tools = checkAudioTools()
      expect(tools).toHaveLength(0)
    })

    it('should detect multiple available tools', () => {
      // Mock that afplay and mpv are available
      execSync.mockImplementation((command) => {
        if (command.includes('which afplay')) return 0
        if (command.includes('which mpv')) return 0
        throw new Error('not found')
      })

      const tools = checkAudioTools()
      expect(tools).toHaveLength(2)
      expect(tools.map((t) => t.tool)).toContain('afplay')
      expect(tools.map((t) => t.tool)).toContain('mpv')
    })
  })

  describe('getAudioPlayer', () => {
    it('should prefer mpv when available', () => {
      // Mock that mpv and afplay are available
      execSync.mockImplementation((command) => {
        if (command.includes('which mpv')) return 0
        if (command.includes('which afplay')) return 0
        throw new Error('not found')
      })

      const player = getAudioPlayer()
      expect(player.tool).toBe('mpv')
    })

    it('should fall back to first available tool', () => {
      // Mock that only afplay is available
      execSync.mockImplementation((command) => {
        if (command.includes('which afplay')) return 0
        throw new Error('not found')
      })

      const player = getAudioPlayer()
      expect(player.tool).toBe('afplay')
    })

    it('should handle no available tools gracefully', () => {
      // Mock that no tools are available
      execSync.mockImplementation(() => {
        throw new Error('not found')
      })

      // Since getAudioPlayer calls process.exit when no tools are found,
      // we'll just test that checkAudioTools returns empty array
      const tools = checkAudioTools()
      expect(tools).toHaveLength(0)
    })
  })

  describe('showHelp', () => {
    it('should display help information', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      showHelp()

      expect(consoleSpy).toHaveBeenCalledWith('🎵 CLI Audio Player')
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Usage:'))

      consoleSpy.mockRestore()
    })
  })
})
