import { useRef, useEffect } from 'react'

export const useScrollToTrack = (currentIndex, isShuffleOn) => {
  const trackListRef = useRef(null)
  const trackItemRefs = useRef({})

  // Scroll current track into view when shuffle is on
  useEffect(() => {
    if (
      isShuffleOn &&
      currentIndex !== null &&
      trackItemRefs.current[currentIndex]
    ) {
      const trackElement = trackItemRefs.current[currentIndex]
      const trackList = trackListRef.current

      if (trackElement && trackList) {
        // Calculate if the track is visible
        const trackRect = trackElement.getBoundingClientRect()
        const listRect = trackList.getBoundingClientRect()

        const isVisible =
          trackRect.top >= listRect.top && trackRect.bottom <= listRect.bottom

        if (!isVisible) {
          trackElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      }
    }
  }, [currentIndex, isShuffleOn])

  // Function to set track item ref
  const setTrackItemRef = (index, element) => {
    trackItemRefs.current[index] = element
  }

  return { trackListRef, setTrackItemRef }
}
