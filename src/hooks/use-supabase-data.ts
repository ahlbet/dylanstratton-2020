import { useState, useEffect } from 'react'
import { useSupabase } from '../contexts/supabase-context'

// Types
export interface AudioItem {
  id: string
  storage_path?: string
  duration?: number | null
  format?: string
  title?: string
  artist?: string
  album?: string
  displayFilename?: string
  daily_id: string
  created_at: string
}

export interface MarkovText {
  id: string
  text_content: string
  coherency_level?: string
  daily_id: string
  created_at: string
}

export interface DailyData {
  id: string
  title?: string
  coherency_level?: string
  cover_art?: string
  date: string
  created_at: string
}

export interface SupabaseData {
  audio: AudioItem[]
  markovTexts: MarkovText[]
  daily: DailyData[]
}

export interface FilterSortParams {
  searchTerm?: string
  sortDirection?: 'asc' | 'desc'
  currentPage?: number
  postsPerPage?: number
}

export const useSupabaseData = (filterSortParams?: FilterSortParams) => {
  const { supabase, loading: contextLoading, error: contextError } = useSupabase()

  const [data, setData] = useState<SupabaseData>({
    daily: [],
    audio: [],
    markovTexts: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    // Don't proceed if context is still loading or has errors
    if (contextLoading) {
      setLoading(true)
      return
    }
    
    if (contextError) {
      setError(contextError)
      setLoading(false)
      return
    }
    
    if (!supabase) {
      setError('Supabase client not initialized')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      
      try {
        setLoading(true)
        
        // Build query for daily table with filtering and sorting
        
        let dailyQuery = supabase
          .from('daily')
          .select('id, title, created_at, coherency_level, cover_art, date', { count: 'exact' })

        // Apply search filter if searchTerm is provided
        if (filterSortParams?.searchTerm && filterSortParams.searchTerm.trim()) {
          const searchTerm = filterSortParams.searchTerm.toLowerCase().trim()
          dailyQuery = dailyQuery.or(`title.ilike.%${searchTerm}%`)
        }

        // Apply sorting - use date field for proper chronological ordering
        const sortDirection = filterSortParams?.sortDirection || 'desc'
        dailyQuery = dailyQuery.order('date', { ascending: sortDirection === 'asc' })

        // Apply pagination
        if (filterSortParams?.currentPage && filterSortParams?.postsPerPage) {
          const from = (filterSortParams.currentPage - 1) * filterSortParams.postsPerPage
          const to = from + filterSortParams.postsPerPage - 1
          dailyQuery = dailyQuery.range(from, to)
        }

        // Execute daily query
        const dailyResult = await dailyQuery

        if (dailyResult.error) {
          throw dailyResult.error
        }

        // Get total count for pagination
        setTotalCount(dailyResult.count || 0)

        // Get the daily IDs from the filtered results
        const dailyIds = dailyResult.data?.map(d => d.id) || []

        // Fetch related audio and markov data only for the filtered daily entries
        const [audioResult, markovResult] = await Promise.all([
          dailyIds.length > 0 
            ? supabase
                .from('daily_audio')
                .select('id, daily_id, storage_path, duration, format, created_at, coherency_level')
                .in('daily_id', dailyIds)
            : Promise.resolve({ data: [], error: null }),
          dailyIds.length > 0
            ? supabase
                .from('markov_texts')
                .select('id, daily_id, text_content, created_at, coherency_level')
                .in('daily_id', dailyIds)
            : Promise.resolve({ data: [], error: null })
        ])

        // Check for errors
        if (audioResult.error) throw audioResult.error
        if (markovResult.error) throw markovResult.error

        // Sort audio entries by the daily entry dates
        const sortedAudioData = audioResult.data.sort((a, b) => {
          const dailyA = dailyResult.data.find((d) => d.id === a.daily_id)
          const dailyB = dailyResult.data.find((d) => d.id === b.daily_id)
          if (!dailyA || !dailyB) return 0
          return dailyA.date.localeCompare(dailyB.date)
        })

        const finalData = {
          daily: dailyResult.data || [],
          audio: sortedAudioData || [],
          markovTexts: markovResult.data || [],
        }

        setData(finalData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    // Only fetch data if we have a Supabase client and context is not loading
    if (supabase && !contextLoading && !contextError) {
      fetchData()
    }
  }, [filterSortParams, supabase, contextLoading, contextError])

  return { data, loading, error, totalCount }
}
