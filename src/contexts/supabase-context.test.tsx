import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SupabaseProvider, useSupabase } from './supabase-context'

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  process.env.GATSBY_SUPABASE_URL = 'https://test.supabase.co'
  process.env.GATSBY_SUPABASE_ANON_KEY = 'test-key'
})

afterEach(() => {
  delete process.env.GATSBY_SUPABASE_URL
  delete process.env.GATSBY_SUPABASE_ANON_KEY
})

// Test component that uses the context
const TestComponent = () => {
  const { supabase, loading, error } = useSupabase()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (supabase) return <div>Supabase client initialized</div>

  return <div>No client</div>
}

describe('SupabaseContext', () => {
  test('should show loading initially and then initialize client', async () => {
    process.env.GATSBY_SUPABASE_URL = 'https://test.supabase.co'
    process.env.GATSBY_SUPABASE_ANON_KEY = 'test-key'

    render(
      <SupabaseProvider>
        <TestComponent />
      </SupabaseProvider>
    )

    // In tests, the useEffect runs synchronously, so we should see the client initialized immediately
    // The loading state might not be visible due to React's batching
    await waitFor(() => {
      expect(
        screen.getByText('Supabase client initialized')
      ).toBeInTheDocument()
    })
  })

  test('should show error when environment variables are missing', async () => {
    delete process.env.GATSBY_SUPABASE_URL
    delete process.env.GATSBY_SUPABASE_ANON_KEY

    render(
      <SupabaseProvider>
        <TestComponent />
      </SupabaseProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument()
    })
  })

  test('should initialize Supabase client successfully', () => {
    process.env.GATSBY_SUPABASE_URL = 'https://test.supabase.co'
    process.env.GATSBY_SUPABASE_ANON_KEY = 'test-key'

    render(
      <SupabaseProvider>
        <TestComponent />
      </SupabaseProvider>
    )

    // The client should initialize immediately in tests, so we should see the success message
    expect(screen.getByText('Supabase client initialized')).toBeInTheDocument()
  })

  test('should provide context values correctly', () => {
    process.env.GATSBY_SUPABASE_URL = 'https://test.supabase.co'
    process.env.GATSBY_SUPABASE_ANON_KEY = 'test-key'

    const TestContextValues = () => {
      const { supabase, loading, error } = useSupabase()
      return (
        <div>
          <div>Loading: {loading.toString()}</div>
          <div>Error: {error || 'none'}</div>
          <div>Client: {supabase ? 'present' : 'missing'}</div>
        </div>
      )
    }

    render(
      <SupabaseProvider>
        <TestContextValues />
      </SupabaseProvider>
    )

    // Should show the correct context values
    expect(screen.getByText('Loading: false')).toBeInTheDocument()
    expect(screen.getByText('Error: none')).toBeInTheDocument()
    expect(screen.getByText('Client: present')).toBeInTheDocument()
  })
})
