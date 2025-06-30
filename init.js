#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const name = process.argv[2]

if (!name) {
  console.log(`Usage: node ${path.basename(process.argv[1])} <name>`)
  process.exit(1)
}

// Checkout to a branch named after the 'name' variable (create if it doesn't exist)
try {
  execSync(`git checkout -B ${name}`, { stdio: 'inherit' })
  console.log(`Checked out to branch '${name}'.`)
} catch (err) {
  console.error(`Failed to checkout to branch '${name}':`, err.message)
  process.exit(1)
}

const dir = path.join(process.cwd(), 'content', 'blog', name)
const file = path.join(dir, `${name}.md`)

// Path to your template file in ./content/blog/
const templatePath = path.join(process.cwd(), 'src', 'template.md')
const description = process.argv[3] || ''
const date = new Date().toISOString().slice(0, 10)
// Read template content from file
let template
try {
  template = fs.readFileSync(templatePath, 'utf8')
} catch (err) {
  console.error(`Template file not found at ${templatePath}`)
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
if (fs.existsSync(subfolderPath) && fs.statSync(subfolderPath).isDirectory()) {
  const files = fs.readdirSync(subfolderPath)
  const wavFiles = files.filter((file) => file.toLowerCase().endsWith('.wav'))

  if (wavFiles.length > 0) {
    console.log(`Found ${wavFiles.length} WAV file(s) in subfolder '${name}'.`)

    // Create backup of the entire subfolder
    const backupSubfolderPath = path.join(downloadsPath, `${name}-backup`)
    if (fs.existsSync(backupSubfolderPath)) {
      fs.rmSync(backupSubfolderPath, { recursive: true, force: true })
    }
    fs.cpSync(subfolderPath, backupSubfolderPath, { recursive: true })
    console.log(`Created backup at '${backupSubfolderPath}'.`)

    // Move all WAV files from subfolder to destDir with unique names
    wavFiles.forEach((wavFile, index) => {
      const sourcePath = path.join(subfolderPath, wavFile)
      // Create unique filename with name prefix and index
      const fileExtension = path.extname(wavFile)
      const baseName = path.basename(wavFile, fileExtension)
      const uniqueFileName = `${name}-${index + 1}-${baseName}${fileExtension}`
      const destPath = path.join(destDir, uniqueFileName)
      fs.renameSync(sourcePath, destPath)
      movedFiles.push(uniqueFileName)
      console.log(
        `Moved file '${wavFile}' to '${uniqueFileName}' in '${destPath}'.`
      )
    })

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

  const destPath = path.join(destDir, `${name}.wav`)
  fs.renameSync(singleFilePath, destPath)
  movedFiles.push(`${name}.wav`)
  console.log(`Moved file from '${singleFilePath}' to '${destPath}'.`)
} else {
  console.warn(
    `No WAV files found. Neither subfolder '${name}' nor single file '${name}.wav' exist in Downloads.`
  )
}

// Generate audio files content
let audioFilesContent = ''
if (movedFiles.length > 0) {
  audioFilesContent = movedFiles
    .map((file) => `\`audio: ../../assets/music/${file}\``)
    .join('\n\n')
} else {
  // If no files were moved, check if there are existing files with the name pattern
  const existingFiles = fs
    .readdirSync(destDir)
    .filter(
      (file) => file.toLowerCase().endsWith('.wav') && file.startsWith(name)
    )

  if (existingFiles.length > 0) {
    audioFilesContent = existingFiles
      .map((file) => `\`audio: ../../assets/music/${file}\``)
      .join('\n\n')
  }
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
  console.error(`Failed to create or finish the release branch:`, err.message)
  process.exit(1)
}
