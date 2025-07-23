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
    this.shapes = [
      'horizontalLine',
      'verticalLine',
      'circle',
      'triangle',
      'square',
    ]

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
    this.ctx.lineWidth = Math.floor(this.size * 0.001) // ~2.5px for 2500px canvas
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
    const tats = this.generateTats()

    // Draw each Tat
    tats.forEach((tat) => {
      tat.chooseShapes()
      tat.show()
    })
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
    this.typesCount = generator.randomInt(1, 5) // 1-5 shape types
    this.shapes = []
    this.n = 2 // Number of repetitions
  }

  chooseShapes() {
    for (let i = 0; i < this.typesCount; i++) {
      this.shapes.push(this.generator.randomChoice(this.generator.shapes))
    }
  }

  show() {
    // Draw shapes for this Tat
    this.shapes.forEach((shapeType) => {
      const radius = this.generator.random(
        this.generator.spacing / 4,
        this.generator.spacing / 2
      )
      const repetitions = this.generator.randomInt(0, this.n - 1)

      switch (shapeType) {
        case 'horizontalLine':
          this.drawHorizontalLine(this.x, this.y, radius, repetitions)
          break
        case 'verticalLine':
          this.drawVerticalLine(this.x, this.y, radius, repetitions)
          break
        case 'circle':
          this.drawCircle(this.x, this.y, radius, repetitions)
          break
        case 'triangle':
          this.drawTriangle(this.x, this.y, radius, repetitions)
          break
        case 'square':
          this.drawSquare(this.x, this.y, radius, repetitions)
          break
      }
    })
  }

  drawHorizontalLine(x, y, r, n) {
    // Draw additional lines with shifts
    for (let i = 0; i < n; i++) {
      if (this.repeatAndShift()) {
        let shift = this.generator.random(-r / 4, r / 4)
        this.drawLine(x - r / 2, y + shift, x + r / 2, y + shift)
      }
    }
    // Draw main line
    this.drawLine(x - r / 2, y, x + r / 2, y)
  }

  drawVerticalLine(x, y, r, n) {
    // Draw additional lines with shifts
    for (let i = 0; i < n; i++) {
      if (this.repeatAndShift()) {
        let shift = this.generator.random(-r / 4, r / 4)
        this.drawLine(x + shift, y - r / 2, x + shift, y + r / 2)
      }
    }
    // Draw main line
    this.drawLine(x, y - r / 2, x, y + r / 2)
  }

  drawCircle(x, y, r, n) {
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
  }

  drawTriangle(x, y, r, n) {
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
  }

  drawSquare(x, y, r, n) {
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
