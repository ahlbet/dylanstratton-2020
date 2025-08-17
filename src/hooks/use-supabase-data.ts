import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

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

export const useSupabaseData = () => {
  const [data, setData] = useState<SupabaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Initialize Supabase client
        const supabaseUrl = process.env.GATSBY_SUPABASE_URL
        const supabaseAnonKey = process.env.GATSBY_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase environment variables not configured')
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Fetch data in parallel
        const [dailyResult, audioResult, markovResult] = await Promise.all([
          supabase
            .from('daily')
            .select('id, title, created_at, coherency_level, cover_art, date')
            .order('date', { ascending: true }),
          supabase
            .from('daily_audio')
            .select('id, daily_id, storage_path, duration, format, created_at, coherency_level'),
          supabase
            .from('markov_texts')
            .select('id, daily_id, text_content, created_at, coherency_level')
        ])

        // Check for errors
        if (dailyResult.error) throw dailyResult.error
        if (audioResult.error) throw audioResult.error
        if (markovResult.error) throw markovResult.error

        // Sort audio entries by the daily entry dates
        const sortedAudioData = audioResult.data.sort((a, b) => {
          const dailyA = dailyResult.data.find((d) => d.id === a.daily_id)
          const dailyB = dailyResult.data.find((d) => d.id === b.daily_id)
          if (!dailyA || !dailyB) return 0
          return dailyA.date.localeCompare(dailyB.date)
        })

        setData({
          daily: dailyResult.data || [],
          audio: sortedAudioData || [],
          markovTexts: markovResult.data || [],
        })
      } catch (err) {
        console.error('Error fetching Supabase data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}
