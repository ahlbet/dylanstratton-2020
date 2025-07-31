// Audio preloader utility
class AudioPreloader {
  constructor() {
    this.cache = new Map()
    this.preloadQueue = []
    this.isProcessing = false
  }

  // Preload a single audio file
  preloadAudio(url) {
    return new Promise((resolve, reject) => {
      if (this.cache.has(url)) {
        resolve(this.cache.get(url))
        return
      }

      const audio = new Audio()

      audio.addEventListener(
        'canplaythrough',
        () => {
          this.cache.set(url, audio)
          resolve(audio)
        },
        { once: true }
      )

      audio.addEventListener(
        'error',
        (error) => {
          console.warn('Failed to preload audio:', url, error)
          reject(error)
        },
        { once: true }
      )

      // Set preload attribute
      audio.preload = 'metadata'
      audio.src = url
    })
  }

  // Preload multiple audio files
  preloadMultiple(urls) {
    return Promise.allSettled(urls.map((url) => this.preloadAudio(url)))
  }

  // Get cached audio element
  getCachedAudio(url) {
    return this.cache.get(url)
  }

  // Clear cache
  clearCache() {
    this.cache.clear()
  }

  // Get cache size
  getCacheSize() {
    return this.cache.size
  }
}

// Create singleton instance
const audioPreloader = new AudioPreloader()

export default audioPreloader
