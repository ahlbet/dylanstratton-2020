#!/usr/bin/env node

/**
 * CLI Audio Player Script
 *
 * This script provides basic audio playback functionality from the command line.
 * It can play audio from URLs or local file paths.
 *
 * Usage:
 *   node scripts/play-audio.js <audio-url-or-path>
 *   node scripts/play-audio.js --help
 *
 * Examples:
 *   node scripts/play-audio.js https://example.com/audio.wav
 *   node scripts/play-audio.js ./local-audio/song.wav
 *   node scripts/play-audio.js "~/Downloads/song.wav"
 */

require('dotenv').config()

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const { checkAudioTools, getAudioPlayer, DEFAULT_AUDIO_KILL_TIMEOUT_MS } = require('../src/utils/audio-tools')

// Helper function to prompt user for input
const askQuestion = (question) => {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

// Get the best available audio player
const getAudioPlayerForScript = () => {
  const availableTools = checkAudioTools()

  if (availableTools.length === 0) {
    console.error('❌ No audio playback tools found on your system')
    console.log('\nPlease install one of the following:')
    console.log('  • mpv: brew install mpv (macOS) or apt install mpv (Ubuntu)')
    console.log('  • VLC: Download from https://www.videolan.org/')
    console.log(
      '  • FFmpeg: brew install ffmpeg (macOS) or apt install ffmpeg (Ubuntu)'
    )
    process.exit(1)
  }

  // Prefer mpv for cross-platform compatibility
  const preferredTool = availableTools.find((t) => t.tool === 'mpv')
  if (preferredTool) {
    return preferredTool
  }

  // Fall back to first available tool
  return availableTools[0]
}

// Play audio file
const playAudio = async (audioPath, audioPlayer) => {
  const { tool } = audioPlayer

  try {
    console.log(`🎵 Playing audio with ${tool}`)
    console.log(`📁 File: ${path.basename(audioPath)}`)

    let command
    let args = []

    switch (tool) {
      case 'afplay':
        // macOS built-in player
        command = 'afplay'
        args = [audioPath]
        break
      case 'aplay':
        // Linux ALSA player
        command = 'aplay'
        args = [audioPath]
        break
      case 'mpv':
        // Cross-platform player with quiet output
        command = 'mpv'
        args = ['--no-video', '--quiet', audioPath]
        break
      case 'ffplay':
        // FFmpeg player with quiet output
        command = 'ffplay'
        args = ['-nodisp', '-autoexit', '-loglevel', 'error', audioPath]
        break
      case 'vlc':
        // VLC player with quiet output
        command = 'vlc'
        args = ['--intf', 'dummy', '--play-and-exit', audioPath]
        break
      default:
        command = tool
        args = [audioPath]
    }

    console.log(`▶️  Playing audio... (Press Enter to stop early)`)

    return new Promise((resolve, reject) => {
      const audioProcess = spawn(command, args, {
        stdio: 'pipe', // Use pipe so we can control input/output
        detached: false,
      })

      // Set up a way to stop playback
      let isStopped = false
      let isResolved = false

      const stopPlayback = () => {
        if (isStopped) return
        isStopped = true

        console.log('\n⏹️  Stopping audio playback...')
        
        // Try graceful termination first
        audioProcess.kill('SIGTERM')
        
        // Monitor process termination with configurable timeout
        const forceKillTimeout = parseInt(process.env.AUDIO_KILL_TIMEOUT) || DEFAULT_AUDIO_KILL_TIMEOUT_MS
        let forceKillTimer = null
        
        // Set up force kill as fallback
        forceKillTimer = setTimeout(() => {
          if (!audioProcess.killed) {
            console.log('⚠️  Force killing audio process...')
            audioProcess.kill('SIGKILL')
          }
        }, forceKillTimeout)
        
        // Clean up timer when process terminates (existing close handler will resolve)
        audioProcess.once('close', () => {
          if (forceKillTimer) {
            clearTimeout(forceKillTimer)
            forceKillTimer = null
          }
        })
        
        if (!isResolved) {
          isResolved = true
          resolve()
        }
      }

      // Handle process exit
      audioProcess.on('close', (code) => {
        if (isStopped) return // Already handled by stopPlayback

        if (code === 0) {
          console.log('\n🎵 Playback finished normally')
          if (!isResolved) {
            isResolved = true
            resolve()
          }
        } else if (code === null) {
          console.log('\n⏹️  Playback stopped')
          if (!isResolved) {
            isResolved = true
            resolve()
          }
        } else {
          console.log(`\n⚠️  Playback ended with code ${code}`)
          if (!isResolved) {
            isResolved = true
            resolve()
          }
        }
      })

      // Handle process errors
      audioProcess.on('error', (error) => {
        if (isStopped) return
        console.error(`❌ Error playing audio: ${error.message}`)
        reject(error)
      })

      // Set up a prompt to stop playback
      const checkForStop = async () => {
        try {
          console.log(
            '\n💡 Press Enter to stop audio, or wait for it to finish...'
          )
          const answer = await askQuestion('')
          if (answer === '') {
            stopPlayback()
          }
        } catch (error) {
          // User interrupted, continue with playback
        }
      }

      // Start checking for stop command after a short delay
      setTimeout(() => {
        if (!isStopped) {
          checkForStop()
        }
      }, 500)
    })
  } catch (error) {
    console.error(`❌ Error playing audio: ${error.message}`)
    throw error
  }
}

// Download audio from URL if needed
const downloadAudio = async (url) => {
  if (!url.startsWith('http')) {
    return url // Already a local path
  }

  console.log(`📥 Downloading audio from: ${url}`)

  try {
    const https = require('https')
    const { promisify } = require('util')
    const stream = require('stream')
    const pipeline = promisify(stream.pipeline)

    const response = await new Promise((resolve, reject) => {
      https.get(url, resolve).on('error', reject)
    })

    if (response.statusCode !== 200) {
      throw new Error(`HTTP ${response.statusCode}`)
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp-audio')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Generate filename from URL
    const urlObj = new URL(url)
    const filename = path.basename(urlObj.pathname) || 'audio.wav'
    const tempPath = path.join(tempDir, filename)

    // Download file
    const fileStream = fs.createWriteStream(tempPath)
    await pipeline(response, fileStream)

    console.log(`✅ Downloaded to: ${tempPath}`)
    return tempPath
  } catch (error) {
    console.error(`❌ Failed to download audio: ${error.message}`)
    process.exit(1)
  }
}

// Show help information
const showHelp = () => {
  console.log('🎵 CLI Audio Player')
  console.log('')
  console.log('Usage:')
  console.log('  node scripts/play-audio.js <audio-url-or-path>')
  console.log('  node scripts/play-audio.js --help')
  console.log('')
  console.log('Examples:')
  console.log('  node scripts/play-audio.js https://example.com/audio.wav')
  console.log('  node scripts/play-audio.js ./local-audio/song.wav')
  console.log('  node scripts/play-audio.js "~/Downloads/song.wav"')
  console.log('')
  console.log('Supported audio formats:')
  console.log('  • WAV, MP3, OGG, M4A, AAC, FLAC')
  console.log('')
  console.log('Controls:')
  console.log('  • Press Ctrl+C to stop playback')
  console.log('  • Use --help to show this message')
}

// Main function
const main = async () => {
  const args = process.argv.slice(2)

  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    return
  }

  // Check if audio path/URL is provided
  if (args.length === 0) {
    console.error('❌ Please provide an audio file path or URL')
    console.log('')
    showHelp()
    process.exit(1)
  }

  const audioInput = args[0]

  try {
    // Check available audio tools
    const audioPlayer = getAudioPlayerForScript()
    console.log(
      `🔧 Using audio player: ${audioPlayer.tool} (${audioPlayer.description})`
    )

    // Handle the audio input
    let audioPath = audioInput

    // Expand ~ to home directory
    if (audioInput.startsWith('~')) {
      audioPath = path.resolve(audioInput.replace('~', process.env.HOME))
    }

    // Download if it's a URL
    if (audioInput.startsWith('http')) {
      audioPath = await downloadAudio(audioInput)
    }

    // Check if file exists (for local paths)
    if (!audioInput.startsWith('http') && !fs.existsSync(audioPath)) {
      console.error(`❌ File not found: ${audioPath}`)
      process.exit(1)
    }

    // Play the audio
    await playAudio(audioPath, audioPlayer)
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}

// Export functions for testing
module.exports = {
  playAudio,
  downloadAudio,
  showHelp,
}

// Run the main function only if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error.message)
    process.exit(1)
  })
}
