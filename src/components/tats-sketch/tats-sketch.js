import React from 'react'
import P5Sketch from '../p5-sketch/p5-sketch'

// Converted from standalone p5.js sketch
const TatsSketchSketch = (p) => {
  // Global variables converted to local scope
  const tats = []
  const border = 50
  const spacing = 100
  const shapes = [
    'horizontalLine',
    'verticalLine',
    'circle',
    'triangle',
    'square',
  ]

  class Tat {
    constructor(x, y) {
      this.x = x
      this.y = y
      this.typesCount = p.floor(p.random(1, 6))
      this.shapes = []
      this.n = 2
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
              p.random(spacing / 4, spacing / 2),
              p.floor(p.random(this.n))
            )
            break
          case 'verticalLine':
            this.drawVerticalLine(
              this.x,
              this.y,
              p.random(spacing / 4, spacing / 2),
              p.floor(p.random(this.n))
            )
            break
          case 'circle':
            this.drawCircle(
              this.x,
              this.y,
              p.random(spacing / 4, spacing / 2),
              p.floor(p.random(this.n))
            )
            break
          case 'triangle':
            this.drawTriangle(
              this.x,
              this.y,
              p.random(spacing / 4, spacing / 2),
              p.floor(p.random(this.n))
            )
            break
          case 'square':
            this.drawSquare(
              this.x,
              this.y,
              p.random(spacing / 4, spacing / 2),
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

    repeatAndShift() {
      return p.random() < 0.25 ? true : false
    }
  }

  p.setup = () => {
    p.createCanvas(600, 600)
    p.background(230)
    p.noFill()
    p.strokeWeight(2.5)
    p.rectMode(p.CENTER)
    p.seedGrid()
    p.drawTats()

    // p.ellipse(p.width / 2, p.height / 2, spacing, spacing)
    // p.rect(p.width / 2, p.height / 2, spacing, spacing)
  }

  p.draw = () => {
    // No draw function found
  }

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
