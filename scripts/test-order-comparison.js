#!/usr/bin/env node

/**
 * Script to compare different Markov chain orders
 * Shows how coherence changes with different n-gram orders
 */

require('dotenv').config()
const { MarkovGenerator } = require('../src/utils/markov-generator')

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

async function compareOrders() {
  console.log(colorize('🔄 Markov Chain Order Comparison', 'bright'))
  console.log(colorize('='.repeat(60), 'yellow'))
  console.log('')

  const orders = [3, 5, 7, 9]

  for (const order of orders) {
    console.log(
      colorize(
        `📝 Order ${order} (looks at ${order} characters to predict next)`,
        'cyan'
      )
    )
    console.log(colorize('-'.repeat(50), 'yellow'))

    const generator = new MarkovGenerator(order)
    console.log('Loading corpus...')
    const success = await generator.loadTextFromSupabase('markov-text')

    if (!success) {
      console.log('❌ Failed to load corpus')
      continue
    }

    // Generate 3 samples for this order
    for (let i = 1; i <= 3; i++) {
      const text = generator.generateText(800, 3) // 800 chars max, 3 sentences max
      console.log(colorize(`Sample ${i}:`, 'green'))
      console.log(`"${text}"`)
      console.log('')
    }

    console.log('')
  }

  console.log(colorize('📊 Analysis:', 'bright'))
  console.log(
    colorize('Order 3:', 'yellow') +
      ' More random, less coherent, higher variety'
  )
  console.log(
    colorize('Order 5:', 'yellow') +
      ' Good balance of coherence and creativity (current)'
  )
  console.log(
    colorize('Order 7:', 'yellow') +
      ' More coherent, follows source patterns closely'
  )
  console.log(
    colorize('Order 9:', 'yellow') + ' Very coherent, may be repetitive'
  )
  console.log('')
  console.log(
    colorize('💡 Sweet spot for your corpus size: Order 6-8', 'green')
  )
}

// Run the comparison
if (require.main === module) {
  compareOrders().catch((error) => {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  })
}
