# Scripts

This directory contains various utility scripts for managing the blog.

## Cover Art Generation

### `generate-cover-art.ts`

Generates cover art for blog posts using the existing cover art generator and saves the PNG to your downloads folder.

**Usage:**
```bash
# Using the compiled version (recommended)
yarn generate-cover-art:compiled "Post Name"        # Generate 1 image
yarn generate-cover-art:compiled "Post Name" 5     # Generate 5 images

# Using ts-node directly (requires ts-node setup)
yarn generate-cover-art "Post Name"                # Generate 1 image
yarn generate-cover-art "Post Name" 5              # Generate 5 images
```

**Features:**
- Generates 2500x2500 PNG cover art based on the post name
- Uses seeded random generation for consistent results
- Automatically sanitizes filenames for safe saving
- Saves directly to your Downloads folder
- Creates organized folder structure for multiple images
- Provides detailed output including file size and location

**Examples:**
```bash
# Generate 1 image
yarn generate-cover-art:compiled "My Amazing Blog Post"
# Output: /Users/username/Downloads/my-amazing-blog-post-cover-art.png

# Generate 3 images
yarn generate-cover-art:compiled "My Amazing Blog Post" 3
# Output: 
# /Users/username/Downloads/my-amazing-blog-post-cover-art/
# ├── cover-art-1.png
# ├── cover-art-2.png
# └── cover-art-3.png
```

**Note:** The script uses the existing `cover-art-generator.ts` from `src/utils/` which generates abstract, artistic designs based on the post name.

## setup-cover-art-bucket.js

A script to set up and manage the Supabase cover-art bucket system for blog post cover art.

### Usage

```bash
# Initial setup - creates bucket with proper permissions
node scripts/setup-cover-art-bucket.js setup

# List all cover art files in the bucket
node scripts/setup-cover-art-bucket.js list

# Test bucket access and permissions
node scripts/setup-cover-art-bucket.js test

# Delete a specific cover art file
node scripts/setup-cover-art-bucket.js delete 25jul01.png

# Show help information
node scripts/setup-cover-art-bucket.js help
```

### What it does

- Creates the `cover-art` bucket in Supabase Storage with public access
- Configures proper MIME type restrictions (PNG, JPEG, JPG)
- Sets file size limits (10MB maximum)
- Provides tools to list, test, and manage cover art files
- Works with the cover art generation system in `init.js`

### Cover Art System

Cover art is automatically generated for each blog post using the Tat sketch algorithm:

- **Deterministic**: Same post name always generates the same cover art
- **High Quality**: 2500x2500 PNG images optimized for display
- **Visual Style**: Matches the aesthetic of the Tat sketch with geometric patterns
- **Integration**: Automatically displayed in the react-list-player header

## backfill-cover-art.js

A script to add cover art to all existing blog posts that don't already have it.

### Usage

```bash
# Preview what would be processed (recommended first step)
node scripts/backfill-cover-art.js --dry-run

# Backfill all posts with cover art (creates backups)
node scripts/backfill-cover-art.js

# Process only posts from July 2025
node scripts/backfill-cover-art.js --filter=25jul

# Process without creating backups (not recommended)
node scripts/backfill-cover-art.js --no-backup

# Show help information
node scripts/backfill-cover-art.js --help
```

### What it does

- Scans all blog posts in `content/blog/` for posts missing cover art
- Generates 4x4 grid cover art using the Tat sketch algorithm
- Uploads cover art to the Supabase `cover-art` bucket
- Updates blog post frontmatter with the cover art URL
- Creates timestamped backups for safety
- Processes posts with 1-second delays to be gentle on Supabase

### Safety Features

- **Dry run mode** to preview changes before execution
- **Automatic backups** with timestamps (unless `--no-backup`)
- **Smart detection** only processes posts that don't already have cover art
- **Error handling** continues processing even if individual posts fail
- **Cache busting** adds timestamps to URLs to prevent browser caching issues

## setup-markov-bucket.js

A script to set up and manage the Supabase markov-text bucket system.

### Usage

```bash
# Initial setup - creates bucket and uploads existing content
node scripts/setup-markov-bucket.js setup

# Upload a new text file to the bucket
node scripts/setup-markov-bucket.js upload path/to/your-text.txt

# List all files in the bucket
node scripts/setup-markov-bucket.js list

# Test Markov text generation
node scripts/setup-markov-bucket.js test
```

### What it does

- Creates the `markov-text` bucket in Supabase Storage
- Uploads txt files to the bucket for Markov text generation
- Provides tools to manage and test the text corpus
- Replaces the single-file approach with a multi-file cloud-based system

See `MARKOV_TEXT_SETUP.md` for complete documentation.

## refresh-markov.js

A script to replace existing Markov text in blog posts with newly generated content from the Supabase corpus.

### Usage

```bash
# Preview what would be changed (recommended first step)
node scripts/refresh-markov.js --dry-run

# Refresh all blog posts (creates backups automatically)
node scripts/refresh-markov.js

# Refresh with different line count
node scripts/refresh-markov.js --lines=3

# Refresh only specific posts
node scripts/refresh-markov.js --filter=25jul

# Skip creating backups (not recommended)
node scripts/refresh-markov.js --no-backup
```

### What it does

- Finds blog posts with existing Markov text (trailing blockquotes)
- Removes old Markov text while preserving all other content
- Generates new text using the rich Supabase multi-file corpus
- Creates timestamped backups for safety
- Processes posts safely with built-in delays

### Safety Features

- **Dry run mode** to preview changes
- **Automatic backups** with timestamps
- **Smart detection** only touches files with Markov text
- **Content preservation** maintains frontmatter and body content
- **Error handling** continues processing even if individual posts fail

## clean-descriptions.js

A script to clean description fields from blog post frontmatter, leaving empty `description: ` fields.

### Usage

```bash
# Preview what would be cleaned (recommended first step)
node scripts/clean-descriptions.js --dry-run

# Clean all descriptions (creates backups by default)
node scripts/clean-descriptions.js

# Clean without creating backups
node scripts/clean-descriptions.js --no-backup

# Clean only specific posts
node scripts/clean-descriptions.js --filter=25jul
```

### What it does

- Finds all blog posts with description content in frontmatter
- Removes any content after `description: ` while preserving the field
- Creates timestamped backups for safety (unless `--no-backup`)
- Only processes files that actually have description content to clean

### Safety Features

- **Dry run mode** to preview changes before execution
- **Automatic backups** with timestamps (optional)
- **Smart detection** only touches files with actual description content
- **Frontmatter preservation** maintains all other YAML fields exactly
- **Content safety** never touches post body content

## convert-sketch.js - P5.js Sketch Conversion Script

This script converts standalone p5.js sketches to work with the P5Sketch React component wrapper.

## Usage

```bash
node scripts/convert-sketch.js <input-sketch-path> <output-component-path> [component-name]
```

### Examples

```bash
# Convert a sketch from your p5-sketchbook
node scripts/convert-sketch.js /Users/dylanstratton/Code/p5-sketchbook/Grid/sketch.js src/components/grid-sketch/grid-sketch.js GridSketch

# Convert another sketch
node scripts/convert-sketch.js ../p5-sketchbook/AnotherSketch/sketch.js src/components/another-sketch/another-sketch.js AnotherSketch
```

## What the script does

1. **Reads the original sketch file** - Parses the standalone p5.js code
2. **Extracts global variables** - Converts them to local scope within the sketch function
3. **Converts global functions** - Transforms `setup()`, `draw()`, and other functions to p5 instance methods
4. **Handles class definitions** - Preserves and converts class structures
5. **Converts p5.js functions** - Adds `p.` prefix to all p5.js function calls
6. **Creates React component** - Wraps the sketch in a React component using P5Sketch

## Output

The script creates a React component that:

- Imports the P5Sketch wrapper
- Defines the sketch function with proper p5 instance usage
- Exports a React component that can be used in your Gatsby site

## Manual adjustments

After conversion, you may need to make some manual adjustments:

1. **Canvas size** - Change `p.createCanvas(p.windowWidth, p.windowHeight)` to fixed dimensions like `p.createCanvas(800, 600)`
2. **Function calls** - Ensure all p5.js functions are properly prefixed with `p.`
3. **Variable scope** - Check that variables are properly scoped within the sketch function

## Example output

```jsx
import React from 'react'
import P5Sketch from '../p5-sketch/p5-sketch'

const MySketchSketch = (p) => {
  // Global variables converted to local scope
  let particles = []
  let margin = 50

  p.setup = () => {
    p.createCanvas(800, 600)
    p.background(0)
  }

  p.draw = () => {
    // Your drawing code here
  }
}

const MySketch = ({ className = '', style = {} }) => {
  return (
    <P5Sketch sketch={MySketchSketch} className={className} style={style} />
  )
}

export default MySketch
```

## Testing

After conversion, you can test your sketch by:

1. Creating a test page that imports the component
2. Running the development server with `yarn start`
3. Visiting the test page to see the sketch in action

## Limitations

- The script may not handle all edge cases perfectly
- Complex sketches with unusual structures may need manual adjustments
- Some p5.js functions might need manual conversion
- The script focuses on common p5.js patterns and may miss specialized usage
