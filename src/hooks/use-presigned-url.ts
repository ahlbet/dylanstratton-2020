import { useState, useCallback, useRef } from 'react'
import { generatePresignedUrlOnDemand } from '../utils/presigned-urls'
import { isLocalDev } from '../utils/local-dev-utils'

interface Track {
  url?: string
  storagePath?: string
}

interface CachedUrl {
  url: string
  expiresAt: number
}

interface UsePresignedUrlReturn {
  getAudioUrl: (track: Track) => Promise<string | null>
  isGenerating: boolean
  clearCache: () => void
}

/**
 * Custom hook for on-demand presigned URL generation
 * Only generates presigned URLs when tracks are actually played
 */
export const usePresignedUrl = (): UsePresignedUrlReturn => {
  const [urlCache, setUrlCache] = useState<Map<string, CachedUrl>>(new Map())
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const urlCacheRef = useRef<Map<string, CachedUrl>>(urlCache)

  // Keep ref in sync with state
  urlCacheRef.current = urlCache

  const getAudioUrl = useCallback(
    async (track: Track): Promise<string | null> => {
      // In development, always use the URL as-is
      if (isLocalDev()) {
        return track.url || null
      }

      // If track already has a presigned URL, use it
      if (
        track.url &&
        track.url.includes('supabase.co') &&
        track.url.includes('?token=')
      ) {
        return track.url
      }

      // If track has a storage path and we're in production, generate presigned URL
      if (track.storagePath && !isLocalDev()) {
        const cacheKey = track.storagePath

        // Check if we have a cached presigned URL
        if (urlCacheRef.current.has(cacheKey)) {
          const cached = urlCacheRef.current.get(cacheKey)
          if (cached && cached.expiresAt > Date.now()) {
            return cached.url
          }
        }

        // Generate new presigned URL
        try {
          setIsGenerating(true)
          const presignedUrl = await generatePresignedUrlOnDemand(
            track.storagePath,
            3600
          )

          // Cache the result
          setUrlCache((prev) =>
            new Map(prev).set(cacheKey, {
              url: presignedUrl,
              expiresAt: Date.now() + 3600 * 1000 - 5 * 60 * 1000, // 1 hour - 5 min buffer
            })
          )

          return presignedUrl
        } catch (error) {
          console.error('Failed to generate presigned URL on-demand:', error)
          // Generate public URL as fallback
          return `https://${process.env.GATSBY_SUPABASE_PUBLIC_URL_DOMAIN || 'uzsnbfnteazzwirbqgzb.supabase.co'}/storage/v1/object/public/${track.storagePath}`
        } finally {
          setIsGenerating(false)
        }
      }

      // If no storage path and no URL, this is an error
      if (!track.url) {
        console.error('Track has no URL or storage path:', track)
        return null
      }

      // Fall back to original URL
      return track.url
    },
    [] // Remove urlCache dependency to prevent function recreation
  )

  return {
    getAudioUrl,
    isGenerating,
    clearCache: () => setUrlCache(new Map()),
  }
}
