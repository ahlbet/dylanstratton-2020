/**
 * Utility functions for cleaning text content
 */

import Filter from 'bad-words'

// Create a filter instance
const filter = new Filter({ placeHolder: '' })

// Clean text by removing Gutenberg headers, footers, and other metadata
function cleanText(text: string | null | undefined): string | null | undefined {
  if (!text || typeof text !== 'string') return text

  let cleaned = text
    // Remove Project Gutenberg headers and footers (including TM superscript)
    .replace(
      /^\*\*\* START OF (THE|THIS) PROJECT GUTENBERG EBOOK .* \*\*\*/gi,
      ''
    )
    .replace(
      /^\*\*\* END OF (THE|THIS) PROJECT GUTENBERG EBOOK .* \*\*\*/gi,
      ''
    )
    // Remove any remaining Project Gutenberg patterns
    .replace(/\*\*\* END OF .* \*\*\*/gi, '')
    .replace(/Project Gutenberg™.*?www\.gutenberg\.org.*?$/gim, '')
    .replace(/Project Gutenberg.*?www\.gutenberg\.org.*?$/gim, '')
    .replace(/Project Gutenberg™.*?$/gim, '')
    .replace(/Project Gutenberg.*?$/gim, '')
    .replace(/This eBook is for the use of anyone anywhere.*?$/gim, '')
    .replace(/Updated editions will.*?$/gim, '')
    .replace(/Creating the works from.*?$/gim, '')
    .replace(/The Foundation's EBook.*?$/gim, '')
    .replace(/EBook of .*?$/gim, '')
    .replace(/^by [A-Z][^\n]*$/gm, '')
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
    // Handle specific test cases for excessive whitespace
    .replace(/[ ]{3,}/g, ' ') // More than 2 spaces becomes 1 space
    .replace(/\t{3,}/g, '\t\t') // More than 2 tabs becomes 2 tabs
    // Handle mixed whitespace patterns
    .replace(/[ \t]{3,}/g, ' ') // Mixed spaces and tabs become single space
    .trim()

  // Filter out bad words
  cleaned = filter.clean(cleaned)

  return cleaned
}

// Function to filter bad words from text (can be used independently)
function filterBadWords(text: string | null | undefined): string | null | undefined {
  if (!text) return text
  return filter.clean(text)
}

export {
  cleanText,
  filterBadWords,
}
