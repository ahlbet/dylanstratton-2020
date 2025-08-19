import * as fs from 'fs'
import * as path from 'path'
import { transformDate } from '../date-utils'
import { getAudioPlayer } from '../audio-tools'
import { GitOperations } from './git-operations'
import { UserInteraction } from './user-interaction'
import { AudioProcessor } from './audio-processor'
import { SupabaseManager } from './supabase-manager'
import { MarkovManager } from './markov-manager'
import { LocalDataManager } from './local-data-manager'
import { TemplateProcessor } from './template-processor'

interface AudioFile {
  fileName: string
  url: string
  duration: number
  storagePath: string
  localPath: string
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
  text_length: number
}

/**
 * Main orchestrator for the init script
 */
class InitOrchestrator {
  public name: string
  public description: string
  public date: string
  public isTest: boolean
  public isDryRun: boolean
  private userInteraction: UserInteraction
  private supabaseManager: SupabaseManager
  private markovManager: MarkovManager
  public movedFiles: AudioFile[]
  public localPlaybackFiles: any[]
  private coverArtData: CoverArtResult | null
  private dailyId: string | null
  private supabaseTexts: MarkovText[]
  public editedTexts: string[]
  public coherencyLevels: number[]

  constructor(name: string, description: string = '', dryRun: boolean = false) {
    this.name = name
    this.description = description
    this.date = transformDate(name, true)
    this.isTest = process.env.NODE_ENV === 'test'
    this.isDryRun = dryRun

    // Initialize managers
    this.userInteraction = new UserInteraction()
    this.supabaseManager = new SupabaseManager()
    this.markovManager = new MarkovManager()

    // State tracking
    this.movedFiles = []
    this.localPlaybackFiles = []
    this.coverArtData = null
    this.dailyId = null
    this.supabaseTexts = []
    this.editedTexts = []
    this.coherencyLevels = []
  }

  /**
   * Run the complete initialization process
   */
  async run(): Promise<void> {
    try {
      // Validate input
      this.validateInput()

      if (this.isDryRun) {
        console.log('\n🔍 DRY RUN MODE - Testing functionality without making changes...')
        console.log('='.repeat(60))
        console.log('✅ Will test: Markov generation, audio playback, coherency collection')
        console.log('❌ Will NOT: Upload to Supabase, create files, or commit to Git')
        console.log('='.repeat(60))
      }

      // Initialize Git branch (skip in dry run)
      if (!this.isDryRun) {
        await this.initializeGit()
      } else {
        console.log('\n📋 Git operations skipped in dry run mode')
      }

      // Process audio files (test functionality, skip uploads)
      await this.processAudioFiles()

      // Generate and process Markov texts (test real generation)
      await this.processMarkovTexts()

      // Generate cover art (test generation, skip upload)
      await this.generateCoverArt()

      // Create database entries (skip in dry run)
      if (!this.isDryRun) {
        await this.createDatabaseEntries()
      } else {
        console.log('\n📋 Database operations skipped in dry run mode')
      }

      // Create blog post (skip in dry run)
      if (!this.isDryRun) {
        await this.createBlogPost()
      } else {
        console.log('\n📋 Blog post creation skipped in dry run mode')
      }

      // Push to Git if successful (skip in dry run)
      if (this.movedFiles.length > 0) {
        if (!this.isDryRun) {
          await this.pushToGit()
        } else {
          console.log('📋 Git push skipped in dry run mode')
        }
      } else {
        if (this.isDryRun) {
          console.log('📋 Git push would be skipped (no audio files to upload)')
        } else {
          console.log(
            `No audio files were uploaded to Supabase. Skipping git push to avoid incomplete commits.`
          )
        }
      }

      // Update local development data (skip in dry run)
      if (!this.isDryRun) {
        await this.updateLocalData()
      } else {
        console.log('\n📋 Local data updates skipped in dry run mode')
      }

      if (this.isDryRun) {
        console.log('\n✅ Dry run testing completed successfully!')
        this.showDryRunSummary()
      } else {
        console.log('✅ Initialization completed successfully!')
      }
    } catch (error) {
      console.error('❌ Initialization failed:', error instanceof Error ? error.message : String(error))
      throw error
    } finally {
      // Always close user interaction
      this.userInteraction.close()
    }
  }

  /**
   * Validate input parameters
   */
  public validateInput(): void {
    if (!this.name) {
      const errorMessage = 'Name argument is required'
      console.log(`Usage: node ${path.basename(process.argv[1])} <name>`)
      if (this.isTest) {
        throw new Error(errorMessage)
      }
      process.exit(1)
    }
  }

  /**
   * Initialize Git branch
   */
  private async initializeGit(): Promise<void> {
    if (this.isDryRun) {
      console.log('📋 Git operations that would happen:')
      console.log(`   - Checkout or create branch: ${this.name}`)
      console.log(`   - Branch would be created from current branch`)
      return
    }
    
    GitOperations.checkoutOrCreateBranch(this.name, this.isTest)
  }

  /**
   * Process audio files
   */
  private async processAudioFiles(): Promise<void> {
    // Find audio files
    const audioData = AudioProcessor.findAudioFiles(this.name)
    this.localPlaybackFiles = audioData.localPlaybackFiles

    if (this.isDryRun) {
      console.log('\n📋 Audio file processing analysis:')
      console.log(`   Found ${this.localPlaybackFiles.length} audio files to process`)
      
      if (this.localPlaybackFiles.length > 0) {
        console.log('\n   Files that would be uploaded to Supabase:')
        this.localPlaybackFiles.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.fileName}`)
          console.log(`      Local path: ${file.localPath}`)
          console.log(`      Storage path: audio/${file.fileName}`)
          console.log(`      Public URL: https://example.supabase.co/storage/v1/object/public/audio/${file.fileName}`)
        })
        
        // Test audio functionality in dry run mode
        console.log('\n🎵 Testing audio functionality (dry run mode):')
        await this.testAudioFunctionality()
        
        // Simulate file processing for dry run (without uploads)
        for (const localFile of this.localPlaybackFiles) {
          const duration = Math.floor(Math.random() * 300) + 30 // Mock duration
          
          this.movedFiles.push({
            fileName: localFile.fileName,
            url: `https://example.supabase.co/storage/v1/object/public/audio/${localFile.fileName}`,
            duration: duration,
            storagePath: `audio/${localFile.fileName}`,
            localPath: localFile.localPath,
          })
        }
        
        console.log(`\n   Total files that would be uploaded: ${this.movedFiles.length}`)
      }
      return
    }

    // Ensure assets directory exists
    const destDir = TemplateProcessor.getAssetsDir()
    fs.mkdirSync(destDir, { recursive: true })

    // Process each audio file
    for (const localFile of this.localPlaybackFiles) {
      try {
        // Extract duration
        const duration = await AudioProcessor.extractAudioDuration(
          localFile.localPath
        )

        // Upload to Supabase
        const supabaseUrl = await this.supabaseManager.uploadToStorage(
          localFile.localPath,
          localFile.fileName,
          'audio'
        )

        // Track uploaded file
        this.movedFiles.push({
          fileName: localFile.fileName,
          url: supabaseUrl,
          duration: duration,
          storagePath: `audio/${localFile.fileName}`,
          localPath: localFile.localPath,
        })

        console.log(`Uploaded file '${localFile.fileName}' to Supabase.`)
      } catch (error) {
        console.error(`Failed to upload ${localFile.fileName}:`, error instanceof Error ? error.message : String(error))
      }
    }
  }

  /**
   * Test audio functionality in dry run mode
   */
  private async testAudioFunctionality(): Promise<void> {
    if (this.localPlaybackFiles.length === 0) {
      return
    }

    // Check for available audio tools
    const audioPlayer = getAudioPlayer()
    if (audioPlayer) {
      console.log(`🔧 Audio player available: ${audioPlayer.tool} (${audioPlayer.description})`)
      
      // Test audio playback and coherency collection for each file
      for (let i = 0; i < this.localPlaybackFiles.length; i++) {
        const file = this.localPlaybackFiles[i]
        console.log(`\n🎧 Testing audio track ${i + 1}: ${file.fileName}`)
        
        // Test coherency level collection (this will offer audio playback)
        const coherencyLevel = await this.userInteraction.getAudioCoherencyLevel(
          i + 1,
          this.localPlaybackFiles.length,
          file.localPath,
          audioPlayer
        )
        
        console.log(`✅ Track ${i + 1} coherency level: ${coherencyLevel}`)
      }
    } else {
      console.log('⚠️  No audio playback tools found on your system')
    }
  }

  /**
   * Process Markov texts
   */
  private async processMarkovTexts(): Promise<void> {
    if (this.isDryRun) {
      console.log('\n📋 Markov text generation analysis:')
      console.log('   Testing real Markov text generation and editing...')
      
      // Initialize Markov generator and test real functionality
      await this.markovManager.initialize()
      
      // Generate real texts using the generator
      const initialTexts = this.markovManager.generateInitialTexts(5)
      
      console.log(`\n   Generated ${initialTexts.length} initial texts for testing`)
      
      // Process texts interactively (real editing and coherency collection)
      const { editedTexts, coherencyLevels } =
        await this.markovManager.processTexts(
          initialTexts,
          this.userInteraction.editText.bind(this.userInteraction),
          this.userInteraction.getTextCoherencyLevel.bind(this.userInteraction)
        )

      // Store processed texts
      this.editedTexts = editedTexts
      this.coherencyLevels = coherencyLevels
      
      console.log(`\n   ✅ Markov text testing complete`)
      console.log(`   Final texts: ${this.editedTexts.length}`)
      console.log(`   Coherency levels: ${this.coherencyLevels.join(', ')}`)
      return
    }

    console.log('📝 Generating 5 markov texts for interactive editing...')

    // Initialize Markov generator
    await this.markovManager.initialize()

    // Generate initial texts
    const initialTexts = this.markovManager.generateInitialTexts(5)

    // Process texts interactively
    const { editedTexts, coherencyLevels } =
      await this.markovManager.processTexts(
        initialTexts,
        this.userInteraction.editText.bind(this.userInteraction),
        this.userInteraction.getTextCoherencyLevel.bind(this.userInteraction)
      )

    // Store processed texts
    this.editedTexts = editedTexts
    this.coherencyLevels = coherencyLevels
  }

  /**
   * Generate cover art
   */
  private async generateCoverArt(): Promise<void> {
    if (this.isDryRun) {
      console.log('\n📋 Cover art generation analysis:')
      console.log(`   Testing real cover art generation for: ${this.name}`)
      
      try {
        // Actually test the cover art generation function
        const coverArtResult = await TemplateProcessor.generateCoverArt(
          this.name,
          this.supabaseManager,
          true // dry run mode
        )
        
        // Store the generated cover art for analysis
        this.coverArtData = {
          path: `cover-art/${this.name}.png`,
          url: `https://example.supabase.co/storage/v1/object/public/cover-art/${this.name}.png`,
          buffer: coverArtResult.buffer
        }
        
        console.log(`   ✅ Cover art generated successfully: ${this.coverArtData.path}`)
        console.log(`   Buffer size: ${(coverArtResult.buffer.length / 1024).toFixed(2)} KB`)
        console.log(`   Would upload to: cover-art bucket`)
        console.log(`   Would be accessible at: ${this.coverArtData.url}`)
        
      } catch (error) {
        console.log(`   ⚠️  Cover art generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.log(`   Creating mock data for analysis`)
        
        // Create mock data for analysis if generation fails
        this.coverArtData = {
          path: `cover-art/${this.name}.png`,
          url: `https://example.supabase.co/storage/v1/object/public/cover-art/${this.name}.png`,
          buffer: Buffer.from('mock-cover-art-data-for-dry-run')
        }
      }
      
      console.log(`\n   Mock cover art data created for analysis`)
      return
    }

    this.coverArtData = await TemplateProcessor.generateCoverArt(
      this.name,
      this.supabaseManager,
      false // not dry run mode
    )
  }

  /**
   * Create database entries
   */
  private async createDatabaseEntries(): Promise<void> {
    if (this.isDryRun) {
      console.log('\n📋 Database operations analysis:')
      
      // Simulate daily ID for dry run
      this.dailyId = `daily_${Date.now()}`
      
      console.log(`   Would create daily entry with ID: ${this.dailyId}`)
      console.log(`   Daily entry data:`)
      console.log(`     title: "${this.name}"`)
      console.log(`     cover_art: "${this.coverArtData?.path || 'null'}"`)
      console.log(`     date: "${this.date}"`)
      
      if (this.movedFiles.length > 0) {
        console.log(`\n   Would create ${this.movedFiles.length} daily_audio entries:`)
        this.movedFiles.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.fileName}`)
          console.log(`      daily_id: "${this.dailyId}"`)
          console.log(`      storage_path: "${file.storagePath}"`)
          console.log(`      duration: ${file.duration}`)
          console.log(`      format: "audio/wav"`)
          console.log(`      coherency_level: [would be collected interactively]`)
        })
      }
      
      if (this.editedTexts.length > 0) {
        console.log(`\n   Would create ${this.editedTexts.length} markov_texts entries:`)
        this.editedTexts.forEach((text, index) => {
          console.log(`   ${index + 1}. Text ${index + 1}`)
          console.log(`      daily_id: "${this.dailyId}"`)
          console.log(`      text_content: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`)
          console.log(`      coherency_level: ${this.coherencyLevels[index]}`)
          console.log(`      text_length: ${text.length}`)
        })
      }
      
      console.log('\n   Mock database data created for analysis')
      return
    }

    // Create daily entry
    this.dailyId = await this.supabaseManager.createDailyEntry(
      this.name,
      this.coverArtData?.path || null,
      this.date
    )

    if (this.dailyId) {
      // Create daily audio entries
      if (this.movedFiles.length > 0) {
        await this.createDailyAudioEntries()
      }

      // Prepare and upload Markov texts
      await this.uploadMarkovTexts()
    }
  }

  /**
   * Create daily audio entries
   */
  private async createDailyAudioEntries(): Promise<void> {
    // Check for available audio tools
    const audioPlayer = getAudioPlayer()
    if (audioPlayer) {
      console.log(
        `🔧 Audio player available: ${audioPlayer.tool} (${audioPlayer.description})`
      )
    } else {
      console.warn('⚠️ No audio playback tools found on your system')
      console.log(
        "You can still set coherency levels, but won't be able to preview audio"
      )
    }

    // Create daily audio entries with coherency levels
    for (let i = 0; i < this.movedFiles.length; i++) {
      const file = this.movedFiles[i]

      try {
        // Get coherency level for this audio track
        const audioCoherencyLevel =
          await this.userInteraction.getAudioCoherencyLevel(
            i + 1,
            this.movedFiles.length,
            file.localPath,
            audioPlayer
          )

        const { error: audioError } = await this.supabaseManager.client
          .from('daily_audio')
          .insert([
            {
              daily_id: this.dailyId,
              storage_path: file.storagePath,
              duration: file.duration,
              format: 'audio/wav',
              coherency_level: audioCoherencyLevel,
            },
          ])

        if (audioError) {
          console.error(
            `Failed to create daily_audio entry for ${file.fileName}:`,
            audioError.message
          )
        } else {
          console.log(
            `✅ Created daily_audio entry for ${file.fileName} with coherency level ${audioCoherencyLevel}`
          )
        }
      } catch (error) {
        console.error(
          `Failed to create daily_audio entry for ${file.fileName}:`,
          error instanceof Error ? error.message : String(error)
        )
      }
    }
  }

  /**
   * Upload Markov texts to database
   */
  private async uploadMarkovTexts(): Promise<void> {
    // Prepare texts data with daily_id
    this.supabaseTexts = this.markovManager.prepareTextsData(
      this.editedTexts,
      this.coherencyLevels,
      this.name,
      this.dailyId
    )

    // Upload to Supabase
    await this.supabaseManager.uploadMarkovTexts(this.supabaseTexts)
  }

  /**
   * Create blog post
   */
  private async createBlogPost(): Promise<void> {
    if (this.isDryRun) {
      console.log('\n📋 Blog post creation analysis:')
      console.log(`   Would create directory: content/blog/${this.name}`)
      console.log(`   Would create file: content/blog/${this.name}/${this.name}.md`)
      console.log(`   Would use template from: src/template.md`)
      console.log(`   Would replace template placeholders:`)
      console.log(`     {name} -> "${this.name}"`)
      console.log(`     {date} -> "${this.date}"`)
      console.log(`     {description} -> "${this.description}"`)
      console.log(`     {audio_files} -> ${this.movedFiles.length} audio file(s)`)
      console.log(`     {cover_art} -> "${this.coverArtData?.url || ''}"`)
      console.log(`     {daily_id} -> "${this.dailyId || ''}"`)
      console.log(`     {markov_text} -> ${this.editedTexts.length} markov text(s)`)
      
      console.log('\n   Mock blog post data created for analysis')
      return
    }

    // Read template
    const templatePath = TemplateProcessor.getTemplatePath()
    const template = TemplateProcessor.readTemplate(templatePath, this.isTest)

    // Generate audio files content
    const audioFilesContent = TemplateProcessor.generateAudioFilesContent(
      this.movedFiles
    )

    // Format Markov text for markdown
    const markovText = this.markovManager.formatForMarkdown(this.editedTexts)

    // Process template
    const replacements = {
      name: this.name,
      date: this.date,
      description: this.description,
      audio_files: audioFilesContent,
      cover_art: this.coverArtData?.url || '',
      daily_id: this.dailyId || '',
      markov_text: markovText,
    }

    const processedTemplate = TemplateProcessor.processTemplate(
      template,
      replacements
    )

    // Create blog post
    TemplateProcessor.createBlogPost(this.name, processedTemplate)
  }

  /**
   * Push changes to Git
   */
  private async pushToGit(): Promise<void> {
    if (this.isDryRun) {
      console.log('\n📋 Git operations that would happen:')
      console.log(`   - Add all changes to staging area`)
      console.log(`   - Commit with message: "feat: ${this.name}"`)
      console.log(`   - Push to remote repository`)
      console.log(`   - Branch: ${this.name}`)
      return
    }
    
    GitOperations.commitAndPush(this.name, `feat: ${this.name}`, this.isTest)
  }

  /**
   * Update local development data
   */
  private async updateLocalData(): Promise<void> {
    if (this.isDryRun) {
      console.log('\n📋 Local data updates analysis:')
      console.log('   Would update local development files:')
      console.log('     - content/local-audio-urls.ts')
      console.log('     - content/local-dev-config.ts')
      console.log('     - content/local-dev-utils.ts')
      console.log(`   Would add data for ${this.name} post`)
      console.log(`   Would include ${this.movedFiles.length} audio files`)
      console.log(`   Would include ${this.editedTexts.length} markov texts`)
      console.log(`   Would include cover art data`)
      
      console.log('\n   Mock local data updates created for analysis')
      
      // Show comprehensive summary
      this.showDryRunSummary()
      return
    }
    
    await LocalDataManager.updateAllLocalData(
      this.movedFiles,
      this.supabaseTexts,
      this.name,
      this.coverArtData?.buffer || null,
      this.supabaseManager.client
    )
  }

  /**
   * Show comprehensive summary of what would happen in dry run mode
   */
  private showDryRunSummary(): void {
    console.log('\n🎯 COMPREHENSIVE DRY RUN SUMMARY')
    console.log('='.repeat(60))
    
    console.log(`\n📝 Blog post: ${this.name}`)
    console.log(`📅 Date: ${this.date}`)
    console.log(`📖 Description: ${this.description || 'None'}`)
    
    console.log('\n🗄️  SUPABASE OPERATIONS:')
    console.log('   Storage Buckets:')
    if (this.movedFiles.length > 0) {
      console.log(`     audio: ${this.movedFiles.length} file(s)`)
    }
    if (this.coverArtData) {
      console.log(`     cover-art: 1 file`)
    }
    
    console.log('\n   Database Tables:')
    console.log(`     daily: 1 entry`)
    if (this.movedFiles.length > 0) {
      console.log(`     daily_audio: ${this.movedFiles.length} entries`)
    }
    if (this.editedTexts.length > 0) {
      console.log(`     markov_texts: ${this.editedTexts.length} entries`)
    }
    
    console.log('\n📁 LOCAL FILES:')
    console.log(`   content/blog/${this.name}/${this.name}.md`)
    if (this.movedFiles.length > 0) {
      console.log(`   content/assets/music/ (${this.movedFiles.length} audio files)`)
    }
    
    console.log('\n🔧 GIT OPERATIONS:')
    console.log(`   - Create/checkout branch: ${this.name}`)
    console.log(`   - Commit message: "feat: ${this.name}"`)
    console.log(`   - Push to remote`)
    
    console.log('\n📊 DATA VOLUME ESTIMATES:')
    const totalAudioSize = this.movedFiles.reduce((sum, file) => sum + (file.duration * 1024), 0) // Rough estimate
    const coverArtSize = this.coverArtData ? this.coverArtData.buffer.length : 0
    const totalStorageSize = totalAudioSize + coverArtSize
    
    console.log(`   Total storage uploads: ~${(totalStorageSize / (1024 * 1024)).toFixed(2)} MB`)
    console.log(`   Database rows: ${1 + this.movedFiles.length + this.editedTexts.length}`)
    
    console.log('\n💡 To run the actual init script, remove the --dry-run flag')
  }
}

export { InitOrchestrator }