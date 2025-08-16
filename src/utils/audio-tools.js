/**
 * Shared utility functions for audio tool detection and management
 */

const { execSync } = require('child_process')

/**
 * Default timeout for force-killing audio processes (in milliseconds)
 */
const DEFAULT_AUDIO_KILL_TIMEOUT_MS = 3000

/**
 * Check if audio playback tools are available on the system
 * @returns {Array} Array of available audio tools with tool name and description
 */
const checkAudioTools = () => {
  const tools = {
    afplay: 'macOS built-in audio player',
    aplay: 'Linux ALSA audio player',
    mpv: 'Cross-platform media player',
    ffplay: 'FFmpeg audio player',
    vlc: 'VLC media player',
  }

  const availableTools = []

  for (const [tool, description] of Object.entries(tools)) {
    try {
      // Actually check if the tool exists using execSync
      execSync(`which ${tool}`, { stdio: 'pipe' })
      availableTools.push({ tool, description })
    } catch (error) {
      // Tool not available, skip it
    }
  }

  return availableTools
}

/**
 * Get the best available audio player for the system
 * @returns {Object|null} Audio player object with tool and description, or null if none available
 */
const getAudioPlayer = () => {
  const availableTools = checkAudioTools()

  if (availableTools.length === 0) {
    return null
  }

  // Prefer mpv for cross-platform compatibility
  const preferredTool = availableTools.find((t) => t.tool === 'mpv')
  if (preferredTool) {
    return preferredTool
  }

  // Fall back to first available tool
  return availableTools[0]
}

/**
 * Get a list of available audio tools as a formatted string
 * @returns {string} Formatted string listing available tools
 */
const getAvailableToolsList = () => {
  const tools = checkAudioTools()
  if (tools.length === 0) {
    return 'No audio tools found'
  }
  return tools.map((t) => `${t.tool} (${t.description})`).join(', ')
}

/**
 * Check if a specific audio tool is available
 * @param {string} toolName - Name of the tool to check
 * @returns {boolean} True if the tool is available
 */
const isToolAvailable = (toolName) => {
  try {
    execSync(`which ${toolName}`, { stdio: 'pipe' })
    return true
  } catch (error) {
    return false
  }
}

module.exports = {
  checkAudioTools,
  getAudioPlayer,
  getAvailableToolsList,
  isToolAvailable,
  DEFAULT_AUDIO_KILL_TIMEOUT_MS,
}
