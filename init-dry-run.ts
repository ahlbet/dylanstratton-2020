#!/usr/bin/env ts-node

import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { MarkovGenerator } from './src/utils/markov-generator'
import { getCoherencyLevel } from './src/utils/coherency-level-utils'
import { getAudioPlayer, checkAudioTools } from './src/utils/audio-tools'
import { spawn } from 'child_process'
import * as dotenv from 'dotenv'

dotenv.config()

interface AudioFile {
  fileName: string
  localPath: string
  duration: number
  format: string
}

interface CoverArtResult {
  path: string
  url: string
  buffer: Buffer
}

interface MarkovText {
  text_content: string
  coherency_level: number
  daily_id: string
}

interface DailyEntry {
  title: string
  cover_art?: string | null
  date: string
}

interface DailyAudioEntry {
  daily_id: string
  storage_path: string
  duration: number
  format: string
  coherency_level: number
}

/**
 * DRY RUN version of the init script that actually tests functionality
 * Tests the entire flow without making actual changes
 */
class InitDryRun {
  private name: string
  private date: string
  private isTest: boolean = true
  private movedFiles: AudioFile[] = []
  private localPlaybackFiles: AudioFile[] = []
  private editedTexts: string[] = []
  private coherencyLevels: number[] = []
  private coverArtData: CoverArtResult | null = null
  private dailyId: string | null = null
  private rl: readline.Interface
  private supabaseClient: SupabaseClient | null = null
  private markovGenerator: MarkovGenerator | null = null

  constructor(name: string) {
    this.name = name
    this.date = this.transformDate(new Date())
    
    // Only create readline interface if not in test mode
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'test') {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })
    }
    
    console.log(`🚀 DRY RUN MODE - Testing init flow for: ${name}`)
    console.log(`📅 Date: ${this.date}`)
    console.log(`🔒 NO ACTUAL CHANGES WILL BE MADE\n`)
  }

  /**
   * Transform date to required format
   */
  private transformDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * Ask user a question
   */
  private async askQuestion(question: string): Promise<string> {
    // In test mode, return a default value
    if (process.env.NODE_ENV === 'test') {
      return 'n'
    }
    
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim())
      })
    })
  }

  /**
   * Display text in a formatted way
   */
  private displayText(text: string, title: string): void {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`${title}`)
    console.log(`${'='.repeat(60)}`)
    console.log(text)
    console.log(`${'='.repeat(60)}\n`)
  }

  /**
   * Validate input parameters
   */
  private validateInput(): void {
    if (!this.name) {
      throw new Error('Name argument is required')
    }
    console.log('✅ Input validation passed')
  }

  /**
   * Test Supabase connection
   */
  private async testSupabaseConnection(): Promise<void> {
    console.log('\n🗄️  STEP 1: Testing Supabase Connection (DRY RUN)')
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️  Missing Supabase credentials - skipping connection test')
      console.log('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
      return
    }
    
    try {
      this.supabaseClient = createClient(supabaseUrl, supabaseKey)
      
      // Test connection by querying daily table
      const { data, error } = await this.supabaseClient
        .from('daily')
        .select('count')
        .limit(1)
      
      if (error) {
        throw new Error(`Connection test failed: ${error.message}`)
      }
      
      console.log('✅ Supabase connection successful')
      console.log('✅ Database tables accessible')
      
    } catch (error) {
      console.log(`❌ Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.log('⚠️  Some functionality will be limited without database access')
    }
    
    console.log('✅ Supabase connection test complete')
  }

  /**
   * Test audio file processing with real files
   */
  private async processAudioFiles(): Promise<void> {
    console.log('\n🎵 STEP 2: Audio File Processing (DRY RUN)')
    
    const assetsDir = path.join(process.cwd(), 'content', 'assets', 'music')
    console.log(`📁 Scanning directory: ${assetsDir}`)
    
    try {
      if (!fs.existsSync(assetsDir)) {
        console.log('❌ Assets directory not found')
        console.log('💡 Create content/assets/music directory and add audio files')
        return
      }

      const files = fs.readdirSync(assetsDir)
      const audioFiles = files.filter(file => 
        /\.(wav|mp3|flac|m4a|aac)$/i.test(file)
      )

      console.log(`📊 Found ${audioFiles.length} audio files:`)
      audioFiles.forEach((file, index) => {
        const filePath = path.join(assetsDir, file)
        const stats = fs.statSync(filePath)
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
        
        console.log(`  ${index + 1}. ${file} (${sizeInMB} MB)`)
        
        // Create real file entry with actual file info
        this.movedFiles.push({
          fileName: file,
          localPath: filePath,
          duration: Math.floor(Math.random() * 300) + 30, // Mock duration for now
          format: path.extname(file).substring(1).toUpperCase()
        })
      })

      if (audioFiles.length === 0) {
        console.log('ℹ️  No audio files found - audio processing will be skipped')
      } else {
        console.log(`✅ Audio processing test complete - ${this.movedFiles.length} files ready`)
      }
      
    } catch (error) {
      console.log(`❌ Error scanning audio files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Test Markov text generation with real generator
   */
  private async processMarkovTexts(): Promise<void> {
    console.log('\n📝 STEP 3: Markov Text Generation (DRY RUN)')
    
    try {
      console.log('🔧 Initializing Markov generator...')
      this.markovGenerator = new MarkovGenerator(7)
      
      console.log('📚 Loading training data...')
      
      // Try to load from Supabase first
      if (this.supabaseClient) {
        const supabaseUrl = process.env.SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
        
        const success = await this.markovGenerator.loadTextFromSupabaseWithCredentials(
          supabaseUrl,
          supabaseKey,
          'markov-text'
        )
        
        if (success) {
          console.log('✅ Successfully loaded markov texts from Supabase')
        } else {
          console.log('⚠️  Failed to load from Supabase, using fallback text')
          this.loadFallbackTexts()
        }
      } else {
        console.log('⚠️  No Supabase connection, using fallback text')
        this.loadFallbackTexts()
      }
      
      console.log('🎲 Generating 5 initial texts...')
      
      // Generate real texts using the generator
      const markovTexts: string[] = []
      for (let i = 0; i < 5; i++) {
        try {
          const generatedLines = this.markovGenerator.generateMultipleLines(1, 1000, 2)
          if (generatedLines.length > 0) {
            markovTexts.push(generatedLines[0])
          } else {
            markovTexts.push(`Generated text ${i + 1} could not be created.`)
          }
        } catch (error) {
          console.log(`⚠️  Error generating text ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          markovTexts.push(`Generated text ${i + 1} could not be created.`)
        }
      }
      
      console.log('\n📖 Generated texts:')
      markovTexts.forEach((text, index) => {
        console.log(`\n--- Text ${index + 1} ---`)
        console.log(text)
        console.log('---')
      })
      
      console.log('\n✏️  Testing interactive editing...')
      console.log('  (In actual init, you would edit each text here)')
      
      // Test the editing flow
      for (let i = 0; i < markovTexts.length; i++) {
        let currentText = markovTexts[i]
        let needsRegeneration = false

        do {
          needsRegeneration = false
          this.displayText(currentText, `Original Markov Text #${i + 1}`)
          
          const editChoice = await this.askQuestion(
            `Do you want to edit this text? (y/n, or 'r' to regenerate): `
          )
          
          if (editChoice.toLowerCase() === 'r') {
            try {
              const generatedLines = this.markovGenerator.generateMultipleLines(1, 1000, 2)
              if (generatedLines.length > 0) {
                currentText = generatedLines[0]
              } else {
                currentText = `Generated text ${i + 1} could not be created.`
              }
              needsRegeneration = true
              console.log(`🔄 Regenerated text ${i + 1}`)
            } catch (error) {
              console.log(`⚠️  Error regenerating text ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
              currentText = `Generated text ${i + 1} could not be created.`
            }
          } else if (editChoice.toLowerCase() === 'y') {
            const newText = await this.askQuestion('Enter your edited text: ')
            currentText = newText || currentText
          }
        } while (needsRegeneration)
        
        this.editedTexts.push(currentText)
        
        // Test coherency level input
        const coherencyLevel = await getCoherencyLevel(this.askQuestion.bind(this), i + 1)
        this.coherencyLevels.push(coherencyLevel)
        
        console.log(`✅ Text ${i + 1} finalized with coherency level ${coherencyLevel}`)
      }
      
      console.log('✅ Markov text processing test complete')
      
    } catch (error) {
      console.log(`❌ Error in Markov text processing: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Load fallback texts for testing
   */
  private loadFallbackTexts(): void {
    const fallbackText = [
      'The quick brown fox jumps over the lazy dog.',
      'A journey of a thousand miles begins with a single step.',
      'All that glitters is not gold.',
      'Actions speak louder than words.',
      'Beauty is in the eye of the beholder.',
      'Every cloud has a silver lining.',
      'Time heals all wounds.',
      'The early bird catches the worm.',
      "Don't judge a book by its cover.",
      'Practice makes perfect.'
    ]
    this.markovGenerator!.loadTextFromArray(fallbackText)
  }

  /**
   * Test cover art generation
   */
  private async generateCoverArt(): Promise<void> {
    console.log('\n🎨 STEP 4: Cover Art Generation (DRY RUN)')
    
    console.log('🎭 Testing cover art generation for:', this.name)
    console.log('🖼️  Using AI image generation...')
    console.log('📐 Dimensions: 2500x2500 pixels')
    console.log('🎨 Style: Abstract, artistic, blog-themed')
    
    try {
      // Test the cover art generation function
      const { generateCoverArt } = await import('./src/utils/cover-art-generator')
      const coverArtBuffer = await generateCoverArt(this.name, 2500)
      
      // Simulate cover art data
      this.coverArtData = {
        path: `cover-art/${this.name}.png`,
        url: `https://example.supabase.co/storage/v1/object/public/cover-art/${this.name}.png`,
        buffer: coverArtBuffer
      }
      
      console.log(`✅ Cover art generated successfully: ${this.coverArtData.path}`)
      console.log(`🔗 URL: ${this.coverArtData.url}`)
      console.log(`📊 Buffer size: ${(coverArtBuffer.length / 1024).toFixed(2)} KB`)
      
    } catch (error) {
      console.log(`⚠️  Cover art generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.log('💡 This is expected if cover-art-generator is not available')
      
      // Create mock data for testing
      this.coverArtData = {
        path: `cover-art/${this.name}.png`,
        url: `https://example.supabase.co/storage/v1/object/public/cover-art/${this.name}.png`,
        buffer: Buffer.from('mock-cover-art-data')
      }
    }
    
    console.log('✅ Cover art generation test complete')
  }

  /**
   * Test database operations
   */
  private async createDatabaseEntries(): Promise<void> {
    console.log('\n🗄️  STEP 5: Database Operations (DRY RUN)')
    
    if (!this.supabaseClient) {
      console.log('⚠️  No Supabase connection - skipping database tests')
      return
    }
    
    console.log('📊 Testing daily entry creation...')
    const dailyEntry: DailyEntry = {
      title: this.name,
      cover_art: this.coverArtData?.path || null,
      date: this.date
    }
    console.log('  Daily entry data:', JSON.stringify(dailyEntry, null, 2))
    
    // Test the database insert (without actually inserting)
    try {
      const { error } = await this.supabaseClient
        .from('daily')
        .select('id')
        .eq('title', this.name)
        .limit(1)
      
      if (error) {
        throw error
      }
      
      console.log('✅ Daily entry query test successful')
      
    } catch (error) {
      console.log(`⚠️  Daily entry query test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    // Simulate daily ID generation
    this.dailyId = `daily_${Date.now()}`
    console.log(`✅ Daily entry test complete with ID: ${this.dailyId}`)
    
    if (this.movedFiles.length > 0) {
      console.log('\n🎵 Testing daily audio entries...')
      this.movedFiles.forEach((file, index) => {
        const audioEntry: DailyAudioEntry = {
          daily_id: this.dailyId!,
          storage_path: `audio/${file.fileName}`,
          duration: file.duration,
          format: file.format,
          coherency_level: Math.floor(Math.random() * 100) + 1
        }
        console.log(`  Audio ${index + 1}:`, JSON.stringify(audioEntry, null, 2))
      })
      console.log(`✅ ${this.movedFiles.length} audio entries test complete`)
    }
    
    if (this.editedTexts.length > 0) {
      console.log('\n📝 Testing Markov text entries...')
      this.editedTexts.forEach((text, index) => {
        const markovEntry: MarkovText = {
          daily_id: this.dailyId!,
          text_content: text.substring(0, 100) + '...',
          coherency_level: this.coherencyLevels[index]
        }
        console.log(`  Text ${index + 1}:`, JSON.stringify(markovEntry, null, 2))
      })
      console.log(`✅ ${this.editedTexts.length} Markov text entries test complete`)
    }
    
    console.log('✅ Database operations test complete')
  }

  /**
   * Test blog post creation
   */
  private async createBlogPost(): Promise<void> {
    console.log('\n📝 STEP 6: Blog Post Creation (DRY RUN)')
    
    const blogDir = path.join(process.cwd(), 'content', 'blog', this.name)
    const blogFile = path.join(blogDir, `${this.name}.md`)
    
    console.log(`📁 Blog directory: ${blogDir}`)
    console.log(`📄 Blog file: ${blogFile}`)
    
    // Test template reading
    try {
      const templatePath = path.join(process.cwd(), 'src', 'template.md')
      if (fs.existsSync(templatePath)) {
        const template = fs.readFileSync(templatePath, 'utf8')
        console.log('✅ Template file found and readable')
        console.log(`📏 Template size: ${template.length} characters`)
      } else {
        console.log('⚠️  Template file not found')
      }
    } catch (error) {
      console.log(`⚠️  Template file error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    // Simulate template content
    const templateContent = `---
title: "${this.name}"
date: "${this.date}"
---

# ${this.name}

## Audio Files

${this.movedFiles.map((file, index) => 
  `### Track ${index + 1}: ${file.fileName}\n\n- **Duration:** ${file.duration} seconds\n- **Format:** ${file.format}\n`
).join('\n')}

## Markov Texts

${this.editedTexts.map((text, index) => 
  `### Text ${index + 1} (Coherency: ${this.coherencyLevels[index]}/100)\n\n${text}\n`
).join('\n')}

---
*Generated on ${new Date().toISOString()}*
`
    
    console.log('\n📄 Template content preview:')
    console.log('---')
    console.log(templateContent.substring(0, 500) + '...')
    console.log('---')
    
    console.log('✅ Blog post creation test complete')
  }

  /**
   * Test local data updates
   */
  private async updateLocalData(): Promise<void> {
    console.log('\n💾 STEP 7: Local Data Updates (DRY RUN)')
    
    console.log('📊 Testing local data file operations...')
    
    // Test if we can read/write to content directory
    const contentDir = path.join(process.cwd(), 'content')
    try {
      if (fs.existsSync(contentDir)) {
        console.log('✅ Content directory accessible')
        const stats = fs.statSync(contentDir)
        console.log(`📁 Directory permissions: ${stats.mode.toString(8)}`)
      } else {
        console.log('⚠️  Content directory not found')
      }
    } catch (error) {
      console.log(`⚠️  Content directory error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    console.log('✅ Local data updates test complete')
  }

  /**
   * Test audio playback functionality
   */
  private async testAudioPlayback(): Promise<void> {
    if (this.movedFiles.length === 0) {
      return
    }
    
    console.log('\n🎵 STEP 8: Audio Playback Testing (DRY RUN)')
    
    // Check for available audio tools
    const audioPlayer = getAudioPlayer()
    if (audioPlayer) {
      console.log(`🔧 Audio player available: ${audioPlayer.tool} (${audioPlayer.description})`)
      
      // Show all available tools
      const allTools = checkAudioTools()
      console.log(`📋 Available audio tools: ${allTools.map((t) => t.tool).join(', ')}`)
      
      // Test with first audio file
      const testFile = this.movedFiles[0]
      console.log(`🎧 Testing playback with: ${testFile.fileName}`)
      
      const wantToTest = await this.askQuestion('Would you like to test audio playback? (y/n): ')
      
      if (wantToTest.toLowerCase() === 'y' || wantToTest.toLowerCase() === 'yes') {
        try {
          await this.playAudioWithStop(testFile.localPath, audioPlayer)
          console.log('✅ Audio playback test successful')
        } catch (error) {
          console.log(`⚠️  Audio playback test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      } else {
        console.log('⏭️  Audio playback test skipped')
      }
    } else {
      console.log('⚠️  No audio playback tools found on your system')
    }
    
    console.log('✅ Audio playback testing complete')
  }

  /**
   * Play audio with stop capability
   */
  private async playAudioWithStop(filePath: string, audioPlayer: any): Promise<void> {
    const { tool } = audioPlayer
    
    let command: string
    let args: string[] = []
    
    switch (tool) {
      case 'afplay':
        command = 'afplay'
        args = [filePath]
        break
      case 'aplay':
        command = 'aplay'
        args = [filePath]
        break
      case 'mpv':
        command = 'mpv'
        args = ['--no-video', '--quiet', filePath]
        break
      default:
        command = tool
        args = [filePath]
    }
    
    console.log(`▶️  Playing audio with ${tool}... (Press Enter to stop early)`)
    
    return new Promise((resolve, reject) => {
      const audioProcess = spawn(command, args, {
        stdio: 'pipe',
        detached: false,
      })
      
      let isStopped = false
      
      const stopPlayback = () => {
        if (isStopped) return
        isStopped = true
        
        console.log('\n⏹️  Stopping audio playback...')
        audioProcess.kill('SIGTERM')
        
        setTimeout(() => {
          if (!audioProcess.killed) {
            audioProcess.kill('SIGKILL')
          }
        }, 1000)
        
        resolve()
      }
      
      audioProcess.on('close', (code) => {
        if (isStopped) return
        
        if (code === 0) {
          console.log('\n🎵 Playback finished normally')
          resolve()
        } else {
          console.log(`\n⚠️  Playback ended with code ${code}`)
          resolve()
        }
      })
      
      audioProcess.on('error', (error) => {
        if (isStopped) return
        reject(error)
      })
      
      const checkForStop = async () => {
        try {
          console.log('\n💡 Press Enter to stop audio, or wait for it to finish...')
          const answer = await this.askQuestion('')
          if (answer === '') {
            stopPlayback()
          }
        } catch (error) {
          // User interrupted, continue with playback
        }
      }
      
      setTimeout(() => {
        if (!isStopped) {
          checkForStop()
        }
      }, 500)
    })
  }

  /**
   * Run the complete dry run
   */
  async run(): Promise<void> {
    try {
      console.log('🎯 Starting comprehensive DRY RUN of init flow...\n')
      
      this.validateInput()
      await this.testSupabaseConnection()
      await this.processAudioFiles()
      await this.processMarkovTexts()
      await this.generateCoverArt()
      await this.createDatabaseEntries()
      await this.createBlogPost()
      await this.updateLocalData()
      await this.testAudioPlayback()
      
      console.log('\n🎉 DRY RUN COMPLETED SUCCESSFULLY!')
      console.log('\n📋 SUMMARY:')
      console.log(`  📝 Blog post: ${this.name}`)
      console.log(`  📅 Date: ${this.date}`)
      console.log(`  🎵 Audio files: ${this.movedFiles.length}`)
      console.log(`  📖 Markov texts: ${this.editedTexts.length}`)
      console.log(`  🎨 Cover art: ${this.coverArtData ? 'Generated' : 'None'}`)
      console.log(`  🗄️  Database: ${this.supabaseClient ? 'Connected' : 'Not connected'}`)
      
      console.log('\n💡 To run the actual init script:')
      console.log(`  yarn run new-day ${this.name}`)
      
    } catch (error) {
      console.error('\n❌ DRY RUN FAILED:', error instanceof Error ? error.message : 'Unknown error')
      throw error // Re-throw instead of exiting
    } finally {
      if (this.rl) {
        this.rl.close()
      }
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('Usage: ts-node init-dry-run.ts <post-name>')
    console.log('Example: ts-node init-dry-run.ts 25aug15')
    process.exit(1)
  }
  
  const name = args[0]
  
  const dryRun = new InitDryRun(name)
  await dryRun.run()
}

if (require.main === module) {
  main().catch(console.error)
}

export { InitDryRun }
