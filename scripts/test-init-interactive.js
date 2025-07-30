const { askQuestion, displayText, editText } = require('../init.js')

async function testInteractiveFunctions() {
  console.log('🧪 Testing interactive functions...')

  // Test displayText
  console.log('\n1. Testing displayText:')
  displayText('This is a test text for display formatting.', 'Test Display')

  // Test askQuestion
  console.log('\n2. Testing askQuestion:')
  const answer = await askQuestion('Enter "test" to continue: ')
  console.log(`You entered: "${answer}"`)

  // Test editText
  console.log('\n3. Testing editText:')
  const originalText = 'This is the original test text.'
  const editedText = await editText(originalText, 1)
  console.log(`Original: "${originalText}"`)
  console.log(`Edited: "${editedText}"`)

  console.log('\n✅ All tests completed!')
}

// Run the test
testInteractiveFunctions().catch(console.error)
