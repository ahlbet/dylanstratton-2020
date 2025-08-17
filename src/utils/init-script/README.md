# Init Script Refactoring

The massive `init.js` script has been refactored into logical, testable, and readable modules. This document describes the new structure and how to use it.

## Overview

The original `init.js` was a monolithic script that handled many different responsibilities. It has been broken down into focused modules that each handle a specific concern:

- **Git operations** - Branch management and Git commands
- **User interaction** - Prompts, input handling, and user interface
- **Audio processing** - Audio file handling and duration extraction
- **Supabase management** - Database and storage operations
- **Markov text management** - Text generation and editing
- **Local data management** - Local development file updates
- **Template processing** - Blog post template handling
- **Main orchestration** - Coordinating all the pieces

## Module Structure

### Core Modules

#### `init-orchestrator.js`

The main orchestrator that coordinates all operations. This is the entry point for the refactored system.

**Key methods:**

- `run()` - Executes the complete initialization process
- `processAudioFiles()` - Handles audio file processing
- `processMarkovTexts()` - Manages Markov text generation
- `createDatabaseEntries()` - Creates database records
- `createBlogPost()` - Generates the final blog post

#### `git-operations.js`

Handles all Git-related operations including branch management and commits.

**Key methods:**

- `checkoutOrCreateBranch(branchName, isTest)` - Creates or checks out branches
- `commitAndPush(branchName, commitMessage, isTest)` - Commits and pushes changes

#### `user-interaction.js`

Manages all user input and interaction including text editing and coherency level input.

**Key methods:**

- `askQuestion(question)` - Prompts user for input
- `editText(originalText, textNumber)` - Interactive text editing
- `getTextCoherencyLevel(textNumber)` - Gets text coherency level
- `getAudioCoherencyLevel(trackNumber, totalTracks, audioPath, audioPlayer)` - Gets audio coherency level

#### `audio-processor.js`

Handles audio file operations including duration extraction and file discovery.

**Key methods:**

- `extractAudioDuration(filePath)` - Extracts duration from WAV files
- `findAudioFiles(name)` - Discovers audio files in Downloads directory
- `sanitizeFilename(filename)` - Cleans filenames for safe use

#### `supabase-manager.js`

Manages all Supabase operations including storage uploads and database operations.

**Key methods:**

- `uploadToStorage(filePathOrBuffer, fileName, bucketName, contentType)` - Uploads files to storage
- `createDailyEntry(title, coverArtPath, date)` - Creates daily database entries
- `createDailyAudioEntries(dailyId, audioFiles, getCoherencyLevel)` - Creates audio database entries
- `uploadMarkovTexts(texts)` - Uploads Markov texts to database

#### `markov-manager.js`

Handles Markov text generation, editing, and processing.

**Key methods:**

- `initialize()` - Initializes the Markov generator with Supabase data
- `generateInitialTexts(count)` - Generates initial text samples
- `processTexts(texts, editText, getCoherencyLevel)` - Processes and edits texts
- `formatForMarkdown(texts)` - Formats texts for markdown output

#### `local-data-manager.js`

Manages local development data including audio files, Markov texts, and cover art.

**Key methods:**

- `updateLocalAudioFiles(movedFiles, supabase)` - Downloads audio files locally
- `updateLocalMarkovTexts(newTexts, postName)` - Updates local Markov text data
- `updateLocalCoverArt(postName, coverArtBuffer)` - Saves cover art locally

#### `template-processor.js`

Handles blog post template processing and file operations.

**Key methods:**

- `readTemplate(templatePath, isTest)` - Reads template from file
- `processTemplate(template, replacements)` - Processes template with replacements
- `createBlogPost(name, content)` - Creates the final blog post file
- `generateCoverArt(postName, supabaseManager)` - Generates and uploads cover art

## Usage

### Basic Usage

The refactored system maintains the same command-line interface:

```bash
node init.js <post-name> [description]
```

### Programmatic Usage

You can also use the orchestrator programmatically:

```javascript
const {
  InitOrchestrator,
} = require('./src/utils/init-script/init-orchestrator')

const orchestrator = new InitOrchestrator('my-post', 'My post description')
await orchestrator.run()
```

### Testing

Each module has comprehensive unit tests. Run them with:

```bash
yarn test src/utils/init-script/
```

## Benefits of Refactoring

### 1. **Testability**

Each module can be tested independently with proper mocking of dependencies.

### 2. **Maintainability**

Code is organized by responsibility, making it easier to understand and modify.

### 3. **Reusability**

Modules can be reused in other parts of the system or in different scripts.

### 4. **Readability**

Each module has a clear, focused purpose that's easy to understand.

### 5. **Error Handling**

Better error handling and recovery with proper error boundaries.

### 6. **Dependency Management**

Clear dependencies between modules with proper separation of concerns.

## Migration Notes

The refactored system maintains full backward compatibility with the original script. The main `init.js` file now simply:

1. Loads environment variables
2. Creates an `InitOrchestrator` instance
3. Runs the orchestration process

All existing functionality is preserved, but now organized in a much more maintainable way.

## Future Enhancements

With the modular structure, future enhancements become much easier:

- **Dry-run mode** - Add a flag to preview changes without executing them
- **Configuration files** - Move hardcoded values to configuration
- **Plugin system** - Allow custom modules to be added
- **Better error recovery** - Implement retry mechanisms and rollback
- **Progress tracking** - Show progress bars for long operations
- **Logging** - Structured logging for better debugging

## Contributing

When adding new functionality:

1. **Identify the appropriate module** for the new feature
2. **Add unit tests** for any new methods
3. **Update this README** if adding new modules
4. **Follow the existing patterns** for consistency
5. **Consider dependencies** between modules

The modular structure makes it easy to add new features without affecting existing functionality.
