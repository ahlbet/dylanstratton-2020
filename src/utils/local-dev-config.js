// Local Development Configuration
// This utility helps switch between local and Supabase data sources

const isLocalDev =
  process.env.NODE_ENV === 'development' &&
  process.env.GATSBY_USE_LOCAL_DATA === 'true'

export const LOCAL_DEV_CONFIG = {
  // Enable local development mode
  enabled: isLocalDev,

  // Local data paths (without static prefix since files are copied to public/)
  paths: {
    audio: '/local-audio/',
    coverArt: '/local-cover-art/',
    markovTexts: '/local-data/markov-texts.json',
    markovSource: '/local-data/markov-source.txt',
  },

  // Fallback to Supabase if local data is missing
  fallbackToSupabase: process.env.GATSBY_LOCAL_FALLBACK_TO_SUPABASE === 'true',
}

export const getAudioUrl = (filename) => {
  if (LOCAL_DEV_CONFIG.enabled) {
    return `${LOCAL_DEV_CONFIG.paths.audio}${filename}`
  }
  // Return original Supabase URL
  return null
}

export const getCoverArtUrl = (postName) => {
  if (LOCAL_DEV_CONFIG.enabled) {
    return `${LOCAL_DEV_CONFIG.paths.coverArt}${postName}.png`
  }
  // Return original Supabase URL
  return null
}

export const getMarkovTextsPath = () => {
  if (LOCAL_DEV_CONFIG.enabled) {
    return LOCAL_DEV_CONFIG.paths.markovTexts
  }
  return null
}

export const getMarkovSourcePath = () => {
  if (LOCAL_DEV_CONFIG.enabled) {
    return LOCAL_DEV_CONFIG.paths.markovSource
  }
  return null
}

export default LOCAL_DEV_CONFIG
