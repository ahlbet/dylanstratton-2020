/**
 * Extract audio URLs from processed HTML content
 * This function looks for both:
 * 1. HTML <audio> elements with src attributes (processed by gatsby-remark-audio)
 * 2. Code blocks containing audio: URLs (in case they weren't processed)
 * @param {string} html - The processed HTML content from markdown
 * @returns {string[]} - Array of audio URLs
 */
export const extractAudioUrls = (html: string): string[] => {
  const audioUrls: string[] = []

  if (!html || typeof html !== 'string') {
    return audioUrls
  }

  // Method 1: Extract from <audio> elements (processed by gatsby-remark-audio)
  // Handle both quoted and unquoted src attributes, including fragments
  const audioElementRegex =
    /<audio[^>]+src=(?:["']([^"']+)["']|([^\s>]+))[^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = audioElementRegex.exec(html)) !== null) {
    const url = match[1] || match[2] // match[1] for quoted, match[2] for unquoted
    if (url && !audioUrls.includes(url)) {
      audioUrls.push(url)
    }
  }

  // Method 2: Extract from code blocks containing `audio: URL`
  // This handles cases where gatsby-remark-audio might not have processed them
  const codeAudioRegex = /<code[^>]*>audio:\s*([^<]+)<\/code>/gi
  while ((match = codeAudioRegex.exec(html)) !== null) {
    const url = match[1].trim()
    if (url && !audioUrls.includes(url)) {
      audioUrls.push(url)
    }
  }

  // Method 3: Extract from plain text patterns (backup method)
  const plainAudioRegex = /`audio:\s*(https?:\/\/[^\s`]+)`/gi
  while ((match = plainAudioRegex.exec(html)) !== null) {
    const url = match[1].trim()
    if (url && !audioUrls.includes(url)) {
      audioUrls.push(url)
    }
  }

  // Filter and validate URLs
  return audioUrls.filter((url: string) => {
    try {
      const parsedUrl = new URL(url)
      // Only allow HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return false
      }
      // Check if it's likely an audio file
      return url.match(/\.(wav|mp3|ogg|m4a|aac|flac)(\?|#|$)/i)
    } catch {
      return false
    }
  })
}

/**
 * Remove audio elements from HTML content
 * This prevents duplicate audio players from showing
 * @param {string} html - The HTML content
 * @returns {string} - HTML with audio elements removed
 */
export const removeAudioFromHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return html
  }

  // Handle whitespace-only input
  if (html.trim() === '') {
    return ''
  }

  const result = html
    // Remove paragraph elements containing audio elements (from gatsby-remark-audio)
    .replace(/<p[^>]*>\s*<audio[^>]*>.*?<\/audio>\s*<\/p>/gi, '')
    // Remove <audio> elements (fallback)
    .replace(/<audio[^>]*>.*?<\/audio>/gi, '')
    // Remove code blocks with audio: URLs
    .replace(/<code[^>]*>audio:[^<]*<\/code>/gi, '')
    // Remove paragraph elements that only contain audio code blocks
    .replace(/<p[^>]*>\s*<code[^>]*>audio:[^<]*<\/code>\s*<\/p>/gi, '')
    // Clean up any double line breaks or empty paragraphs
    .replace(/<p[^>]*>\s*<\/p>/gi, '')
    .replace(/\n\s*\n/g, '\n')

  // Only trim if we actually made changes to avoid modifying content unnecessarily
  const hasChanges = result !== html
  return hasChanges ? result.trim() : html
}

export default { extractAudioUrls, removeAudioFromHtml }
