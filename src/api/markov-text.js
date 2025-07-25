const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Load environment variables - works for both local development and Netlify
function loadEnvironmentVariables() {
  // In Netlify, environment variables are directly available in process.env
  // In local development, we need to load from .env file
  if (process.env.NODE_ENV === 'production') {
    // Production (Netlify) - use process.env directly
    return {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    }
  } else {
    // Development - load from .env file
    const envPath = path.resolve(__dirname, '../../.env')

    require('dotenv').config({ path: envPath, override: true })

    // Try alternative path if first one doesn't work
    if (!process.env.SUPABASE_URL) {
      const altEnvPath = path.resolve(process.cwd(), '.env')
      require('dotenv').config({ path: altEnvPath, override: true })
    }

    // Manual parsing as fallback
    let manualEnvVars = {}
    try {
      const fs = require('fs')
      const envContent = fs.readFileSync(envPath, 'utf8')
      const lines = envContent
        .split('\n')
        .filter((line) => line.trim() && !line.startsWith('#'))

      for (const line of lines) {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim()
          manualEnvVars[key.trim()] = value
        }
      }
    } catch (error) {
      console.error('❌ Error manually parsing .env:', error.message)
    }

    return {
      SUPABASE_URL: process.env.SUPABASE_URL || manualEnvVars.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY:
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        manualEnvVars.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_ANON_KEY:
        process.env.SUPABASE_ANON_KEY || manualEnvVars.SUPABASE_ANON_KEY,
    }
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Load environment variables
  const env = loadEnvironmentVariables()

  // Check if required environment variables are set
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ API: Missing required Supabase environment variables')
    return res.status(500).json({
      error: 'Server configuration error - missing Supabase credentials',
    })
  }

  try {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Get total count first
    const { count, error: countError } = await supabase
      .from('markov_texts')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ API: Failed to get count:', countError.message)
      return res.status(500).json({ error: 'Failed to get text count' })
    }

    if (!count || count === 0) {
      return res.status(500).json({ error: 'No texts available' })
    }

    // Get query parameter for number of texts (default 20)
    const numTexts = parseInt(req.query.count) || 20
    const maxTexts = Math.min(numTexts, 50) // Cap at 50 for performance

    console.log(`🎲 Fetching ${maxTexts} random texts from ${count} total`)

    // Get multiple random texts using random offsets
    const randomTexts = []
    const usedOffsets = new Set()

    for (let i = 0; i < maxTexts; i++) {
      let randomOffset
      do {
        randomOffset = Math.floor(Math.random() * count)
      } while (usedOffsets.has(randomOffset))

      usedOffsets.add(randomOffset)

      const { data: texts, error: textError } = await supabase
        .from('markov_texts')
        .select('id, text_content, text_length, created_at')
        .range(randomOffset, randomOffset)

      if (textError) {
        console.error('❌ API: Failed to load text:', textError.message)
        continue
      }

      if (texts && texts.length > 0) {
        randomTexts.push({
          id: texts[0].id,
          text: texts[0].text_content,
          length: texts[0].text_length,
          createdAt: texts[0].created_at,
        })
      }
    }

    if (randomTexts.length === 0) {
      return res.status(500).json({ error: 'No texts found' })
    }

    return res.status(200).json({
      texts: randomTexts,
      stats: {
        totalTexts: count,
        requestedCount: maxTexts,
        returnedCount: randomTexts.length,
      },
    })
  } catch (error) {
    console.error('❌ API: Error in markov-text endpoint:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
