# Audio Lazy Loading Implementation

## Overview

This document describes the implementation of lazy loading for audio files in the project. Previously, all audio files were loaded immediately when navigating to `/all` or blog post pages, causing performance issues and unnecessary bandwidth usage.

## What Was Changed

### 1. **Removed `useTrackDurations` Hook**

**Before**: The hook automatically loaded metadata for ALL audio files when the component mounted, using `preload="metadata"` on Audio elements.

**After**: **REMOVED** - Audio durations are now stored directly in the Supabase `daily_audio` table and passed through the component props.

**Key Changes**:

- Completely removed the `useTrackDurations` hook
- Durations are now fetched from the database instead of audio files
- No more client-side audio metadata loading

### 2. **FixedAudioPlayer Component (`src/components/fixed-audio-player/FixedAudioPlayer.js`)**

**Before**: Used `preload="auto"` which could trigger audio loading

**After**:

- Changed to `preload="none"` to prevent automatic loading
- Removed duration loading logic since durations come from database
- Only loads audio when actually needed for playback

### 3. **AllSongsPlaylist Component (`src/components/all-songs-playlist/all-songs-playlist.js`)**

**Before**: Used the old `useTrackDurations` hook that loaded all durations at once

**After**:

- **REMOVED** duration loading hooks
- Uses duration data directly from Supabase `daily_audio` table
- Durations are passed through `audioUrlsWithMetadata` prop

### 4. **BlogAudioPlayer Component (`src/components/blog-audio-player/BlogAudioPlayer.js`)**

**Before**: Used the old `useTrackDurations` hook that loaded all durations at once

**After**:

- **REMOVED** duration loading hooks
- Uses duration data directly from Supabase `daily_audio` table
- Durations are passed through `audioData` prop

### 5. **Audio Player Context (`src/contexts/audio-player-context/audio-player-context.js`)**

**Before**: Had `loadTrackAudio()` function for lazy loading audio metadata

**After**:

- **REMOVED** `loadTrackAudio()` function
- Simplified `playTrack()` function since no metadata loading is needed
- Audio is only loaded when actually played

### 6. **`/all` Page (`src/pages/all.js`)**

**Before**: Extracted audio URLs from markdown files (no duration data)

**After**:

- **PRIORITY**: Uses custom API endpoint `/api/all-audio` for complete audio metadata with proper integer IDs
- **FALLBACK**: GraphQL data with UUID conversion handling
- **LEGACY**: Markdown extraction for posts without Supabase data
- Gets durations directly from database instead of loading audio files
- **AVOIDS UUID CONVERSION**: Custom API endpoint bypasses Gatsby Supabase plugin's UUID conversion

### 7. **New API Endpoint (`src/api/all-audio.js`)**

**Purpose**: Bypass Gatsby Supabase plugin's UUID conversion to get proper integer IDs

**Features**:

- Direct Supabase client queries (no UUID conversion)
- Proper foreign key relationships between `daily_audio` and `daily` tables
- Returns pre-linked data with audio metadata and daily entry information
- CORS-enabled for cross-origin requests
- Fallback support for the `/all` page

**Why Created**: The Gatsby Supabase plugin converts integer IDs to UUIDs, breaking foreign key relationships. This API endpoint provides the same data with proper integer IDs.

## How It Works Now

### 1. **Page Load**

- Playlist is set with track URLs and durations from Supabase database
- **NO** audio files are loaded
- **NO** metadata extraction from audio files
- All duration data comes from the `daily_audio.duration` field

### 2. **Track Selection**

- When a user clicks on a track, duration is already available from database
- **NO** additional loading needed
- Audio file is only fetched when `playTrack()` is called

### 3. **Audio Playback**

- Audio is only fetched when `playTrack()` is called
- The main audio element in FixedAudioPlayer only loads audio when actually needed
- **NO** preloading of audio metadata

## Benefits

1. **Performance**: Pages load much faster since no audio files are fetched
2. **Bandwidth**: Only loads audio files that users actually want to hear
3. **User Experience**: Faster page navigation and better responsiveness
4. **Scalability**: Performance doesn't degrade with large numbers of audio files
5. **Database Efficiency**: Durations are stored once in database, not extracted repeatedly
6. **Simplified Code**: Removed complex duration loading logic

## Database Schema

The implementation relies on the Supabase `daily_audio` table structure:

```sql
CREATE TABLE daily_audio (
  id INTEGER PRIMARY KEY,
  daily_id INTEGER REFERENCES daily(id),
  storage_path TEXT NOT NULL,
  duration INTEGER, -- Audio duration in seconds
  format TEXT,     -- Audio format (e.g., 'audio/wav')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Backward Compatibility

The changes maintain backward compatibility:

- All existing components continue to work
- Fallback to markdown extraction for posts without Supabase data
- Existing playlist functionality is preserved
- Audio playback behavior is unchanged

## Future Improvements

1. **Intersection Observer**: Could implement lazy loading based on scroll position
2. **Prefetching**: Could prefetch next few tracks in a playlist for smoother playback
3. **Progressive Loading**: Could load audio in chunks for very large files
4. **Background Loading**: Could load audio in background threads when available

## Usage Examples

### Getting Duration from Audio Metadata

```javascript
// Duration is now part of the audioItem object from Supabase
const audioData = supabaseData.audio.map((audio) => ({
  url: audio.storage_path,
  duration: audio.duration, // Already available from database
  format: audio.format,
}))
```

### Using the Custom API Endpoint

```javascript
// Fetch audio data with proper integer IDs (no UUID conversion)
const fetchAudioData = async () => {
  try {
    const response = await fetch('/api/all-audio')
    const data = await response.json()

    // Data is pre-linked with proper relationships
    const audioWithMetadata = data.audio.map((audio) => ({
      url: audio.storage_path,
      duration: audio.duration,
      postTitle: audio.daily?.title || 'Unknown',
      postDate: audio.daily?.created_at || 'Unknown Date',
    }))

    return audioWithMetadata
  } catch (error) {
    console.error('Failed to fetch audio data:', error)
    return []
  }
}
```

### Displaying Duration in Components

```javascript
// No need to load duration - it's already available
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Use directly from metadata
const duration = item.duration ? formatDuration(item.duration) : '0:00'
```

### No More Duration Loading

```javascript
// This is no longer needed - durations come from database
// const { loadSingleTrackDuration } = useTrackDurations([])
// await loadSingleTrackDuration(url)
```
