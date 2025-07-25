import React from 'react'
import P5Sketch from '../p5-sketch/p5-sketch'

// Converted from standalone p5.js sketch
const GridSketchSketch = (p) => {
  // Global variables converted to local scope
  let particles = []
  let margin = 50
  let spacing = 100
  let buff = 5
  let radius = 300
  let num = 2000

  class Particle {
    constructor(x, y, r, op, startX, startY) {
      this.x = x
      this.y = y
      this.r = r
      this.op = op
      this.startX = startX
      this.startY = startY
      this.mov = 3
      this.slow = 50
      this.fadeRate = 0.5
      this.isFading = true
    }

    show() {
      p.noStroke()
      p.fill(this.op, 25)
      p.ellipse(this.x, this.y, this.r)
    }

    move(i) {
      let t = p.frameCount / 100.0
      let wonkV = 10000

      // let d = p.floor(p.dist(this.startX, this.startY, p.width / 2, p.height / 2));

      let wonkX = p.map(p.sin(this.startX * i), -1, 1, -wonkV, wonkV)
      let wonkY = p.map(p.cos(this.startY * i), -1, 1, -wonkV, wonkV)

      this.x += p.map(
        p.noise(wonkX / this.slow, t, i),
        0,
        1,
        -this.mov,
        this.mov * 1.1
      )
      this.y += p.map(
        p.noise(t, i, wonkY / this.slow),
        0,
        1,
        -this.mov,
        this.mov * 1.1
      )
    }

    update() {
      if (
        this.x > p.width - margin ||
        this.y > p.height - margin ||
        this.x < margin ||
        this.y < margin
      ) {
        this.x = this.startX
        this.y = this.startY
      }
    }

    fade() {
      if (this.isFading) {
        this.op -= this.fadeRate
      } else {
        this.op += this.fadeRate
      }

      if (this.op > 255) {
        this.isFading = true
      }

      if (this.op < 0) {
        this.isFading = false
      }
    }
  }

  p.setup = () => {
    // Get the container width and use fixed height
    // const containerWidth = p.canvas ? p.canvas.parentElement.offsetWidth : 800
    // const canvasHeight = 400

    p.createCanvas(p.windowWidth, p.windowHeight)
    p.background(0)

    // Update global variables to use full canvas dimensions
    margin = 5 // Minimal margin
    // spacing = Math.max(10, p.windowWidth * 0.015) // Responsive spacing
    radius = Math.min(p.windowWidth, p.windowHeight) * 0.4 // Responsive radius

    p.seed()
  }

  p.windowResized = () => {
    // Resize canvas when window is resized
    // const containerWidth = p.canvas.parentElement.offsetWidth
    // const canvasHeight = 400

    p.resizeCanvas(p.windowWidth, p.windowHeight)
    p.background(0)

    // Update global variables for new canvas dimensions
    margin = 5 // Minimal margin
    // spacing = Math.max(10, p.windowWidth * 0.015) // Responsive spacing
    radius = Math.min(p.windowWidth, p.windowHeight) * 0.4 // Responsive radius

    // Re-seed particles for new canvas size
    particles = []
    p.seed()
  }

  p.draw = () => {
    if (p.frameCount > 500) {
      // p.noLoop();
    }

    for (let i = 0; i < particles.length; i++) {
      particles[i].move(i)
      particles[i].show()
      particles[i].update()
      particles[i].fade()
    }
  }

  p.seed = () => {
    // Use full canvas dimensions with responsive spacing
    for (let i = margin; i < p.width - margin; i += spacing) {
      for (let j = margin; j < p.height - margin; j += spacing) {
        let particle = new Particle(i, j, 2, 256, i, j)
        particles.push(particle)
      }
    }
  }
}

const GridSketch = ({ className = '', style = {} }) => {
  return (
    <P5Sketch sketch={GridSketchSketch} className={className} style={style} />
  )
}

export default GridSketch
