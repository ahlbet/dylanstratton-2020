import React from 'react'
import P5Sketch from '../p5-sketch/p5-sketch'

// Converted from standalone p5.js sketch
const WallPrintSketchSketch = (p) => {
  // Global variables converted to local scope
  let cubes, canvasColor, border, spacing

  class Cube {
    constructor(x, y, sz, i) {
      this.x = x
      this.y = y
      this.sz = sz
      this.i = i
      this.r = 0
      this.g = 0
      this.b = 0
      this.time = 0
      this.timeMag = p.random(0.1, 0.9)
      this.slow = p.floor(p.random(20, 30))
      this.direction = p.floor(p.random(1, 3))
      this.sWeight = 3
    }

    birth() {
      if (this.direction === this.direction) {
        for (let cy = this.y; cy <= this.y + this.sz; cy += this.sWeight) {
          this.r = p.map(
            p.noise(
              p.sin(this.time / this.slow),
              cy / this.slow,
              this.i / this.slow
            ),
            0,
            1,
            100,
            255
          )
          this.g = p.map(
            p.noise(p.sin(cy / this.slow), this.i, this.time / this.slow),
            0,
            1,
            60,
            255
          )
          this.b = p.map(
            p.noise(
              this.i / this.slow,
              p.cos(p.sin(this.time / this.slow)),
              cy / this.slow
            ),
            0,
            1,
            0,
            200
          )

          p.noFill()
          p.stroke(this.r, this.g, this.b)
          p.strokeWeight(this.sWeight)
          p.line(this.x, cy, this.x + this.sz, cy)

          this.time += this.timeMag
        }
      } else {
        for (let cx = this.x; cx <= this.x + this.sz; cx += this.sWeight) {
          this.r = p.map(
            p.noise(
              p.sin(this.time / this.slow),
              cx / this.slow,
              this.i / this.slow
            ),
            0,
            1,
            30,
            220
          )
          this.g = p.map(
            p.noise(
              p.sin(cx / this.slow),
              this.i / this.slow,
              this.time / this.slow
            ),
            0,
            1,
            80,
            255
          )
          this.b = p.map(
            p.noise(
              this.i,
              p.cos(p.sin(this.time / this.slow)),
              cx / this.slow
            ),
            0,
            1,
            70,
            235
          )

          p.noFill()
          p.stroke(this.r, this.g, this.b)
          p.strokeWeight(this.sWeight)
          p.line(cx, this.y, cx, this.y + this.sz)

          this.time += this.timeMag
        }
      }
    }
  }

  const seedCubes = () => {
    let i = 1
    for (let y = border; y <= p.height - border - spacing; y += spacing) {
      for (let x = border; x <= p.width - border - spacing; x += spacing) {
        let cube = new Cube(x, y, spacing, i)
        cubes.push(cube)
        i++
      }
    }
  }

  const seedGlobals = () => {
    cubes = []
    canvasColor = 240
    border = 150
    spacing = 75
  }

  p.setup = () => {
    p.createCanvas(1000, 1000)
    seedGlobals()
    p.background(canvasColor)
    seedCubes()
    for (let cube of cubes) {
      cube.birth()
    }
  }

  p.draw = () => {
    // No draw function found - this is a static sketch
  }
}

const WallPrintSketch = ({ className = '', style = {} }) => {
  return (
    <P5Sketch
      sketch={WallPrintSketchSketch}
      className={className}
      style={style}
    />
  )
}

export default WallPrintSketch
