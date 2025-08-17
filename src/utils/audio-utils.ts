// Utility function to check if we're in local development mode
export const isLocalDev = (): boolean => {
  // In test environment, always use production mode (getAudioUrl)
  if (process.env.NODE_ENV === 'test') {
    return false
  }
  
  return process.env.NODE_ENV === 'development' && 
         typeof window !== 'undefined' && 
         window.location.hostname === 'localhost'
}

// Utility function to extract filename from storage path
export const extractFilenameFromStoragePath = (storagePath: string): string => {
  const pathParts = storagePath.split('/')
  const filename = pathParts[pathParts.length - 1]
  return filename.replace(/\.[^/.]+$/, '') // Remove extension
}

// Utility function to format duration
export const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Utility function to generate track title from available data
export const generateTrackTitle = (track: any): string => {
  // Extract from storage path (similar to BlogAudioPlayer logic)
  if (track.storage_path) {
    const pathParts = track.storage_path.split('/')
    const filename = pathParts[pathParts.length - 1]
    const trackName = filename.replace(/\.[^/.]+$/, '') // Remove extension
    return trackName
  }

  // Fallback: use the daily_id and track number
  return `${track.daily_id}-${track.id}`
}

// Utility function to get next track index
export const getNextTrackIndex = (currentIndex: number | null, playlistLength: number): number => {
  if (currentIndex === null || playlistLength === 0) return 0
  return (currentIndex + 1) % playlistLength
}

// Utility function to get previous track index
export const getPreviousTrackIndex = (currentIndex: number | null, playlistLength: number): number => {
  if (currentIndex === null || playlistLength === 0) return 0
  return currentIndex === 0 ? playlistLength - 1 : currentIndex - 1
}
