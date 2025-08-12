import { createClient } from '@supabase/supabase-js'

// Cache for pre-signed URLs to avoid regenerating them unnecessarily
const urlCache = new Map()

/**
 * Generate a pre-signed URL for a Supabase storage object
 * @param {string} storagePath - The storage path (e.g., 'audio/filename.wav')
 * @param {string} bucketName - The bucket name (default: 'audio')
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} The pre-signed URL
 */
export async function generatePresignedUrl(
  storagePath,
  bucketName = 'audio',
  expiresIn = 3600
) {
  // Check cache first
  const cacheKey = `${bucketName}:${storagePath}:${expiresIn}`
  if (urlCache.has(cacheKey)) {
    const cached = urlCache.get(cacheKey)
    // Check if cached URL is still valid (with 5 minute buffer)
    if (cached.expiresAt > Date.now() + 5 * 60 * 1000) {
      return cached.url
    }
    // Remove expired entry
    urlCache.delete(cacheKey)
  }

  try {
    // Initialize Supabase client
    const supabaseUrl =
      process.env.GATSBY_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey =
      process.env.GATSBY_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Missing Supabase credentials for pre-signed URL generation')
      // Fall back to public URL if credentials not available
      return `https://uzsnbfnteazzwirbqgzb.supabase.co/storage/v1/object/public/${bucketName}/${storagePath}`
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate pre-signed URL
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, expiresIn)

    if (error) {
      console.error('Error generating pre-signed URL:', error.message)
      // Fall back to public URL on error
      return `https://uzsnbfnteazzwirbqgzb.supabase.co/storage/v1/object/public/${bucketName}/${storagePath}`
    }

    // Cache the URL
    const expiresAt = Date.now() + expiresIn * 1000
    urlCache.set(cacheKey, {
      url: data.signedUrl,
      expiresAt,
    })

    return data.signedUrl
  } catch (error) {
    console.error('Error in generatePresignedUrl:', error.message)
    // Fall back to public URL on any error
    return `https://uzsnbfnteazzwirbqgzb.supabase.co/storage/v1/object/public/${bucketName}/${storagePath}`
  }
}

/**
 * Generate pre-signed URLs for multiple audio files
 * @param {Array} audioFiles - Array of audio objects with storage_path
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<Array>} Array of audio objects with pre-signed URLs
 */
export async function generatePresignedUrlsForAudio(
  audioFiles,
  expiresIn = 3600
) {
  if (!audioFiles || audioFiles.length === 0) {
    return []
  }

  try {
    const audioWithUrls = await Promise.all(
      audioFiles.map(async (audio) => {
        // Extract filename from storage_path (e.g., 'audio/24mar10.wav' -> '24mar10.wav')
        const filename = audio.storage_path.replace(/^audio\//, '')

        const presignedUrl = await generatePresignedUrl(
          filename,
          'audio',
          expiresIn
        )

        return {
          ...audio,
          url: presignedUrl,
          // Keep the original storage_path for reference
          storage_path: audio.storage_path,
        }
      })
    )

    return audioWithUrls
  } catch (error) {
    console.error('Error generating pre-signed URLs for audio:', error.message)
    // Fall back to public URLs on error
    return audioFiles.map((audio) => ({
      ...audio,
      url: `https://uzsnbfnteazzwirbqgzb.supabase.co/storage/v1/object/public/${audio.storage_path}`,
      storage_path: audio.storage_path,
    }))
  }
}

/**
 * Clear the URL cache (useful for testing or when you want to force regeneration)
 */
export function clearUrlCache() {
  urlCache.clear()
}

/**
 * Get cache statistics (useful for debugging)
 */
export function getCacheStats() {
  const now = Date.now()
  let validEntries = 0
  let expiredEntries = 0

  for (const [key, value] of urlCache.entries()) {
    if (value.expiresAt > now) {
      validEntries++
    } else {
      expiredEntries++
      urlCache.delete(key)
    }
  }

  return {
    totalEntries: urlCache.size,
    validEntries,
    expiredEntries,
  }
}
