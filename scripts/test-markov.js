#!/usr/bin/env node

/**
 * Comprehensive Markov text generation testing script
 * Provides detailed testing and analysis of the text corpus
 */

require('dotenv').config()
const {
  MarkovGenerator,
  generateBlogPostText,
} = require('../src/utils/markov-generator')

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

// Test different generation parameters
async function testGenerationVariations() {
  console.log(colorize('\n🎭 Testing Different Generation Styles\n', 'cyan'))

  const generator = new MarkovGenerator(7)
  console.log('Loading corpus from Supabase...')
  const success = await generator.loadTextFromSupabase('markov-text')

  if (!success) {
    console.log(colorize('❌ Failed to load from Supabase', 'red'))
    return
  }

  console.log(
    colorize(`✅ Loaded corpus: ${generator.lines.length} lines`, 'green')
  )

  // Test different n-gram orders
  const orders = [3, 5, 7]
  for (const order of orders) {
    console.log(colorize(`\n📝 N-gram Order: ${order}`, 'yellow'))
    const testGen = new MarkovGenerator(order)
    await testGen.loadTextFromSupabase('markov-text')

    const text = testGen.generateText(200)
    console.log(colorize('Generated:', 'dim'))
    console.log(`"${text.substring(0, 150)}..."`)
  }
}

// Test multiple generations for variety
async function testVariety(count = 5) {
  console.log(colorize('\n🎲 Testing Generation Variety\n', 'cyan'))

  for (let i = 1; i <= count; i++) {
    console.log(colorize(`Sample ${i}:`, 'yellow'))
    const markovText = await generateBlogPostText(`test-${i}`, 2)
    console.log(markovText)
    console.log('')
  }
}

// Analyze the text corpus
async function analyzeCorpus() {
  console.log(colorize('\n📊 Corpus Analysis\n', 'cyan'))

  const generator = new MarkovGenerator(7)
  const success = await generator.loadTextFromSupabase('markov-text')

  if (!success) {
    console.log(colorize('❌ Failed to load corpus', 'red'))
    return
  }

  // Basic stats
  const totalLines = generator.lines.length
  const totalChars = generator.lines.join('').length
  const avgLineLength = Math.round(totalChars / totalLines)
  const ngramCount = Object.keys(generator.ngrams).length
  const beginningsCount = generator.beginnings.length

  console.log(colorize('Basic Statistics:', 'yellow'))
  console.log(`  📄 Total lines: ${totalLines.toLocaleString()}`)
  console.log(`  🔤 Total characters: ${totalChars.toLocaleString()}`)
  console.log(`  📏 Average line length: ${avgLineLength} characters`)
  console.log(`  🧩 Unique n-grams: ${ngramCount.toLocaleString()}`)
  console.log(`  🎯 Possible beginnings: ${beginningsCount.toLocaleString()}`)

  // Sample some beginnings
  console.log(colorize('\nSample Beginnings:', 'yellow'))
  for (let i = 0; i < Math.min(5, beginningsCount); i++) {
    const randomBeginning =
      generator.beginnings[Math.floor(Math.random() * beginningsCount)]
    console.log(`  "${randomBeginning}"`)
  }

  // Check n-gram diversity (safely handle large datasets)
  console.log(colorize('\nN-gram Diversity:', 'yellow'))
  let totalOptions = 0
  let maxNgramOptions = 0
  let sampleCount = 0

  // Sample n-grams instead of processing all (for large corpora)
  const ngramKeys = Object.keys(generator.ngrams)
  const sampleSize = Math.min(10000, ngramKeys.length) // Sample up to 10k n-grams

  for (let i = 0; i < sampleSize; i++) {
    const key = ngramKeys[Math.floor(Math.random() * ngramKeys.length)]
    const optionCount = generator.ngrams[key].length
    totalOptions += optionCount
    maxNgramOptions = Math.max(maxNgramOptions, optionCount)
    sampleCount++
  }

  const avgNgramOptions = Math.round(totalOptions / sampleCount)

  console.log(
    `  🔀 Average options per n-gram: ${avgNgramOptions} (sampled ${sampleCount.toLocaleString()})`
  )
  console.log(`  🎰 Maximum options for any n-gram: ${maxNgramOptions}`)
}

// Test specific scenarios
async function testScenarios() {
  console.log(colorize('\n🎯 Testing Specific Scenarios\n', 'cyan'))

  // Test blog post generation
  console.log(colorize('Blog Post Generation (5 lines):', 'yellow'))
  const blogText = await generateBlogPostText('test-blog', 5)
  console.log(blogText)

  // Test shorter generation
  console.log(colorize('\nShort Generation (1 line):', 'yellow'))
  const shortText = await generateBlogPostText('test-short', 1)
  console.log(shortText)

  // Test longer generation
  console.log(colorize('\nLong Generation (10 lines):', 'yellow'))
  const longText = await generateBlogPostText('test-long', 10)
  console.log(longText)
}

// Performance test
async function testPerformance() {
  console.log(colorize('\n⚡ Performance Test\n', 'cyan'))

  const iterations = 10
  const start = Date.now()

  for (let i = 0; i < iterations; i++) {
    await generateBlogPostText(`perf-test-${i}`, 3)
  }

  const end = Date.now()
  const avgTime = (end - start) / iterations

  console.log(colorize('Results:', 'yellow'))
  console.log(`  ⏱️  Average generation time: ${avgTime.toFixed(2)}ms`)
  console.log(`  🚀 Generations per second: ${(1000 / avgTime).toFixed(2)}`)
}

// Main function
async function main() {
  const command = process.argv[2] || 'all'

  console.log(colorize('🔮 Advanced Markov Text Testing', 'bright'))
  console.log(colorize('='.repeat(50), 'dim'))

  try {
    switch (command) {
      case 'variations':
      case 'var':
        await testGenerationVariations()
        break

      case 'variety':
        const count = parseInt(process.argv[3]) || 5
        await testVariety(count)
        break

      case 'analyze':
      case 'stats':
        await analyzeCorpus()
        break

      case 'scenarios':
        await testScenarios()
        break

      case 'performance':
      case 'perf':
        await testPerformance()
        break

      case 'all':
      default:
        await analyzeCorpus()
        await testVariety(3)
        await testGenerationVariations()
        await testPerformance()
        break
    }

    console.log(colorize('\n✅ Testing complete!', 'green'))
  } catch (error) {
    console.log(colorize(`\n❌ Error during testing: ${error.message}`, 'red'))
    process.exit(1)
  }
}

// Help function
function showHelp() {
  console.log(colorize('🔮 Advanced Markov Text Testing', 'bright'))
  console.log('')
  console.log('Usage: node scripts/test-markov.js [command]')
  console.log('')
  console.log(colorize('Commands:', 'yellow'))
  console.log('  all          - Run all tests (default)')
  console.log('  analyze      - Analyze the text corpus')
  console.log(
    '  variety [n]  - Test generation variety (n samples, default: 5)'
  )
  console.log('  variations   - Test different n-gram orders')
  console.log('  scenarios    - Test specific use cases')
  console.log('  performance  - Run performance benchmarks')
  console.log('')
  console.log(colorize('Examples:', 'cyan'))
  console.log('  node scripts/test-markov.js')
  console.log('  node scripts/test-markov.js analyze')
  console.log('  node scripts/test-markov.js variety 10')
  console.log('  node scripts/test-markov.js performance')
}

// Run the script
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp()
  } else {
    main().catch((error) => {
      console.error(colorize(`❌ Script failed: ${error.message}`, 'red'))
      process.exit(1)
    })
  }
}

module.exports = {
  testGenerationVariations,
  testVariety,
  analyzeCorpus,
  testScenarios,
  testPerformance,
}
