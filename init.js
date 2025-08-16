#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config()

const {
  InitOrchestrator,
} = require('./src/utils/init-script/init-orchestrator')

const name = process.argv[2]
const description = process.argv[3] || ''

// Main function to handle the async operations
const main = async (nameParam, descriptionParam) => {
  try {
    const postName = nameParam || name
    const postDescription = descriptionParam || description
    const orchestrator = new InitOrchestrator(postName, postDescription)
    await orchestrator.run()
  } catch (error) {
    console.error('Script failed:', error.message)
    process.exit(1)
  }
}

// Export functions for testing
module.exports = { main }

// Run the main function only if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error.message)
    process.exit(1)
  })
}
