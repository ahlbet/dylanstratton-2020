#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const name = process.argv[2]

if (!name) {
  console.log(`Usage: node ${path.basename(process.argv[1])} <name>`)
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

const downloadsPath = path.join(
  process.env.HOME || process.env.USERPROFILE,
  'Downloads',
  `${name}.wav`
)
const destDir = path.join(process.cwd(), 'content', 'assets', 'music')
const destPath = path.join(destDir, `${name}.wav`)

fs.mkdirSync(destDir, { recursive: true })

if (fs.existsSync(downloadsPath)) {
  fs.renameSync(downloadsPath, destPath)
  console.log(`Moved file from '${downloadsPath}' to '${destPath}'.`)
} else {
  console.warn(`File '${downloadsPath}' not found. Skipping move.`)
}

// Replace {name}, {date}, and {description} in template
template = template
  .replace(/\{name\}/g, name)
  .replace(/\{date\}/g, date)
  .replace(/\{description\}/g, description)

fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(file, template)

console.log(
  `Created folder '${name}' and file '${name}/${name}.md' with template content.`
)
