// This script helps explore what GraphQL types are available
// Run this in the Gatsby context to see all available types

async function exploreGraphQLSchema() {
  console.log('🔍 Exploring available GraphQL types...')

  // Test different possible names for the markov texts table
  const possibleNames = [
    'allSupabaseMarkovTexts',
    'allSupabaseMarkov_texts',
    'allSupabaseMarkovText',
    'allSupabaseMarkov_text',
    'allSupabaseMarkovtexts',
    'allSupabaseMarkovtext',
  ]

  for (const typeName of possibleNames) {
    try {
      const result = await graphql(`{ ${typeName} { nodes { id } } }`)
      console.log(
        `✅ Found: ${typeName} (${result.data[typeName]?.nodes?.length || 0} nodes)`
      )
    } catch (error) {
      console.log(`❌ Not found: ${typeName}`)
    }
  }

  // Also test the other tables
  console.log('\n🔍 Testing known tables...')
  try {
    const result = await graphql(`
      {
        allSupabaseDaily {
          nodes {
            id
            title
          }
        }
        allSupabaseDailyAudio {
          nodes {
            id
            daily_id
          }
        }
      }
    `)
    console.log(
      '✅ Daily table:',
      result.data.allSupabaseDaily?.nodes?.length || 0,
      'entries'
    )
    console.log(
      '✅ DailyAudio table:',
      result.data.allSupabaseDailyAudio?.nodes?.length || 0,
      'entries'
    )
  } catch (error) {
    console.error('❌ Error querying known tables:', error.message)
  }
}

// This needs to be run in Gatsby context
if (typeof graphql !== 'undefined') {
  exploreGraphQLSchema()
} else {
  console.log(
    '⚠️ Run this in Gatsby context (add to gatsby-node.js temporarily)'
  )
}
