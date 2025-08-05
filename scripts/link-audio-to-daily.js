#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const https = require('https')
const { promisify } = require('util')
const stream = require('stream')
const pipeline = promisify(stream.pipeline)

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error(
    'Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Function to extract frontmatter from markdown content
function extractFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return { frontmatter: '', content: content }

  const frontmatter = frontmatterMatch[1]
  const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '')

  return { frontmatter, content: bodyContent }
}

// Function to parse frontmatter YAML
function parseFrontmatter(frontmatter) {
  const lines = frontmatter.split('\n')
  const parsed = {}

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex !== -1) {
      const key = line.substring(0, colonIndex).trim()
      let value = line.substring(colonIndex + 1).trim()

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      parsed[key] = value
    }
  }

  return parsed
}

// Function to extract audio URLs from markdown content
function extractAudioUrls(content) {
  const audioMatches = content.match(/`audio: ([^`]+)`/g)
  if (!audioMatches) return []

  return audioMatches.map((match) => {
    const url = match.match(/`audio: ([^`]+)`/)[1]
    return url
  })
}

// Function to get all markdown files from blog directory
function getMarkdownFiles() {
  const blogDir = path.join(process.cwd(), 'content', 'blog')
  const files = []

  if (!fs.existsSync(blogDir)) {
    console.error('❌ Blog directory not found:', blogDir)
    return files
  }

  const entries = fs.readdirSync(blogDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const postDir = path.join(blogDir, entry.name)
      const postEntries = fs.readdirSync(postDir, { withFileTypes: true })

      for (const postEntry of postEntries) {
        if (postEntry.isFile() && postEntry.name.endsWith('.md')) {
          files.push({
            path: path.join(postDir, postEntry.name),
            name: entry.name,
            title: entry.name,
          })
        }
      }
    }
  }

  return files
}

// Function to extract storage path from Supabase URL
function extractStoragePath(url) {
  // Extract the full storage path from the URL
  // Example: https://uzsnbfnteazzwirbqgzb.supabase.co/storage/v1/object/public/audio/25may25.wav
  // Should return: audio/25may25.wav

  // Remove query parameters first
  const cleanUrl = url.split('?')[0]

  // Split by '/' and find the bucket and filename
  const urlParts = cleanUrl.split('/')

  // Find the index of 'public' and get everything after it
  const publicIndex = urlParts.indexOf('public')
  if (publicIndex !== -1 && publicIndex + 1 < urlParts.length) {
    // Get bucket name and filename
    const bucketName = urlParts[publicIndex + 1]
    const filename = urlParts[publicIndex + 2]

    // Return the full storage path
    return `${bucketName}/${filename}`
  }

  // Fallback: just return the filename if we can't parse the URL properly
  const filename = urlParts[urlParts.length - 1]
  return filename
}

// Function to extract audio duration from WAV file
async function extractAudioDuration(audioUrl) {
  try {
    console.log(`   📊 Extracting duration from: ${audioUrl}`)

    // Download just the header of the WAV file to get duration
    const duration = await new Promise((resolve, reject) => {
      const req = https.get(audioUrl, (res) => {
        if (res.statusCode !== 200) {
          console.log(`   ⚠️ HTTP ${res.statusCode}, using null`)
          resolve(null)
          return
        }

        let data = Buffer.alloc(0)
        res.on('data', (chunk) => {
          data = Buffer.concat([data, chunk])
          // We need at least 80 bytes for non-standard WAV files
          if (data.length >= 80) {
            res.destroy() // Stop downloading
            // Manually parse and resolve since 'end' won't fire after destroy()
            try {
              // Parse WAV header to get duration
              if (data.length >= 80) {
                // Check if it's actually a WAV file (should start with "RIFF")
                const riffHeader = data.toString('ascii', 0, 4)
                if (riffHeader !== 'RIFF') {
                  console.log(
                    `   ⚠️ Not a valid WAV file (no RIFF header), using null`
                  )
                  resolve(null)
                  return
                }

                // Find the format chunk ("fmt ")
                const fmtIndex = data.indexOf('fmt ')
                if (fmtIndex === -1) {
                  console.log(`   ⚠️ No format chunk found, using null`)
                  resolve(null)
                  return
                }

                // Find the data chunk ("data")
                const dataIndex = data.indexOf('data')
                if (dataIndex === -1) {
                  console.log(`   ⚠️ No data chunk found, using null`)
                  resolve(null)
                  return
                }

                // Read format chunk data
                const sampleRate = data.readUInt32LE(fmtIndex + 12)
                const byteRate = data.readUInt32LE(fmtIndex + 16)
                const dataSize = data.readUInt32LE(dataIndex + 4)

                if (sampleRate > 0 && byteRate > 0 && dataSize > 0) {
                  const durationSeconds = dataSize / byteRate
                  if (durationSeconds > 0 && durationSeconds < 3600) {
                    // Sanity check: between 0 and 1 hour
                    console.log(
                      `   ✅ Duration: ${durationSeconds.toFixed(2)} seconds`
                    )
                    resolve(Math.round(durationSeconds))
                  } else {
                    console.log(
                      `   ⚠️ Duration out of reasonable range (${durationSeconds}s), using null`
                    )
                    resolve(null)
                  }
                } else {
                  console.log(`   ⚠️ Invalid WAV header values, using null`)
                  resolve(null)
                }
              } else {
                console.log(
                  `   ⚠️ File too small (${data.length} bytes), using null`
                )
                resolve(null)
              }
            } catch (error) {
              console.log(`   ⚠️ Error parsing WAV header: ${error.message}`)
              resolve(null)
            }
          }
        })

        res.on('end', () => {
          // Only handle if we didn't already resolve in the 'data' event
          if (data.length < 80) {
            console.log(
              `   ⚠️ File too small (${data.length} bytes), using null`
            )
            resolve(null)
          }
        })

        res.on('error', (error) => {
          console.log(`   ⚠️ Download error: ${error.message}`)
          resolve(null)
        })
      })

      req.on('error', (error) => {
        console.log(`   ⚠️ Request error: ${error.message}`)
        resolve(null)
      })

      req.setTimeout(15000, () => {
        console.log(`   ⚠️ Request timeout (15s), using null`)
        req.destroy()
        resolve(null)
      })
    })

    return duration
  } catch (error) {
    console.log(`   ⚠️ Duration extraction failed: ${error.message}`)
    return null
  }
}

// Function to create daily_audio entry
async function createDailyAudioEntry(dailyId, storagePath, metadata = {}) {
  try {
    const { data, error } = await supabase
      .from('daily_audio')
      .insert([
        {
          daily_id: dailyId,
          storage_path: storagePath,
          ...metadata,
        },
      ])
      .select()

    if (error) {
      throw error
    }

    return data[0].id
  } catch (error) {
    console.error(
      `❌ Error creating daily_audio entry for ${storagePath}:`,
      error.message
    )
    return null
  }
}

// Function to check if daily_audio entry already exists
async function checkDailyAudioExists(dailyId, storagePath) {
  try {
    const { data, error } = await supabase
      .from('daily_audio')
      .select('id')
      .eq('daily_id', dailyId)
      .eq('storage_path', storagePath)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw error
    }

    return data ? data.id : null
  } catch (error) {
    console.error(`❌ Error checking daily_audio entry:`, error.message)
    return null
  }
}

// Main function
async function main() {
  console.log('🚀 Starting audio linking process...')

  // Get all markdown files
  const markdownFiles = getMarkdownFiles()
  console.log(`📁 Found ${markdownFiles.length} markdown files`)

  if (markdownFiles.length === 0) {
    console.log('❌ No markdown files found')
    return
  }

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  // Process each file
  for (const file of markdownFiles) {
    console.log(`\n📝 Processing: ${file.name}`)

    try {
      const content = fs.readFileSync(file.path, 'utf8')
      const { frontmatter, content: bodyContent } = extractFrontmatter(content)

      if (!frontmatter) {
        console.warn(`⚠️ No frontmatter found in ${file.path}`)
        errorCount++
        continue
      }

      const parsed = parseFrontmatter(frontmatter)

      // Check if daily_id exists
      if (!parsed.daily_id) {
        console.warn(`⚠️ No daily_id found in ${file.name}`)
        errorCount++
        continue
      }

      const dailyId = parseInt(parsed.daily_id)

      // Extract audio URLs
      const audioUrls = extractAudioUrls(bodyContent)

      if (audioUrls.length === 0) {
        console.log(`ℹ️ No audio files found in ${file.name}`)
        skipCount++
        continue
      }

      console.log(`🎵 Found ${audioUrls.length} audio files`)

      // Process each audio URL
      for (const audioUrl of audioUrls) {
        const storagePath = extractStoragePath(audioUrl)

        // Check if entry already exists
        const existingId = await checkDailyAudioExists(dailyId, storagePath)

        if (existingId) {
          console.log(`ℹ️ Audio entry already exists for ${storagePath}`)
          skipCount++
          continue
        }

        // Extract duration from audio file
        const duration = await extractAudioDuration(audioUrl)

        // Create new entry
        const audioId = await createDailyAudioEntry(dailyId, storagePath, {
          duration: duration,
          format: 'audio/wav',
        })

        if (audioId) {
          console.log(`✅ Created daily_audio entry for ${storagePath}`)
          successCount++
        } else {
          errorCount++
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${file.name}:`, error.message)
      errorCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`✅ Successfully created: ${successCount} audio entries`)
  console.log(`ℹ️ Skipped (already existed): ${skipCount} entries`)
  console.log(`❌ Errors: ${errorCount} files`)

  if (errorCount > 0) {
    console.log('\n⚠️ Some files had errors. Check the logs above for details.')
  } else {
    console.log('\n🎉 All audio files linked successfully!')
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error.message)
    process.exit(1)
  })
}

module.exports = {
  extractFrontmatter,
  parseFrontmatter,
  extractAudioUrls,
  getMarkdownFiles,
  extractStoragePath,
  extractAudioDuration,
  createDailyAudioEntry,
  checkDailyAudioExists,
}
