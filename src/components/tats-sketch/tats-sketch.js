import React from 'react'
import P5Sketch from '../p5-sketch/p5-sketch'

// Converted from standalone p5.js sketch
const TatsSketchSketch = (p) => {
  // Global variables converted to local scope
  let tats = []
  const border = 100
  const spacing = 50
  const shapes = [
    'horizontalLine',
    'verticalLine',
    'circle',
    'triangle',
    'square',
    'bezier',
  ]

  const rMin = spacing / 5
  const rMax = spacing / 2

  class Tat {
    constructor(x, y) {
      this.x = x
      this.y = y
      this.typesCount = p.floor(p.random(1, 3))
      this.shapes = []
      this.n = 4
    }

    chooseShapes() {
      for (let i = 0; i < this.typesCount; i++) {
        this.shapes.push(shapes[p.floor(p.random(shapes.length))])
      }
    }

    show() {
      // p.ellipse(this.x, this.y, 3)
      for (let i = 0; i < this.shapes.length; i++) {
        switch (this.shapes[i]) {
          case 'horizontalLine':
            this.drawHorizontalLine(
              this.x,
              this.y,
              p.random(rMin, rMax),
              p.floor(p.random(this.n))
            )
            break
          case 'verticalLine':
            this.drawVerticalLine(
              this.x,
              this.y,
              p.random(rMin, rMax),
              p.floor(p.random(this.n))
            )
            break
          case 'circle':
            this.drawCircle(
              this.x,
              this.y,
              p.random(rMin, rMax),
              p.floor(p.random(this.n))
            )
            break
          case 'triangle':
            this.drawTriangle(
              this.x,
              this.y,
              p.random(rMin, rMax),
              p.floor(p.random(this.n))
            )
            break
          case 'square':
            this.drawSquare(
              this.x,
              this.y,
              p.random(rMin, rMax),
              p.floor(p.random(this.n))
            )
            break
          case 'bezier':
            this.drawConnectedBezier(
              this.x,
              this.y,
              p.random(rMin, rMax),
              p.floor(p.random(this.n))
            )
            break
        }
      }
    }

    drawHorizontalLine(x, y, r, n) {
      for (let i = 0; i < n; i++) {
        if (this.repeatAndShift()) {
          let shift = p.random(r / 4)
          if (p.random() < 0.5) shift = shift * -1
          p.line(x - r / 2, y + shift, x + r / 2, y + shift)
        }
      }
      p.line(x - r / 2, y, x + r / 2, y)
    }

    drawVerticalLine(x, y, r, n) {
      for (let i = 0; i < n; i++) {
        if (this.repeatAndShift()) {
          let shift = p.random(r / 4)
          if (p.random() < 0.5) shift = shift * -1
          p.line(x + shift, y - r / 2, x + shift, y + r / 2)
        }
      }
      p.line(x, y - r / 2, x, y + r / 2)
    }

    drawCircle(x, y, r, n) {
      for (let i = 0; i < n; i++) {
        if (this.repeatAndShift()) {
          let xShift = p.noise(x, y, n) * (r / 2)
          let yShift = p.noise(x, y, n) * (r / 2)
          // let yShift = p.random(r / 4)
          if (p.random() < 0.5) xShift = xShift * -1
          if (p.random() < 0.5) yShift = yShift * -1
          p.ellipse(x + xShift, y + yShift, r, r)
        }
      }
      p.ellipse(x, y, r, r)
    }

    drawTriangle(x, y, r, n) {
      p.triangle(x, y - r / 2, x - r / 2, y + r / 2, x + r / 2, y + r / 2)
    }

    drawSquare(x, y, r, n) {
      for (let i = 0; i < n; i++) {
        if (this.repeatAndShift()) {
          let xShift = p.noise(this.x, this.y, n) * (r / 2)
          let yShift = p.noise(this.x, this.y, n) * (r / 2)
          // let yShift = p.random(r / 4)
          if (p.random() < 0.5) xShift = xShift * -1
          if (p.random() < 0.5) yShift = yShift * -1
          p.rect(x + xShift, y + yShift, r, r)
        }
      }
      p.rect(x, y, r, r)
    }

    drawConnectedBezier(x, y, r, n) {
      // Draw additional bezier curves with shifts
      for (let i = 0; i < n; i++) {
        if (this.repeatAndShift()) {
          let xShift = p.noise(x, y, n) * (r / 3)
          let yShift = p.noise(x, y, n) * (r / 3)
          if (p.random() < 0.5) xShift = -xShift
          if (p.random() < 0.5) yShift = -yShift
          this.drawConnectedBezierShape(x + xShift, y + yShift, r)
        }
      }
      this.drawConnectedBezierShape(x, y, r)
    }

    drawConnectedBezierShape(x, y, r) {
      // Start point is the current position (where previous shape ended)
      const startX = x
      const startY = y

      // Generate end point at distance r from start
      const endAngle = p.random(0, Math.PI * 2)
      const endX = x + Math.cos(endAngle) * r
      const endY = y + Math.sin(endAngle) * r

      // Control points - create interesting curves
      const cp1Distance = p.random(r * 0.3, r * 0.8)
      const cp2Distance = p.random(r * 0.3, r * 0.8)
      const cp1Angle = p.random(0, Math.PI * 2)
      const cp2Angle = p.random(0, Math.PI * 2)

      const cp1X = x + Math.cos(cp1Angle) * cp1Distance
      const cp1Y = y + Math.sin(cp1Angle) * cp1Distance
      const cp2X = x + Math.cos(cp2Angle) * cp2Distance
      const cp2Y = y + Math.sin(cp2Angle) * cp2Distance

      // Draw the bezier curve
      p.bezier(startX, startY, cp1X, cp1Y, cp2X, cp2Y, endX, endY)
    }

    repeatAndShift() {
      return p.random() < 0.25 ? true : false
    }
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight)
    p.background(0)
    p.noFill()
    p.strokeWeight(1.5)
    p.stroke(255)
    p.rectMode(p.CENTER)
    p.seedGrid()
    p.drawTats()
  }

  p.windowResized = () => {
    tats = []
    p.clear()
    p.resizeCanvas(p.windowWidth, p.windowHeight)
    p.background(0)
    p.seedGrid()
    p.drawTats()
  }

  p.draw = () => {}

  p.drawTats = () => {
    for (let i = 0; i < tats.length; i++) {
      tats[i].chooseShapes()
      tats[i].show()
    }
  }

  p.seedGrid = () => {
    for (let y = border; y <= p.height - border; y += spacing) {
      for (let x = border; x <= p.width - border; x += spacing) {
        let tat = new Tat(x, y)
        tats.push(tat)
      }
    }
  }
}

const TatsSketch = ({ className = '', style = {} }) => {
  return (
    <P5Sketch sketch={TatsSketchSketch} className={className} style={style} />
  )
}

export default TatsSketch
