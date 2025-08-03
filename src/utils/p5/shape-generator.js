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
  }

  return positions
}

// Generate Tat shape positions based on markov text seed
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
