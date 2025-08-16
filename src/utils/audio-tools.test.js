const { execSync } = require('child_process')

// Mock the child_process module
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}))

// Import the functions after mocking
const {
  checkAudioTools,
  getAudioPlayer,
  getAvailableToolsList,
  isToolAvailable,
} = require('./audio-tools')

describe('audio-tools', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('checkAudioTools', () => {
    test('should return empty array when no tools are available', () => {
      // Mock execSync to throw error for all tools (simulating none available)
      execSync.mockImplementation(() => {
        throw new Error('Command not found')
      })

      const result = checkAudioTools()
      expect(result).toEqual([])
      expect(execSync).toHaveBeenCalledTimes(5) // 5 tools checked
    })

    test('should return available tools when some are found', () => {
      // Mock execSync to succeed for some tools and fail for others
      execSync.mockImplementation((command) => {
        if (command.includes('afplay') || command.includes('mpv')) {
          return Buffer.from('/usr/bin/afplay') // Success
        }
        throw new Error('Command not found') // Failure
      })

      const result = checkAudioTools()
      expect(result).toEqual([
        { tool: 'afplay', description: 'macOS built-in audio player' },
        { tool: 'mpv', description: 'Cross-platform media player' },
      ])
      expect(execSync).toHaveBeenCalledTimes(5)
    })

    test('should return all tools when all are available', () => {
      // Mock execSync to succeed for all tools
      execSync.mockImplementation(() => Buffer.from('/usr/bin/tool'))

      const result = checkAudioTools()
      expect(result).toEqual([
        { tool: 'afplay', description: 'macOS built-in audio player' },
        { tool: 'aplay', description: 'Linux ALSA audio player' },
        { tool: 'mpv', description: 'Cross-platform media player' },
        { tool: 'ffplay', description: 'FFmpeg audio player' },
        { tool: 'vlc', description: 'VLC media player' },
      ])
      expect(execSync).toHaveBeenCalledTimes(5)
    })

    test('should handle execSync errors gracefully', () => {
      // Mock execSync to throw different types of errors
      execSync.mockImplementation((command) => {
        if (command.includes('afplay')) {
          throw new Error('Permission denied')
        } else if (command.includes('mpv')) {
          throw new Error('No such file or directory')
        }
        return Buffer.from('/usr/bin/tool')
      })

      const result = checkAudioTools()
      expect(result).toEqual([
        { tool: 'aplay', description: 'Linux ALSA audio player' },
        { tool: 'ffplay', description: 'FFmpeg audio player' },
        { tool: 'vlc', description: 'VLC media player' },
      ])
    })
  })

  describe('getAudioPlayer', () => {
    test('should return null when no tools are available', () => {
      execSync.mockImplementation(() => {
        throw new Error('Command not found')
      })

      const result = getAudioPlayer()
      expect(result).toBeNull()
    })

    test('should prefer mpv when available', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('mpv') || command.includes('afplay')) {
          return Buffer.from('/usr/bin/tool')
        }
        throw new Error('Command not found')
      })

      const result = getAudioPlayer()
      expect(result).toEqual({
        tool: 'mpv',
        description: 'Cross-platform media player',
      })
    })

    test('should fall back to first available tool when mpv is not available', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('afplay')) {
          return Buffer.from('/usr/bin/afplay')
        }
        throw new Error('Command not found')
      })

      const result = getAudioPlayer()
      expect(result).toEqual({
        tool: 'afplay',
        description: 'macOS built-in audio player',
      })
    })

    test('should return first available tool when multiple are available but mpv is not', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('afplay') || command.includes('ffplay')) {
          return Buffer.from('/usr/bin/tool')
        }
        throw new Error('Command not found')
      })

      const result = getAudioPlayer()
      expect(result).toEqual({
        tool: 'afplay',
        description: 'macOS built-in audio player',
      })
    })
  })

  describe('getAvailableToolsList', () => {
    test('should return "No audio tools found" when no tools are available', () => {
      execSync.mockImplementation(() => {
        throw new Error('Command not found')
      })

      const result = getAvailableToolsList()
      expect(result).toBe('No audio tools found')
    })

    test('should return formatted list when tools are available', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('afplay') || command.includes('mpv')) {
          return Buffer.from('/usr/bin/tool')
        }
        throw new Error('Command not found')
      })

      const result = getAvailableToolsList()
      expect(result).toBe(
        'afplay (macOS built-in audio player), mpv (Cross-platform media player)'
      )
    })

    test('should return single tool when only one is available', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('afplay')) {
          return Buffer.from('/usr/bin/afplay')
        }
        throw new Error('Command not found')
      })

      const result = getAvailableToolsList()
      expect(result).toBe('afplay (macOS built-in audio player)')
    })
  })

  describe('isToolAvailable', () => {
    test('should return true when tool is available', () => {
      execSync.mockReturnValue(Buffer.from('/usr/bin/afplay'))

      const result = isToolAvailable('afplay')
      expect(result).toBe(true)
      expect(execSync).toHaveBeenCalledWith('which afplay', { stdio: 'pipe' })
    })

    test('should return false when tool is not available', () => {
      execSync.mockImplementation(() => {
        throw new Error('Command not found')
      })

      const result = isToolAvailable('nonexistent-tool')
      expect(result).toBe(false)
      expect(execSync).toHaveBeenCalledWith('which nonexistent-tool', {
        stdio: 'pipe',
      })
    })

    test('should handle different tool names correctly', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('mpv')) {
          return Buffer.from('/usr/bin/mpv')
        }
        throw new Error('Command not found')
      })

      expect(isToolAvailable('mpv')).toBe(true)
      expect(isToolAvailable('vlc')).toBe(false)
    })

    test('should handle execSync errors gracefully', () => {
      execSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = isToolAvailable('restricted-tool')
      expect(result).toBe(false)
    })
  })

  describe('integration scenarios', () => {
    test('should work correctly in a macOS-like environment', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('afplay')) {
          return Buffer.from('/usr/bin/afplay')
        }
        throw new Error('Command not found')
      })

      const tools = checkAudioTools()
      const player = getAudioPlayer()
      const list = getAvailableToolsList()
      const afplayAvailable = isToolAvailable('afplay')
      const mpvAvailable = isToolAvailable('mpv')

      expect(tools).toEqual([
        { tool: 'afplay', description: 'macOS built-in audio player' },
      ])
      expect(player).toEqual({
        tool: 'afplay',
        description: 'macOS built-in audio player',
      })
      expect(list).toBe('afplay (macOS built-in audio player)')
      expect(afplayAvailable).toBe(true)
      expect(mpvAvailable).toBe(false)
    })

    test('should work correctly in a Linux-like environment', () => {
      execSync.mockImplementation((command) => {
        if (command.includes('aplay') || command.includes('mpv')) {
          return Buffer.from('/usr/bin/tool')
        }
        throw new Error('Command not found')
      })

      const tools = checkAudioTools()
      const player = getAudioPlayer()
      const list = getAvailableToolsList()

      expect(tools).toEqual([
        { tool: 'aplay', description: 'Linux ALSA audio player' },
        { tool: 'mpv', description: 'Cross-platform media player' },
      ])
      expect(player).toEqual({
        tool: 'mpv',
        description: 'Cross-platform media player',
      })
      expect(list).toBe(
        'aplay (Linux ALSA audio player), mpv (Cross-platform media player)'
      )
    })

    test('should work correctly in a cross-platform environment with multiple tools', () => {
      execSync.mockImplementation((command) => {
        if (
          command.includes('mpv') ||
          command.includes('ffplay') ||
          command.includes('vlc')
        ) {
          return Buffer.from('/usr/bin/tool')
        }
        throw new Error('Command not found')
      })

      const tools = checkAudioTools()
      const player = getAudioPlayer()
      const list = getAvailableToolsList()

      expect(tools).toEqual([
        { tool: 'mpv', description: 'Cross-platform media player' },
        { tool: 'ffplay', description: 'FFmpeg audio player' },
        { tool: 'vlc', description: 'VLC media player' },
      ])
      expect(player).toEqual({
        tool: 'mpv',
        description: 'Cross-platform media player',
      })
      expect(list).toBe(
        'mpv (Cross-platform media player), ffplay (FFmpeg audio player), vlc (VLC media player)'
      )
    })
  })
})
