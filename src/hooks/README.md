# Hooks

This directory contains custom React hooks used throughout the application.

## Available Hooks

### `useDebounce<T>(value: T, delay: number): T`

A generic hook that debounces value changes. Useful for reducing API calls when users are typing in search inputs.

**Parameters:**
- `value`: The value to debounce (can be any type)
- `delay`: The delay in milliseconds before updating the debounced value

**Returns:**
- The debounced value

**Example:**
```tsx
import { useDebounce } from '../hooks/use-debounce'

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500) // 500ms delay
  
  // searchTerm updates immediately for UI responsiveness
  // debouncedSearchTerm updates after 500ms of no typing
  
  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  )
}
```

**Use Cases:**
- Search inputs to reduce API calls
- Form validation to avoid excessive validation on every keystroke
- Any scenario where you want to delay an action until user input stops

### `usePresignedUrl`

Hook for generating presigned URLs for audio files stored in Supabase storage.

### `useSupabaseData`

Hook for fetching data from Supabase with filtering, sorting, and pagination support.

### `useAudioPlayer`

Hook for managing audio playback state and controls.

### `useIsMobile`

Hook for detecting mobile device viewport.

### `useScrollToTrack`

Hook for scrolling to specific tracks in the audio player.
