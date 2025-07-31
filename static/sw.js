const CACHE_NAME = 'audio-cache-v1'
const AUDIO_CACHE_NAME = 'audio-files-v1'

// Install event - cache audio files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(AUDIO_CACHE_NAME).then((cache) => {
      console.log('Audio cache opened')
      return cache
    })
  )
})

// Fetch event - serve from cache if available
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only handle audio files
  if (url.pathname.match(/\.(wav|mp3|ogg|m4a)$/i)) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          // Return cached version if available
          if (response) {
            console.log('Serving audio from cache:', url.pathname)
            return response
          }

          // Fetch from network and cache
          return fetch(event.request)
            .then((networkResponse) => {
              // Clone the response before caching
              const responseToCache = networkResponse.clone()

              // Cache the response for future use
              cache.put(event.request, responseToCache).then(() => {
                console.log('Cached new audio file:', url.pathname)
              })

              return networkResponse
            })
            .catch((error) => {
              console.error('Failed to fetch audio:', url.pathname, error)
              // Return a fallback response or throw
              throw error
            })
        })
      })
    )
  }
})

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== AUDIO_CACHE_NAME && cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
