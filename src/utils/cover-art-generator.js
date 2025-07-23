const { createCanvas } = require('canvas')

/**
 * Server-side cover art generator using Tat sketch logic
 * Generates 2500x2500 PNG images for blog post cover art
 */

class CoverArtGenerator {
  constructor(seed = 0, size = 2500) {
    this.seed = seed
    this.size = size
    this.canvas = createCanvas(size, size)
    this.ctx = this.canvas.getContext('2d')

    // Tat sketch parameters scaled for cover art - 4x4 grid
    this.border = Math.floor(size * 0.15) // ~375px for 2500px canvas
    this.spacing = Math.floor(size * 0.23) // ~575px for 2500px canvas
    this.shapes = ['horizontalLine', 'verticalLine', 'circle', 'bezier']

    // Seeded random number generator
    this.randomSeed = seed
    this.setupCanvas()
  }

  // Seeded random number generator (simple LCG)
  random(min = 0, max = 1) {
    this.randomSeed = (this.randomSeed * 1664525 + 1013904223) % 4294967296
    const val = this.randomSeed / 4294967296
    return min + val * (max - min)
  }

  // Random integer between min and max (inclusive)
  randomInt(min, max) {
    return Math.floor(this.random(min, max + 1))
  }

  // Choose random array element
  randomChoice(array) {
    return array[this.randomInt(0, array.length - 1)]
  }

  // Noise function (simplified)
  noise(x, y = 0, z = 0) {
    const hash = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791)
    return Math.abs(Math.sin(hash)) % 1
  }

  setupCanvas() {
    // Set background to light gray like original
    this.ctx.fillStyle = '#E6E6E6' // RGB(230, 230, 230)
    this.ctx.fillRect(0, 0, this.size, this.size)

    // Set drawing properties
    this.ctx.strokeStyle = '#000000'
    this.ctx.lineWidth = Math.floor(this.size * 0.004) // ~10px for 2500px canvas
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
  }

  generateTats() {
    const tats = []

    // Create grid of Tats like original sketch
    for (let y = this.border; y <= this.size - this.border; y += this.spacing) {
      for (
        let x = this.border;
        x <= this.size - this.border;
        x += this.spacing
      ) {
        const tat = new Tat(x, y, this)
        tats.push(tat)
      }
    }

    return tats
  }

  drawTats() {
    // Create a single centered Tat instead of a grid
    const centerX = this.size / 2
    const centerY = this.size / 2
    const tat = new Tat(centerX, centerY, this)

    tat.chooseShapes()
    tat.show()
  }

  generateCoverArt() {
    this.drawTats()
    return this.canvas.toBuffer('image/png')
  }
}

class Tat {
  constructor(x, y, generator) {
    this.x = x
    this.y = y
    this.generator = generator
    this.ctx = generator.ctx
    this.typesCount = generator.randomInt(2, 5) // 2-5 shape types (cleaner compositions)
    this.shapes = []
    this.n = 6 // Even more repetitions for complex layering
  }

  chooseShapes() {
    for (let i = 0; i < this.typesCount; i++) {
      this.shapes.push(this.generator.randomChoice(this.generator.shapes))
    }
  }

  show() {
    // Start at the center and chain shapes together in a connected flow
    let currentPoint = { x: this.x, y: this.y }

    // Draw multiple shapes with connected endpoints
    this.shapes.forEach((shapeType, index) => {
      const baseRadius = this.generator.size * 0.25 // 25% of canvas size as base
      const radius = this.generator.random(
        baseRadius * 0.5, // 50% to 120% of base radius (12.5% to 30% of canvas)
        baseRadius * 1.2
      )
      const repetitions = this.generator.randomInt(0, this.n - 1)

      // Draw shape starting at current point and get its endpoint
      let endpoint = currentPoint

      switch (shapeType) {
        case 'horizontalLine':
          endpoint = this.drawConnectedHorizontalLine(
            currentPoint.x,
            currentPoint.y,
            radius,
            repetitions
          )
          break
        case 'verticalLine':
          endpoint = this.drawConnectedVerticalLine(
            currentPoint.x,
            currentPoint.y,
            radius,
            repetitions
          )
          break
        case 'circle':
          endpoint = this.drawConnectedCircle(
            currentPoint.x,
            currentPoint.y,
            radius * 0.25,
            repetitions
          )
          break
        case 'triangle':
          endpoint = this.drawConnectedTriangle(
            currentPoint.x,
            currentPoint.y,
            radius,
            repetitions
          )
          break
        case 'square':
          endpoint = this.drawConnectedSquare(
            currentPoint.x,
            currentPoint.y,
            radius,
            repetitions
          )
          break
        case 'bezier':
          endpoint = this.drawConnectedBezier(
            currentPoint.x,
            currentPoint.y,
            radius,
            repetitions
          )
          break
      }

      // Next shape starts where this one ended
      currentPoint = endpoint
    })
  }

  // Connected drawing methods that return endpoints for chaining
  drawConnectedHorizontalLine(x, y, r, n) {
    // Draw additional lines with shifts
    for (let i = 0; i < n; i++) {
      if (this.repeatAndShift()) {
        let shift = this.generator.random(-r / 4, r / 4)
        this.drawLine(x - r / 2, y + shift, x + r / 2, y + shift)
      }
    }
    // Draw main line
    this.drawLine(x - r / 2, y, x + r / 2, y)

    // Return right endpoint of the line
    return { x: x + r / 2, y: y }
  }

  drawConnectedVerticalLine(x, y, r, n) {
    // Draw additional lines with shifts
    for (let i = 0; i < n; i++) {
      if (this.repeatAndShift()) {
        let shift = this.generator.random(-r / 4, r / 4)
        this.drawLine(x + shift, y - r / 2, x + shift, y + r / 2)
      }
    }
    // Draw main line
    this.drawLine(x, y - r / 2, x, y + r / 2)

    // Return bottom endpoint of the line
    return { x: x, y: y + r / 2 }
  }

  drawConnectedCircle(x, y, r, n) {
    // Draw additional circles with shifts
    for (let i = 0; i < n; i++) {
      if (this.repeatAndShift()) {
        let xShift = this.generator.noise(x, y, n) * (r / 2)
        let yShift = this.generator.noise(x, y, n) * (r / 2)
        if (this.generator.random() < 0.5) xShift = -xShift
        if (this.generator.random() < 0.5) yShift = -yShift
        this.drawCircleShape(x + xShift, y + yShift, r)
      }
    }
    // Draw main circle
    this.drawCircleShape(x, y, r)

    // Return a point on the circle's circumference
    const angle = this.generator.random(0, Math.PI * 2)
    return {
      x: x + Math.cos(angle) * (r / 2),
      y: y + Math.sin(angle) * (r / 2),
    }
  }

  drawConnectedTriangle(x, y, r, n) {
    // Draw additional triangles with shifts
    for (let i = 0; i < n; i++) {
      if (this.repeatAndShift()) {
        let xShift = this.generator.noise(x, y, n) * (r / 2)
        let yShift = this.generator.noise(x, y, n) * (r / 2)
        if (this.generator.random() < 0.5) xShift = -xShift
        if (this.generator.random() < 0.5) yShift = -yShift
        this.drawTriangleShape(x + xShift, y + yShift, r)
      }
    }
    // Draw main triangle
    this.drawTriangleShape(x, y, r)

    // Return one of the triangle's vertices
    const angle = this.generator.random(0, Math.PI * 2)
    return {
      x: x + Math.cos(angle) * (r / 2),
      y: y + Math.sin(angle) * (r / 2),
    }
  }

  drawConnectedSquare(x, y, r, n) {
    // Draw additional squares with shifts
    for (let i = 0; i < n; i++) {
      if (this.repeatAndShift()) {
        let xShift = this.generator.noise(x, y, n) * (r / 2)
        let yShift = this.generator.noise(x, y, n) * (r / 2)
        if (this.generator.random() < 0.5) xShift = -xShift
        if (this.generator.random() < 0.5) yShift = -yShift
        this.drawSquareShape(x + xShift, y + yShift, r)
      }
    }
    // Draw main square
    this.drawSquareShape(x, y, r)

    // Return one of the square's corners
    const corners = [
      { x: x + r / 2, y: y + r / 2 },
      { x: x - r / 2, y: y + r / 2 },
      { x: x - r / 2, y: y - r / 2 },
      { x: x + r / 2, y: y - r / 2 },
    ]
    return this.generator.randomChoice(corners)
  }

  drawConnectedBezier(x, y, r, n) {
    // Draw additional bezier curves with shifts
    for (let i = 0; i < n; i++) {
      if (this.repeatAndShift()) {
        let xShift = this.generator.noise(x, y, n) * (r / 3)
        let yShift = this.generator.noise(x, y, n) * (r / 3)
        if (this.generator.random() < 0.5) xShift = -xShift
        if (this.generator.random() < 0.5) yShift = -yShift
        this.drawBezierShape(x + xShift, y + yShift, r)
      }
    }
    // Draw main bezier curve and return its endpoint
    return this.drawConnectedBezierShape(x, y, r)
  }

  // Helper drawing methods
  drawLine(x1, y1, x2, y2) {
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()
  }

  drawCircleShape(x, y, r) {
    this.ctx.beginPath()
    this.ctx.arc(x, y, r / 2, 0, Math.PI * 2)
    this.ctx.stroke()
  }

  drawTriangleShape(x, y, r) {
    const height = (r * Math.sqrt(3)) / 2
    this.ctx.beginPath()
    this.ctx.moveTo(x, y - height / 2)
    this.ctx.lineTo(x - r / 2, y + height / 2)
    this.ctx.lineTo(x + r / 2, y + height / 2)
    this.ctx.closePath()
    this.ctx.stroke()
  }

  drawSquareShape(x, y, r) {
    this.ctx.beginPath()
    this.ctx.rect(x - r / 2, y - r / 2, r, r)
    this.ctx.stroke()
  }

  drawBezierShape(x, y, r) {
    // Generate random bezier curve points within the radius
    const angle1 = this.generator.random(0, Math.PI * 2)
    const angle2 = this.generator.random(0, Math.PI * 2)

    // Start and end points on circle boundary
    const startX = x + Math.cos(angle1) * (r / 2)
    const startY = y + Math.sin(angle1) * (r / 2)
    const endX = x + Math.cos(angle2) * (r / 2)
    const endY = y + Math.sin(angle2) * (r / 2)

    // Control points - create interesting curves
    const cp1Distance = this.generator.random(r * 0.3, r * 0.8)
    const cp2Distance = this.generator.random(r * 0.3, r * 0.8)
    const cp1Angle = this.generator.random(0, Math.PI * 2)
    const cp2Angle = this.generator.random(0, Math.PI * 2)

    const cp1X = x + Math.cos(cp1Angle) * cp1Distance
    const cp1Y = y + Math.sin(cp1Angle) * cp1Distance
    const cp2X = x + Math.cos(cp2Angle) * cp2Distance
    const cp2Y = y + Math.sin(cp2Angle) * cp2Distance

    // Draw the bezier curve
    this.ctx.beginPath()
    this.ctx.moveTo(startX, startY)
    this.ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY)
    this.ctx.stroke()
  }

  drawConnectedBezierShape(x, y, r) {
    // Start point is the current position (where previous shape ended)
    const startX = x
    const startY = y

    // Generate end point at distance r from start
    const endAngle = this.generator.random(0, Math.PI * 2)
    const endX = x + Math.cos(endAngle) * r
    const endY = y + Math.sin(endAngle) * r

    // Control points - create interesting curves
    const cp1Distance = this.generator.random(r * 0.3, r * 0.8)
    const cp2Distance = this.generator.random(r * 0.3, r * 0.8)
    const cp1Angle = this.generator.random(0, Math.PI * 2)
    const cp2Angle = this.generator.random(0, Math.PI * 2)

    const cp1X = x + Math.cos(cp1Angle) * cp1Distance
    const cp1Y = y + Math.sin(cp1Angle) * cp1Distance
    const cp2X = x + Math.cos(cp2Angle) * cp2Distance
    const cp2Y = y + Math.sin(cp2Angle) * cp2Distance

    // Draw the bezier curve
    this.ctx.beginPath()
    this.ctx.moveTo(startX, startY)
    this.ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY)
    this.ctx.stroke()

    // Return the endpoint for chaining
    return { x: endX, y: endY }
  }

  repeatAndShift() {
    return this.generator.random() < 0.25
  }
}

// Helper function to generate seed from post name
function generateSeedFromPostName(postName) {
  if (!postName || typeof postName !== 'string') return 0

  let seed = 0
  for (let i = 0; i < postName.length; i++) {
    const charCode = postName.charCodeAt(i)
    seed += charCode * (i + 1)
  }

  return Math.abs(seed) % 10000
}

// Main function to generate cover art for a blog post
async function generateCoverArt(postName, size = 2500) {
  const seed = generateSeedFromPostName(postName)
  const generator = new CoverArtGenerator(seed, size)
  const pngBuffer = generator.generateCoverArt()

  console.log(
    `Generated ${size}x${size} cover art for "${postName}" with seed: ${seed}`
  )
  return pngBuffer
}

module.exports = {
  CoverArtGenerator,
  generateCoverArt,
  generateSeedFromPostName,
}
