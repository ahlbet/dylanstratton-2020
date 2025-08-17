#!/usr/bin/env node

/**
 * Dry Run Init Script with Audio Coherency Levels
 *
 * This script tests the new audio coherency level functionality without
 * actually creating posts or uploading to Supabase.
 *
 * Usage:
 *   node scripts/init-dry-run-coherency.js
 *
 * It will use the 25aug12-backup folder in Downloads as test audio files.
 * You can listen to each track before rating its coherency level.
 */

require('dotenv').config()

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { spawn } = require('child_process')
const {
  checkAudioTools,
  getAudioPlayer,
  DEFAULT_AUDIO_KILL_TIMEOUT_MS,
  COHERENCY_MIN_LEVEL,
  COHERENCY_MAX_LEVEL,
} = require('../src/utils/audio-tools')

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Helper function to prompt user for input
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

// Helper function to display text in a formatted way
const displayText = (text, title) => {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`${title}`)
  console.log(`${'='.repeat(60)}`)
  console.log(text)
  console.log(`${'='.repeat(60)}\n`)
}

// Audio tools are now imported from shared utility

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

      const stopPlayback = () => {
        if (isStopped) return
        isStopped = true

        console.log('\n⏹️  Stopping audio playback...')
        audioProcess.kill('SIGTERM')

        // Give it a moment to clean up, then force kill if needed
        setTimeout(() => {
          if (!audioProcess.killed) {
            audioProcess.kill('SIGKILL')
          }
        }, DEFAULT_AUDIO_KILL_TIMEOUT_MS)

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

// Helper function to get coherency level for audio tracks
const getAudioCoherencyLevel = async (
  askQuestion,
  trackNumber,
  totalTracks
) => {
  console.log(`\n🎵 Audio Track #${trackNumber} Coherency Level`)
  console.log('1 = Least coherent (random/jumbled)')
  console.log('100 = Fully coherent (clear, logical flow)')
  console.log(`Track ${trackNumber} of ${totalTracks}`)

  while (true) {
    const coherencyInput = await askQuestion(
      `Enter coherency level (${COHERENCY_MIN_LEVEL}-${COHERENCY_MAX_LEVEL}, or press Enter for default 50): `
    )

    if (coherencyInput === '') {
      return 50 // Default value for audio tracks
    }

    const coherencyLevel = parseInt(coherencyInput)

    if (
      isNaN(coherencyLevel) ||
      coherencyLevel < COHERENCY_MIN_LEVEL ||
      coherencyLevel > COHERENCY_MAX_LEVEL
    ) {
      console.log(
        `❌ Please enter a number between ${COHERENCY_MIN_LEVEL} and ${COHERENCY_MAX_LEVEL}`
      )
      continue
    }

    return coherencyLevel
  }
}

// Function to extract audio duration from WAV file (simplified for dry run)
const extractAudioDuration = async (filePath, mockDurationArg) => {
  try {
    console.log(`   📊 Extracting duration from: ${path.basename(filePath)}`)

    // For dry run, return a deterministic or configurable mock duration
    let mockDuration = 120 // default mock duration in seconds
    if (typeof mockDurationArg === 'number') {
      mockDuration = mockDurationArg
    } else if (process.env.MOCK_AUDIO_DURATION) {
      const envVal = parseInt(process.env.MOCK_AUDIO_DURATION, 10)
      if (!isNaN(envVal)) {
        mockDuration = envVal
      }
    }

    console.log(`   ✅ Duration: ${mockDuration} seconds (mock)`)
    return mockDuration
  } catch (error) {
    console.log(`   ⚠️ Duration extraction failed: ${error.message}`)
    return null
  }
}

// Function to sanitize filename
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9\-]/g, '')
}

// Main function to handle the dry run
const main = async () => {
  console.log('🧪 DRY RUN MODE - Testing Audio Coherency Level Flow')
  console.log('No files will be uploaded or posts created\n')

  // Check for available audio tools
  const audioPlayer = getAudioPlayer()
  console.log(
    `🔧 Using audio player: ${audioPlayer.tool} (${audioPlayer.description})`
  )

  // Show all available tools for debugging
  const allTools = checkAudioTools()
  console.log(
    `📋 Available audio tools: ${allTools.map((t) => t.tool).join(', ')}`
  )

  // Use the 25aug12-backup folder as test audio files
  const downloadsPath = path.join(
    process.env.HOME || process.env.USERPROFILE,
    'Downloads'
  )
  const testFolderPath = path.join(downloadsPath, '25aug12-backup')

  if (!fs.existsSync(testFolderPath)) {
    console.error(`❌ Test folder not found: ${testFolderPath}`)
    console.log(
      '\nPlease ensure the 25aug12-backup folder exists in your Downloads directory'
    )
    process.exit(1)
  }

  console.log(`📁 Using test folder: ${testFolderPath}`)

  // Check for audio files in the test folder
  const files = fs.readdirSync(testFolderPath)
  const audioFiles = files.filter(
    (file) =>
      file.toLowerCase().endsWith('.wav') ||
      file.toLowerCase().endsWith('.mp3') ||
      file.toLowerCase().endsWith('.ogg') ||
      file.toLowerCase().endsWith('.m4a') ||
      file.toLowerCase().endsWith('.aac') ||
      file.toLowerCase().endsWith('.flac')
  )

  if (audioFiles.length === 0) {
    console.error('❌ No audio files found in test folder')
    console.log('\nPlease add some audio files to the 25aug12-backup folder')
    process.exit(1)
  }

  console.log(`🎵 Found ${audioFiles.length} audio file(s) in test folder\n`)

  // Simulate the movedFiles array that would be created in the real init script
  const movedFiles = []
  const coherencyLevels = []

  // Process each audio file
  for (let i = 0; i < audioFiles.length; i++) {
    const audioFile = audioFiles[i]
    const sourcePath = path.join(testFolderPath, audioFile)

    console.log(`📁 Processing: ${audioFile}`)

    try {
      // Extract duration (mock for dry run)
      const duration = await extractAudioDuration(sourcePath)

      // Create mock file entry
      const sanitizedName = sanitizeFilename('25aug12')
      const uniqueFileName =
        audioFiles.length === 1
          ? `${sanitizedName}.wav`
          : `${sanitizedName}-${i + 1}.wav`

      const mockFile = {
        fileName: uniqueFileName,
        url: `DRY_RUN_URL_${i + 1}`,
        duration: duration,
        storagePath: `audio/${uniqueFileName}`,
      }

      movedFiles.push(mockFile)
      console.log(`   ✅ Mock file created: ${uniqueFileName}`)
    } catch (error) {
      console.error(`   ❌ Error processing ${audioFile}:`, error.message)
    }
  }

  if (movedFiles.length === 0) {
    console.error('❌ No audio files were processed successfully')
    process.exit(1)
  }

  console.log(
    `\n🎯 Ready to test coherency level prompts for ${movedFiles.length} audio tracks`
  )
  console.log(
    'This simulates what you would see when creating a real blog post\n'
  )

  // Test the coherency level prompts with audio playback
  console.log('📝 Testing Audio Coherency Level Prompts...')

  for (let i = 0; i < movedFiles.length; i++) {
    const file = movedFiles[i]
    const audioFile = audioFiles[i]
    const sourcePath = path.join(testFolderPath, audioFile)

    console.log(`\n🎵 TRACK ${i + 1} of ${movedFiles.length}: ${audioFile}`)
    console.log('─'.repeat(60))

    try {
      // Ask if user wants to listen to this track
      const listenChoice = await askQuestion(
        `Would you like to listen to this track before rating? (y/n): `
      )

      if (
        listenChoice.toLowerCase() === 'y' ||
        listenChoice.toLowerCase() === 'yes'
      ) {
        console.log(`\n🎧 Playing ${audioFile}...`)
        await playAudio(sourcePath, audioPlayer)
        console.log('\n🎵 Playback finished. Now rate the coherency level.')
      } else {
        console.log('⏭️  Skipping audio playback for this track.')
      }

      // Get coherency level for this audio track
      const audioCoherencyLevel = await getAudioCoherencyLevel(
        askQuestion,
        i + 1,
        movedFiles.length
      )

      coherencyLevels.push(audioCoherencyLevel)

      console.log(
        `✅ Track ${i + 1} coherency level set to: ${audioCoherencyLevel}`
      )

      // Show what would be saved to database
      console.log(`   📊 Would save to daily_audio table:`)
      console.log(`      - daily_id: DRY_RUN_DAILY_ID`)
      console.log(`      - storage_path: ${file.storagePath}`)
      console.log(`      - duration: ${file.duration}`)
      console.log(`      - format: audio/wav`)
      console.log(`      - coherency_level: ${audioCoherencyLevel}`)
      console.log('')
    } catch (error) {
      console.error(
        `❌ Error setting coherency level for track ${i + 1}:`,
        error.message
      )
    }
  }

  // Summary of what would happen
  console.log('📊 DRY RUN SUMMARY')
  console.log('==================')
  console.log(`Total audio tracks processed: ${movedFiles.length}`)
  console.log(`Coherency levels collected: ${coherencyLevels.join(', ')}`)
  console.log('')
  console.log('What would happen in real mode:')
  console.log('1. ✅ Audio files would be uploaded to Supabase')
  console.log(
    '2. ✅ daily_audio entries would be created with coherency levels'
  )
  console.log('3. ✅ Blog post would be created with audio links')
  console.log('4. ✅ Markov texts would be generated and edited')
  console.log('5. ✅ Cover art would be generated')
  console.log('6. ✅ Git branch would be created and committed')
  console.log('')
  console.log('🎉 Dry run completed successfully!')
  console.log('The new audio coherency level feature is working correctly.')

  // Close readline interface
  rl.close()
}

// Export functions for testing
module.exports = {
  main,
  askQuestion,
  displayText,
  getAudioCoherencyLevel,
  extractAudioDuration,
  sanitizeFilename,
  playAudio,
}

// Run the main function only if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error.message)
    rl.close()
    process.exit(1)
  })
}
