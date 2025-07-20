import React from 'react'
import P5Sketch from '../p5-sketch/p5-sketch'

// Converted from standalone p5.js sketch
const GridSketchSketch = (p) => {
  // Global variables converted to local scope
  let particles = []
  let margin = 50
  let spacing = 30
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
        this.x > p.width - 2 * margin ||
        this.y > p.height - margin ||
        this.x < margin ||
        this.y < margin
      ) {
        this.x = this.startX
        this.y = this.startY
      }

      // if (p.dist(this.x, this.y, p.width / 2, p.height / 2) > radius) {
      //   this.x = p.width / 2;
      //   this.y = p.height / 2;
      // }
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
    p.createCanvas(800, 600)
    p.background(0)
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
    for (let i = margin + buff; i < p.width - 2 * margin - buff; i += spacing) {
      for (let j = margin + buff; j < p.height - margin - buff; j += spacing) {
        let particle = new Particle(i, j, 2, 256, i, j)
        particles.push(particle)
      }
    }

    // for (let i = 0; i < num; i++) {
    //   let particle = new Particle(
    //     p.width / 2,
    //     p.height / 2,
    //     1,
    //     256,
    //     p.width / 2,
    //     p.height / 2
    //   );
    //   particles.push(particle);
    // }
  }
}

const GridSketch = ({ className = '', style = {} }) => {
  return (
    <P5Sketch sketch={GridSketchSketch} className={className} style={style} />
  )
}

export default GridSketch
