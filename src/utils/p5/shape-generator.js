// Shared shape generation utilities for audio-reactive visualizations

// Generate a seed from text to influence shape behavior
export const generateSeedFromText = (text) => {
  if (!text || typeof text !== 'string') return 0

  let seed = 0
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    if (isFinite(charCode)) {
      seed += charCode * (i + 1)
    }
  }

  // Validate final seed
  const finalSeed = seed % 10000
  return isFinite(finalSeed) ? finalSeed : 0
}

// Generate spawn positions based on different patterns
export const generateSpawnPositions = (
  seed,
  canvasWidth,
  canvasHeight,
  pattern = 0,
  density = 1.0,
  margin = 5
) => {
  const positions = []
  const insetMargin = margin + 30
  
  switch (pattern) {
    case 0: // Random distribution
      const randomCount = Math.floor(50 * density)
      for (let i = 0; i < randomCount; i++) {
        const x = insetMargin + (seed * (i + 1) * 137) % (canvasWidth - 2 * insetMargin)
        const y = insetMargin + (seed * (i + 1) * 73) % (canvasHeight - 2 * insetMargin)
        positions.push({ x, y })
      }
      break
      
    case 1: // Grid pattern
      const gridSize = Math.max(5, Math.floor(10 * density))
      const cellWidth = (canvasWidth - 2 * insetMargin) / gridSize
      const cellHeight = (canvasHeight - 2 * insetMargin) / gridSize
      
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          if ((seed * (row * gridSize + col)) % 3 === 0) { // 33% chance per cell
            const x = insetMargin + col * cellWidth + (seed * (row + col)) % (cellWidth * 0.8)
            const y = insetMargin + row * cellHeight + (seed * (row * col)) % (cellHeight * 0.8)
            positions.push({ x, y })
          }
        }
      }
      break
      
    case 2: // Spiral pattern
      const spiralCount = Math.floor(100 * density)
      const maxRadius = Math.min(canvasWidth, canvasHeight) / 2 - insetMargin
      const centerX = canvasWidth / 2
      const centerY = canvasHeight / 2
      
      for (let i = 0; i < spiralCount; i++) {
        const angle = (i / spiralCount) * Math.PI * 8 + (seed % 100) / 100
        const radius = (i / spiralCount) * maxRadius * (0.3 + (seed % 70) / 100)
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        
        if (x >= insetMargin && x <= canvasWidth - insetMargin && 
            y >= insetMargin && y <= canvasHeight - insetMargin) {
          positions.push({ x, y })
        }
      }
      break
      
    case 3: // Wave pattern
      const waveCount = Math.floor(80 * density)
      const waveAmplitude = (canvasHeight - 2 * insetMargin) * 0.3
      const waveFrequency = 0.02 + (seed % 50) / 1000
      
      for (let i = 0; i < waveCount; i++) {
        const x = insetMargin + (i / (waveCount - 1)) * (canvasWidth - 2 * insetMargin)
        const baseY = canvasHeight / 2
        const waveOffset = Math.sin(i * waveFrequency) * waveAmplitude
        const y = baseY + waveOffset + ((seed * i) % 40 - 20)
        
        if (y >= insetMargin && y <= canvasHeight - insetMargin) {
          positions.push({ x, y })
        }
      }
      break
  }
  
  return positions
}

// Generate particle positions for each shape type
export const generateShapePositions = (
  centerX,
  centerY,
  shapeType,
  canvasDimensions,
  shapeSeed,
  margin = 5
) => {
  const positions = []
  const numParticles = 25 + (shapeSeed % 8) // 25-32 particles per shape
  const { width, height } = canvasDimensions
  const insetMargin = margin + 30 // Additional inset to prevent particles from getting stuck at edges

  switch (shapeType) {
    case 'horizontalLine':
      for (let i = 0; i < numParticles; i++) {
        const t = i / (numParticles - 1) // 0 to 1
        const x = insetMargin + t * (width - 2 * insetMargin) // Inset width span
        const y = centerY + (((shapeSeed * i) % 40) - 20) // Vertical variation
        positions.push({ x, y })
      }
      break

    case 'verticalLine':
      for (let i = 0; i < numParticles; i++) {
        const t = i / (numParticles - 1) // 0 to 1
        const x = centerX + (((shapeSeed * i) % 40) - 20) // Horizontal variation
        const y = insetMargin + t * (height - 2 * insetMargin) // Inset height span
        positions.push({ x, y })
      }
      break

    case 'circle':
      for (let i = 0; i < numParticles; i++) {
        const angle = (i / numParticles) * Math.PI * 2
        // Use ellipse with inset margins
        const radiusX = (width - 2 * insetMargin) / 2
        const radiusY = (height - 2 * insetMargin) / 2
        const x =
          centerX +
          Math.cos(angle) * radiusX * (0.8 + ((shapeSeed * i) % 40) / 100)
        const y =
          centerY +
          Math.sin(angle) * radiusY * (0.8 + ((shapeSeed * i) % 40) / 100)
        positions.push({ x, y })
      }
      break

    case 'triangle':
      for (let i = 0; i < numParticles; i++) {
        // Three vertices of triangle with inset margins
        const vertices = [
          { x: centerX, y: insetMargin }, // top
          { x: insetMargin, y: height - insetMargin }, // bottom left
          { x: width - insetMargin, y: height - insetMargin }, // bottom right
        ]

        if (i < 3) {
          // Place particles at vertices
          positions.push(vertices[i])
        } else {
          // Place particles along edges
          const edgeIndex = (i - 3) % 3
          const t = ((shapeSeed * i) % 100) / 100 // Random position along edge
          const start = vertices[edgeIndex]
          const end = vertices[(edgeIndex + 1) % 3]
          const x = start.x + (end.x - start.x) * t
          const y = start.y + (end.y - start.y) * t
          positions.push({ x, y })
        }
      }
      break

    case 'square':
      for (let i = 0; i < numParticles; i++) {
        if (i < 4) {
          // Place particles at corners with inset margins
          const corners = [
            { x: insetMargin, y: insetMargin }, // top left
            { x: width - insetMargin, y: insetMargin }, // top right
            { x: width - insetMargin, y: height - insetMargin }, // bottom right
            { x: insetMargin, y: height - insetMargin }, // bottom left
          ]
          positions.push(corners[i])
        } else {
          // Place particles along edges
          const side = (i - 4) % 4
          const t = ((shapeSeed * i) % 100) / 100

          let x, y
          switch (side) {
            case 0: // top edge
              x = insetMargin + t * (width - 2 * insetMargin)
              y = insetMargin
              break
            case 1: // right edge
              x = width - insetMargin
              y = insetMargin + t * (height - 2 * insetMargin)
              break
            case 2: // bottom edge
              x = width - insetMargin - t * (width - 2 * insetMargin)
              y = height - insetMargin
              break
            case 3: // left edge
              x = insetMargin
              y = height - insetMargin - t * (height - 2 * insetMargin)
              break
          }
          positions.push({ x, y })
        }
      }
      break
      
    case 'cross':
      for (let i = 0; i < numParticles; i++) {
        if (i < 2) {
          // Horizontal line
          const x = insetMargin + (i * (width - 2 * insetMargin))
          const y = centerY + ((shapeSeed * i) % 20 - 10)
          positions.push({ x, y })
        } else if (i < 4) {
          // Vertical line
          const x = centerX + ((shapeSeed * i) % 20 - 10)
          const y = insetMargin + ((i - 2) * (height - 2 * insetMargin))
          positions.push({ x, y })
        } else {
          // Additional particles along the cross
          const isHorizontal = ((shapeSeed * i) % 2) === 0
          if (isHorizontal) {
            const x = insetMargin + ((shapeSeed * i) % (width - 2 * insetMargin))
            const y = centerY + ((shapeSeed * (i + 1)) % 40 - 20)
            positions.push({ x, y })
          } else {
            const x = centerX + ((shapeSeed * (i + 1)) % 40 - 20)
            const y = insetMargin + ((shapeSeed * i) % (height - 2 * insetMargin))
            positions.push({ x, y })
          }
        }
      }
      break
      
    case 'diamond':
      for (let i = 0; i < numParticles; i++) {
        const angle = (i / numParticles) * Math.PI * 2
        const radiusX = (width - 2 * insetMargin) / 2
        const radiusY = (height - 2 * insetMargin) / 2
        
        // Create diamond shape by rotating the coordinate system
        const rotatedAngle = angle + Math.PI / 4
        const x = centerX + Math.cos(rotatedAngle) * radiusX * 0.7
        const y = centerY + Math.sin(rotatedAngle) * radiusY * 0.7
        
        if (x >= insetMargin && x <= width - insetMargin && 
            y >= insetMargin && y <= height - insetMargin) {
          positions.push({ x, y })
        }
      }
      break
  }

  return positions
}

// Generate Tat shape positions based on markov text seed with enhanced variety
export const generateTatShapePositions = (
  markovSeed,
  canvasWidth,
  canvasHeight,
  margin = 5
) => {
  const shapes = [
    'horizontalLine',
    'verticalLine',
    'circle',
    'triangle',
    'square',
    'cross',
    'diamond',
  ]

  const positions = []

  // Generate multiple Tat positions distributed across the canvas
  const tatCount = Math.max(1, Math.floor(canvasWidth / 300)) // More Tats for wider canvases
  const typesCount = Math.floor(markovSeed % 5) + 1

  for (let tatIndex = 0; tatIndex < tatCount; tatIndex++) {
    // Distribute Tats across the canvas width
    const tatX = (canvasWidth / (tatCount + 1)) * (tatIndex + 1)
    const tatY =
      canvasHeight / 2 + (((markovSeed * (tatIndex + 1)) % 200) - 100)

    for (let i = 0; i < typesCount; i++) {
      const shapeIndex = Math.floor(
        (markovSeed * (tatIndex + 1) * (i + 1) * 123) % shapes.length
      )
      const shapeType = shapes[shapeIndex]

      // Generate positions based on shape type with full canvas dimensions
      const shapePositions = generateShapePositions(
        tatX,
        tatY,
        shapeType,
        { width: canvasWidth, height: canvasHeight }, // Pass full canvas dimensions
        markovSeed * (tatIndex + 1) * (i + 1),
        margin
      )
      positions.push(...shapePositions)
    }
  }

  // Add additional distributed spawn points for better coverage
  const additionalPoints = Math.max(
    5,
    Math.floor((canvasWidth * canvasHeight) / 50000)
  ) // More points for larger canvases

  for (let i = 0; i < additionalPoints; i++) {
    const seedOffset = markovSeed * (i + 100)
    const x = margin + (seedOffset % (canvasWidth - 2 * margin))
    const y = margin + ((seedOffset * 7) % (canvasHeight - 2 * margin))
    positions.push({ x, y })
  }

  return positions
}

// Generate enhanced spawn positions with pattern variety
export const generateEnhancedSpawnPositions = (
  seed,
  canvasWidth,
  canvasHeight,
  options = {}
) => {
  const {
    pattern = seed % 4,
    density = 1.0,
    margin = 5,
    enableSymmetry = false,
    symmetryLevel = seed % 3
  } = options
  
  let positions = generateSpawnPositions(seed, canvasWidth, canvasHeight, pattern, density, margin)
  
  // Apply symmetry if enabled
  if (enableSymmetry && symmetryLevel > 0) {
    const symmetricPositions = []
    
    positions.forEach(pos => {
      symmetricPositions.push(pos) // Original position
      
      if (symmetryLevel >= 1) {
        // Horizontal symmetry
        symmetricPositions.push({
          x: canvasWidth - pos.x,
          y: pos.y
        })
      }
      
      if (symmetryLevel >= 2) {
        // Vertical symmetry
        symmetricPositions.push({
          x: pos.x,
          y: canvasHeight - pos.y
        })
        
        // Both axes symmetry
        symmetricPositions.push({
          x: canvasWidth - pos.x,
          y: canvasHeight - pos.y
        })
      }
    })
    
    positions = symmetricPositions
  }
  
  return positions
}
