const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Global cache for the entire module
let globalCache = {
  markovData: null,
  timestamp: 0,
  loading: false,
  loadPromise: null,
}

const CACHE_MAX_AGE = 60 * 60 * 1000 // 1 hour in milliseconds

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

// Check if cache is valid
function isCacheValid() {
  if (!globalCache.markovData) {
    return false
  }
  const age = Date.now() - globalCache.timestamp
  return age < CACHE_MAX_AGE
}

// Load pre-processed Markov data from Supabase
async function loadMarkovData() {
  if (isCacheValid()) {
    console.log('📦 Using cached Markov data')
    return globalCache.markovData
  }

  if (globalCache.loading) {
    console.log('⏳ Waiting for Markov data to load...')
    return globalCache.loadPromise
  }

  globalCache.loading = true
  globalCache.loadPromise = loadMarkovDataFromSupabase()

  try {
    const data = await globalCache.loadPromise
    globalCache.markovData = data
    globalCache.timestamp = Date.now()
    globalCache.loading = false
    return data
  } catch (error) {
    globalCache.loading = false
    throw error
  }
}

// Load Markov data from Supabase storage
async function loadMarkovDataFromSupabase() {
  const env = loadEnvironmentVariables()

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables')
  }

  console.log('🔄 Loading pre-processed Markov data from Supabase...')

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  const { data, error } = await supabase.storage
    .from('markov-chains')
    .download('processed-chains.json')

  if (error) {
    throw new Error(`Failed to download Markov data: ${error.message}`)
  }

  const jsonText = await data.text()
  const markovData = JSON.parse(jsonText)

  console.log(
    `✅ Loaded Markov data: ${Object.keys(markovData.ngrams).length.toLocaleString()} ngrams`
  )

  return markovData
}

// Generate text using pre-processed Markov data
function generateText(markovData, maxLength = 600, maxSentences = 2) {
  const { ngrams, beginnings } = markovData

  if (!beginnings || beginnings.length === 0) {
    return 'Unable to generate text at this time.'
  }

  // Choose a random beginning
  const beginning = beginnings[Math.floor(Math.random() * beginnings.length)]
  let result = beginning
  let currentLength = beginning.length
  let sentenceCount = 0

  // Count sentences in the beginning
  const sentenceMatches = beginning.match(/[.!?]+/g)
  if (sentenceMatches) {
    sentenceCount = sentenceMatches.length
  }

  // Determine ngram order from the first ngram key
  const firstNgramKey = Object.keys(ngrams)[0]
  const order = firstNgramKey ? firstNgramKey.split(' ').length : 3

  // Generate text using ngrams
  let attempts = 0
  const maxAttempts = 50 // Prevent infinite loops

  while (
    currentLength < maxLength &&
    sentenceCount < maxSentences &&
    attempts < maxAttempts
  ) {
    attempts++

    const currentWords = result.split(' ')

    if (currentWords.length < order) {
      break
    }

    const currentNgram = currentWords.slice(-order).join(' ')
    const nextWords = ngrams[currentNgram]

    if (!nextWords || nextWords.length === 0) {
      break
    }

    const nextWord = nextWords[Math.floor(Math.random() * nextWords.length)]
    result += ' ' + nextWord
    currentLength = result.length

    // Check for sentence endings
    if (nextWord.match(/[.!?]+$/)) {
      sentenceCount++
    }
  }

  return result
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

  try {
    // Get query parameters
    const maxLength = parseInt(req.query.maxLength) || 600
    const maxSentences = parseInt(req.query.maxSentences) || 2

    // Load Markov data (cached)
    const markovData = await loadMarkovData()

    // Generate text
    const generatedText = generateText(markovData, maxLength, maxSentences)

    return res.status(200).json({
      text: generatedText,
      stats: {
        ngramsCount: Object.keys(markovData.ngrams).length,
        beginningsCount: markovData.beginnings.length,
        maxLength,
        maxSentences,
      },
    })
  } catch (error) {
    console.error('❌ Error in markov-generate endpoint:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    })
  }
}
