#!/usr/bin/env node

require('dotenv').config()

const { generateBlogPostText } = require('../src/utils/markov-generator')

async function testMarkovFlow() {
  console.log('🧪 Testing Markov Generator Flow')
  console.log('='.repeat(50))

  const testPostName = 'test-post-' + Date.now()

  try {
    console.log(`📝 Testing with post name: ${testPostName}`)
    console.log('\n🔄 Attempting to generate markov text...')

    // This will test the new Supabase-first logic
    const generatedText = await generateBlogPostText(testPostName, 3)

    console.log('✅ SUCCESS: Markov text generated!')
    console.log('\n📄 Generated text:')
    console.log('-'.repeat(30))
    console.log(generatedText)
    console.log('-'.repeat(30))

    // Test regeneration
    console.log('\n🔄 Testing regeneration...')
    const regeneratedText = await generateBlogPostText(testPostName, 2)

    console.log('✅ SUCCESS: Regeneration works!')
    console.log('\n📄 Regenerated text:')
    console.log('-'.repeat(30))
    console.log(regeneratedText)
    console.log('-'.repeat(30))

    console.log('\n🎉 All tests passed! Markov generator is working correctly.')
  } catch (error) {
    console.error('❌ ERROR: Markov generation failed')
    console.error('Error details:', error.message)

    if (error.message.includes('Supabase')) {
      console.log('\n💡 This might be a Supabase connection issue.')
      console.log('Check your environment variables and network connection.')
    }

    process.exit(1)
  }
}

// Run the test
testMarkovFlow().catch((error) => {
  console.error('Script failed:', error.message)
  process.exit(1)
})
