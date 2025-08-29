#!/usr/bin/env ts-node

import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { generateCoverArt } from '../src/utils/cover-art-generator'

/**
 * Generate cover art for a given name and save to downloads folder
 * Usage: ts-node scripts/generate-cover-art.ts "Post Name" [count]
 * Examples:
 *   ts-node scripts/generate-cover-art.ts "Post Name"        # Generate 1 image
 *   ts-node scripts/generate-cover-art.ts "Post Name" 5     # Generate 5 images
 */

async function main(): Promise<void> {
  // Get the post name and count from command line arguments
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error('❌ Error: Please provide a post name as an argument')
    console.log('Usage: ts-node scripts/generate-cover-art.ts "Post Name" [count]')
    console.log('Examples:')
    console.log('  ts-node scripts/generate-cover-art.ts "Post Name"        # Generate 1 image')
    console.log('  ts-node scripts/generate-cover-art.ts "Post Name" 5     # Generate 5 images')
    process.exit(1)
  }

  const postName = args[0]
  
  if (!postName || postName.trim() === '') {
    console.error('❌ Error: Post name cannot be empty')
    process.exit(1)
  }

  // Parse count argument (default to 1 if not provided)
  let count = 1
  if (args.length > 1) {
    const countArg = parseInt(args[1], 10)
    if (isNaN(countArg) || countArg < 1) {
      console.error('❌ Error: Count must be a positive number')
      process.exit(1)
    }
    count = countArg
  }

  console.log(`🎨 Generating ${count} cover art image${count > 1 ? 's' : ''} for: "${postName}"`)
  
  try {
    // Get the downloads folder path
    const downloadsPath = path.join(os.homedir(), 'Downloads')
    
    // Create a sanitized filename base
    const sanitizedName = postName
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase()
      .trim()
    
    // Create folder path for multiple images
    let targetPath = downloadsPath
    if (count > 1) {
      const folderName = `${sanitizedName}-cover-art`
      targetPath = path.join(downloadsPath, folderName)
      
      // Create the folder if it doesn't exist
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true })
        console.log(`📁 Created folder: ${targetPath}`)
      }
    }
    
    // Generate multiple cover art images
    for (let i = 1; i <= count; i++) {
      console.log(`🔄 Generating cover art ${i}/${count}...`)
      
      // Generate the cover art buffer with a unique seed for each image
      let coverArtBuffer: Buffer
      if (count > 1) {
        // For multiple images, create a unique seed by combining post name with image number
        const uniquePostName = `${postName}-${i}`
        coverArtBuffer = await generateCoverArt(uniquePostName, 2500)
      } else {
        // For single image, use the original post name
        coverArtBuffer = await generateCoverArt(postName, 2500)
      }
      
      // Create filename with count if generating multiple
      const fileName = count > 1 
        ? `cover-art-${i}.png`
        : `${sanitizedName}-cover-art.png`
      
      const filePath = path.join(targetPath, fileName)
      
      // Save the PNG to downloads folder
      fs.writeFileSync(filePath, coverArtBuffer)
      
      console.log(`✅ Cover art ${i}/${count} generated successfully!`)
      console.log(`📁 Saved to: ${filePath}`)
      console.log(`📊 File size: ${(coverArtBuffer.length / 1024).toFixed(2)} KB`)
      console.log(`🎭 Dimensions: 2500x2500 pixels`)
      
      if (i < count) {
        console.log('') // Add spacing between images
      }
    }
    
    console.log(`🎉 Successfully generated ${count} cover art image${count > 1 ? 's' : ''}!`)
    
  } catch (error) {
    console.error('❌ Error generating cover art:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// Run the script
main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
