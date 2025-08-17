# Audio Coherency Level Features

This document describes the new audio coherency level functionality added to the init script and the new CLI audio playback utility.

## Overview

The init script now supports setting coherency levels for individual audio tracks, and a new CLI audio player allows you to play audio files directly from the command line.

## Audio Coherency Levels

### What are Coherency Levels?

Coherency levels represent how "coherent" or "logical" an audio track is, on a scale from 1 to 100:

- **1-25**: Very random/jumbled, experimental, chaotic
- **26-50**: Somewhat random, loose structure
- **51-75**: Moderately coherent, clear patterns
- **76-100**: Highly coherent, logical flow, structured

### How it Works

When you run `node init.js <name>` and upload multiple audio files:

1. **For each audio track**, you'll be prompted to set a coherency level
2. **The level is stored** in the `daily_audio` table in Supabase
3. **The level appears** in your blog post and can be used for filtering/sorting

### Example Usage

```bash
node init.js my-new-post
```

During the process, you'll see prompts like:

```
🎵 Audio Track #1 Coherency Level
1 = Least coherent (random/jumbled)
100 = Fully coherent (clear, logical flow)
Track 1 of 3

Enter coherency level (1-100, or press Enter for default 50): 75
```

### Database Schema

The coherency levels are stored in the `daily_audio` table:

```sql
CREATE TABLE daily_audio (
  id INTEGER PRIMARY KEY,
  daily_id INTEGER REFERENCES daily(id),
  storage_path TEXT NOT NULL,
  duration INTEGER,
  format TEXT,
  coherency_level INTEGER DEFAULT 50, -- NEW FIELD
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## CLI Audio Player

### Overview

A new command-line audio player allows you to play audio files directly from the terminal.

### Installation

The script automatically detects available audio players on your system:

- **macOS**: `afplay` (built-in)
- **Linux**: `aplay` (ALSA)
- **Cross-platform**: `mpv`, `ffplay`, `vlc`

### Usage

#### Basic Usage

```bash
# Play a local audio file
yarn play-audio ./local-audio/song.wav

# Play audio from URL
yarn play-audio https://example.com/audio.wav

# Play from downloads folder
yarn play-audio ~/Downloads/song.wav
```

#### Help

```bash
yarn play-audio --help
```

### Examples

```bash
# Play a local WAV file
yarn play-audio ./content/assets/music/song.wav

# Play from Supabase URL
yarn play-audio "https://your-project.supabase.co/storage/v1/object/public/audio/song.wav"

# Play from home directory
yarn play-audio "~/Music/song.mp3"
```

### Controls

- **Start playback**: The script automatically starts playing
- **Stop playback**: Press `Ctrl+C` to stop
- **Supported formats**: WAV, MP3, OGG, M4A, AAC, FLAC

### Installation Requirements

#### macOS

```bash
# Install mpv (recommended)
brew install mpv

# Or use built-in afplay (already available)
```

#### Ubuntu/Debian

```bash
# Install mpv
sudo apt install mpv

# Or install FFmpeg
sudo apt install ffmpeg
```

#### Windows

```bash
# Install mpv via chocolatey
choco install mpv

# Or download VLC from https://www.videolan.org/
```

## Integration with Existing Features

### Blog Posts

Coherency levels are automatically displayed in your blog posts:

```markdown
---
title: my-post
daily_id: 123
---

`audio: https://supabase.co/storage/v1/object/public/audio/track1.wav` (Coherency: 75)
`audio: https://supabase.co/storage/v1/object/public/audio/track2.wav` (Coherency: 45)
```

### Audio Player Components

The coherency levels are available in your React components:

```javascript
// In your audio player component
const audioData = supabaseData.audio.map((audio) => ({
  url: audio.storage_path,
  duration: audio.duration,
  coherencyLevel: audio.coherency_level, // Available here
}))
```

### Filtering and Sorting

You can now filter and sort audio tracks by coherency level:

```javascript
// Sort by coherency level (most coherent first)
const sortedAudio = audioData.sort(
  (a, b) => b.coherency_level - a.coherency_level
)

// Filter for highly coherent tracks
const coherentTracks = audioData.filter((track) => track.coherency_level >= 75)
```

## Testing

### Test the Init Script

```bash
# Test with a new post
node init.js test-audio-coherency

# Check that coherency levels are prompted for each audio track
# Verify they're saved to the database
```

### Test the Audio Player

```bash
# Test help
yarn play-audio --help

# Test with a local file
yarn play-audio ./test-audio.wav

# Test with a URL
yarn play-audio "https://example.com/test.wav"
```

### Run Tests

```bash
# Test the audio player script
yarn test scripts/play-audio.test.js

# Test the init script
yarn test init.test.js
```

## Troubleshooting

### Common Issues

1. **No audio playback tools found**
   - Install mpv: `brew install mpv` (macOS) or `apt install mpv` (Ubuntu)
   - Or install VLC from https://www.videolan.org/

2. **Coherency level not saving**
   - Check your Supabase credentials
   - Verify the `daily_audio` table has the `coherency_level` column

3. **Audio won't play**
   - Check file format support
   - Verify file path/URL is correct
   - Check audio player installation

### Debug Mode

```bash
# Run init script with verbose logging
DEBUG=* node init.js my-post

# Check Supabase logs for database errors
```

## Future Enhancements

### Potential Features

1. **Batch coherency level setting**: Set levels for multiple tracks at once
2. **Coherency level editing**: Update levels for existing tracks
3. **Audio analysis**: Automatically suggest coherency levels based on audio content
4. **Playlist generation**: Create playlists based on coherency levels
5. **Visual coherency display**: Show coherency levels in the web interface

### API Endpoints

```javascript
// Future API endpoint for updating coherency levels
PUT /api/audio/:id/coherency-level
{
  "coherency_level": 85
}
```

## Contributing

To add new features or improve the audio coherency system:

1. **Update the init script** in `init.js`
2. **Add database migrations** if needed
3. **Update tests** in the test files
4. **Document changes** in this README

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the test files for examples
3. Check the Supabase dashboard for database issues
4. Review the console output for error messages
