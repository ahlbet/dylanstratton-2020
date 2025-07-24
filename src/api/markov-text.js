const path = require('path')
const { MarkovGenerator } = require('../utils/markov-generator')

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
    const generator = new MarkovGenerator(5)
    const success = await generator.loadTextFromSupabaseWithCredentials(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      'markov-text'
    )

    if (!success) {
      console.error('❌ API: Failed to load markov text from Supabase')
      return res.status(500).json({ error: 'Failed to load markov text' })
    }

    // Return the combined text content for client-side generation
    const textContent = generator.lines.join('\n')

    // Check response size and limit if necessary
    const responseData = {
      text: textContent,
      stats: {
        lines: generator.lines.length,
        characters: textContent.length,
        ngramsCount: Object.keys(generator.ngrams).length,
        beginningsCount: generator.beginnings.length,
      },
    }

    const responseSize = JSON.stringify(responseData).length
    const maxSize = 5 * 1024 * 1024 // 5MB limit for Netlify

    if (responseSize > maxSize) {
      console.warn(
        `⚠️ Response too large (${responseSize} bytes), limiting text content`
      )

      // Reduce text content to fit within limits
      const maxTextSize = 4 * 1024 * 1024 // Leave room for stats
      let limitedText = textContent

      if (limitedText.length > maxTextSize) {
        // Take first 4MB of text
        limitedText = limitedText.substring(0, maxTextSize)
        // Try to end at a complete line
        const lastNewline = limitedText.lastIndexOf('\n')
        if (lastNewline > maxTextSize * 0.9) {
          // If we can find a newline in last 10%
          limitedText = limitedText.substring(0, lastNewline)
        }
      }

      responseData.text = limitedText
      responseData.stats.characters = limitedText.length
      responseData.stats.lines = limitedText.split('\n').length
      responseData.stats.truncated = true
    }

    return res.status(200).json(responseData)
  } catch (error) {
    console.error('❌ API: Error in markov-text endpoint:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
