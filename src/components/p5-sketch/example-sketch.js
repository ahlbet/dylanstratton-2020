import React from 'react'
import P5Sketch from './p5-sketch'

// Example p5.js sketch
const bouncingBallSketch = (p) => {
  let x = 0
  let y = 0
  let xSpeed = 2
  let ySpeed = 2
  let ballSize = 20

  p.setup = () => {
    p.createCanvas(400, 300)
    p.background(220)
  }

  p.draw = () => {
    p.background(220)

    // Update ball position
    x += xSpeed
    y += ySpeed

    // Bounce off edges
    if (x > p.width - ballSize / 2 || x < ballSize / 2) {
      xSpeed *= -1
    }
    if (y > p.height - ballSize / 2 || y < ballSize / 2) {
      ySpeed *= -1
    }

    // Draw ball
    p.fill(255, 0, 0)
    p.noStroke()
    p.ellipse(x, y, ballSize)
  }
}

const ExampleSketch = () => {
  return (
    <div>
      <h3>Bouncing Ball Example</h3>
      <P5Sketch
        sketch={bouncingBallSketch}
        className="example-sketch"
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          margin: '20px 0',
        }}
      />
    </div>
  )
}

export default ExampleSketch
