/**
 * Spawn Position Management Utilities
 * Reusable functions for managing particle spawn positions in audio-reactive visualizations
 */

/**
 * Update Tat shape positions with dynamic movement
 * @param {Array} tatShapePositions - Array of position objects with movement properties
 * @param {Object} p - p5 instance
 */
export const updateTatShapePositions = (tatShapePositions, p) => {
  tatShapePositions.forEach((pos) => {
    // Circular movement around original position
    pos.movementAngle += pos.movementSpeed * 0.01 * pos.movementDirection

    pos.x = pos.originalX + Math.cos(pos.movementAngle) * pos.movementRadius
    pos.y = pos.originalY + Math.sin(pos.movementAngle) * pos.movementRadius

    // Keep within canvas bounds
    pos.x = Math.max(20, Math.min(p.width - 20, pos.x))
    pos.y = Math.max(20, Math.min(p.height - 20, pos.y))
  })
}

/**
 * Add dynamic movement properties to Tat shape positions
 * @param {Array} tatShapePositions - Array of position objects
 * @param {Object} p - p5 instance
 */
export const addDynamicMovementToPositions = (tatShapePositions, p) => {
  tatShapePositions.forEach((pos, index) => {
    pos.originalX = pos.x
    pos.originalY = pos.y
    pos.movementSpeed = p.random(0.5, 2.0)
    pos.movementRadius = p.random(20, 360)
    pos.movementAngle = p.random(p.TWO_PI)
    pos.movementDirection = p.random([-1, 1])
  })
}

/**
 * Calculate spawn position using Tat shape positions with noise
 * @param {Array} tatShapePositions - Array of Tat shape positions
 * @param {number} bandIndex - Frequency band index
 * @param {number} particleIndex - Particle index within the band
 * @param {Object} p - p5 instance
 * @returns {Object} Object with x and y coordinates
 */
export const calculateTatSpawnPosition = (
  tatShapePositions,
  bandIndex,
  particleIndex,
  p
) => {
  if (tatShapePositions.length === 0) {
    return null
  }

  // Special handling for sub-bass (case 0) - distribute across entire canvas
  if (bandIndex === 0) {
    // Create a distributed grid pattern for sub-bass particles
    const gridSize = Math.ceil(Math.sqrt(tatShapePositions.length * 2)) // More grid points
    const gridSpacingX = p.width / gridSize
    const gridSpacingY = p.height / gridSize

    // Use particle index to determine grid position with some randomness
    const gridX = (particleIndex % gridSize) * gridSpacingX
    const gridY = Math.floor(particleIndex / gridSize) * gridSpacingY

    // Add significant random variation to break up the grid pattern
    const randomOffsetX = (p.random() - 0.5) * gridSpacingX * 0.8
    const randomOffsetY = (p.random() - 0.5) * gridSpacingY * 0.8

    // Add smooth noise for organic movement
    const noiseOffsetX =
      (gridX + particleIndex * 100) * 0.01 + p.frameCount * 0.003
    const noiseOffsetY =
      (gridY + particleIndex * 200) * 0.01 + p.frameCount * 0.003
    const noiseX = (p.noise(noiseOffsetX) - 0.5) * gridSpacingX * 0.6
    const noiseY = (p.noise(noiseOffsetY) - 0.5) * gridSpacingY * 0.6

    return {
      x: gridX + randomOffsetX + noiseX,
      y: gridY + randomOffsetY + noiseY,
    }
  }

  // Original logic for other frequency bands
  const positionIndex = (bandIndex * particleIndex) % tatShapePositions.length
  const position = tatShapePositions[positionIndex]

  // Add smooth noise to spawn position
  const noiseOffsetX = position.x * 0.01 + p.frameCount * 0.005
  const noiseOffsetY = position.y * 0.01 + p.frameCount * 0.005
  const noiseX = (p.noise(noiseOffsetX) - 0.5) * 60
  const noiseY = (p.noise(noiseOffsetY) - 0.5) * 60

  return {
    x: position.x + noiseX,
    y: position.y + noiseY,
  }
}

/**
 * Calculate fallback spawn position based on spawn area
 * @param {string} spawnArea - Spawn area identifier
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} frameCount - Current frame count
 * @param {number} bandIndex - Frequency band index
 * @param {Object} p - p5 instance
 * @returns {Object} Object with x and y coordinates
 */
export const calculateFallbackSpawnPosition = (
  spawnArea,
  canvasWidth,
  canvasHeight,
  frameCount,
  bandIndex,
  p
) => {
  const time = frameCount * 0.01
  let baseX, baseY

  switch (spawnArea) {
    case 'center':
      const centerRadius = 100 + Math.sin(time * 0.5) * 30
      const centerAngle = time * 0.3
      baseX = canvasWidth / 2 + Math.cos(centerAngle) * centerRadius
      baseY = canvasHeight / 2 + Math.sin(centerAngle) * centerRadius
      break
    case 'left':
      const leftY =
        canvasHeight * 0.5 + Math.sin(time * 0.4) * canvasHeight * 0.4
      baseX = canvasWidth * 0.15 + Math.sin(time * 0.6) * 50
      baseY = leftY
      break
    case 'right':
      const rightY =
        canvasHeight * 0.5 + Math.cos(time * 0.4) * canvasHeight * 0.4
      baseX = canvasWidth * 0.85 + Math.sin(time * 0.6) * 50
      baseY = rightY
      break
    case 'top':
      const topX = canvasWidth * 0.5 + Math.sin(time * 0.5) * canvasWidth * 0.4
      baseX = topX
      baseY = canvasHeight * 0.15 + Math.sin(time * 0.7) * 50
      break
    case 'bottom':
      const bottomX =
        canvasWidth * 0.5 + Math.cos(time * 0.5) * canvasWidth * 0.4
      baseX = bottomX
      baseY = canvasHeight * 0.85 + Math.sin(time * 0.7) * 50
      break
    case 'top-left':
      baseX = canvasWidth * 0.2 + Math.sin(time * 0.3) * 40
      baseY = canvasHeight * 0.2 + Math.cos(time * 0.4) * 40
      break
    case 'bottom-right':
      baseX = canvasWidth * 0.8 + Math.sin(time * 0.3) * 40
      baseY = canvasHeight * 0.8 + Math.cos(time * 0.4) * 40
      break
    default:
      baseX = p.random(0, canvasWidth)
      baseY = p.random(0, canvasHeight)
  }

  // Add smooth noise to fallback spawn positions
  const noiseOffsetX = baseX * 0.01 + frameCount * 0.003 + bandIndex * 100
  const noiseOffsetY = baseY * 0.01 + frameCount * 0.003 + bandIndex * 100
  const noiseX = (p.noise(noiseOffsetX) - 0.5) * 50
  const noiseY = (p.noise(noiseOffsetY) - 0.5) * 50

  return {
    x: baseX + noiseX,
    y: baseY + noiseY,
  }
}

/**
 * Calculate spawn position for a particle
 * @param {Array} tatShapePositions - Array of Tat shape positions
 * @param {string} spawnArea - Spawn area identifier
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} frameCount - Current frame count
 * @param {number} bandIndex - Frequency band index
 * @param {number} particleIndex - Particle index within the band
 * @param {Object} p - p5 instance
 * @returns {Object} Object with x and y coordinates
 */
export const calculateSpawnPosition = (
  tatShapePositions,
  spawnArea,
  canvasWidth,
  canvasHeight,
  frameCount,
  bandIndex,
  particleIndex,
  p
) => {
  // Try Tat shape positions first
  const tatPosition = calculateTatSpawnPosition(
    tatShapePositions,
    bandIndex,
    particleIndex,
    p
  )

  if (tatPosition) {
    return tatPosition
  }

  // Fallback to spawn area-based positioning
  return calculateFallbackSpawnPosition(
    spawnArea,
    canvasWidth,
    canvasHeight,
    frameCount,
    bandIndex,
    p
  )
}
