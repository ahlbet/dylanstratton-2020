# Supabase Migration Plan

## Overview
Migrate audio file storage from local filesystem to Supabase Storage to handle scalability and avoid GitHub repo size limits.

## Required Changes

### 1. **Dependencies & Environment Setup**

#### Install Supabase client:
```bash
npm install @supabase/supabase-js
```

#### Environment variables needed:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (for admin operations)
```

### 2. **Init Script Changes** (`init.js`)

#### ✅ Already Updated:
- Added placeholder for Supabase client integration
- Created `uploadToSupabase()` function
- Updated file processing to upload instead of move
- Changed audio content generation to use Supabase URLs

#### 🔄 Still Needed:
- Uncomment and implement actual Supabase upload logic
- Add proper error handling for upload failures
- Make the script async to handle uploads properly
- Add retry logic for failed uploads

### 3. **Gatsby Configuration Changes**

#### Update `gatsby-config.js`:
```javascript
// Remove or comment out the assets filesystem source
// {
//   resolve: 'gatsby-source-filesystem',
//   options: {
//     path: `${__dirname}/content/assets`,
//     name: 'assets',
//   },
// },
```

#### Update `gatsby-remark-audio` configuration:
```javascript
{
  resolve: 'gatsby-remark-audio',
  options: {
    preload: 'auto',
    loop: false,
    controls: true,
    muted: false,
    autoplay: false,
    // Add support for external URLs
    externalAudio: true,
  },
},
```

### 4. **Template Updates**

#### Update `src/template.md`:
```markdown
---
title: {name}
date: {date}
description: {description}
---

{audio_files}
```

The `{audio_files}` placeholder will now generate Supabase URLs instead of local paths.

### 5. **Blog Post Template Updates**

#### Update `src/templates/blog-post/blog-post.js`:
- Ensure the audio player can handle external URLs
- Add loading states for remote audio files
- Add error handling for failed audio loads

### 6. **Database Schema (Optional)**

#### Create a Supabase table for audio metadata:
```sql
CREATE TABLE audio_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_audio_files_blog_post ON audio_files(blog_post_name);
```

### 7. **Migration Script**

#### Create `migrate-to-supabase.js`:
```javascript
// Script to migrate existing local files to Supabase
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Upload all existing audio files to Supabase
// Update existing blog posts to use new URLs
```

### 8. **Testing Updates**

#### Update `init.test.js`:
- Mock Supabase client instead of file system operations
- Test upload success/failure scenarios
- Test URL generation for audio content

### 9. **Deployment Considerations**

#### Environment Variables:
- Add Supabase credentials to deployment environment
- Ensure proper CORS configuration in Supabase
- Set up proper bucket policies

#### Build Process:
- Remove audio files from build process
- Update `.gitignore` to exclude audio files
- Update build scripts to handle external assets

## Implementation Steps

### Phase 1: Setup & Infrastructure
1. Set up Supabase project
2. Create storage bucket
3. Configure CORS and policies
4. Install dependencies

### Phase 2: Core Implementation
1. Implement Supabase upload in init script
2. Update Gatsby configuration
3. Test with new blog posts

### Phase 3: Migration
1. Create migration script
2. Migrate existing audio files
3. Update existing blog posts
4. Remove local audio files

### Phase 4: Cleanup
1. Remove local storage code
2. Update documentation
3. Clean up build process

## Benefits

### ✅ Advantages:
- **Scalability**: No GitHub repo size limits
- **Performance**: CDN delivery for audio files
- **Cost**: Pay only for storage used
- **Reliability**: Supabase handles backups and redundancy
- **Access Control**: Fine-grained permissions if needed

### ⚠️ Considerations:
- **Dependency**: Now depends on Supabase service
- **Cost**: Storage and bandwidth costs
- **Complexity**: More complex setup and debugging
- **Migration**: One-time effort to move existing files

## Rollback Plan

If issues arise:
1. Keep local backup of all audio files
2. Maintain local storage code in git history
3. Can quickly revert to local storage if needed
4. Gradual migration allows testing before full switch

## Next Steps

1. Set up Supabase project and get credentials
2. Implement the actual Supabase upload logic in init.js
3. Test with a small set of files
4. Gradually migrate existing content
5. Monitor performance and costs 