#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config()

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { execSync } = require('child_process')
const { createClient } = require('@supabase/supabase-js')
const https = require('https')
const { promisify } = require('util')
const stream = require('stream')
const pipeline = promisify(stream.pipeline)

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Helper function to prompt user for input
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

// Helper function to display text in a formatted way
const displayText = (text, title) => {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`${title}`)
  console.log(`${'='.repeat(60)}`)
  console.log(text)
  console.log(`${'='.repeat(60)}\n`)
}

// Helper function to edit text interactively
const editText = async (originalText, textNumber) => {
  displayText(originalText, `Original Markov Text #${textNumber}`)

  const editChoice = await askQuestion(
    `Do you want to edit this text? (y/n, or 'r' to regenerate): `
  )

  if (editChoice.toLowerCase() === 'r') {
    return 'REGENERATE'
  }

  if (editChoice.toLowerCase() !== 'y') {
    return originalText
  }

  console.log('\nEnter your edited text (press Enter twice to finish):')
  console.log(
    '(Type "skip" to keep original, "regenerate" to generate new text)'
  )

  const lines = []
  let lineNumber = 1

  while (true) {
    const line = await askQuestion(`Line ${lineNumber}: `)

    if (line === '') {
      if (lines.length > 0) break
      continue
    }

    if (line.toLowerCase() === 'skip') {
      return originalText
    }

    if (line.toLowerCase() === 'regenerate') {
      return 'REGENERATE'
    }

    lines.push(line)
    lineNumber++
  }

  return lines.join('\n')
}

// Function to extract audio duration from WAV file
const extractAudioDuration = async (filePath) => {
  try {
    console.log(`   📊 Extracting duration from: ${path.basename(filePath)}`)

    const data = fs.readFileSync(filePath)

    if (data.length < 80) {
      console.log(`   ⚠️ File too small, using null`)
      return null
    }

    // Check if it's actually a WAV file (should start with "RIFF")
    const riffHeader = data.toString('ascii', 0, 4)
    if (riffHeader !== 'RIFF') {
      console.log(`   ⚠️ Not a valid WAV file (no RIFF header), using null`)
      return null
    }

    // Find the format chunk ("fmt ")
    const fmtIndex = data.indexOf('fmt ')
    if (fmtIndex === -1) {
      console.log(`   ⚠️ No format chunk found, using null`)
      return null
    }

    // Find the data chunk ("data")
    const dataIndex = data.indexOf('data')
    if (dataIndex === -1) {
      console.log(`   ⚠️ No data chunk found, using null`)
      return null
    }

    // Read format chunk data
    const sampleRate = data.readUInt32LE(fmtIndex + 12)
    const byteRate = data.readUInt32LE(fmtIndex + 16)
    const dataSize = data.readUInt32LE(dataIndex + 4)

    if (sampleRate > 0 && byteRate > 0 && dataSize > 0) {
      const durationSeconds = dataSize / byteRate
      if (durationSeconds > 0 && durationSeconds < 3600) {
        // Sanity check: between 0 and 1 hour
        console.log(`   ✅ Duration: ${durationSeconds.toFixed(2)} seconds`)
        return Math.round(durationSeconds)
      } else {
        console.log(
          `   ⚠️ Duration out of reasonable range (${durationSeconds}s), using null`
        )
        return null
      }
    } else {
      console.log(`   ⚠️ Invalid WAV header values, using null`)
      return null
    }
  } catch (error) {
    console.log(`   ⚠️ Duration extraction failed: ${error.message}`)
    return null
  }
}

// Function to strip special characters except hyphens
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9\-]/g, '')
}

// Function to update local audio files
const updateLocalAudioFiles = async (movedFiles) => {
  if (!movedFiles || movedFiles.length === 0) return

  const localAudioDir = path.join(process.cwd(), 'static/local-audio')
  if (!fs.existsSync(localAudioDir)) {
    fs.mkdirSync(localAudioDir, { recursive: true })
  }

  console.log('📥 Adding new audio files to local directory...')

  for (const file of movedFiles) {
    try {
      // Download from Supabase to local directory
      const { data, error } = await supabase.storage
        .from('audio')
        .download(file.fileName)

      if (error) {
        console.warn(`⚠️ Failed to download ${file.fileName}:`, error.message)
        continue
      }

      // Convert blob to buffer and save
      const arrayBuffer = await data.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const localPath = path.join(localAudioDir, file.fileName)
      fs.writeFileSync(localPath, buffer)

      const sizeKB = (buffer.length / 1024).toFixed(1)
      console.log(`✅ Added ${file.fileName} to local audio (${sizeKB}KB)`)
    } catch (error) {
      console.warn(
        `⚠️ Failed to add ${file.fileName} to local audio:`,
        error.message
      )
    }
  }
}

// Function to update local Markov texts
const updateLocalMarkovTexts = async (newTexts, postName) => {
  if (!newTexts || newTexts.length === 0) return

  const localDataDir = path.join(process.cwd(), 'static/local-data')
  if (!fs.existsSync(localDataDir)) {
    fs.mkdirSync(localDataDir, { recursive: true })
  }

  const markovTextsPath = path.join(localDataDir, 'markov-texts.json')

  try {
    // Read existing texts
    let existingData = { texts: [] }
    if (fs.existsSync(markovTextsPath)) {
      const existingContent = fs.readFileSync(markovTextsPath, 'utf8')
      existingData = JSON.parse(existingContent)
    }

    // Add new texts with unique IDs
    const maxId =
      existingData.texts.length > 0
        ? Math.max(...existingData.texts.map((t) => t.id))
        : 0

    const textsWithIds = newTexts.map((text, index) => ({
      id: maxId + index + 1,
      text_content: text,
      text_length: text.length,
      created_at: new Date().toISOString(),
      metadata: {
        generated_at: new Date().toISOString(),
        source: 'init-script',
        post_name: postName,
      },
    }))

    // Combine existing and new texts
    existingData.texts = [...existingData.texts, ...textsWithIds]

    // Save updated data
    fs.writeFileSync(markovTextsPath, JSON.stringify(existingData, null, 2))
    console.log(`✅ Added ${newTexts.length} new Markov texts to local data`)
  } catch (error) {
    console.warn('⚠️ Failed to update local Markov texts:', error.message)
  }
}

// Function to update local cover art
const updateLocalCoverArt = async (postName, coverArtBuffer) => {
  if (!coverArtBuffer) return

  const localCoverArtDir = path.join(process.cwd(), 'static/local-cover-art')
  if (!fs.existsSync(localCoverArtDir)) {
    fs.mkdirSync(localCoverArtDir, { recursive: true })
  }

  try {
    const sanitizedName = sanitizeFilename(postName)
    const coverArtPath = path.join(localCoverArtDir, `${sanitizedName}.png`)
    fs.writeFileSync(coverArtPath, coverArtBuffer)
    console.log(`✅ Added cover art for ${postName} to local directory`)
  } catch (error) {
    console.warn('⚠️ Failed to update local cover art:', error.message)
  }
}

// Import the transformDate function from utils
const { transformDate } = require('./src/utils/date-utils')

// Import the Markov generator
const { generateBlogPostText } = require('./src/utils/markov-generator')

// Import the cover art generator
const { generateCoverArt } = require('./src/utils/cover-art-generator')

// Import coherency level utilities
const { getCoherencyLevel } = require('./src/utils/coherency-level-utils')

// Initialize Supabase client
let supabase

const initializeSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    )
    if (process.env.NODE_ENV === 'test') {
      throw new Error('Missing Supabase credentials')
    }
    process.exit(1)
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Function to upload file to Supabase storage
const uploadToSupabase = async (
  filePathOrBuffer,
  fileName,
  bucketName = 'audio',
  contentType = 'audio/wav'
) => {
  try {
    // Read the file or use provided buffer
    let fileBuffer
    if (Buffer.isBuffer(filePathOrBuffer)) {
      fileBuffer = filePathOrBuffer
    } else {
      fileBuffer = fs.readFileSync(filePathOrBuffer)
    }

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: false, // Don't overwrite existing files
      })

    if (error) {
      throw new Error(`Failed to upload to Supabase: ${error.message}`)
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    return urlData.publicUrl
  } catch (error) {
    console.error(`Upload error for ${fileName}:`, error.message)
    throw error
  }
}

const name = process.argv[2]

// Main function to handle the async operations
const main = async () => {
  // Check if name is provided
  if (!name) {
    console.log(`Usage: node ${path.basename(process.argv[1])} <name>`)
    if (process.env.NODE_ENV === 'test') {
      throw new Error('Missing name argument')
    }
    process.exit(1)
  }

  // Initialize Supabase client
  supabase = initializeSupabase()

  // Check if branch exists, then checkout or create it
  try {
    // Check if branch exists
    const branchExists = execSync(
      `git show-ref --verify --quiet refs/heads/${name}`,
      { stdio: 'pipe' }
    )
    if (branchExists === 0) {
      // Branch exists, just checkout to it
      execSync(`git checkout ${name}`, { stdio: 'inherit' })
      console.log(`Checked out to existing branch '${name}'.`)
    } else {
      // Branch doesn't exist, create and checkout to it
      execSync(`git checkout -B ${name}`, { stdio: 'inherit' })
      console.log(`Created and checked out to new branch '${name}'.`)
    }
  } catch (err) {
    // If the above command fails, it means the branch doesn't exist, so create it
    try {
      execSync(`git checkout -B ${name}`, { stdio: 'inherit' })
      console.log(`Created and checked out to new branch '${name}'.`)
    } catch (checkoutErr) {
      console.error(
        `Failed to checkout to branch '${name}':`,
        checkoutErr.message
      )
      if (process.env.NODE_ENV === 'test') {
        throw new Error(
          `Failed to checkout to branch '${name}': ${checkoutErr.message}`
        )
      }
      process.exit(1)
    }
  }

  const dir = path.join(process.cwd(), 'content', 'blog', name)
  const file = path.join(dir, `${name}.md`)

  // Path to your template file in ./content/blog/
  const templatePath = path.join(process.cwd(), 'src', 'template.md')
  const description = process.argv[3] || ''
  const date = transformDate(name, true)

  // Read template content from file
  let template
  try {
    template = fs.readFileSync(templatePath, 'utf8')
    console.log('template', template)
    console.log('template type:', typeof template)
    console.log('template length:', template ? template.length : 'undefined')
  } catch (err) {
    console.error(`Template file not found at ${templatePath}`)
    if (process.env.NODE_ENV === 'test') {
      throw new Error(`Template file not found at ${templatePath}`)
    }
    process.exit(1)
  }

  // Ensure template is a string
  if (typeof template !== 'string') {
    console.error('Template is not a string:', typeof template, template)
    if (process.env.NODE_ENV === 'test') {
      throw new Error(`Template is not a string: ${typeof template}`)
    }
    process.exit(1)
  }

  // Process template immediately after reading it
  const downloadsPath = path.join(
    process.env.HOME || process.env.USERPROFILE,
    'Downloads'
  )

  // Check for subfolder first (multiple files)
  const subfolderPath = path.join(downloadsPath, name)
  const singleFilePath = path.join(downloadsPath, `${name}.wav`)

  const destDir = path.join(process.cwd(), 'content', 'assets', 'music')
  fs.mkdirSync(destDir, { recursive: true })

  let movedFiles = [] // Track which files were moved

  // Check if subfolder exists and contains WAV files
  if (
    fs.existsSync(subfolderPath) &&
    fs.statSync(subfolderPath).isDirectory()
  ) {
    const files = fs.readdirSync(subfolderPath)
    const wavFiles = files.filter((file) => file.toLowerCase().endsWith('.wav'))

    if (wavFiles.length > 0) {
      console.log(
        `Found ${wavFiles.length} WAV file(s) in subfolder '${name}'.`
      )

      // Create backup of the entire subfolder
      const backupSubfolderPath = path.join(downloadsPath, `${name}-backup`)
      if (fs.existsSync(backupSubfolderPath)) {
        fs.rmSync(backupSubfolderPath, { recursive: true, force: true })
      }
      fs.cpSync(subfolderPath, backupSubfolderPath, { recursive: true })
      console.log(`Created backup at '${backupSubfolderPath}'.`)

      // Upload all WAV files from subfolder to Supabase
      for (let index = 0; index < wavFiles.length; index++) {
        const wavFile = wavFiles[index]
        const sourcePath = path.join(subfolderPath, wavFile)
        // Create unique filename with just the name and index, sanitized
        const fileExtension = path.extname(wavFile)
        const sanitizedName = sanitizeFilename(name)
        const uniqueFileName =
          wavFiles.length === 1
            ? `${sanitizedName}${fileExtension}`
            : `${sanitizedName}-${index + 1}${fileExtension}`

        try {
          // Extract duration before uploading
          const duration = await extractAudioDuration(sourcePath)

          // Upload to Supabase instead of moving to local storage
          const supabaseUrl = await uploadToSupabase(sourcePath, uniqueFileName)
          movedFiles.push({
            fileName: uniqueFileName,
            url: supabaseUrl,
            duration: duration,
            storagePath: `audio/${uniqueFileName}`,
          })
          console.log(
            `Uploaded file '${wavFile}' to Supabase as '${uniqueFileName}'.`
          )
        } catch (error) {
          console.error(`Failed to upload ${wavFile}:`, error.message)
        }
      }

      // Remove empty subfolder
      if (fs.readdirSync(subfolderPath).length === 0) {
        fs.rmdirSync(subfolderPath)
        console.log(`Removed empty subfolder '${subfolderPath}'.`)
      }
    } else {
      console.warn(`Subfolder '${name}' exists but contains no WAV files.`)
    }
  } else if (fs.existsSync(singleFilePath)) {
    // Handle single file case (existing behavior)
    console.log(`Found single WAV file '${name}.wav'.`)

    // Duplicate the original file before moving
    const backupPath = path.join(downloadsPath, `${name}-backup.wav`)

    fs.copyFileSync(singleFilePath, backupPath)
    console.log(`Created backup at '${backupPath}'.`)

    try {
      // Extract duration before uploading
      const duration = await extractAudioDuration(singleFilePath)

      // Upload to Supabase instead of moving to local storage
      const sanitizedName = sanitizeFilename(name)
      const supabaseUrl = await uploadToSupabase(
        singleFilePath,
        `${sanitizedName}.wav`
      )
      movedFiles.push({
        fileName: `${sanitizedName}.wav`,
        url: supabaseUrl,
        duration: duration,
        storagePath: `audio/${sanitizedName}.wav`,
      })
      console.log(
        `Uploaded file '${name}.wav' to Supabase as '${sanitizedName}.wav'.`
      )
    } catch (error) {
      console.error(`Failed to upload ${name}.wav:`, error.message)
    }
  } else {
    console.warn(
      `No WAV files found. Neither subfolder '${name}' nor single file '${name}.wav' exist in Downloads.`
    )
  }

  // Generate audio files content
  let audioFilesContent = ''
  if (movedFiles.length > 0) {
    audioFilesContent = movedFiles
      .map((file) => `\`audio: ${file.url}\``)
      .join('\n\n')
  } else {
    // TODO: Check Supabase for existing files instead of local filesystem
    // const { data: existingFiles } = await supabase.storage
    //   .from('audio')
    //   .list('', { search: name })
    // if (existingFiles && existingFiles.length > 0) {
    //   audioFilesContent = existingFiles
    //     .map((file) => `\`audio: https://your-project.supabase.co/storage/v1/object/public/audio/${file.name}\``)
    //     .join('\n\n')
    // }
  }

  // Generate and edit Markov chain texts for the blog post
  console.log('📝 Generating 5 markov texts for interactive editing...')
  const markovTexts = []
  const editedTexts = []
  const coherencyLevels = []

  // Generate 5 initial texts
  for (let i = 0; i < 5; i++) {
    let text = null
    let attemptCount = 0

    while (!text && attemptCount < 3) {
      try {
        const generatedText = await generateBlogPostText(name, 1)
        // Remove the "> " prefix since we're generating individual texts
        text = generatedText.replace(/^> /, '').trim()

        if (text && text.length > 10) {
          break
        }
      } catch (error) {
        console.error(`Error generating text ${i + 1}:`, error.message)
      }
      attemptCount++
    }

    if (!text) {
      text = `Generated text ${i + 1} could not be created.`
    }

    markovTexts.push(text)
  }

  console.log(`✅ Generated ${markovTexts.length} initial texts\n`)

  // Interactive editing
  for (let i = 0; i < markovTexts.length; i++) {
    let currentText = markovTexts[i]
    let needsRegeneration = false

    do {
      needsRegeneration = false
      const editedText = await editText(currentText, i + 1)

      if (editedText === 'REGENERATE') {
        try {
          const newText = await generateBlogPostText(name, 1)
          currentText = newText.replace(/^> /, '').trim()
          needsRegeneration = true
          console.log(`🔄 Regenerated text ${i + 1}`)
        } catch (error) {
          console.error(`Error regenerating text ${i + 1}:`, error.message)
          currentText = `Generated text ${i + 1} could not be created.`
        }
      } else {
        currentText = editedText
      }
    } while (needsRegeneration)

    // Get coherency level for this text
    const coherencyLevel = await getCoherencyLevel(askQuestion, i + 1)
    coherencyLevels.push(coherencyLevel)

    editedTexts.push(currentText)
    console.log(
      `✅ Text ${i + 1} finalized with coherency level ${coherencyLevel}\n`
    )
  }

  // Format for markdown
  const markovText = editedTexts.map((text) => `> ${text}`).join('\n\n')

  // Prepare markov texts data (without daily_id for now)
  const markovTextsData = editedTexts.map((text, index) => ({
    text_content: text,
    text_length: text.length,
    coherency_level: coherencyLevels[index],
    metadata: {
      generated_at: new Date().toISOString(),
      source: 'markov-generator',
      post_name: name,
      text_number: index + 1,
      edited_by_user: true,
      cleaned_with_bad_words_filter: true,
    },
  }))

  // Generate cover art for the blog post
  let coverArtUrl = ''
  try {
    console.log('Generating cover art for blog post...')
    const coverArtBuffer = await generateCoverArt(name, 2500)
    const sanitizedName = sanitizeFilename(name)
    const coverArtFileName = `${sanitizedName}.png`

    // Upload cover art to Supabase
    coverArtUrl = await uploadToSupabase(
      coverArtBuffer,
      coverArtFileName,
      'cover-art',
      'image/png'
    )

    // Add cache-busting parameter to ensure fresh images
    coverArtUrl += `?v=${Date.now()}`

    console.log(`Generated and uploaded cover art: ${coverArtFileName}`)
  } catch (error) {
    console.error('Failed to generate cover art:', error.message)
    // Cover art is optional, continue without it
  }

  // Create daily entry in Supabase and get daily_id
  let dailyId = null
  let supabaseTexts = [] // Declare outside the block so it's available for local update
  try {
    console.log('📝 Creating daily entry in Supabase...')

    // Prepare cover art path if cover art was generated
    const coverArtPath = coverArtUrl
      ? `cover-art/${sanitizeFilename(name)}.png`
      : null

    const { data, error } = await supabase
      .from('daily')
      .insert([
        {
          title: name,
          cover_art: coverArtPath,
        },
      ])
      .select()

    if (error) {
      console.error('Failed to create daily entry:', error.message)
    } else {
      dailyId = data[0].id
      console.log(`✅ Created daily entry with ID: ${dailyId}`)
      if (coverArtPath) {
        console.log(`🎨 Added cover art path: ${coverArtPath}`)
      }

      // Create daily_audio entries for uploaded files
      if (movedFiles.length > 0) {
        console.log('🎵 Creating daily_audio entries...')
        for (const file of movedFiles) {
          try {
            const { error: audioError } = await supabase
              .from('daily_audio')
              .insert([
                {
                  daily_id: dailyId,
                  storage_path: file.storagePath,
                  duration: file.duration,
                  format: 'audio/wav',
                },
              ])

            if (audioError) {
              console.error(
                `Failed to create daily_audio entry for ${file.fileName}:`,
                audioError.message
              )
            } else {
              console.log(`✅ Created daily_audio entry for ${file.fileName}`)
            }
          } catch (error) {
            console.error(
              `Failed to create daily_audio entry for ${file.fileName}:`,
              error.message
            )
          }
        }

        // Upload markov texts with daily_id
        console.log('📦 Uploading edited texts to Supabase...')
        supabaseTexts = markovTextsData.map((textData) => ({
          ...textData,
          daily_id: dailyId, // Now we have the daily_id
        }))

        try {
          const { error } = await supabase
            .from('markov_texts')
            .insert(supabaseTexts)
          if (error) {
            console.error('Failed to upload texts to Supabase:', error.message)
          } else {
            console.log(
              `✅ Successfully uploaded ${supabaseTexts.length} texts to Supabase`
            )
          }
        } catch (error) {
          console.error('Failed to upload texts to Supabase:', error.message)
        }
      }
    }
  } catch (error) {
    console.error('Failed to create daily entry:', error.message)
  }

  // Replace {name}, {date}, {description}, {audio_files}, {cover_art}, {daily_id}, and {markov_text} in template
  template = template
    .replace(/\{name\}/g, name)
    .replace(/\{date\}/g, date)
    .replace(/\{audio_files\}/g, audioFilesContent)
    .replace(/\{cover_art\}/g, coverArtUrl)
    .replace(/\{daily_id\}/g, dailyId || '')
    .replace(/\{markov_text\}/g, markovText)

  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(file, template)

  console.log(
    `Created folder '${name}' and file '${name}/${name}.md' with template content.`
  )

  // Only push to GitHub if at least one Supabase upload succeeded
  if (movedFiles.length > 0) {
    try {
      execSync(`git add .`, { stdio: 'inherit' })
      console.log(`Added changes to git.`)
      execSync(`git commit -m "new-day: ${name}"`, { stdio: 'inherit' })
      console.log(`Committed changes to git.`)
      execSync(`git push origin ${name} --tags`, { stdio: 'inherit' })
      console.log(`Pushed tags to origin.`)
      execSync(`git push origin ${name}`, { stdio: 'inherit' })
      console.log(`Pushed changes to origin.`)
    } catch (err) {
      console.error(
        `Failed to create or finish the release branch:`,
        err.message
      )
      if (process.env.NODE_ENV === 'test') {
        throw new Error(
          `Failed to create or finish the release branch: ${err.message}`
        )
      }
      process.exit(1)
    }
  } else {
    console.log(
      `No audio files were uploaded to Supabase. Skipping git push to avoid incomplete commits.`
    )
  }

  try {
    console.log('\n🔄 Updating local development data...')

    // Update local audio files
    await updateLocalAudioFiles(movedFiles)

    // Update local Markov texts
    await updateLocalMarkovTexts(supabaseTexts, name)

    // Update local cover art
    if (coverArtUrl) {
      await updateLocalCoverArt(name, coverArtBuffer)
    }

    console.log('✅ Local development data updated successfully!')
  } catch (error) {
    console.warn('⚠️ Failed to update local development data:', error.message)
    console.log(
      'You can manually update local data with: yarn generate-local-data'
    )
  }

  // Close readline interface
  rl.close()
}

// Export functions for testing
module.exports = { main, askQuestion, displayText, editText }

// Run the main function only if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error.message)
    rl.close()
    process.exit(1)
  })
}
