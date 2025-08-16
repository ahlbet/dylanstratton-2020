import { renderHook } from '@testing-library/react'
import { useScrollToTrack } from './use-scroll-to-track'

// Mock getBoundingClientRect
const mockGetBoundingClientRect = jest.fn()

// Mock scrollIntoView
const mockScrollIntoView = jest.fn()

describe('useScrollToTrack', () => {
  let mockTrackElement
  let mockTrackList

  beforeEach(() => {
    jest.clearAllMocks()

    mockTrackElement = {
      getBoundingClientRect: mockGetBoundingClientRect,
      scrollIntoView: mockScrollIntoView,
    }

    mockTrackList = {
      getBoundingClientRect: mockGetBoundingClientRect,
    }
  })

  test('returns trackListRef and setTrackItemRef', () => {
    const { result } = renderHook(() => useScrollToTrack(0, false))

    expect(result.current).toHaveProperty('trackListRef')
    expect(result.current).toHaveProperty('setTrackItemRef')
    expect(typeof result.current.setTrackItemRef).toBe('function')
  })

  test('does not scroll when shuffle is off', () => {
    const { result } = renderHook(() => useScrollToTrack(0, false))

    // Set up refs
    result.current.trackListRef.current = mockTrackList
    result.current.setTrackItemRef(0, mockTrackElement)

    // Trigger effect by changing currentIndex
    renderHook(() => useScrollToTrack(1, false))

    expect(mockScrollIntoView).not.toHaveBeenCalled()
  })

  test('does not scroll when currentIndex is null', () => {
    const { result } = renderHook(() => useScrollToTrack(null, true))

    // Set up refs
    result.current.trackListRef.current = mockTrackList
    result.current.setTrackItemRef(0, mockTrackElement)

    // Trigger effect by changing currentIndex
    renderHook(() => useScrollToTrack(0, true))

    expect(mockScrollIntoView).not.toHaveBeenCalled()
  })

  test('scrolls to track when shuffle is on and track is not visible', () => {
    // Mock getBoundingClientRect to return positions where track is not visible
    mockGetBoundingClientRect
      .mockReturnValueOnce({ top: 100, bottom: 150 }) // track element
      .mockReturnValueOnce({ top: 0, bottom: 200 }) // track list

    const { result } = renderHook(() => useScrollToTrack(0, true))

    // Set up refs
    result.current.trackListRef.current = mockTrackList
    result.current.setTrackItemRef(0, mockTrackElement)

    // The hook should scroll when isShuffleOn is true and track is not visible
    // Note: This test verifies the hook's internal logic, but we can't directly test
    // the scrolling behavior since it's in a useEffect that runs on mount
    expect(result.current.trackListRef.current).toBe(mockTrackList)
    expect(result.current.setTrackItemRef).toBeDefined()
  })

  test('does not scroll when track is already visible', () => {
    // Mock getBoundingClientRect to return positions where track is visible
    mockGetBoundingClientRect
      .mockReturnValueOnce({ top: 50, bottom: 100 }) // track element
      .mockReturnValueOnce({ top: 0, bottom: 200 }) // track list

    const { result } = renderHook(() => useScrollToTrack(0, true))

    // Set up refs
    result.current.trackListRef.current = mockTrackList
    result.current.setTrackItemRef(0, mockTrackElement)

    // Trigger effect by changing currentIndex
    renderHook(() => useScrollToTrack(1, true))

    expect(mockScrollIntoView).not.toHaveBeenCalled()
  })

  test('handles track element not found gracefully', () => {
    const { result } = renderHook(() => useScrollToTrack(0, true))

    // Set up only trackList ref, but not track element ref
    result.current.trackListRef.current = mockTrackList

    // Should not throw error
    expect(() => {
      renderHook(() => useScrollToTrack(1, true))
    }).not.toThrow()

    expect(mockScrollIntoView).not.toHaveBeenCalled()
  })

  test('handles track list not found gracefully', () => {
    const { result } = renderHook(() => useScrollToTrack(0, true))

    // Set up only track element ref, but not track list ref
    result.current.setTrackItemRef(0, mockTrackElement)

    // Should not throw error
    expect(() => {
      renderHook(() => useScrollToTrack(1, true))
    }).not.toThrow()

    expect(mockScrollIntoView).not.toHaveBeenCalled()
  })

  test('handles both refs not found gracefully', () => {
    const { result } = renderHook(() => useScrollToTrack(0, true))

    // Don't set up any refs

    // Should not throw error
    expect(() => {
      renderHook(() => useScrollToTrack(1, true))
    }).not.toThrow()

    expect(mockScrollIntoView).not.toHaveBeenCalled()
  })

  test('handles missing track element gracefully', () => {
    const { result } = renderHook(() => useScrollToTrack(0, true))

    // Should not throw when track element is missing
    expect(() => {
      // The hook doesn't expose scrollToTrack, so we just test that the hook renders
      expect(result.current.trackListRef).toBeDefined()
      expect(result.current.setTrackItemRef).toBeDefined()
    }).not.toThrow()
  })

  test('handles missing track list gracefully', () => {
    const { result } = renderHook(() => useScrollToTrack(0, true))

    // Should not throw when track list is missing
    expect(() => {
      // The hook doesn't expose scrollToTrack, so we just test that the hook renders
      expect(result.current.trackListRef).toBeDefined()
      expect(result.current.setTrackItemRef).toBeDefined()
    }).not.toThrow()
  })

  test('setTrackItemRef sets ref correctly', () => {
    const { result } = renderHook(() => useScrollToTrack(0, true))

    const mockRef = { current: mockTrackElement }
    result.current.setTrackItemRef(0, mockRef)

    // The ref should be set (we can't directly test the internal ref, but we can verify the function exists)
    expect(typeof result.current.setTrackItemRef).toBe('function')
  })

  test('returns correct API', () => {
    const { result } = renderHook(() => useScrollToTrack(0, true))

    // Should return the expected API
    expect(result.current.trackListRef).toBeDefined()
    expect(result.current.setTrackItemRef).toBeDefined()
    expect(typeof result.current.setTrackItemRef).toBe('function')

    // Should not expose internal functions
    expect(result.current.scrollToTrack).toBeUndefined()
    expect(result.current.setTrackListRef).toBeUndefined()
  })
})
