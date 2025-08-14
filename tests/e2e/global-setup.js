/**
 * Global setup for Playwright e2e tests
 * This runs once before all tests
 */

async function globalSetup() {
  // Add any global setup here
  // For example:
  // - Set up test databases
  // - Configure test environment
  // - Set up authentication tokens
  
  console.log('Setting up global test environment...')
  
  // You can add environment variable setup here
  if (!process.env.E2E_BASE_URL) {
    process.env.E2E_BASE_URL = 'http://localhost:8000'
  }
  
  console.log(`E2E tests will run against: ${process.env.E2E_BASE_URL}`)
}

export default globalSetup
