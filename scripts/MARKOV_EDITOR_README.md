# Markov Text Editor CLI

A command-line tool for manually editing Markov-generated texts stored in your Supabase database.

## Setup

### 1. Add the required columns to your database

First, run the setup scripts to add the required columns:

```bash
# Add the 'edited' column
node scripts/add-edited-column.js

# Add the 'coherency_level' column
node scripts/add-coherency-level-column.js
```

This will:
- Add an `edited` boolean column to the `markov_texts` table
- Add a `coherency_level` integer column (1-100) to the `markov_texts` table
- Set appropriate default values and constraints
- Create indexes for better performance

If the automatic setup fails, you can run this SQL manually in your Supabase SQL editor:

```sql
-- Add edited column
ALTER TABLE markov_texts ADD COLUMN edited BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_markov_texts_edited ON markov_texts (edited);

-- Add coherency_level column
ALTER TABLE markov_texts ADD COLUMN coherency_level INTEGER DEFAULT 1;
ALTER TABLE markov_texts ADD CONSTRAINT check_coherency_level CHECK (coherency_level >= 1 AND coherency_level <= 100);
CREATE INDEX idx_markov_texts_coherency_level ON markov_texts (coherency_level);
UPDATE markov_texts SET coherency_level = 1 WHERE coherency_level IS NULL;
```

### 2. Start the editor

```bash
node scripts/markov-text-editor.js
```

## How it works

The editor will:

1. **Fetch 5 random unedited texts** from your `markov_texts` table
2. **Display each text one by one** with options to:
   - Edit the text
   - Skip to the next text
   - Mark as edited without changes
   - Exit the editor
3. **Save your edits** back to the database
4. **Mark texts as edited** so they won't be fetched again in future sessions

## Features

- **Random selection**: Always fetches different texts each time
- **Multi-line editing**: Support for multi-line text input
- **Coherency level editing**: Assign and edit coherency levels (1-100) for each text
- **Skip functionality**: Skip texts you don't want to edit
- **Session summary**: Shows how many texts you edited/skipped
- **Graceful exit**: Press Ctrl+C to exit at any time
- **Validation**: Prevents saving empty texts

## Usage Example

```
🎲 Markov Text Editor
====================
🎲 Fetching 5 random unedited texts...
📊 Found 1250 unedited texts total
✅ Fetched 5 texts

📝 Ready to edit 5 texts
Press Ctrl+C at any time to exit

==========================================
📝 Text 1 of 5 (ID: 1234)
📏 Length: 245 characters
📅 Created: 1/15/2025
==========================================

📄 Current text:
────────────────────────────────────────
The quick brown fox jumps over the lazy dog. 
A journey of a thousand miles begins with a single step.
────────────────────────────────────────

Options:
1. Edit text (line by line)
2. Edit coherency level
3. Skip this text
4. Mark as edited without changes
5. Exit editor

Enter your choice (1-5): 1

📝 Enter your edited text (press Enter twice to finish):
💡 Tip: You can use multiple lines. Press Enter twice when done.
> The quick brown fox jumps over the lazy dog.
> A journey of a thousand miles begins with a single step.
> Every cloud has a silver lining.
> 

📄 Edited text:
────────────────────────────────────────
The quick brown fox jumps over the lazy dog.
A journey of a thousand miles begins with a single step.
Every cloud has a silver lining.
────────────────────────────────────────

Save this edit? (y/n): y
✅ Text saved successfully!
```

## Database Schema

The `markov_texts` table should have these columns:

- `id` (SERIAL PRIMARY KEY)
- `text_content` (TEXT NOT NULL)
- `text_length` (INTEGER NOT NULL)
- `created_at` (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
- `metadata` (JSONB DEFAULT '{}'::jsonb)
- `edited` (BOOLEAN DEFAULT FALSE) ← Added by this tool
- `coherency_level` (INTEGER DEFAULT 1) ← Added by this tool

## Environment Variables

Make sure your `.env` file contains:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Tips

- **Batch editing**: Run the tool multiple times to edit more texts
- **Quality control**: Use this to improve the quality of your Markov-generated content
- **Content curation**: Skip texts that don't meet your standards
- **Consistent editing**: Mark texts as edited even if you don't change them to avoid seeing them again

## Troubleshooting

**"No unedited texts found"**
- All texts in your database have been marked as edited
- Run the tool again later after generating new texts

**"Failed to get count"**
- Check your Supabase credentials in `.env`
- Verify the `markov_texts` table exists

**"Error saving text"**
- Check your internet connection
- Verify you have write permissions to the database 