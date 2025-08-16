const { spawn } = require('child_process')
const path = require('path')
const { DEFAULT_AUDIO_KILL_TIMEOUT_MS } = require('../audio-tools')

/**
 * Manages audio playback for the init script
 */
class AudioPlayer {
  /**
   * Play audio file with user control
   * @param {string} audioPath - Path to audio file
   * @param {Object} audioPlayer - Audio player configuration
   * @returns {Promise<void>}
   */
  async playAudio(audioPath, audioPlayer) {
    if (!audioPlayer) {
      console.log('⚠️ No audio player available, skipping playback')
      return
    }

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

        const stopPlayback = () => {
          if (isStopped) return
          isStopped = true

          console.log('\n⏹️  Stopping audio playback...')

          // Try graceful termination first
          audioProcess.kill('SIGTERM')

          // Monitor process termination with configurable timeout
          const forceKillTimeout =
            parseInt(process.env.AUDIO_KILL_TIMEOUT) ||
            DEFAULT_AUDIO_KILL_TIMEOUT_MS
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

          resolve()
        }

        // Handle process exit
        audioProcess.on('close', (code) => {
          if (isStopped) return // Already handled by stopPlayback

          if (code === 0) {
            console.log('\n🎵 Playback finished normally')
            resolve()
          } else if (code === null) {
            console.log('\n⏹️  Playback stopped')
            resolve()
          } else {
            console.log(`\n⚠️  Playback ended with code ${code}`)
            resolve()
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
            // Note: This would need to be passed in from the calling context
            // For now, we'll just let it play through
            setTimeout(() => {
              if (!isStopped) {
                console.log('🎵 Audio playback continuing...')
              }
            }, 1000)
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
}

module.exports = { AudioPlayer }
