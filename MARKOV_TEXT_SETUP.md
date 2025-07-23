# Markov Text Bucket Setup Guide

## Overview

Your Markov text generation system has been upgraded to pull from multiple txt files stored in a Supabase `markov-text` bucket instead of using a single local file. This allows you to:

- Store multiple text sources in the cloud
- Easily add/remove text content without code changes
- Combine different literary sources for richer generation
- Maintain text content independently from your codebase

## Setup Instructions

### 1. Prerequisites

Ensure you have your Supabase credentials in your `.env` file:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Initial Setup

Run the setup script to create the bucket and upload your existing content:

```bash
node scripts/setup-markov-bucket.js setup
```

This will:
- Create the `markov-text` bucket in Supabase
- Upload your existing `448.txt` file (if it exists)
- Show you the current bucket contents

### 3. Managing Text Files

#### Upload additional text files:
```bash
node scripts/setup-markov-bucket.js upload path/to/your-text.txt
```

#### List current files in the bucket:
```bash
node scripts/setup-markov-bucket.js list
```

#### Test Markov generation:
```bash
node scripts/setup-markov-bucket.js test
```

## How It Works

### Text Compilation Process

1. **Fetch All Files**: The system downloads all `.txt` files from your `markov-text` bucket
2. **Compile Content**: All text files are combined into a single corpus
3. **Clean & Normalize**: Text is cleaned to remove excessive whitespace and normalize formatting
4. **Build N-grams**: The combined text is processed into n-grams for Markov chain generation

### Fallback System

The system includes multiple fallback layers:

1. **Primary**: Load from Supabase `markov-text` bucket
2. **Secondary**: Load from local `static/448.txt` file
3. **Tertiary**: Use hardcoded sample text

This ensures your blog generation never fails, even if Supabase is temporarily unavailable.

### Text Cleaning Features

The system automatically:
- Removes excessive whitespace
- Normalizes line breaks
- Ensures proper sentence endings
- Combines multiple sources seamlessly

## File Requirements

### Supported Formats
- `.txt` files only
- UTF-8 encoding
- Plain text content

### File Size Limits
- Individual files: Up to 10MB
- Total bucket: No hard limit (pay for what you use)

### Naming Conventions
- Use descriptive names (e.g., `poetry-collection.txt`, `prose-excerpts.txt`)
- Avoid special characters
- Include file extensions (`.txt`)

## Usage in Your Workflow

### When Creating New Blog Posts

The Markov text generation now automatically:
1. Pulls from all txt files in your Supabase bucket
2. Compiles them into a rich text corpus
3. Generates unique content for each blog post

### For P5.js Sketches

P5.js sketches still use the local `448.txt` file for client-side compatibility, but you can sync this file with your Supabase content.

## Supabase Bucket Configuration

### Bucket Settings
- **Name**: `markov-text`
- **Public Access**: Enabled
- **MIME Types**: `text/plain`
- **File Size Limit**: 10MB per file

### Required Policies

Make sure your bucket has the correct policies:

```sql
-- Allow public read access to markov-text files
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'markov-text');
```

## Troubleshooting

### Common Issues

**"Missing Supabase credentials"**
- Check your `.env` file has the correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Restart your development server after updating `.env`

**"No txt files found in bucket"**
- Run `node scripts/setup-markov-bucket.js list` to check bucket contents
- Upload files using `node scripts/setup-markov-bucket.js upload <file-path>`

**"Failed to load from Supabase"**
- Check your internet connection
- Verify Supabase service status
- The system will automatically fall back to local files

### Debug Mode

Add logging to see what's happening:

```javascript
// The system automatically logs:
// - Files found in bucket
// - Download progress
// - Compilation statistics
// - Fallback usage
```

## Best Practices

### Content Organization
- **Separate by genre**: Create different txt files for poetry, prose, lyrics, etc.
- **Thematic grouping**: Group related content together
- **Version control**: Keep backups of your text files locally

### Content Curation
- **Quality over quantity**: Better to have fewer, high-quality sources
- **Consistent style**: Similar writing styles generate more coherent text
- **Regular updates**: Add new content periodically to keep generation fresh

### Performance Tips
- **File sizes**: Keep individual files under 1MB for faster downloads
- **File count**: 5-20 text files is usually optimal
- **Update frequency**: Changes take effect immediately, no cache clearing needed

## Example Workflow

1. **Add new text source**:
   ```bash
   node scripts/setup-markov-bucket.js upload ./new-poetry.txt
   ```

2. **Test the generation**:
   ```bash
   node scripts/setup-markov-bucket.js test
   ```

3. **Create a blog post** (uses new content automatically):
   ```bash
   node init.js 25dec25 "new post with updated markov text"
   ```

## Migration Notes

If you had custom text in your old `448.txt` file:
1. Your existing content is automatically uploaded during setup
2. The local file remains as a fallback for P5.js sketches
3. All new blog posts use the Supabase bucket system
4. No code changes needed in your existing workflow

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify your Supabase bucket permissions
3. Test with `node scripts/setup-markov-bucket.js test`
4. Fall back to local files if needed (automatic)

The system is designed to be robust and always provide content for your blog posts, even if there are temporary issues with Supabase. 