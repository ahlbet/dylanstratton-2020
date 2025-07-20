const fs = require('fs')
const path = require('path')

class MarkovGenerator {
  constructor(order = 5) {
    this.order = order
    this.ngrams = {}
    this.beginnings = []
    this.lines = []
  }

  async loadTextFromFile(filePath) {
    try {
      const text = fs.readFileSync(filePath, 'utf8')
      this.lines = text.split('\n').filter((line) => line.trim().length > 0)
      this.buildNgrams()
      return true
    } catch (error) {
      console.error('Error loading text file:', error.message)
      return false
    }
  }

  loadTextFromArray(textArray) {
    this.lines = textArray.filter((line) => line.trim().length > 0)
    this.buildNgrams()
  }

  buildNgrams() {
    this.ngrams = {}
    this.beginnings = []

    for (let j = 0; j < this.lines.length; j++) {
      let txt = this.lines[j]
      for (let i = 0; i <= txt.length - this.order; i++) {
        let gram = txt.substring(i, i + this.order)
        if (i == 0) {
          this.beginnings.push(gram)
        }

        if (!this.ngrams[gram]) {
          this.ngrams[gram] = []
        }
        this.ngrams[gram].push(txt.charAt(i + this.order))
      }
    }
  }

  generateText(maxLength = 1000) {
    if (this.beginnings.length === 0) {
      return null
    }

    let currentGram =
      this.beginnings[Math.floor(Math.random() * this.beginnings.length)]
    let result = currentGram

    for (let i = 0; i < maxLength; i++) {
      let possibilities = this.ngrams[currentGram]
      if (!possibilities) {
        break
      }
      let next = possibilities[Math.floor(Math.random() * possibilities.length)]
      result += next
      let len = result.length
      currentGram = result.substring(len - this.order, len)
    }

    return result
  }

  generateMultipleLines(count = 5, maxLength = 1000) {
    const lines = []
    for (let i = 0; i < count; i++) {
      const generated = this.generateText(maxLength)
      if (generated) {
        lines.push(generated)
      }
    }
    return lines
  }
}

// Helper function to generate text for blog posts
async function generateBlogPostText(postName, linesCount = 5) {
  const generator = new MarkovGenerator(5)

  // Try to load the 448.txt file
  const textFilePath = path.join(process.cwd(), 'static', '448.txt')
  const success = await generator.loadTextFromFile(textFilePath)

  if (!success) {
    // Fallback to sample text if file not found
    const fallbackText = [
      'The quick brown fox jumps over the lazy dog.',
      'A journey of a thousand miles begins with a single step.',
      'All that glitters is not gold.',
      'Actions speak louder than words.',
      'Beauty is in the eye of the beholder.',
      'Every cloud has a silver lining.',
      'Time heals all wounds.',
      'Actions speak louder than words.',
      'The early bird catches the worm.',
      "Don't judge a book by its cover.",
    ]
    generator.loadTextFromArray(fallbackText)
  }

  const generatedLines = generator.generateMultipleLines(linesCount)

  // Format the generated text for markdown
  const markdownText = generatedLines.map((line) => `> ${line}`).join('\n\n')

  return markdownText
}

module.exports = { MarkovGenerator, generateBlogPostText }
