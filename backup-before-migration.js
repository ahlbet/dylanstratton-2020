#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Function to copy directory recursively
const copyDirectory = (src, dest) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

// Main backup function
const createBackup = () => {
  console.log('📦 Creating backup before migration...\n')

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(process.cwd(), `backup-${timestamp}`)

  try {
    // Create backup directory
    fs.mkdirSync(backupDir, { recursive: true })

    // Backup audio files
    const audioDir = path.join(process.cwd(), 'content', 'assets', 'music')
    if (fs.existsSync(audioDir)) {
      const audioBackupDir = path.join(backupDir, 'audio-files')
      console.log(`📁 Backing up audio files to: ${audioBackupDir}`)
      copyDirectory(audioDir, audioBackupDir)

      const audioFiles = fs
        .readdirSync(audioDir)
        .filter((file) => file.endsWith('.wav'))
      console.log(`  ✅ Backed up ${audioFiles.length} audio files`)
    } else {
      console.log('⚠️  No audio directory found')
    }

    // Backup blog posts
    const blogDir = path.join(process.cwd(), 'content', 'blog')
    if (fs.existsSync(blogDir)) {
      const blogBackupDir = path.join(backupDir, 'blog-posts')
      console.log(`📁 Backing up blog posts to: ${blogBackupDir}`)
      copyDirectory(blogDir, blogBackupDir)

      const blogPosts = fs
        .readdirSync(blogDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory()).length
      console.log(`  ✅ Backed up ${blogPosts} blog posts`)
    } else {
      console.log('⚠️  No blog directory found')
    }

    console.log(`\n🎉 Backup completed successfully!`)
    console.log(`📁 Backup location: ${backupDir}`)
    console.log(`\n💡 You can now safely run the migration script.`)
    console.log(`   If anything goes wrong, you can restore from this backup.`)
  } catch (error) {
    console.error('❌ Backup failed:', error.message)
    process.exit(1)
  }
}

// Run the backup
createBackup()
