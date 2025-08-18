import { execSync } from 'child_process'

interface AudioPlayer {
  tool: string
  description: string
}

interface AudioPlaybackOptions {
  volume?: number
  speed?: number
  startTime?: number
}

/**
 * Manages audio playback for the init script
 */
class AudioPlayerManager {
  private availablePlayers: AudioPlayer[]

  constructor() {
    this.availablePlayers = this.detectAvailablePlayers()
  }

  /**
   * Detect available audio players on the system
   * @returns Array of available audio players
   */
  private detectAvailablePlayers(): AudioPlayer[] {
    const players: AudioPlayer[] = []
    const playerConfigs = [
      { tool: 'afplay', description: 'macOS built-in audio player' },
      { tool: 'aplay', description: 'Linux ALSA audio player' },
      { tool: 'mpv', description: 'Cross-platform media player' },
      { tool: 'ffplay', description: 'FFmpeg audio player' },
      { tool: 'vlc', description: 'VLC media player' }
    ]

    playerConfigs.forEach(config => {
      if (this.isToolAvailable(config.tool)) {
        players.push(config)
      }
    })

    return players
  }

  /**
   * Check if a specific tool is available
   * @param toolName - Name of the tool to check
   * @returns True if tool is available
   */
  private isToolAvailable(toolName: string): boolean {
    try {
      execSync(`which ${toolName}`, { stdio: 'pipe' })
      return true
    } catch {
      return false
    }
  }

  /**
   * Get the best available audio player
   * @returns Best available audio player or null if none available
   */
  getBestPlayer(): AudioPlayer | null {
    if (this.availablePlayers.length === 0) {
      return null
    }

    // Prefer mpv for cross-platform compatibility
    const preferredPlayer = this.availablePlayers.find(p => p.tool === 'mpv')
    if (preferredPlayer) {
      return preferredPlayer
    }

    // Fall back to first available player
    return this.availablePlayers[0]
  }

  /**
   * Get all available audio players
   * @returns Array of all available audio players
   */
  getAllPlayers(): AudioPlayer[] {
    return [...this.availablePlayers]
  }

  /**
   * Play audio file with specified player
   * @param filePath - Path to audio file
   * @param player - Audio player to use
   * @param options - Playback options
   */
  async playAudio(
    filePath: string,
    player: AudioPlayer,
    options: AudioPlaybackOptions = {}
  ): Promise<void> {
    try {
      const command = this.buildPlayCommand(filePath, player, options)
      execSync(command, { stdio: 'inherit' })
    } catch (error) {
      throw new Error(`Audio playback failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Build play command for specific player
   * @param filePath - Path to audio file
   * @param player - Audio player to use
   * @param options - Playback options
   * @returns Command string to execute
   */
  private buildPlayCommand(
    filePath: string,
    player: AudioPlayer,
    options: AudioPlaybackOptions
  ): string {
    const { volume, speed, startTime } = options
    let command = ''

    switch (player.tool) {
      case 'afplay':
        command = `afplay "${filePath}"`
        if (volume !== undefined) {
          command += ` --volume ${Math.max(0, Math.min(1, volume))}`
        }
        break

      case 'mpv':
        command = `mpv "${filePath}"`
        if (volume !== undefined) {
          command += ` --volume=${Math.max(0, Math.min(100, volume * 100))}`
        }
        if (speed !== undefined) {
          command += ` --speed=${speed}`
        }
        if (startTime !== undefined) {
          command += ` --start=${startTime}`
        }
        break

      case 'ffplay':
        command = `ffplay "${filePath}"`
        if (volume !== undefined) {
          command += ` -volume ${Math.max(0, Math.min(100, volume * 100))}`
        }
        if (startTime !== undefined) {
          command += ` -ss ${startTime}`
        }
        break

      case 'vlc':
        command = `vlc "${filePath}"`
        if (volume !== undefined) {
          command += ` --intf dummy --play-and-exit --gain=${Math.max(0, Math.min(100, volume * 100))}`
        }
        break

      default:
        command = `"${player.tool}" "${filePath}"`
    }

    return command
  }

  /**
   * Stop audio playback
   * @param player - Audio player to stop
   */
  stopAudio(player: AudioPlayer): void {
    try {
      switch (player.tool) {
        case 'mpv':
          execSync('pkill -f mpv', { stdio: 'pipe' })
          break
        case 'ffplay':
          execSync('pkill -f ffplay', { stdio: 'pipe' })
          break
        case 'vlc':
          execSync('pkill -f vlc', { stdio: 'pipe' })
          break
        default:
          execSync(`pkill -f ${player.tool}`, { stdio: 'pipe' })
      }
    } catch (error) {
      // Ignore errors when stopping audio
    }
  }

  /**
   * Get audio file information
   * @param filePath - Path to audio file
   * @returns Audio file information
   */
  async getAudioInfo(filePath: string): Promise<{
    duration: number
    format: string
    sampleRate?: number
    channels?: number
  }> {
    try {
      // Try using ffprobe for detailed info
      const ffprobeOutput = execSync(
        `ffprobe -v quiet -show_entries format=duration,format_name -show_entries stream=sample_rate,channels -of csv=p=0 "${filePath}"`,
        { encoding: 'utf8', stdio: 'pipe' }
      ).trim()

      const [duration, format, sampleRate, channels] = ffprobeOutput.split(',')

      return {
        duration: parseFloat(duration) || 0,
        format: format || 'unknown',
        sampleRate: parseInt(sampleRate) || undefined,
        channels: parseInt(channels) || undefined
      }
    } catch (error) {
      // Fallback to basic info
      return {
        duration: 0,
        format: 'unknown'
      }
    }
  }

  /**
   * Check if audio is currently playing
   * @param player - Audio player to check
   * @returns True if audio is playing
   */
  isAudioPlaying(player: AudioPlayer): boolean {
    try {
      const result = execSync(`pgrep -f ${player.tool}`, { stdio: 'pipe' })
      return result.toString().trim().length > 0
    } catch {
      return false
    }
  }

  /**
   * Get system volume level
   * @returns Current system volume (0-100) or null if unavailable
   */
  getSystemVolume(): number | null {
    try {
      if (process.platform === 'darwin') {
        // macOS
        const output = execSync('osascript -e "output volume of (get volume settings)"', { encoding: 'utf8' })
        return parseInt(output.trim())
      } else if (process.platform === 'linux') {
        // Linux
        const output = execSync('amixer get Master | grep -o "[0-9]*%" | head -1', { encoding: 'utf8' })
        return parseInt(output.replace('%', ''))
      }
    } catch {
      // Ignore errors
    }
    return null
  }
}

export { AudioPlayerManager, AudioPlayer, AudioPlaybackOptions }
