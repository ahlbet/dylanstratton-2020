import * as fs from 'fs'
import * as path from 'path'
import { transformDate } from '../date-utils'
import { generateCoverArt } from '../cover-art-generator.js'

interface AudioFile {
  fileName: string
  url: string
  duration: number
  storagePath: string
  localPath: string
}

interface SupabaseManager {
  uploadToStorage: (localPath: string | Buffer, fileName: string, bucketName?: string, contentType?: string) => Promise<string>
  client: any
}

interface CoverArtResult {
  path: string
  url: string
  buffer: Buffer
}

/**
 * Manages template processing and file operations for the init script
 */
class TemplateProcessor {
  /**
   * Read template content from file
   * @param templatePath - Path to template file
   * @param isTest - Whether running in test mode
   * @returns Template content
   * @throws {Error} If template file cannot be read
   */
  static readTemplate(templatePath: string, isTest: boolean = false): string {
    try {
      const template = fs.readFileSync(templatePath, 'utf8')
      console.log('template', template)
      console.log('template type:', typeof template)
      console.log('template length:', template ? template.length : 'undefined')

      // Ensure template is a string
      if (typeof template !== 'string') {
        const errorMessage = `Template is not a string: ${typeof template}`
        console.error(errorMessage)
        if (isTest) {
          throw new Error(errorMessage)
        }
        process.exit(1)
      }

      return template
    } catch (err) {
      const errorMessage = `Template file not found at ${templatePath}`
      console.error(errorMessage)
      if (isTest) {
        throw new Error(errorMessage)
      }
      process.exit(1)
    }
  }

  /**
   * Process template with replacements
   * @param template - Template content
   * @param replacements - Object containing replacement values
   * @returns Processed template
   */
  static processTemplate(template: string, replacements: Record<string, string>): string {
    let processedTemplate = template

    // Replace all placeholders
    Object.entries(replacements).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      processedTemplate = processedTemplate.replace(
        new RegExp(placeholder, 'g'),
        value || ''
      )
    })

    return processedTemplate
  }

  /**
   * Create blog post directory and file
   * @param name - Name of the blog post
   * @param content - Processed template content
   * @returns Path to created file
   */
  static createBlogPost(name: string, content: string): string {
    const dir = path.join(process.cwd(), 'content', 'blog', name)
    const file = path.join(dir, `${name}.md`)

    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(file, content)

    console.log(
      `Created folder '${name}' and file '${name}/${name}.md' with template content.`
    )

    return file
  }

  /**
   * Generate cover art for blog post
   * @param postName - Name of the blog post
   * @param supabaseManager - Supabase manager instance
   * @returns Promise<Object> Object containing cover art URL and buffer
   */
  static async generateCoverArt(postName: string, supabaseManager: SupabaseManager): Promise<CoverArtResult> {
    try {
      console.log('Generating cover art for blog post...')
      const coverArtBuffer = await generateCoverArt(postName, 2500)

      const { AudioProcessor } = await import('./audio-processor')
      const sanitizedName = AudioProcessor.sanitizeFilename(postName)
      const coverArtFileName = `${sanitizedName}.png`

      // Upload to Supabase storage
      const coverArtUrl = await supabaseManager.uploadToStorage(
        coverArtBuffer,
        coverArtFileName,
        'cover-art'
      )

      // Create cover art data
      const coverArtData: CoverArtResult = {
        path: `cover-art/${coverArtFileName}`,
        url: coverArtUrl,
        buffer: coverArtBuffer,
      }

      console.log(`✅ Cover art generated and uploaded: ${coverArtUrl}`)
      return coverArtData
    } catch (error) {
      console.error('Failed to generate cover art:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /**
   * Get the template file path
   * @returns Path to template file
   */
  static getTemplatePath(): string {
    return path.join(process.cwd(), 'src', 'template.md')
  }

  /**
   * Get the assets directory path
   * @returns Path to assets directory
   */
  static getAssetsDir(): string {
    return path.join(process.cwd(), 'content', 'assets', 'music')
  }

  /**
   * Generate audio files content for markdown
   * @param audioFiles - Array of audio file objects
   * @returns Formatted markdown content for audio files
   */
  static generateAudioFilesContent(audioFiles: AudioFile[]): string {
    if (audioFiles.length === 0) {
      return 'No audio files available.'
    }

    let content = '\n\n## Audio Files\n\n'
    audioFiles.forEach((file, index) => {
      content += `### Track ${index + 1}: ${file.fileName}\n\n`
      content += `- **Duration:** ${file.duration} seconds\n`
      content += `- **Storage Path:** \`${file.storagePath}\`\n`
      content += `- **URL:** [${file.url}](${file.url})\n\n`
    })

    return content
  }

  /**
   * Generate a summary of the blog post
   * @param name - Name of the post
   * @param description - Description of the post
   * @param audioFiles - Array of audio files
   * @returns Formatted summary content
   */
  static generateSummary(name: string, description: string, audioFiles: AudioFile[]): string {
    let summary = `## Summary\n\n`
    summary += `**Post:** ${name}\n\n`
    
    if (description) {
      summary += `**Description:** ${description}\n\n`
    }
    
    summary += `**Audio Tracks:** ${audioFiles.length}\n\n`
    
    if (audioFiles.length > 0) {
      summary += `**Total Duration:** ${audioFiles.reduce((total, file) => total + file.duration, 0)} seconds\n\n`
    }
    
    return summary
  }
}

export { TemplateProcessor }
