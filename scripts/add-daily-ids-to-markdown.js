#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

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

// Function to extract markov texts (blockquotes) from markdown content
function extractMarkovTexts(content) {
  const blockquoteMatches = content.match(/^> (.+)$/gm)
  if (!blockquoteMatches) return []

  return blockquoteMatches.map((match) => {
    // Remove the "> " prefix and trim
    return match.replace(/^> /, '').trim()
  })
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

// Function to stringify frontmatter back to YAML
function stringifyFrontmatter(frontmatterObj) {
  const lines = []

  for (const [key, value] of Object.entries(frontmatterObj)) {
    if (value === null || value === undefined) {
      lines.push(`${key}: `)
    } else if (typeof value === 'string' && value.includes(':')) {
      lines.push(`${key}: "${value}"`)
    } else {
      lines.push(`${key}: ${value}`)
    }
  }

  return lines.join('\n')
}

// Function to update markdown file with daily_id
function updateMarkdownFile(filePath, dailyId) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const { frontmatter, content: bodyContent } = extractFrontmatter(content)

    if (!frontmatter) {
      console.warn(`⚠️ No frontmatter found in ${filePath}`)
      return false
    }

    const parsed = parseFrontmatter(frontmatter)

    // Check if daily_id already exists
    if (parsed.daily_id) {
      console.log(`ℹ️ ${filePath} already has daily_id: ${parsed.daily_id}`)
      return true
    }

    // Add daily_id
    parsed.daily_id = dailyId

    // Reconstruct the file content
    const newFrontmatter = stringifyFrontmatter(parsed)
    const newContent = `---\n${newFrontmatter}\n---\n\n${bodyContent}`

    // Write back to file
    fs.writeFileSync(filePath, newContent)
    console.log(`✅ Updated ${filePath} with daily_id: ${dailyId}`)
    return true
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message)
    return false
  }
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

// Function to create daily entry in Supabase
async function createDailyEntry(title) {
  try {
    const { data, error } = await supabase
      .from('daily')
      .insert([
        {
          title: title,
        },
      ])
      .select()

    if (error) {
      throw error
    }

    return data[0].id
  } catch (error) {
    console.error(`❌ Error creating daily entry for ${title}:`, error.message)
    return null
  }
}

// Function to check if daily entry already exists
async function checkDailyEntryExists(title) {
  try {
    const { data, error } = await supabase
      .from('daily')
      .select('id')
      .eq('title', title)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw error
    }

    return data ? data.id : null
  } catch (error) {
    console.error(`❌ Error checking daily entry for ${title}:`, error.message)
    return null
  }
}

// Function to check if markov text already exists in database
async function checkMarkovTextExists(textContent) {
  try {
    const { data, error } = await supabase
      .from('markov_texts')
      .select('id')
      .eq('text_content', textContent)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw error
    }

    return data ? data.id : null
  } catch (error) {
    console.error(`❌ Error checking markov text:`, error.message)
    return null
  }
}

// Function to update existing markov text with daily_id
async function updateMarkovTextWithDailyId(markovTextId, dailyId) {
  try {
    const { error } = await supabase
      .from('markov_texts')
      .update({ daily_id: dailyId })
      .eq('id', markovTextId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error(
      `❌ Error updating markov text ${markovTextId}:`,
      error.message
    )
    return false
  }
}

// Function to create new markov text entry
async function createMarkovTextEntry(dailyId, textContent, metadata = {}) {
  try {
    const { data, error } = await supabase
      .from('markov_texts')
      .insert([
        {
          daily_id: dailyId,
          text_content: textContent,
          text_length: textContent.length,
          ...metadata,
        },
      ])
      .select()

    if (error) {
      throw error
    }

    return data[0].id
  } catch (error) {
    console.error(`❌ Error creating markov text entry:`, error.message)
    return null
  }
}

// Main function
async function main() {
  console.log('🚀 Starting daily_id addition process...')

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
      // Check if daily entry already exists
      let dailyId = await checkDailyEntryExists(file.title)

      if (!dailyId) {
        // Create new daily entry
        dailyId = await createDailyEntry(file.title)
      }

      if (!dailyId) {
        console.error(`❌ Failed to get/create daily_id for ${file.name}`)
        errorCount++
        continue
      }

      // Update markdown file
      const success = updateMarkdownFile(file.path, dailyId)

      if (success) {
        successCount++

        // Process markov texts from the file
        try {
          const content = fs.readFileSync(file.path, 'utf8')
          const { content: bodyContent } = extractFrontmatter(content)
          const markovTexts = extractMarkovTexts(bodyContent)

          if (markovTexts.length > 0) {
            console.log(
              `   📝 Processing ${markovTexts.length} markov texts...`
            )

            for (const textContent of markovTexts) {
              // Check if markov text already exists in database
              const existingMarkovId = await checkMarkovTextExists(textContent)

              if (existingMarkovId) {
                // Link existing markov text to this daily entry
                const updated = await updateMarkovTextWithDailyId(
                  existingMarkovId,
                  dailyId
                )
                if (updated) {
                  console.log(`   ✅ Linked existing markov text`)
                } else {
                  console.log(`   ❌ Failed to link existing markov text`)
                }
              } else {
                // Create new markov text entry
                const markovId = await createMarkovTextEntry(
                  dailyId,
                  textContent,
                  {
                    metadata: {
                      generated_at: new Date().toISOString(),
                      source: 'migration',
                      post_name: file.name,
                    },
                  }
                )
                if (markovId) {
                  console.log(`   ✅ Created new markov text entry`)
                } else {
                  console.log(`   ❌ Failed to create markov text entry`)
                }
              }
            }
          }
        } catch (error) {
          console.error(`   ❌ Error processing markov texts:`, error.message)
        }
      } else {
        errorCount++
      }
    } catch (error) {
      console.error(`❌ Error processing ${file.name}:`, error.message)
      errorCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`✅ Successfully updated: ${successCount} files`)
  console.log(`ℹ️ Skipped (already had daily_id): ${skipCount} files`)
  console.log(`❌ Errors: ${errorCount} files`)

  if (errorCount > 0) {
    console.log('\n⚠️ Some files had errors. Check the logs above for details.')
  } else {
    console.log('\n🎉 All files processed successfully!')
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
  stringifyFrontmatter,
  extractMarkovTexts,
  updateMarkdownFile,
  getMarkdownFiles,
  createDailyEntry,
  checkDailyEntryExists,
  checkMarkovTextExists,
  updateMarkovTextWithDailyId,
  createMarkovTextEntry,
}
