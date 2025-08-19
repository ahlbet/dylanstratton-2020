# Production to Local Migration Script

This script migrates all data from your production Supabase database and storage buckets to your local development environment.

## What it migrates

### Database Tables
- `daily` - Daily blog posts
- `daily_audio` - Audio files linked to blog posts  
- `markov_texts` - Markov chain text content

### Storage Buckets
- `audio` - Audio files (WAV, MP3, OGG, FLAC)
- `cover-art` - Cover art images (JPEG, PNG, GIF, WebP)

## Prerequisites

1. **Local Supabase running**: Make sure your local Supabase instance is running
   ```bash
   supabase start
   ```

2. **Production service role key**: You need your production Supabase service role key (not the anon key)
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the `service_role` key (not the `anon` key)

3. **Environment variable set**: Set the production service role key as an environment variable
   ```bash
   export PROD_SUPABASE_SERVICE_ROLE_KEY="your-production-service-role-key-here"
   ```

## Usage

### Basic Migration
```bash
node scripts/migrate-prod-to-local.js
```

### What the script does

1. **Environment Check**: Verifies the production service role key is set
2. **Create Local Buckets**: Sets up local storage buckets if they don't exist
3. **Database Migration**: 
   - Fetches all rows from production tables
   - Clears existing local data (respecting foreign key constraints)
   - Inserts production data into local tables
4. **Storage Migration**:
   - Downloads all files from production storage buckets
   - Uploads them to local storage buckets
5. **Cleanup**: Removes temporary downloaded files

### Output Example
```
🚀 Starting production to local migration...
🔍 Checking environment configuration...
✅ Environment configuration looks good
📡 Production URL: https://uzsnbfnteazzwirbqgzb.supabase.co
🏠 Local URL: http://127.0.0.1:54321

🪣 Creating local storage buckets...
✅ Created bucket 'audio'
✅ Created bucket 'cover-art'

📊 Starting database migration...

📊 Migrating table: daily
📥 Found 45 rows in production daily
🗑️  Cleared existing data in local daily
✅ Successfully migrated 45 rows to local daily

📊 Migrating table: daily_audio
📥 Found 23 rows in production daily_audio
🗑️  Cleared existing data in local daily_audio
✅ Successfully migrated 23 rows to local daily_audio

📊 Migrating table: markov_texts
📥 Found 156 rows in production markov_texts
🗑️  Cleared existing data in local markov_texts
✅ Successfully migrated 156 rows to local markov_texts

📊 Database migration summary: 3/3 tables successful, 224 total rows

📁 Starting storage migration...

📁 Downloading files from audio bucket...
📥 Found 18 files in audio bucket
✅ Downloaded 24may5.wav
✅ Downloaded 25jun14.wav
...
📊 Download summary for audio: 18 success, 0 errors

📤 Uploading files to local audio bucket...
✅ Uploaded 24may5.wav to local audio
✅ Uploaded 25jun14.wav to local audio
...
📊 Upload summary for audio: 18 success, 0 errors

📁 Downloading files from cover-art bucket...
📥 Found 12 files in cover-art bucket
✅ Downloaded cover1.jpg
✅ Downloaded cover2.png
...
📊 Download summary for cover-art: 12 success, 0 errors

📤 Uploading files to local cover-art bucket...
✅ Uploaded cover1.jpg to local cover-art
✅ Uploaded cover2.png to local cover-art
...
📊 Upload summary for cover-art: 12 success, 0 errors

📁 Storage migration summary: 2/2 buckets processed, 30 total files

🧹 Cleaning up temporary files...
✅ Cleaned up temporary files

✨ Migration completed successfully!
📊 Migrated 224 database rows and 30 storage files
```

## Troubleshooting

### Common Issues

1. **"PROD_SUPABASE_SERVICE_ROLE_KEY environment variable is required"**
   - Make sure you've set the environment variable
   - Use `export PROD_SUPABASE_SERVICE_ROLE_KEY="your-key"` before running the script

2. **"Error creating bucket"**
   - Check that your local Supabase is running (`supabase start`)
   - Verify the bucket doesn't already exist

3. **"Error fetching from production"**
   - Verify your production service role key is correct
   - Check that your production Supabase project is accessible

4. **"Error inserting into local"**
   - Ensure your local database schema matches production
   - Check that local Supabase is running

### Manual Steps if Needed

If the script fails, you can run individual functions:

```javascript
const { migrateTableData, downloadStorageFiles, uploadStorageFiles } = require('./migrate-prod-to-local')

// Migrate specific table
await migrateTableData('daily')

// Download storage files
await downloadStorageFiles('audio')

// Upload to local
await uploadStorageFiles('audio')
```

## Testing

Run the test suite to ensure the script works correctly:

```bash
yarn test scripts/migrate-prod-to-local.test.js
```

## Safety Features

- **Dry run capability**: The script doesn't modify production data
- **Error handling**: Graceful error handling with detailed logging
- **Cleanup**: Automatically removes temporary files
- **Validation**: Checks environment configuration before proceeding
- **Rollback safe**: Local data is cleared before migration, so you can re-run if needed
- **Filename correction**: Automatically fixes malformed filenames (e.g., "24jul21wav" → "24jul21.wav")

## Notes

- The script uses the service role key for full access to production data
- Local data is completely replaced (not merged)
- Temporary files are downloaded to `temp-migration-files/` and cleaned up automatically
- The script handles large files and provides progress updates
- All operations are logged for debugging purposes
