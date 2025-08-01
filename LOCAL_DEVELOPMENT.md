# Local Development Setup

This guide explains how to set up local development data to reduce Supabase API calls during development.

## Overview

The local development system allows you to:
- Use local audio files instead of fetching from Supabase storage
- Use local cover art instead of generating/uploading to Supabase
- Use local Markov texts instead of querying the Supabase database
- Use local Markov source text instead of downloading from Supabase storage

## Quick Start

1. **Generate local data**:
   ```bash
   yarn generate-local-data
   ```

2. **Fetch audio files from Supabase**:
   ```bash
   yarn fetch-audio
   ```

3. **Start development server with local data**:
   ```bash
   yarn start-local
   ```

   Or manually with environment variables:
   ```bash
   NODE_ENV=development GATSBY_USE_LOCAL_DATA=true yarn start
   ```

## What Gets Generated

The `generate-local-data` script creates:

### Audio Files
- **Location**: `static/local-audio/`
- **Source**: Downloaded from Supabase `audio` bucket (343 files, ~3GB)
- **Usage**: Audio URLs in blog posts are automatically converted to local paths

### Cover Art
- **Location**: `static/local-cover-art/`
- **Source**: Generated for 21 common posts including `25jul27`, `25jul25`, `25jul24`, `25jul23`, `25jul22`, `25jul01`, `25jul14`, `25jul15`, `25jul16`, `25jul17`, `25jul18`, `25jul20`, `25jun14`, `25jun30`, `25may12`, `25may13`, `25may14`, `25may16`, `25may18`, `25may20`, `25may25`
- **Usage**: Cover art URLs are automatically converted to local paths

### Markov Texts
- **Location**: `static/local-data/markov-texts.json`
- **Source**: Generated from Supabase `markov_texts` table (1000 texts)
- **Usage**: API calls use `/api/local-markov-text` instead of `/api/markov-text`

### Markov Source Text
- **Location**: `static/local-data/markov-source.txt`
- **Source**: Downloaded from Supabase `markov-text` bucket
- **Usage**: Markov generator uses local file instead of Supabase storage

## How It Works

### Environment Variables

- `GATSBY_USE_LOCAL_DATA=true`: Enables local development mode
- `GATSBY_LOCAL_FALLBACK_TO_SUPABASE=true`: Falls back to Supabase if local data is missing
- `NODE_ENV=development`: Must be set for local mode to work

### URL Conversion

The system automatically converts Supabase URLs to local URLs:

```javascript
// Supabase URL
https://uzsnbfnteazzwirbqgzb.supabase.co/storage/v1/object/public/audio/25jul27.wav

// Local URL (when GATSBY_USE_LOCAL_DATA=true)
/local-audio/25jul27.wav
```

### API Endpoints

- **Production**: `/api/markov-text` (queries Supabase database)
- **Local Dev**: `/api/local-markov-text` (serves local JSON file)

## Configuration Files

### `src/utils/local-dev-config.js`
Central configuration for local development settings.

### `src/utils/local-audio-urls.js`
Utilities for converting Supabase URLs to local URLs.

### `src/api/local-markov-text.js`
Local API endpoint that serves Markov texts from JSON file.

## Updating Local Data

### Automatic Updates (Recommended)

When you run `yarn new-day` in development mode (`NODE_ENV=development` and `GATSBY_USE_LOCAL_DATA=true`), the script automatically:
- Adds new audio files to `static/local-audio/`
- Adds new Markov texts to `static/local-data/markov-texts.json`
- Adds new cover art to `static/local-cover-art/`

**Note**: This only works when `NODE_ENV=development` and `GATSBY_USE_LOCAL_DATA=true` are set in your environment.

### Manual Updates

To manually refresh your local data:

1. **Regenerate everything**:
   ```bash
   yarn generate-local-data
   ```

2. **Fetch new audio files from Supabase**:
   ```bash
   yarn fetch-audio
   ```

3. **Add individual audio files**:
   ```bash
   cp path/to/new/audio.wav static/local-audio/
   ```

4. **Add more cover art**:
   ```bash
   # Edit scripts/generate-local-markov-data.js to add more post names
   yarn generate-local-data
   ```

## Troubleshooting

### Local Data Not Loading
- Check that `USE_LOCAL_DATA=true` is in your `.env` file
- Ensure `NODE_ENV=development`
- Restart your development server

### Missing Audio Files
- Run `yarn generate-local-data` to copy audio files
- Check that files exist in `static/local-audio/`
- Verify file permissions

### Missing Cover Art
- Run `yarn generate-local-data` to generate cover art
- Check that files exist in `static/local-cover-art/`
- Add more post names to the script if needed

### Markov Texts Not Working
- Check that `static/local-data/markov-texts.json` exists
- Verify the JSON structure is correct
- Check browser console for API errors

### Fallback to Supabase
If you want to fallback to Supabase when local data is missing:
```env
LOCAL_FALLBACK_TO_SUPABASE=true
```

## Performance Benefits

- **Faster Development**: No network requests to Supabase
- **Reduced API Calls**: Avoid hitting Supabase rate limits
- **Offline Development**: Work without internet connection
- **Consistent Data**: Same data across development sessions

## Production Deployment

Local development mode is automatically disabled in production:
- `NODE_ENV=production` disables local mode
- All URLs and API calls use Supabase
- No changes needed for deployment

## File Structure

```
static/
├── local-audio/           # Local audio files
│   ├── 25jul27.wav
│   ├── 25jul25.wav
│   └── ...
├── local-cover-art/       # Local cover art
│   ├── 25jul27.png
│   ├── 25jul25.png
│   └── ...
└── local-data/           # Local data files
    ├── markov-texts.json
    └── markov-source.txt
```

## Scripts

- `yarn generate-local-data`: Generate Markov texts, source text, and cover art
- `yarn fetch-audio`: Download all audio files from Supabase storage
- `yarn test-local-dev`: Test that all local data is properly set up
- `yarn test-init-local`: Test init.js local update functions
- `yarn debug-local-dev`: Debug local development environment variables
- `yarn test-url-conversion`: Test URL conversion logic
- `yarn start-local`: Start development server with local data enabled
- `yarn start`: Start development server (uses local data if enabled)
- `yarn build`: Build for production (always uses Supabase) 