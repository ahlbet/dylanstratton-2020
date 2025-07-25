const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

async function setupMarkovTextsTable() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('🗄️ Setting up markov_texts table...')

  try {
    // Create the table using direct SQL
    const { error } = await supabase.from('markov_texts').select('id').limit(1)

    if (error && error.message.includes('does not exist')) {
      console.log('📝 Table does not exist, creating it...')

      // You'll need to create this table manually in Supabase dashboard
      // or use the SQL editor with this query:
      console.log(`
        Run this SQL in your Supabase SQL editor:
        
        CREATE TABLE markov_texts (
          id SERIAL PRIMARY KEY,
          text_content TEXT NOT NULL,
          text_length INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'::jsonb
        );
        
        -- Create index for faster random selection
        CREATE INDEX idx_markov_texts_random ON markov_texts (id);
        
        -- Create index for text length if needed
        CREATE INDEX idx_markov_texts_length ON markov_texts (text_length);
      `)
    } else {
      console.log('✅ Table markov_texts already exists')
    }

    console.log('🎉 Table setup complete!')
    console.log(
      '📝 Next step: Run "node scripts/generate-markov-texts-db.js" to populate it with texts'
    )
  } catch (error) {
    console.error('❌ Error checking table:', error.message)
  }
}

setupMarkovTextsTable().catch(console.error)
