import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface SupabaseContextType {
  supabase: SupabaseClient | null
  loading: boolean
  error: string | null
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  loading: true,
  error: null,
})

export const useSupabase = () => {
  const context = useContext(SupabaseContext)

  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

interface SupabaseProviderProps {
  children: React.ReactNode
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({
  children,
}) => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const supabaseUrl = process.env.GATSBY_SUPABASE_URL
      const supabaseAnonKey = process.env.GATSBY_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        const error = `Supabase environment variables not configured. URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`
        throw new Error(error)
      }

      const client = createClient(supabaseUrl, supabaseAnonKey)
      setSupabase(client)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }, [])

  const contextValue = { supabase, loading, error }

  return (
    <SupabaseContext.Provider value={contextValue}>
      {children}
    </SupabaseContext.Provider>
  )
}
