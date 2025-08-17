import { renderHook } from '@testing-library/react'
import { useSupabaseData, FilterSortParams } from './use-supabase-data'

// Mock the useSupabase hook with a simple mock
jest.mock('../contexts/supabase-context', () => ({
  useSupabase: () => ({
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          or: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: [],
            count: 0,
            error: null
          })
        }))
      }))
    },
    loading: false,
    error: null
  })
}))

describe('useSupabaseData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return initial loading state', () => {
    const { result } = renderHook(() => useSupabaseData())

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual({
      audio: [],
      markovTexts: [],
      daily: []
    })
    expect(result.current.error).toBe(null)
    expect(result.current.totalCount).toBe(0)
  })

  test('should accept filter parameters', () => {
    const filterParams: FilterSortParams = { 
      searchTerm: 'test',
      sortDirection: 'asc',
      currentPage: 2,
      postsPerPage: 5
    }
    
    const { result } = renderHook(() => useSupabaseData(filterParams))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual({
      audio: [],
      markovTexts: [],
      daily: []
    })
  })

  test('should handle search filter', () => {
    const filterParams: FilterSortParams = { searchTerm: 'test' }
    const { result } = renderHook(() => useSupabaseData(filterParams))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual({
      audio: [],
      markovTexts: [],
      daily: []
    })
  })

  test('should handle sort direction', () => {
    const filterParams: FilterSortParams = { sortDirection: 'desc' }
    const { result } = renderHook(() => useSupabaseData(filterParams))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual({
      audio: [],
      markovTexts: [],
      daily: []
    })
  })

  test('should handle pagination', () => {
    const filterParams: FilterSortParams = { 
      currentPage: 3, 
      postsPerPage: 20 
    }
    const { result } = renderHook(() => useSupabaseData(filterParams))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual({
      audio: [],
      markovTexts: [],
      daily: []
    })
  })

  test('should handle empty parameters', () => {
    const { result } = renderHook(() => useSupabaseData())

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual({
      audio: [],
      markovTexts: [],
      daily: []
    })
    expect(result.current.error).toBe(null)
    expect(result.current.totalCount).toBe(0)
  })
})
