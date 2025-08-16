# Song Backfill Script

This script processes audio files from your downloads folder and creates blog posts for each one, complete with audio uploads, cover art generation, and Markov text.

## Setup

1. **Create the downloads folder:**

   ```bash
   mkdir -p ~/Downloads/backfill-songs
   ```

2. **Place your audio files in the folder:**
   - Supported formats: `.wav`, `.mp3`, `.ogg`, `.m4a`, `.aac`, `.flac`
   - Use descriptive filenames (they'll become the blog post titles)
   - Example: `24jul01.wav`, `my-awesome-song.mp3`

3. **Ensure your `.env` file has Supabase credentials:**
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_ANON_KEY=your_anon_key
   ```

## Usage

### Test Run (Recommended First)

```bash
node scripts/backfill-songs.js --dry-run
```

This will show you what the script would do without making any changes.

### Process All Files

```bash
node scripts/backfill-songs.js
```

This will:

1. Upload each audio file to Supabase storage
2. Generate cover art using the song name as seed
3. Upload cover art to Supabase storage
4. Generate 5 Markov text blockquotes
5. Create blog post markdown files

### Help

```bash
node scripts/backfill-songs.js --help
```

## What the Script Does

For each audio file, the script:

1. **Uploads Audio**: Uploads the file to Supabase `audio` bucket
2. **Generates Cover Art**: Creates unique 2500x2500 PNG cover art using the song name as a seed
3. **Uploads Cover Art**: Uploads the cover art to Supabase `cover-art` bucket
4. **Generates Markov Text**: Creates 5 blockquotes of Markov-generated text
5. **Creates Blog Post**: Creates a markdown file in `content/blog/[song-name]/[song-name].md`

## Output Structure

```
content/blog/
├── 24jul01/
│   └── 24jul01.md
├── 24jul21/
│   └── 24jul21.md
└── ...
```

Each blog post will have:

- Frontmatter with title, date, description, and cover art URL
- Audio player (using the `audio:` syntax)
- 5 Markov-generated blockquotes

## Example Blog Post

```markdown
---
title: 24jul01
date: '2025-01-27T10:30:00.000Z'
description:
cover_art: https://your-supabase-url/storage/v1/object/public/cover-art/24jul01.png?v=1234567890
---

`audio: https://your-supabase-url/storage/v1/object/public/audio/24jul01.wav?v=1234567890`

> First Markov-generated blockquote here.

> Second Markov-generated blockquote here.

> Third Markov-generated blockquote here.

> Fourth Markov-generated blockquote here.

> Fifth Markov-generated blockquote here.
```

## Safety Features

- **Dry-run mode**: Test without making changes
- **Delay between posts**: 2-second delay to avoid overwhelming the server
- **Error handling**: Continues processing other files if one fails
- **File validation**: Only processes supported audio formats
- **Safe filenames**: Sanitizes filenames for storage

## Troubleshooting

### "Downloads directory not found"

Make sure you've created `~/Downloads/backfill-songs/` and placed audio files there.

### "Missing Supabase credentials"

Check your `.env` file has the required Supabase environment variables.

### "Upload failed"

Check your internet connection and Supabase credentials. The script will continue with other files.

### "No audio files found"

Make sure your audio files have supported extensions (`.wav`, `.mp3`, etc.).

## Notes

- The script uses the filename (without extension) as the blog post title
- Cover art is generated using a deterministic seed based on the song name
- Markov text is generated using your existing Markov text corpus
- All files are uploaded with cache-busting parameters
- The script processes files sequentially to avoid overwhelming the server
