#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

/**
 * Promisify readline question
 */
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

/**
 * Fetch 5 random unedited markov texts
 */
async function fetchRandomTexts(count = 5) {
  try {
    console.log(`🎲 Fetching ${count} random unedited texts...`)

    // Get total count of unedited texts
    const { count: totalCount, error: countError } = await supabase
      .from('markov_texts')
      .select('*', { count: 'exact', head: true })
      .eq('edited', false)

    if (countError) {
      throw new Error(`Failed to get count: ${countError.message}`)
    }

    if (!totalCount || totalCount === 0) {
      console.log('✅ No unedited texts found! All texts have been edited.')
      return []
    }

    console.log(`📊 Found ${totalCount} unedited texts total`)

    // Fetch random texts using random offsets
    const texts = []
    const usedOffsets = new Set()
    const actualCount = Math.min(count, totalCount)

    for (let i = 0; i < actualCount; i++) {
      let randomOffset
      do {
        randomOffset = Math.floor(Math.random() * totalCount)
      } while (usedOffsets.has(randomOffset))

      usedOffsets.add(randomOffset)

      const { data: textData, error: textError } = await supabase
        .from('markov_texts')
        .select('id, text_content, text_length, created_at')
        .eq('edited', false)
        .range(randomOffset, randomOffset)

      if (textError) {
        console.error(`❌ Error fetching text ${i + 1}:`, textError.message)
        continue
      }

      if (textData && textData.length > 0) {
        texts.push(textData[0])
      }
    }

    console.log(`✅ Fetched ${texts.length} texts`)
    return texts
  } catch (error) {
    console.error('❌ Error fetching texts:', error.message)
    return []
  }
}

/**
 * Display text and get user input for editing
 */
async function editText(text, index, total) {
  console.log('\n' + '='.repeat(80))
  console.log(`📝 Text ${index + 1} of ${total} (ID: ${text.id})`)
  console.log(`📏 Length: ${text.text_length} characters`)
  console.log(`📅 Created: ${new Date(text.created_at).toLocaleDateString()}`)
  console.log('='.repeat(80))
  console.log('\n📄 Current text:')
  console.log('─'.repeat(40))
  console.log(text.text_content)
  console.log('─'.repeat(40))

  while (true) {
    console.log('\nOptions:')
    console.log('1. Edit text (line by line)')
    console.log('2. Skip this text')
    console.log('3. Mark as edited without changes')
    console.log('4. Exit editor')

    const choice = await question('\nEnter your choice (1-4): ')

    switch (choice.trim()) {
      case '1':
        return await editTextLineByLine(text)
      case '2':
        console.log('⏭️  Skipping this text...')
        return null
      case '3':
        return await saveText(text, text.text_content, true)
      case '4':
        console.log('👋 Exiting editor...')
        return 'exit'
      default:
        console.log('❌ Invalid choice. Please enter 1-4.')
    }
  }
}

/**
 * Edit text line by line with current text shown
 */
async function editTextLineByLine(text) {
  console.log('\n📝 Editing text line by line:')
  console.log('💡 Press Enter to keep the current line, or type your changes')
  console.log('💡 Type "add" to add a new line, "done" when finished')

  const currentLines = text.text_content.split('\n')
  const lines = []

  // Edit existing lines
  for (let i = 0; i < currentLines.length; i++) {
    const currentLine = currentLines[i]
    console.log(`\nLine ${i + 1}: "${currentLine}"`)

    while (true) {
      const action = await question(
        'Action (Enter=keep, type=edit, "add"=new line, "done"=finish): '
      )

      if (action === 'done') {
        // Add remaining lines as-is
        for (let j = i; j < currentLines.length; j++) {
          lines.push(currentLines[j])
        }
        return await finishEditing(text, lines)
      } else if (action === 'add') {
        const newLine = await question('Enter new line: ')
        if (newLine.trim()) {
          lines.push(newLine.trim())
        }
        break
      } else if (action === '') {
        // Keep current line
        lines.push(currentLine)
        break
      } else {
        // Edit current line
        lines.push(action)
        break
      }
    }
  }

  // Allow adding more lines
  console.log('\n💡 You can add more lines (type "done" when finished)')
  while (true) {
    const action = await question('Action ("add"=new line, "done"=finish): ')

    if (action === 'done') {
      break
    } else if (action === 'add') {
      const newLine = await question('Enter new line: ')
      if (newLine.trim()) {
        lines.push(newLine.trim())
      }
    }
  }

  return await finishEditing(text, lines)
}

/**
 * Finish the editing process
 */
async function finishEditing(text, lines) {
  const editedText = lines.join('\n').trim()

  if (editedText === '') {
    console.log('❌ Text cannot be empty. Please try again.')
    return await editTextLineByLine(text)
  }

  console.log('\n📄 Final edited text:')
  console.log('─'.repeat(40))
  console.log(editedText)
  console.log('─'.repeat(40))

  const confirm = await question('\nSave this edit? (y/n): ')

  if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
    return await saveText(text, editedText, true)
  } else {
    console.log("🔄 Let's try editing again...")
    return await editTextLineByLine(text)
  }
}

/**
 * Save the edited text to the database
 */
async function saveText(originalText, newText, markAsEdited = true) {
  try {
    const updateData = {
      text_content: newText,
      text_length: newText.length,
    }

    if (markAsEdited) {
      updateData.edited = true
    }

    const { error } = await supabase
      .from('markov_texts')
      .update(updateData)
      .eq('id', originalText.id)

    if (error) {
      throw new Error(`Failed to save: ${error.message}`)
    }

    console.log('✅ Text saved successfully!')
    return { success: true, text: { ...originalText, text_content: newText } }
  } catch (error) {
    console.error('❌ Error saving text:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Main editor function
 */
async function startEditor() {
  console.log('🎲 Markov Text Editor (CLI)')
  console.log('==========================')

  try {
    // Fetch random texts
    const texts = await fetchRandomTexts(5)

    if (texts.length === 0) {
      console.log('🎉 No texts to edit!')
      rl.close()
      return
    }

    console.log(`\n📝 Ready to edit ${texts.length} texts`)
    console.log('Press Ctrl+C at any time to exit\n')

    let editedCount = 0
    let skippedCount = 0

    for (let i = 0; i < texts.length; i++) {
      const result = await editText(texts[i], i, texts.length)

      if (result === 'exit') {
        break
      } else if (result && result.success) {
        editedCount++
      } else if (result === null) {
        skippedCount++
      }
    }

    // Summary
    console.log('\n📊 Editing Session Summary:')
    console.log(`✅ Edited: ${editedCount} texts`)
    console.log(`⏭️  Skipped: ${skippedCount} texts`)
    console.log(`📝 Total processed: ${editedCount + skippedCount} texts`)
  } catch (error) {
    console.error('❌ Error in editor:', error.message)
  } finally {
    rl.close()
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!')
  rl.close()
  process.exit(0)
})

// Run the editor
if (require.main === module) {
  startEditor()
}

module.exports = { startEditor, fetchRandomTexts }
