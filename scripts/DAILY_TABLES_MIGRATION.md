# Daily Tables Migration Guide

This guide explains how to migrate your existing markdown blog posts to use the new Supabase daily tables structure.

## Database Schema

The migration creates the following table structure:

### `daily` table
- `id` (integer, primary key)
- `title` (text) - matches your markdown file naming

### `daily_audio` table
- `id` (integer, primary key)
- `daily_id` (foreign key → daily.id)
- `storage_path` (text) - points to your Supabase bucket key
- `duration` (integer, optional) - audio duration in seconds
- `format` (text, optional) - audio format (e.g., 'wav')
- `bitrate` (integer, optional) - audio bitrate

### `markov_texts` table (updated)
- `id` (integer, primary key)
- `daily_id` (foreign key → daily.id) - **NEW FIELD**
- `text_content` (text)
- `created_at` (timestamp)

## Migration Process

### 1. Prerequisites

Ensure you have:
- Supabase project set up with the tables created
- Environment variables configured in `.env`:
  ```
  SUPABASE_URL=your_supabase_project_url
  SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
  ```

### 2. Run the Migration

Execute the comprehensive migration script:

```bash
node scripts/migrate-to-daily-tables.js
```

This script will:
1. Add `daily_id` frontmatter to all existing markdown files
2. Create corresponding entries in the `daily` table
3. Link existing audio files to the `daily_audio` table

### 3. Individual Scripts

You can also run the scripts individually:

#### Add daily_id to markdown files:
```bash
node scripts/add-daily-ids-to-markdown.js
```

#### Link audio files to daily_audio table:
```bash
node scripts/link-audio-to-daily.js
```

## What the Migration Does

### For Each Markdown File:

1. **Extracts the title** from the directory name (e.g., `25may25`)
2. **Creates a daily entry** in the `daily` table with that title
3. **Adds the daily_id** to the markdown frontmatter
4. **Extracts audio URLs** from the markdown content
5. **Creates daily_audio entries** linking each audio file to the daily entry

### Example Before/After:

**Before:**
```yaml
---
title: 25may25
date: '2025-05-25T13:16:31.000Z'
description: 
cover_art: https://...
---
```

**After:**
```yaml
---
title: 25may25
date: '2025-05-25T13:16:31.000Z'
description: 
cover_art: https://...
daily_id: 1
---
```

## New Blog Post Creation

After migration, new blog posts created with `node init.js <name>` will automatically:

1. Create a `daily` table entry
2. Include the `daily_id` in the frontmatter
3. Link markov texts to the `daily_id`
4. Link audio files to the `daily_audio` table

## Verification

After running the migration, verify:

1. **Check markdown files**: All should have `daily_id` in frontmatter
2. **Check Supabase dashboard**: 
   - `daily` table should have entries for each blog post
   - `daily_audio` table should have entries for each audio file
   - `markov_texts` table should have `daily_id` values populated

3. **Test new post creation**: Run `node init.js test-post` to ensure new posts work correctly

## Troubleshooting

### Common Issues:

1. **Missing environment variables**: Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
2. **Table doesn't exist**: Create the tables in Supabase first
3. **Permission errors**: Ensure your service role key has write permissions

### Rollback:

If you need to rollback:
1. Remove `daily_id` from markdown frontmatter
2. Delete entries from `daily` and `daily_audio` tables
3. Remove `daily_id` from `markov_texts` table

## Benefits

This migration provides:

- **Structured relationships** between blog posts, audio, and markov texts
- **Better querying capabilities** for related content
- **Consistent data model** for future features
- **Easier content management** through database relationships 