const fs = require('fs')
const path = require('path')

// Test the local update functions from init.js
async function testInitLocalUpdate() {
  console.log('🧪 Testing init.js local update functions...\n')

  try {
    // Test 1: Check if updateLocalAudioFiles function exists
    const initPath = path.join(__dirname, '../init.js')
    const initContent = fs.readFileSync(initPath, 'utf8')

    if (initContent.includes('updateLocalAudioFiles')) {
      console.log('✅ updateLocalAudioFiles function found')
    } else {
      console.log('❌ updateLocalAudioFiles function not found')
    }

    if (initContent.includes('updateLocalMarkovTexts')) {
      console.log('✅ updateLocalMarkovTexts function found')
    } else {
      console.log('❌ updateLocalMarkovTexts function not found')
    }

    if (initContent.includes('updateLocalCoverArt')) {
      console.log('✅ updateLocalCoverArt function found')
    } else {
      console.log('❌ updateLocalCoverArt function not found')
    }

    // Test 2: Check if the development mode check is in place
    if (initContent.includes("process.env.NODE_ENV === 'development'")) {
      console.log('✅ Development mode check found')
    } else {
      console.log('❌ Development mode check not found')
    }

    // Test 3: Check if local directories exist
    const localAudioDir = path.join(__dirname, '../static/local-audio')
    const localDataDir = path.join(__dirname, '../static/local-data')
    const localCoverArtDir = path.join(__dirname, '../static/local-cover-art')

    if (fs.existsSync(localAudioDir)) {
      console.log('✅ Local audio directory exists')
    } else {
      console.log('❌ Local audio directory missing')
    }

    if (fs.existsSync(localDataDir)) {
      console.log('✅ Local data directory exists')
    } else {
      console.log('❌ Local data directory missing')
    }

    if (fs.existsSync(localCoverArtDir)) {
      console.log('✅ Local cover art directory exists')
    } else {
      console.log('❌ Local cover art directory missing')
    }

    // Test 4: Check if markov-texts.json exists and is valid JSON
    const markovTextsPath = path.join(localDataDir, 'markov-texts.json')
    if (fs.existsSync(markovTextsPath)) {
      try {
        const content = fs.readFileSync(markovTextsPath, 'utf8')
        const data = JSON.parse(content)
        if (data.texts && Array.isArray(data.texts)) {
          console.log(
            `✅ Markov texts JSON is valid (${data.texts.length} texts)`
          )
        } else {
          console.log('❌ Markov texts JSON has invalid structure')
        }
      } catch (error) {
        console.log('❌ Markov texts JSON is not valid JSON')
      }
    } else {
      console.log('❌ Markov texts JSON file missing')
    }

    console.log('\n' + '='.repeat(50))
    console.log('🎉 Init.js local update functions test complete!')
    console.log('\n📋 To test with actual data:')
    console.log('1. Set NODE_ENV=development')
    console.log('2. Run: yarn new-day <post-name>')
    console.log('3. Check that new files appear in local directories')
    console.log('='.repeat(50))
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testInitLocalUpdate().catch(console.error)
