const fs = require('fs')
const path = require('path')

function testLocalDevelopmentSetup() {
  console.log('🧪 Testing Local Development Setup...\n')

  const tests = [
    {
      name: 'Local Audio Files',
      path: 'static/local-audio',
      type: 'directory',
      minFiles: 10,
    },
    {
      name: 'Local Cover Art',
      path: 'static/local-cover-art',
      type: 'directory',
      minFiles: 5,
    },
    {
      name: 'Markov Texts JSON',
      path: 'static/local-data/markov-texts.json',
      type: 'file',
      validate: (content) => {
        try {
          const data = JSON.parse(content)
          return (
            data.texts && Array.isArray(data.texts) && data.texts.length > 0
          )
        } catch (e) {
          return false
        }
      },
    },
    {
      name: 'Markov Source Text',
      path: 'static/local-data/markov-source.txt',
      type: 'file',
      validate: (content) => content.length > 1000,
    },
  ]

  let allPassed = true

  for (const test of tests) {
    console.log(`📋 Testing ${test.name}...`)

    const fullPath = path.join(process.cwd(), test.path)

    if (test.type === 'directory') {
      if (!fs.existsSync(fullPath)) {
        console.log(`❌ ${test.name}: Directory does not exist`)
        allPassed = false
        continue
      }

      const files = fs.readdirSync(fullPath)
      if (files.length < test.minFiles) {
        console.log(
          `❌ ${test.name}: Expected at least ${test.minFiles} files, found ${files.length}`
        )
        allPassed = false
      } else {
        console.log(`✅ ${test.name}: Found ${files.length} files`)
      }
    } else if (test.type === 'file') {
      if (!fs.existsSync(fullPath)) {
        console.log(`❌ ${test.name}: File does not exist`)
        allPassed = false
        continue
      }

      const content = fs.readFileSync(fullPath, 'utf8')
      if (test.validate && !test.validate(content)) {
        console.log(`❌ ${test.name}: File content validation failed`)
        allPassed = false
      } else {
        const size = (content.length / 1024).toFixed(1)
        console.log(`✅ ${test.name}: File exists (${size}KB)`)
      }
    }
  }

  console.log('\n' + '='.repeat(50))

  if (allPassed) {
    console.log('🎉 All tests passed! Local development setup is ready.')
    console.log('\n📋 Next steps:')
    console.log('1. Add USE_LOCAL_DATA=true to your .env file')
    console.log('2. Restart your development server: yarn start')
    console.log('3. Visit a blog post to test local audio and cover art')
  } else {
    console.log('❌ Some tests failed. Please run: yarn generate-local-data')
  }

  console.log('='.repeat(50))
}

testLocalDevelopmentSetup()
