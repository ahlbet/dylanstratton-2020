import { AudioPlayerManager, AudioPlayer, AudioPlaybackOptions } from './audio-player'
import { execSync } from 'child_process'

// Mock child_process module
jest.mock('child_process')
const MockExecSync = execSync as jest.MockedFunction<typeof execSync>

describe('AudioPlayerManager', () => {
  let audioPlayerManager: AudioPlayerManager

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock process.platform
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      writable: true
    })
  })

  describe('constructor and player detection', () => {
    it('should detect available players on construction', () => {
      // Mock which command to return success for some tools
      MockExecSync.mockImplementation((command) => {
        if (command.includes('which afplay')) return 'afplay' as any
        if (command.includes('which mpv')) return 'mpv' as any
        throw new Error('Tool not found')
      })

      audioPlayerManager = new AudioPlayerManager()
      const players = audioPlayerManager.getAllPlayers()

      expect(players).toHaveLength(2)
      expect(players.find(p => p.tool === 'afplay')).toBeDefined()
      expect(players.find(p => p.tool === 'mpv')).toBeDefined()
    })

    it('should handle no available players', () => {
      // Mock which command to fail for all tools
      MockExecSync.mockImplementation(() => { throw new Error('Tool not found') })

      audioPlayerManager = new AudioPlayerManager()
      const players = audioPlayerManager.getAllPlayers()

      expect(players).toHaveLength(0)
    })
  })

  describe('getBestPlayer', () => {
    it('should return mpv when available', () => {
      MockExecSync.mockImplementation((command) => {
        if (command.includes('which mpv')) return 'mpv' as any
        if (command.includes('which afplay')) return 'afplay' as any
        throw new Error('Tool not found')
      })

      audioPlayerManager = new AudioPlayerManager()
      const bestPlayer = audioPlayerManager.getBestPlayer()

      expect(bestPlayer?.tool).toBe('mpv')
    })

    it('should return first available player when mpv is not available', () => {
      MockExecSync.mockImplementation((command) => {
        if (command.includes('which afplay')) return 'afplay' as any
        throw new Error('Tool not found')
      })

      audioPlayerManager = new AudioPlayerManager()
      const bestPlayer = audioPlayerManager.getBestPlayer()

      expect(bestPlayer?.tool).toBe('afplay')
    })

    it('should return null when no players are available', () => {
      MockExecSync.mockImplementation(() => { throw new Error('Tool not found') })

      audioPlayerManager = new AudioPlayerManager()
      const bestPlayer = audioPlayerManager.getBestPlayer()

      expect(bestPlayer).toBeNull()
    })
  })

  describe('playAudio', () => {
    beforeEach(() => {
      MockExecSync.mockImplementation((command) => {
        if (command.includes('which afplay')) return 'afplay' as any
        throw new Error('Tool not found')
      })
      audioPlayerManager = new AudioPlayerManager()
    })

    it('should play audio successfully', async () => {
      const player: AudioPlayer = { tool: 'afplay', description: 'macOS player' }
      MockExecSync.mockImplementation(() => undefined as any)

      await expect(audioPlayerManager.playAudio('/path/to/audio.wav', player)).resolves.toBeUndefined()

      expect(MockExecSync).toHaveBeenCalledWith('afplay "/path/to/audio.wav"', { stdio: 'inherit' })
    })

    it('should throw error when playback fails', async () => {
      const player: AudioPlayer = { tool: 'afplay', description: 'macOS player' }
      MockExecSync.mockImplementation(() => { throw new Error('Playback failed') })

      await expect(audioPlayerManager.playAudio('/path/to/audio.wav', player)).rejects.toThrow('Audio playback failed: Playback failed')
    })
  })

  describe('buildPlayCommand', () => {
    beforeEach(() => {
      MockExecSync.mockImplementation((command) => {
        if (command.includes('which afplay')) return 'afplay' as any
        throw new Error('Tool not found')
      })
      audioPlayerManager = new AudioPlayerManager()
    })

    it('should build command for afplay with volume', () => {
      const player: AudioPlayer = { tool: 'afplay', description: 'macOS player' }
      const options: AudioPlaybackOptions = { volume: 0.5 }

      // Access private method through reflection
      const command = (audioPlayerManager as any).buildPlayCommand('/path/to/audio.wav', player, options)

      expect(command).toBe('afplay "/path/to/audio.wav" --volume 0.5')
    })

    it('should build command for mpv with all options', () => {
      const player: AudioPlayer = { tool: 'mpv', description: 'Cross-platform player' }
      const options: AudioPlaybackOptions = { volume: 0.7, speed: 1.5, startTime: 30 }

      // Access private method through reflection
      const command = (audioPlayerManager as any).buildPlayCommand('/path/to/audio.wav', player, options)

      expect(command).toBe('mpv "/path/to/audio.wav" --volume=70 --speed=1.5 --start=30')
    })

    it('should build command for ffplay with volume and start time', () => {
      const player: AudioPlayer = { tool: 'ffplay', description: 'FFmpeg player' }
      const options: AudioPlaybackOptions = { volume: 0.8, startTime: 45 }

      // Access private method through reflection
      const command = (audioPlayerManager as any).buildPlayCommand('/path/to/audio.wav', player, options)

      expect(command).toBe('ffplay "/path/to/audio.wav" -volume 80 -ss 45')
    })

    it('should build command for vlc with volume', () => {
      const player: AudioPlayer = { tool: 'vlc', description: 'VLC player' }
      const options: AudioPlaybackOptions = { volume: 0.6 }

      // Access private method through reflection
      const command = (audioPlayerManager as any).buildPlayCommand('/path/to/audio.wav', player, options)

      expect(command).toBe('vlc "/path/to/audio.wav" --intf dummy --play-and-exit --gain=60')
    })

    it('should build command for unknown player', () => {
      const player: AudioPlayer = { tool: 'custom-player', description: 'Custom player' }
      const options: AudioPlaybackOptions = {}

      // Access private method through reflection
      const command = (audioPlayerManager as any).buildPlayCommand('/path/to/audio.wav', player, options)

      expect(command).toBe('"custom-player" "/path/to/audio.wav"')
    })

    it('should clamp volume values appropriately', () => {
      const player: AudioPlayer = { tool: 'afplay', description: 'macOS player' }
      
      // Test volume clamping
      const command1 = (audioPlayerManager as any).buildPlayCommand('/path/to/audio.wav', player, { volume: -0.5 })
      const command2 = (audioPlayerManager as any).buildPlayCommand('/path/to/audio.wav', player, { volume: 1.5 })

      expect(command1).toBe('afplay "/path/to/audio.wav" --volume 0')
      expect(command2).toBe('afplay "/path/to/audio.wav" --volume 1')
    })
  })

  describe('stopAudio', () => {
    beforeEach(() => {
      MockExecSync.mockImplementation((command) => {
        if (command.includes('which afplay')) return 'afplay' as any
        throw new Error('Tool not found')
      })
      audioPlayerManager = new AudioPlayerManager()
    })

    it('should stop mpv audio', () => {
      const player: AudioPlayer = { tool: 'mpv', description: 'Cross-platform player' }
      MockExecSync.mockImplementation(() => undefined as any)

      audioPlayerManager.stopAudio(player)

      expect(MockExecSync).toHaveBeenCalledWith('pkill -f mpv', { stdio: 'pipe' })
    })

    it('should stop ffplay audio', () => {
      const player: AudioPlayer = { tool: 'ffplay', description: 'FFmpeg player' }
      MockExecSync.mockImplementation(() => undefined as any)

      audioPlayerManager.stopAudio(player)

      expect(MockExecSync).toHaveBeenCalledWith('pkill -f ffplay', { stdio: 'pipe' })
    })

    it('should stop vlc audio', () => {
      const player: AudioPlayer = { tool: 'vlc', description: 'VLC player' }
      MockExecSync.mockImplementation(() => undefined as any)

      audioPlayerManager.stopAudio(player)

      expect(MockExecSync).toHaveBeenCalledWith('pkill -f vlc', { stdio: 'pipe' })
    })

    it('should stop custom player audio', () => {
      const player: AudioPlayer = { tool: 'custom-player', description: 'Custom player' }
      MockExecSync.mockImplementation(() => undefined as any)

      audioPlayerManager.stopAudio(player)

      expect(MockExecSync).toHaveBeenCalledWith('pkill -f custom-player', { stdio: 'pipe' })
    })

    it('should handle errors gracefully when stopping audio', () => {
      const player: AudioPlayer = { tool: 'mpv', description: 'Cross-platform player' }
      MockExecSync.mockImplementation(() => { throw new Error('Stop failed') })

      // Should not throw error
      expect(() => audioPlayerManager.stopAudio(player)).not.toThrow()
    })
  })

  describe('getAudioInfo', () => {
    beforeEach(() => {
      MockExecSync.mockImplementation((command) => {
        if (command.includes('which afplay')) return 'afplay' as any
        throw new Error('Tool not found')
      })
      audioPlayerManager = new AudioPlayerManager()
    })

    it('should return audio info when ffprobe succeeds', async () => {
      MockExecSync.mockImplementation((command) => {
        if (command.includes('ffprobe')) return '120.5,wav,44100,2' as any
        return 'afplay' as any
      })

      const result = await audioPlayerManager.getAudioInfo('/path/to/audio.wav')

      expect(result).toEqual({
        duration: 120.5,
        format: 'wav',
        sampleRate: 44100,
        channels: 2
      })
    })

    it('should return fallback info when ffprobe fails', async () => {
      MockExecSync.mockImplementation((command) => {
        if (command.includes('ffprobe')) throw new Error('ffprobe failed')
        return 'afplay' as any
      })

      const result = await audioPlayerManager.getAudioInfo('/path/to/audio.wav')

      expect(result).toEqual({
        duration: 0,
        format: 'unknown'
      })
    })
  })

  describe('isAudioPlaying', () => {
    beforeEach(() => {
      MockExecSync.mockImplementation((command) => {
        if (command.includes('which afplay')) return 'afplay' as any
        throw new Error('Tool not found')
      })
      audioPlayerManager = new AudioPlayerManager()
    })

    it('should return true when audio is playing', () => {
      const player: AudioPlayer = { tool: 'afplay', description: 'macOS player' }
      MockExecSync.mockImplementation((command) => {
        if (command.includes('pgrep')) return '12345' as any
        return 'afplay' as any
      })

      const result = audioPlayerManager.isAudioPlaying(player)

      expect(result).toBe(true)
      expect(MockExecSync).toHaveBeenCalledWith('pgrep -f afplay', { stdio: 'pipe' })
    })

    it('should return false when audio is not playing', () => {
      const player: AudioPlayer = { tool: 'afplay', description: 'macOS player' }
      MockExecSync.mockImplementation((command) => {
        if (command.includes('pgrep')) throw new Error('No process found')
        return 'afplay' as any
      })

      const result = audioPlayerManager.isAudioPlaying(player)

      expect(result).toBe(false)
    })
  })

  describe('getSystemVolume', () => {
    beforeEach(() => {
      MockExecSync.mockImplementation((command) => {
        if (command.includes('which afplay')) return 'afplay' as any
        throw new Error('Tool not found')
      })
      audioPlayerManager = new AudioPlayerManager()
    })

    it('should return volume on macOS', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' })
      MockExecSync.mockImplementation((command) => {
        if (command.includes('osascript')) return '75' as any
        return 'afplay' as any
      })

      const result = audioPlayerManager.getSystemVolume()

      expect(result).toBe(75)
      expect(MockExecSync).toHaveBeenCalledWith('osascript -e "output volume of (get volume settings)"', { encoding: 'utf8' })
    })

    it('should return volume on Linux', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' })
      MockExecSync.mockImplementation((command) => {
        if (command.includes('amixer')) return '80%' as any
        return 'afplay' as any
      })

      const result = audioPlayerManager.getSystemVolume()

      expect(result).toBe(80)
      expect(MockExecSync).toHaveBeenCalledWith('amixer get Master | grep -o "[0-9]*%" | head -1', { encoding: 'utf8' })
    })

    it('should return null on unsupported platform', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' })

      const result = audioPlayerManager.getSystemVolume()

      expect(result).toBeNull()
    })

    it('should return null when command fails', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' })
      MockExecSync.mockImplementation((command) => {
        if (command.includes('osascript')) throw new Error('Command failed')
        return 'afplay' as any
      })

      const result = audioPlayerManager.getSystemVolume()

      expect(result).toBeNull()
    })
  })
})
