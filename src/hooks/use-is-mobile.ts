import { useState, useEffect } from 'react'

/**
 * Hook to detect if the user is on a mobile device
 * @returns {boolean} True if the user is on a mobile device
 */
const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof navigator !== 'undefined') {
      const checkIsMobile = (): void => {
        const mobileRegex = /iPhone|iPad|iPod|Android/i
        setIsMobile(mobileRegex.test(navigator.userAgent))
      }

      // Check immediately
      checkIsMobile()

      // Listen for orientation changes (useful for tablets that can rotate)
      window.addEventListener('orientationchange', checkIsMobile)

      // Listen for resize events (in case of responsive design changes)
      window.addEventListener('resize', checkIsMobile)

      // Cleanup event listeners
      return () => {
        window.removeEventListener('orientationchange', checkIsMobile)
        window.removeEventListener('resize', checkIsMobile)
      }
    }
  }, [])

  return isMobile
}

export default useIsMobile
