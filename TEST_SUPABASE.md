# Testing Supabase Integration

## 1. Environment Setup

Create a `.env` file in your project root:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 2. Test with a Small File

1. **Create a test WAV file** in your Downloads folder:

   ```bash
   # Create a small test file (if you don't have one)
   ffmpeg -f lavfi -i "sine=frequency=1000:duration=5" ~/Downloads/test-audio.wav
   ```

2. **Run the init script**:

   ```bash
   node init.js test-supabase "Testing Supabase upload"
   ```

3. **Check the results**:
   - Look for upload success messages
   - Check your Supabase dashboard → Storage → audio bucket
   - Verify the generated markdown file has Supabase URLs

## 3. Expected Output

You should see:

```
Checked out to branch 'test-supabase'.
Found single WAV file 'test-supabase.wav'.
Created backup at '/Users/username/Downloads/test-supabase-backup.wav'.
Uploaded file 'test-supabase.wav' to Supabase.
Created folder 'test-supabase' and file 'test-supabase/test-supabase.md' with template content.
```

## 4. Verify the Generated Markdown

The generated file should contain:

```markdown
---
title: test-supabase
date: 2025-01-27
description: Testing Supabase upload
---

`audio: https://your-project.supabase.co/storage/v1/object/public/audio/test-supabase.wav`
```

## 5. Test Multiple Files

1. **Create a subfolder** in Downloads: `~/Downloads/test-multiple/`
2. **Add multiple WAV files** to the subfolder
3. **Run the script**: `node init.js test-multiple "Testing multiple files"`
4. **Verify all files uploaded** to Supabase

## 6. Troubleshooting

### Common Issues:

**"Missing Supabase credentials"**

- Check your `.env` file exists and has correct values
- Ensure no spaces around the `=` sign

**"Failed to upload to Supabase"**

- Check bucket permissions in Supabase dashboard
- Verify CORS settings include your domain
- Check file size limits (default is 50MB)

**"Bucket not found"**

- Ensure your bucket is named exactly `audio`
- Check bucket is public and has proper policies

## 7. Next Steps After Testing

Once testing is successful:

1. **Update Gatsby config** to remove local assets source
2. **Test with your actual blog** to ensure audio plays correctly
3. **Migrate existing audio files** if needed
4. **Monitor upload performance** and adjust as needed
