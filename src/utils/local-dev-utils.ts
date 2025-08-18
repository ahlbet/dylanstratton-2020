// Shared utilities for local development environment detection

/**
 * Check if local development mode is enabled
 * @returns {boolean} True if running in local development mode
 */
export function isLocalDev(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.GATSBY_USE_LOCAL_DATA === 'true'
  )
}

/**
 * Check if local development mode is enabled (alias for isLocalDev)
 * @returns {boolean} True if running in local development mode
 */
export const isLocalAudioDev = isLocalDev

/**
 * Get local development configuration
 * @returns {Object} Configuration object for local development
 */
export function getLocalDevConfig(): {
  enabled: boolean
  fallbackToSupabase: boolean
} {
  return {
    enabled: isLocalDev(),
    fallbackToSupabase:
      process.env.GATSBY_LOCAL_FALLBACK_TO_SUPABASE === 'true',
  }
}
