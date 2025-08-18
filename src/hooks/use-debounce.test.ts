import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    // Change the value
    rerender({ value: 'changed', delay: 500 })
    
    // Value should still be the old one immediately
    expect(result.current).toBe('initial')
    
    // Fast-forward time to just before the delay
    act(() => {
      jest.advanceTimersByTime(499)
    })
    
    // Value should still be the old one
    expect(result.current).toBe('initial')
    
    // Fast-forward time to complete the delay
    act(() => {
      jest.advanceTimersByTime(1)
    })
    
    // Now the value should have updated
    expect(result.current).toBe('changed')
  })

  it('should cancel previous timer when value changes rapidly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    // Change value multiple times rapidly
    rerender({ value: 'first', delay: 500 })
    rerender({ value: 'second', delay: 500 })
    rerender({ value: 'third', delay: 500 })
    
    // Value should still be initial
    expect(result.current).toBe('initial')
    
    // Fast-forward time to complete the delay
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    // Should only have the last value, not intermediate ones
    expect(result.current).toBe('third')
  })

  it('should work with different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    )

    rerender({ value: 'changed', delay: 1000 })
    
    // Fast-forward time to just before the delay
    act(() => {
      jest.advanceTimersByTime(999)
    })
    
    expect(result.current).toBe('initial')
    
    // Complete the delay
    act(() => {
      jest.advanceTimersByTime(1)
    })
    
    expect(result.current).toBe('changed')
  })

  it('should work with different types', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 500 } }
    )

    rerender({ value: 42, delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    expect(result.current).toBe(42)
  })

  it('should cleanup timer on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    
    const { unmount } = renderHook(() => useDebounce('test', 500))
    
    unmount()
    
    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})
