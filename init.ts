#!/usr/bin/env node

import * as dotenv from 'dotenv'
import { InitOrchestrator } from './src/utils/init-script/init-orchestrator'

// Load environment variables
dotenv.config()

/**
 * Main entry point for the init script
 */
async function main(): Promise<void> {
  try {
    // Get command line arguments
    const args = process.argv.slice(2)
    
    if (args.length === 0) {
      console.log('Usage: node init.js <name> [description]')
      console.log('Example: node init.js 25dec01 "December 1st, 2025"')
      process.exit(1)
    }

    const name = args[0]
    const description = args[1] || ''

    // Validate name format
    if (!isValidNameFormat(name)) {
      console.error('Invalid name format. Expected format like "25may05" or "24jun19"')
      process.exit(1)
    }

    console.log(`🚀 Starting initialization for: ${name}`)
    if (description) {
      console.log(`📝 Description: ${description}`)
    }

    // Create and run orchestrator
    const orchestrator = new InitOrchestrator(name, description)
    await orchestrator.run()

    console.log('🎉 All done! Your blog post has been created successfully.')
    console.log(`📁 Check the content/blog/${name} directory for your new post.`)
    console.log(`🌐 Don't forget to commit and push your changes!`)

  } catch (error) {
    console.error('❌ Script failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

/**
 * Validate if a name follows the expected format
 * @param name - The name to validate
 * @returns True if valid format
 */
function isValidNameFormat(name: string): boolean {
  return /^(\d{2})([a-z]{3})(\d{2})$/i.test(name)
}

/**
 * Handle process termination gracefully
 */
process.on('SIGINT', () => {
  console.log('\n⚠️  Process interrupted by user')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n⚠️  Process terminated')
  process.exit(0)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error in main:', error)
    process.exit(1)
  })
}

export { main, isValidNameFormat }
