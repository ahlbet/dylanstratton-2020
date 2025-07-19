#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config()

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { createClient } = require('@supabase/supabase-js')

// Function to strip special characters except hyphens
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9\-]/g, '')
}

// Import the transformDate function from utils
const { transformDate } = require('./src/utils/date-utils')

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
const uploadToSupabase = async (filePath, fileName, bucketName = 'audio') => {
  try {
    // Read the file
    const fileBuffer = fs.readFileSync(filePath)

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: 'audio/wav',
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
  const date = transformDate(name)

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
          // Upload to Supabase instead of moving to local storage
          const supabaseUrl = await uploadToSupabase(sourcePath, uniqueFileName)
          movedFiles.push({ fileName: uniqueFileName, url: supabaseUrl })
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
      // Upload to Supabase instead of moving to local storage
      const sanitizedName = sanitizeFilename(name)
      const supabaseUrl = await uploadToSupabase(
        singleFilePath,
        `${sanitizedName}.wav`
      )
      movedFiles.push({ fileName: `${sanitizedName}.wav`, url: supabaseUrl })
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

  // Replace {name}, {date}, {description}, and {audio_files} in template
  template = template
    .replace(/\{name\}/g, name)
    .replace(/\{date\}/g, date)
    .replace(/\{description\}/g, description.split('_').join(' '))
    .replace(/\{audio_files\}/g, audioFilesContent)

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
}

// Export functions for testing
module.exports = { main }

// Run the main function only if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error.message)
    process.exit(1)
  })
}
