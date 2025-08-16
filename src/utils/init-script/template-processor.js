const fs = require('fs')
const path = require('path')
const { transformDate } = require('../date-utils')
const { generateCoverArt } = require('../cover-art-generator')

/**
 * Manages template processing and file operations for the init script
 */
class TemplateProcessor {
  /**
   * Read template content from file
   * @param {string} templatePath - Path to template file
   * @param {boolean} isTest - Whether running in test mode
   * @returns {string} Template content
   * @throws {Error} If template file cannot be read
   */
  static readTemplate(templatePath, isTest = false) {
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
   * @param {string} template - Template content
   * @param {Object} replacements - Object containing replacement values
   * @returns {string} Processed template
   */
  static processTemplate(template, replacements) {
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
   * @param {string} name - Name of the blog post
   * @param {string} content - Processed template content
   * @returns {string} Path to created file
   */
  static createBlogPost(name, content) {
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
   * @param {string} postName - Name of the blog post
   * @param {Object} supabaseManager - Supabase manager instance
   * @returns {Promise<Object>} Object containing cover art URL and buffer
   */
  static async generateCoverArt(postName, supabaseManager) {
    try {
      console.log('Generating cover art for blog post...')
      const coverArtBuffer = await generateCoverArt(postName, 2500)

      const { sanitizeFilename } = require('./audio-processor')
      const sanitizedName = sanitizeFilename(postName)
      const coverArtFileName = `${sanitizedName}.png`

      // Upload cover art to Supabase
      const coverArtUrl = await supabaseManager.uploadToStorage(
        coverArtBuffer,
        coverArtFileName,
        'cover-art',
        'image/png'
      )

      // Add cache-busting parameter to ensure fresh images
      const finalUrl = coverArtUrl + `?v=${Date.now()}`

      console.log(`Generated and uploaded cover art: ${coverArtFileName}`)

      return {
        url: finalUrl,
        buffer: coverArtBuffer,
        path: `cover-art/${coverArtFileName}`,
      }
    } catch (error) {
      console.error('Failed to generate cover art:', error.message)
      // Cover art is optional, continue without it
      return {
        url: '',
        buffer: null,
        path: null,
      }
    }
  }

  /**
   * Generate audio files content for template
   * @param {Array} movedFiles - Array of uploaded audio files
   * @returns {string} Formatted audio files content
   */
  static generateAudioFilesContent(movedFiles) {
    if (!movedFiles || movedFiles.length === 0) {
      return ''
    }

    return movedFiles.map((file) => `\`audio: ${file.url}\``).join('\n\n')
  }

  /**
   * Get template path
   * @returns {string} Path to template file
   */
  static getTemplatePath() {
    return path.join(process.cwd(), 'src', 'template.md')
  }

  /**
   * Get blog post directory path
   * @param {string} name - Name of the blog post
   * @returns {string} Path to blog post directory
   */
  static getBlogPostDir(name) {
    return path.join(process.cwd(), 'content', 'blog', name)
  }

  /**
   * Get blog post file path
   * @param {string} name - Name of the blog post
   * @returns {string} Path to blog post file
   */
  static getBlogPostFile(name) {
    const dir = this.getBlogPostDir(name)
    return path.join(dir, `${name}.md`)
  }

  /**
   * Get assets directory path
   * @returns {string} Path to assets directory
   */
  static getAssetsDir() {
    return path.join(process.cwd(), 'content', 'assets', 'music')
  }
}

module.exports = { TemplateProcessor }
