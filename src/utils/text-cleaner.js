/**
 * Utility functions for cleaning text content
 */

// Clean text by removing Gutenberg headers, footers, and other metadata
function cleanText(text) {
  return (
    text
      // Remove Project Gutenberg headers and footers (including TM superscript)
      .replace(
        /^\*\*\* START OF (THE|THIS) PROJECT GUTENBERG EBOOK .* \*\*\*/gi,
        ''
      )
      .replace(
        /^\*\*\* END OF (THE|THIS) PROJECT GUTENBERG EBOOK .* \*\*\*/gi,
        ''
      )
      .replace(/Project Gutenberg™.*?www\.gutenberg\.org.*?$/gim, '')
      .replace(/Project Gutenberg.*?www\.gutenberg\.org.*?$/gim, '')
      .replace(/Project Gutenberg™.*?$/gim, '')
      .replace(/Project Gutenberg.*?$/gim, '')
      .replace(/This eBook is for the use of anyone anywhere.*?$/gim, '')
      .replace(/Updated editions will.*?$/gim, '')
      .replace(/Creating the works from.*?$/gim, '')
      .replace(/The Foundation's EBook.*?$/gim, '')
      .replace(/EBook of .*?$/gim, '')
      .replace(/by .*?$/gim, '')
      .replace(/Transcriber's Note:.*?$/gim, '')
      .replace(/Produced by .*?$/gim, '')
      // Remove common metadata patterns
      .replace(/^Title:.*$/gim, '')
      .replace(/^Author:.*$/gim, '')
      .replace(/^Release Date:.*$/gim, '')
      .replace(/^Language:.*$/gim, '')
      .replace(/^Character set encoding:.*$/gim, '')
      .replace(/^\*\*\* START OF .* \*\*\*/gi, '')
      .replace(/^\*\*\* END OF .* \*\*\*/gi, '')
      // Remove specific Gutenberg patterns with TM
      .replace(/Project Gutenberg™/gi, '')
      .replace(/Gutenberg™/gi, '')
      .replace(/™/g, '') // Remove any remaining TM symbols
      // Remove empty lines and normalize whitespace
      .replace(/\n\s*\n/g, '\n')
      .replace(/^\s+|\s+$/gm, '')
      .trim()
  )
}

module.exports = {
  cleanText,
}
