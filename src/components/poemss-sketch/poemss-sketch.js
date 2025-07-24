import React from 'react'
import P5Sketch from '../p5-sketch/p5-sketch'

// Converted from standalone p5.js sketch
const PoemssSketchSketch = (p) => {
  // Global variables converted to local scope
  let order = 5
  let ngrams = {}
  const beginnings = []
  let button
  let lines
  let createdLines

  p.setup = async () => {
    p.createCanvas(600, 400)
    p.background(240)

    // Load text from multiple sources (Supabase or fallback)
    try {
      // First try to load from 448.txt (for client-side p5 sketches)
      const response = await fetch('/448.txt')
      const text = await response.text()
      lines = text.split('\n').filter((line) => line.trim().length > 0)
    } catch (error) {
      console.error('Error loading 448.txt for p5 sketch:', error)
      // Fallback to sample text if file loading fails
      lines = [
        'The quick brown fox jumps over the lazy dog.',
        'A journey of a thousand miles begins with a single step.',
        'All that glitters is not gold.',
        'Actions speak louder than words.',
        'Beauty is in the eye of the beholder.',
        'Every cloud has a silver lining.',
        'Time heals all wounds.',
        'Actions speak louder than words.',
        'The early bird catches the worm.',
        "Don't judge a book by its cover.",
      ]
    }

    createdLines = lines

    for (let j = 0; j < createdLines.length; j++) {
      let txt = createdLines[j]
      for (let i = 0; i <= txt.length - order; i++) {
        let gram = txt.substring(i, i + order)
        if (i == 0) {
          beginnings.push(gram)
        }

        if (!ngrams[gram]) {
          ngrams[gram] = []
        }
        ngrams[gram].push(txt.charAt(i + order))
      }
    }

    // Create a button-like interaction with mouse clicks
    p.textAlign(p.CENTER)
    p.textSize(16)
    p.fill(0)
    p.text('Click to generate new text', p.width / 2, p.height - 30)
  }

  p.draw = () => {
    // Display current generated text
    p.background(240)
    p.textAlign(p.LEFT)
    p.textSize(14)
    p.fill(100, 0, 200) // Purple color for generated text

    let y = 30

    // Show only generated lines
    for (let i = lines.length; i < createdLines.length; i++) {
      if (y < p.height - 50) {
        p.text(createdLines[i], 20, y)
        y += 20
      }
    }

    // Button area
    p.textAlign(p.CENTER)
    p.textSize(16)
    p.fill(0)
    p.text('Click to generate new text', p.width / 2, p.height - 30)
  }

  p.mousePressed = () => {
    if (p.mouseY > p.height - 50) {
      p.markovIt()
    }
  }

  p.iterateMarkov = () => {
    for (let i = 0; i < 10; i++) {
      p.markovIt()
    }
  }

  p.markovIt = () => {
    if (beginnings.length === 0) {
      return
    }

    let currentGram = p.random(beginnings)
    let result = currentGram

    for (let i = 0; i < 1000; i++) {
      let possibilities = ngrams[currentGram]
      if (!possibilities) {
        break
      }
      let next = p.random(possibilities)
      result += next
      let len = result.length
      currentGram = result.substring(len - order, len)
    }

    createdLines.push(result)
  }
}

const PoemssSketch = ({ className = '', style = {} }) => {
  return (
    <P5Sketch sketch={PoemssSketchSketch} className={className} style={style} />
  )
}

export default PoemssSketch
