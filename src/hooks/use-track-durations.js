import { useState, useRef, useEffect } from 'react'

export const useTrackDurations = (audioUrls) => {
  const [trackDurations, setTrackDurations] = useState({})
  const loadingTracksRef = useRef(new Set())
  const hasStartedLoadingRef = useRef(false)

  // Load all track durations
  const loadAllTrackDurations = async () => {
    if (hasStartedLoadingRef.current || !audioUrls || audioUrls.length === 0) {
      return
    }

    hasStartedLoadingRef.current = true

    const promises = audioUrls.map((item) => {
      return new Promise((resolve) => {
        const url = typeof item === 'string' ? item : item.url

        if (loadingTracksRef.current.has(url)) {
          resolve({ url, success: false, reason: 'already_loading' })
          return
        }

        loadingTracksRef.current.add(url)

        const audio = new Audio()
        audio.preload = 'metadata'
        audio.crossOrigin = 'anonymous'

        const timeoutId = setTimeout(() => {
          loadingTracksRef.current.delete(url)
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
          audio.removeEventListener('error', handleError)
          audio.src = ''
          resolve({ url, success: false, reason: 'timeout' })
        }, 15000)

        const handleLoadedMetadata = () => {
          clearTimeout(timeoutId)
          const capturedDuration = audio.duration

          if (
            capturedDuration &&
            !isNaN(capturedDuration) &&
            capturedDuration > 0
          ) {
            setTrackDurations((prev) => ({
              ...prev,
              [url]: capturedDuration,
            }))
            resolve({
              url,
              success: true,
              duration: capturedDuration,
            })
          } else {
            resolve({
              url,
              success: false,
              reason: 'invalid_duration',
            })
          }

          loadingTracksRef.current.delete(url)
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
          audio.removeEventListener('error', handleError)
          audio.src = ''
        }

        const handleError = (e) => {
          clearTimeout(timeoutId)
          loadingTracksRef.current.delete(url)
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
          audio.removeEventListener('error', handleError)
          audio.src = ''
          resolve({
            url,
            success: false,
            reason: 'network_error',
            error: e,
          })
        }

        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('error', handleError)
        audio.src = url
      })
    })

    try {
      await Promise.all(promises)
    } catch (error) {
      console.error('Audio duration loading error:', error)
    }
  }

  // Start loading when component mounts
  useEffect(() => {
    if (!hasStartedLoadingRef.current) {
      loadAllTrackDurations()
    }
  }, [audioUrls])

  return { trackDurations, setTrackDurations }
}
