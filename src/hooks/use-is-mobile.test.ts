import { renderHook } from '@testing-library/react'
import useIsMobile from './use-is-mobile'

// Mock navigator
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
}

// Mock window events
const mockAddEventListener = jest.fn()
const mockRemoveEventListener = jest.fn()

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
})

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
})

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
})

describe('useIsMobile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAddEventListener.mockClear()
    mockRemoveEventListener.mockClear()
  })

  it('returns false for desktop user agent', () => {
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
    expect(mockAddEventListener).toHaveBeenCalledWith(
      'orientationchange',
      expect.any(Function)
    )
    expect(mockAddEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    )
  })

  it('returns true for iPhone user agent', () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      },
      writable: true,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('returns true for iPad user agent', () => {
    Object.defineProperty(window, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)' },
      writable: true,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('returns true for Android user agent', () => {
    Object.defineProperty(window, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G973F)' },
      writable: true,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('handles case-insensitive user agent matching', () => {
    Object.defineProperty(window, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (android; CPU OS 14_0 like Mac OS X)' },
      writable: true,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('sets up event listeners for orientation and resize changes', () => {
    renderHook(() => useIsMobile())

    expect(mockAddEventListener).toHaveBeenCalledTimes(2)
    expect(mockAddEventListener).toHaveBeenCalledWith(
      'orientationchange',
      expect.any(Function)
    )
    expect(mockAddEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    )
  })

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile())

    unmount()

    expect(mockRemoveEventListener).toHaveBeenCalledTimes(2)
    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'orientationchange',
      expect.any(Function)
    )
    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    )
  })

  it('handles server-side rendering gracefully', () => {
    // Mock server-side environment where navigator is undefined
    const originalNavigator = global.navigator
    delete (global as any).navigator

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
    expect(mockAddEventListener).not.toHaveBeenCalled()

    // Restore navigator
    global.navigator = originalNavigator
  })
})
