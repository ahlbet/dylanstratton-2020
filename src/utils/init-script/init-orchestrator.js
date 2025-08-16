const path = require('path')
const { transformDate } = require('../date-utils')
const { getAudioPlayer } = require('../audio-tools')
const { GitOperations } = require('./git-operations')
const { UserInteraction } = require('./user-interaction')
const { AudioProcessor } = require('./audio-processor')
const { SupabaseManager } = require('./supabase-manager')
const { MarkovManager } = require('./markov-manager')
const { LocalDataManager } = require('./local-data-manager')
const { TemplateProcessor } = require('./template-processor')

/**
 * Main orchestrator for the init script
 */
class InitOrchestrator {
  constructor(name, description = '') {
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
  }

  /**
   * Run the complete initialization process
   */
  async run() {
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
      console.error('❌ Initialization failed:', error.message)
      throw error
    } finally {
      // Always close user interaction
      this.userInteraction.close()
    }
  }

  /**
   * Validate input parameters
   */
  validateInput() {
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
  async initializeGit() {
    GitOperations.checkoutOrCreateBranch(this.name, this.isTest)
  }

  /**
   * Process audio files
   */
  async processAudioFiles() {
    // Find audio files
    const audioData = AudioProcessor.findAudioFiles(this.name)
    this.localPlaybackFiles = audioData.localPlaybackFiles

    // Ensure assets directory exists
    const destDir = TemplateProcessor.getAssetsDir()
    require('fs').mkdirSync(destDir, { recursive: true })

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
        console.error(`Failed to upload ${localFile.fileName}:`, error.message)
      }
    }
  }

  /**
   * Process Markov texts
   */
  async processMarkovTexts() {
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
  async generateCoverArt() {
    this.coverArtData = await TemplateProcessor.generateCoverArt(
      this.name,
      this.supabaseManager
    )
  }

  /**
   * Create database entries
   */
  async createDatabaseEntries() {
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
  async createDailyAudioEntries() {
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
          error.message
        )
      }
    }
  }

  /**
   * Upload Markov texts to database
   */
  async uploadMarkovTexts() {
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
  async createBlogPost() {
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
  async pushToGit() {
    GitOperations.commitAndPush(this.name, `feat: ${this.name}`, this.isTest)
  }

  /**
   * Update local development data
   */
  async updateLocalData() {
    await LocalDataManager.updateAllLocalData(
      this.movedFiles,
      this.supabaseTexts,
      this.name,
      this.coverArtData?.buffer || null,
      this.supabaseManager.client
    )
  }
}

module.exports = { InitOrchestrator }
