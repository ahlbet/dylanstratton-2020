const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error(
    'Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fetchMarkovTextsFromSupabase() {
  try {
    console.log('📥 Fetching all Markov texts from Supabase...')

    // Fetch all texts from the markov_texts table
    const { data: texts, error } = await supabase
      .from('markov_texts')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`)
    }

    if (!texts || texts.length === 0) {
      console.log('⚠️ No Markov texts found in Supabase')
      return
    }

    console.log(`📚 Found ${texts.length} Markov texts in Supabase`)

    // Transform the data to match the local format
    const transformedTexts = texts.map((text, index) => ({
      id: text.id,
      text_content: text.text_content,
      text_length: text.text_content ? text.text_content.length : 0,
      created_at: text.created_at,
      updated_at: text.updated_at,
    }))

    // Create the data structure
    const localData = {
      texts: transformedTexts,
      total_count: transformedTexts.length,
      last_updated: new Date().toISOString(),
    }

    // Ensure the directory exists
    const localDataDir = path.join(__dirname, '../public/local-data')
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true })
      console.log(`📁 Created directory: ${localDataDir}`)
    }

    // Backup existing file if it exists
    const localDataPath = path.join(localDataDir, 'markov-texts.json')
    if (fs.existsSync(localDataPath)) {
      const backupPath = localDataPath.replace(
        '.json',
        `.backup-${Date.now()}.json`
      )
      fs.copyFileSync(localDataPath, backupPath)
      console.log(`💾 Backed up existing file to: ${backupPath}`)
    }

    // Write the new data
    fs.writeFileSync(localDataPath, JSON.stringify(localData, null, 2))

    console.log(`✅ Successfully updated local Markov texts!`)
    console.log(`📊 Results:`)
    console.log(`   - Texts fetched from Supabase: ${texts.length}`)
    console.log(`   - Local file updated: ${localDataPath}`)
    console.log(
      `   - Total characters: ${transformedTexts.reduce((sum, text) => sum + text.text_length, 0)}`
    )

    // Show a few sample texts
    console.log(`\n📝 Sample texts:`)
    transformedTexts.slice(0, 3).forEach((text, index) => {
      console.log(
        `   ${index + 1}. "${text.text_content.substring(0, 100)}..."`
      )
    })
  } catch (error) {
    console.error('❌ Error fetching Markov texts from Supabase:', error)
    process.exit(1)
  }
}

// Export the function for use in other modules
module.exports = { fetchMarkovTextsFromSupabase }

// Run the script if this file is executed directly
if (require.main === module) {
  fetchMarkovTextsFromSupabase()
}
