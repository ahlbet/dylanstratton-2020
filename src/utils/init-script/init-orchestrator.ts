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

interface CoverArtData {
  path: string
  url: string
  buffer: Buffer
}

interface MarkovText {
  text_content: string
  coherency_level: number
  daily_id: string
  name: string
}

/**
 * Main orchestrator for the init script
 */
class InitOrchestrator {
  public name: string
  public description: string
  public date: string
  public isTest: boolean
  private userInteraction: UserInteraction
  private supabaseManager: SupabaseManager
  private markovManager: MarkovManager
  public movedFiles: AudioFile[]
  public localPlaybackFiles: any[]
  private coverArtData: CoverArtData | null
  private dailyId: string | null
  private supabaseTexts: MarkovText[]
  public editedTexts: string[]
  public coherencyLevels: number[]

  constructor(name: string, description: string = '') {
    this.name = name
    this.description = description
    this.date = transformDate(name, true)
    this.isTest = process.env.NODE_ENV === 'test'

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

      // Initialize Git branch
      await this.initializeGit()

      // Process audio files
      await this.processAudioFiles()

      // Generate and process Markov texts
      await this.processMarkovTexts()

      // Generate cover art
      await this.generateCoverArt()

      // Create database entries
      await this.createDatabaseEntries()

      // Create blog post
      await this.createBlogPost()

      // Push to Git if successful
      if (this.movedFiles.length > 0) {
        await this.pushToGit()
      } else {
        console.log(
          `No audio files were uploaded to Supabase. Skipping git push to avoid incomplete commits.`
        )
      }

      // Update local development data
      await this.updateLocalData()

      console.log('✅ Initialization completed successfully!')
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
    GitOperations.checkoutOrCreateBranch(this.name, this.isTest)
  }

  /**
   * Process audio files
   */
  private async processAudioFiles(): Promise<void> {
    // Find audio files
    const audioData = AudioProcessor.findAudioFiles(this.name)
    this.localPlaybackFiles = audioData.localPlaybackFiles

    // Ensure assets directory exists
    const destDir = TemplateProcessor.getAssetsDir()
    const fs = await import('fs')
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
          localFile.fileName
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
   * Process Markov texts
   */
  private async processMarkovTexts(): Promise<void> {
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
    this.coverArtData = await TemplateProcessor.generateCoverArt(
      this.name,
      this.supabaseManager
    )
  }

  /**
   * Create database entries
   */
  private async createDatabaseEntries(): Promise<void> {
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
    GitOperations.commitAndPush(this.name, `feat: ${this.name}`, this.isTest)
  }

  /**
   * Update local development data
   */
  private async updateLocalData(): Promise<void> {
    await LocalDataManager.updateAllLocalData(
      this.movedFiles,
      this.supabaseTexts,
      this.name,
      this.coverArtData?.buffer || null,
      this.supabaseManager.client
    )
  }
}

export { InitOrchestrator }
