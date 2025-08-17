import { useRef, useEffect, RefObject } from 'react'

interface UseScrollToTrackReturn {
  trackListRef: RefObject<HTMLDivElement>
  setTrackItemRef: (index: number, element: HTMLDivElement | null) => void
}

export const useScrollToTrack = (
  currentIndex: number | null,
  isShuffleOn: boolean
): UseScrollToTrackReturn => {
  const trackListRef = useRef<HTMLDivElement>(null)
  const trackItemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

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
  const setTrackItemRef = (index: number, element: HTMLDivElement | null): void => {
    trackItemRefs.current[index] = element
  }

  return { trackListRef, setTrackItemRef }
}
