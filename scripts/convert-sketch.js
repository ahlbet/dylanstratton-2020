const fs = require('fs')
const path = require('path')

function convertSketchToComponent(sketchPath, outputPath, componentName) {
  try {
    // Read the original sketch
    const sketchContent = fs.readFileSync(sketchPath, 'utf8')

    // Convert the sketch to work with P5Sketch component
    const convertedContent = convertSketchContent(sketchContent, componentName)

    // Write the converted component
    fs.writeFileSync(outputPath, convertedContent)

    console.log(`✅ Successfully converted sketch to: ${outputPath}`)
    console.log(`📝 Component name: ${componentName}`)
  } catch (error) {
    console.error('❌ Error converting sketch:', error.message)
    process.exit(1)
  }
}

function convertSketchContent(sketchContent, componentName) {
  // Remove any existing imports or exports
  let content = sketchContent
    .replace(/^import.*$/gm, '')
    .replace(/^export.*$/gm, '')
    .trim()

  // Extract and convert the class definition
  const classDefinition = extractClassDefinition(content)

  // Extract global variables
  const globalVars = extractGlobalVariables(content)

  // Create the React component structure
  const componentContent = `import React from 'react'
import P5Sketch from '../p5-sketch/p5-sketch'

// Converted from standalone p5.js sketch
const ${componentName}Sketch = (p) => {
  // Global variables converted to local scope
${globalVars.map((varDecl) => `  ${varDecl}`).join('\n')}

${classDefinition}

  p.setup = () => {
${extractSetupFunction(content)}
  }

  p.draw = () => {
${extractDrawFunction(content)}
  }

${extractOtherFunctions(content)}
}

const ${componentName} = ({ className = '', style = {} }) => {
  return (
    <P5Sketch 
      sketch={${componentName}Sketch}
      className={className}
      style={style}
    />
  )
}

export default ${componentName}
`

  return componentContent
}

function extractGlobalVariables(content) {
  const lines = content.split('\n')
  const variables = []

  for (let line of lines) {
    line = line.trim()
    // Match variable declarations
    if (line.match(/^(let|const|var)\s+\w+\s*=/)) {
      // Skip function declarations
      if (!line.includes('function')) {
        variables.push(line)
      }
    }
  }

  return variables
}

function extractClassDefinition(content) {
  const classMatch = content.match(/class\s+(\w+)\s*\{([\s\S]*?)\n\}/)
  if (classMatch) {
    const className = classMatch[1]
    let classBody = classMatch[2]

    // Convert p5 functions in class methods
    classBody = convertP5Functions(classBody)

    return `  class ${className} {
${classBody
  .split('\n')
  .map((line) => `    ${line}`)
  .join('\n')}
  }`
  }
  return ''
}

function extractSetupFunction(content) {
  const setupMatch = content.match(/function\s+setup\s*\(\)\s*\{([\s\S]*?)\n\}/)
  if (setupMatch) {
    let setupContent = setupMatch[1]
    // Convert p5 functions to use p5 instance
    setupContent = convertP5Functions(setupContent)
    return setupContent
      .split('\n')
      .map((line) => `    ${line}`)
      .join('\n')
  }
  return '    p.createCanvas(800, 600)'
}

function extractDrawFunction(content) {
  const drawMatch = content.match(/function\s+draw\s*\(\)\s*\{([\s\S]*?)\n\}/)
  if (drawMatch) {
    let drawContent = drawMatch[1]
    // Convert p5 functions to use p5 instance
    drawContent = convertP5Functions(drawContent)
    return drawContent
      .split('\n')
      .map((line) => `    ${line}`)
      .join('\n')
  }
  return '    // No draw function found'
}

function extractOtherFunctions(content) {
  const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/g
  const functions = []
  let match

  while ((match = functionPattern.exec(content)) !== null) {
    const funcName = match[1]
    let funcBody = match[2]

    // Skip setup and draw functions (already handled)
    if (funcName === 'setup' || funcName === 'draw') continue

    // Convert p5 functions to use p5 instance
    funcBody = convertP5Functions(funcBody)

    functions.push(`  p.${funcName} = () => {
${funcBody
  .split('\n')
  .map((line) => `    ${line}`)
  .join('\n')}
  }`)
  }

  return functions.join('\n\n')
}

function convertP5Functions(content) {
  // List of p5.js functions that need to be prefixed with 'p.'
  const p5Functions = [
    'background',
    'fill',
    'stroke',
    'noStroke',
    'noFill',
    'ellipse',
    'rect',
    'line',
    'point',
    'triangle',
    'beginShape',
    'endShape',
    'vertex',
    'map',
    'noise',
    'sin',
    'cos',
    'dist',
    'floor',
    'width',
    'height',
    'frameCount',
    'push',
    'pop',
    'translate',
    'rotate',
    'scale',
    'createCanvas',
    'windowWidth',
    'windowHeight',
  ]

  let converted = content

  p5Functions.forEach((func) => {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${func}\\b`, 'g')
    converted = converted.replace(regex, `p.${func}`)
  })

  return converted
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.log(
      'Usage: node convert-sketch.js <input-sketch-path> <output-component-path> [component-name]'
    )
    console.log(
      'Example: node convert-sketch.js ../p5-sketchbook/Grid/sketch.js src/components/grid-sketch/grid-sketch.js GridSketch'
    )
    process.exit(1)
  }

  const inputPath = args[0]
  const outputPath = args[1]
  const componentName = args[2] || 'ConvertedSketch'

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  convertSketchToComponent(inputPath, outputPath, componentName)
}

module.exports = { convertSketchToComponent }
