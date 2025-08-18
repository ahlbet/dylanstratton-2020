import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLIC_URL_DOMAIN } from './supabase-config'

// Define types for the cache entries
interface CacheEntry {
  url: string
  expiresAt: number
}

// Define types for audio objects
interface AudioFile {
  storage_path: string
  [key: string]: any
}

interface AudioWithUrl extends AudioFile {
  url: string
  displayFilename: string
}

// Define types for cache configuration
interface CacheConfig {
  maxSize: number
  cleanupInterval: number
  bufferTime: number
}

// Cache configuration
const CACHE_CONFIG: CacheConfig = {
  maxSize: parseInt(process.env.SUPABASE_CACHE_MAX_SIZE || '1000', 10) || 1000, // Maximum number of cached URLs
  cleanupInterval:
    parseInt(process.env.SUPABASE_CACHE_CLEANUP_INTERVAL || '300000', 10) || 5 * 60 * 1000, // Clean up expired entries every 5 minutes
  bufferTime:
    parseInt(process.env.SUPABASE_CACHE_BUFFER_TIME || '300000', 10) || 5 * 60 * 1000, // 5 minute buffer before considering URLs expired
}

// Cache for pre-signed URLs to avoid regenerating them unnecessarily
const urlCache = new Map<string, CacheEntry>()

// Track last cleanup time
let lastCleanupTime = Date.now()

/**
 * Clean up expired cache entries and enforce size limits
 */
function cleanupCache(): void {
  const now = Date.now()

  // Remove expired entries
  for (const [key, value] of urlCache.entries()) {
    if (value.expiresAt <= now) {
      urlCache.delete(key)
    }
  }

  // If cache is still too large, remove oldest entries
  if (urlCache.size > CACHE_CONFIG.maxSize) {
    const entries = Array.from(urlCache.entries())
    // Sort by expiration time (oldest first)
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt)

    // Remove oldest entries until we're under the limit
    const entriesToRemove = entries.slice(
      0,
      urlCache.size - CACHE_CONFIG.maxSize
    )
    entriesToRemove.forEach(([key]) => urlCache.delete(key))

    console.log(
      `Cache cleanup: Removed ${entriesToRemove.length} oldest entries`
    )
  }

  lastCleanupTime = now
}

/**
 * Remove bucket prefix from storage path
 * @param storagePath - The storage path (e.g., 'audio/24mar10.wav')
 * @param bucketName - The bucket name (e.g., 'audio')
 * @returns The filename without bucket prefix (e.g., '24mar10.wav')
 */
function removeBucketPrefix(storagePath: string, bucketName: string): string {
  const prefix = `${bucketName}/`
  if (storagePath.startsWith(prefix)) {
    return storagePath.substring(prefix.length)
  }
  return storagePath
}

/**
 * Extract clean filename from storage path (removes bucket prefix and file extension)
 * @param storagePath - The storage path (e.g., 'audio/25aug05.wav')
 * @param bucketName - The bucket name (e.g., 'audio')
 * @returns The clean filename without bucket prefix or extension (e.g., '25aug05')
 */
function extractFilenameFromStoragePath(storagePath: string, bucketName: string = 'audio'): string {
  const withoutPrefix = removeBucketPrefix(storagePath, bucketName)
  return withoutPrefix.replace(/\.wav$/, '')
}

/**
 * Generate a pre-signed URL for a Supabase storage object
 * @param storagePath - The storage path (e.g., 'audio/filename.wav')
 * @param bucketName - The bucket name (default: 'audio')
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns The pre-signed URL
 */
async function generatePresignedUrl(
  storagePath: string,
  bucketName: string = 'audio',
  expiresIn: number = 3600
): Promise<string> {
  // Check cache first
  const cacheKey = `${bucketName}:${storagePath}:${expiresIn}`

  // Perform cleanup if needed
  const now = Date.now()
  if (now - lastCleanupTime > CACHE_CONFIG.cleanupInterval) {
    cleanupCache()
  }

  if (urlCache.has(cacheKey)) {
    const cached = urlCache.get(cacheKey)
    if (!cached) return
    // Check if cached URL is still valid (with buffer time)
    if (cached.expiresAt > now + CACHE_CONFIG.bufferTime) {
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
      return `https://${SUPABASE_PUBLIC_URL_DOMAIN}/storage/v1/object/public/${bucketName}/${storagePath}`
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate pre-signed URL
    console.log('generatePresignedUrl debug:', {
      bucketName,
      storagePath,
      expiresIn,
    })

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, expiresIn)

    if (error) {
      console.error('Error generating pre-signed URL:', error.message)
      // Fall back to public URL on error
      return `https://${SUPABASE_PUBLIC_URL_DOMAIN}/storage/v1/object/public/${bucketName}/${storagePath}`
    }

    // Cache the URL (check size limits first)
    const expiresAt = now + expiresIn * 1000

    // If cache is at capacity, remove oldest entry before adding new one
    if (urlCache.size >= CACHE_CONFIG.maxSize) {
      const oldestKey = urlCache.keys().next().value
      if (oldestKey) {
        urlCache.delete(oldestKey)
      }
    }

    urlCache.set(cacheKey, {
      url: data.signedUrl,
      expiresAt,
    })

    return data.signedUrl
  } catch (error) {
    console.error('Error in generatePresignedUrl:', error instanceof Error ? error.message : String(error))
    // Fall back to public URL on any error
    return `https://${SUPABASE_PUBLIC_URL_DOMAIN}/storage/v1/object/public/${bucketName}/${storagePath}`
  }
}

/**
 * Generate pre-signed URLs for multiple audio files
 * @param audioFiles - Array of audio objects with storage_path
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Array of audio objects with pre-signed URLs
 */
async function generatePresignedUrlsForAudio(audioFiles: AudioFile[], expiresIn: number = 3600): Promise<AudioWithUrl[]> {
  if (!audioFiles || audioFiles.length === 0) {
    return []
  }

  try {
    const audioWithUrls = await Promise.all(
      audioFiles.map(async (audio) => {
        // Extract clean filename for display purposes
        const displayFilename = extractFilenameFromStoragePath(
          audio.storage_path
        )

        // For presigned URL generation, we need the full storage path with extension
        const storagePathForUrl = removeBucketPrefix(
          audio.storage_path,
          'audio'
        )

        // Debug logging
        console.log('Presigned URL generation:', {
          original: audio.storage_path,
          displayFilename,
          storagePathForUrl,
        })

        const presignedUrl = await generatePresignedUrl(
          storagePathForUrl,
          'audio',
          expiresIn
        )

        return {
          ...audio,
          url: presignedUrl,
          // Keep the original storage_path for reference
          storage_path: audio.storage_path,
          // Add the clean display filename for convenience
          displayFilename: displayFilename,
        }
      })
    )

    return audioWithUrls
  } catch (error) {
    console.error('Error generating pre-signed URLs for audio:', error instanceof Error ? error.message : String(error))
    // Fall back to public URLs on error
    return audioFiles.map((audio) => ({
      ...audio,
      url: `https://${SUPABASE_PUBLIC_URL_DOMAIN}/storage/v1/object/public/${audio.storage_path}`,
      storage_path: audio.storage_path,
      displayFilename: extractFilenameFromStoragePath(audio.storage_path),
    }))
  }
}

/**
 * Clear the URL cache (useful for testing or when you want to force regeneration)
 */
function clearUrlCache(): void {
  urlCache.clear()
  lastCleanupTime = Date.now()
}

/**
 * Update cache configuration dynamically
 * @param newConfig - New configuration options
 */
function updateCacheConfig(newConfig: Partial<CacheConfig>): void {
  if (newConfig.maxSize !== undefined) {
    CACHE_CONFIG.maxSize = Math.max(1, parseInt(String(newConfig.maxSize), 10))
  }
  if (newConfig.cleanupInterval !== undefined) {
    CACHE_CONFIG.cleanupInterval = Math.max(
      1000,
      parseInt(String(newConfig.cleanupInterval), 10)
    )
  }
  if (newConfig.bufferTime !== undefined) {
    CACHE_CONFIG.bufferTime = Math.max(1000, parseInt(String(newConfig.bufferTime), 10))
  }

  // Force cleanup if new config is more restrictive
  if (urlCache.size > CACHE_CONFIG.maxSize) {
    cleanupCache()
  }
}

/**
 * Get cache statistics (useful for debugging)
 */
function getCacheStats(): {
  totalEntries: number
  validEntries: number
  expiredEntries: number
  totalExpired: number
  maxSize: number
  cleanupInterval: number
  lastCleanup: number
  timeSinceLastCleanup: number
} {
  const now = Date.now()
  let validEntries = 0
  let expiredEntries = 0
  let totalExpired = 0

  for (const [key, value] of urlCache.entries()) {
    if (value.expiresAt > now) {
      validEntries++
    } else {
      expiredEntries++
      totalExpired++
      urlCache.delete(key)
    }
  }

  return {
    totalEntries: urlCache.size,
    validEntries,
    expiredEntries,
    totalExpired,
    maxSize: CACHE_CONFIG.maxSize,
    cleanupInterval: CACHE_CONFIG.cleanupInterval,
    lastCleanup: lastCleanupTime,
    timeSinceLastCleanup: now - lastCleanupTime,
  }
}

/**
 * Generate a presigned URL for a single audio file on-demand
 * @param storagePath - The storage path (e.g., 'audio/filename.wav')
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export async function generatePresignedUrlOnDemand(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    // Check cache first
    const cacheKey = `${storagePath}_${expiresIn}`
    const cached = urlCache.get(cacheKey)

    if (cached && cached.expiresAt > Date.now()) {
      return cached.url
    }

    // Generate new presigned URL
    // The storagePath includes the bucket name (e.g., 'audio/filename.wav'),
    // but generatePresignedUrl expects just the file path
    const filePath = storagePath.replace(/^audio\//, '') // Remove 'audio/' prefix

    console.log('generatePresignedUrlOnDemand debug:', {
      originalStoragePath: storagePath,
      extractedFilePath: filePath,
      bucketName: 'audio',
      expiresIn,
    })

    const presignedUrl = await generatePresignedUrl(
      filePath,
      'audio',
      expiresIn
    )

    // Cache the result
    urlCache.set(cacheKey, {
      url: presignedUrl,
      expiresAt: Date.now() + expiresIn * 1000 - CACHE_CONFIG.bufferTime,
    })

    return presignedUrl
  } catch (error) {
    console.error(
      'Failed to generate presigned URL on-demand:',
      storagePath,
      error
    )
    throw error
  }
}

// ES6 exports for Gatsby components
export {
  generatePresignedUrl,
  generatePresignedUrlsForAudio,
  removeBucketPrefix,
  extractFilenameFromStoragePath,
  clearUrlCache,
  getCacheStats,
  cleanupCache,
  updateCacheConfig,
  CACHE_CONFIG,
}
