# P5Sketch Component

A React wrapper component for p5.js sketches that can be easily integrated into Gatsby pages and blog posts.

## Features

- Clean React integration with p5.js
- Automatic cleanup when component unmounts
- Support for custom styling and CSS classes
- Proper lifecycle management

## Installation

The component uses p5.js which is already installed in this project (`p5: ^2.0.3`).

## Usage

### Basic Usage

```jsx
import P5Sketch from '../components/p5-sketch/p5-sketch'

const mySketch = (p) => {
  p.setup = () => {
    p.createCanvas(400, 300)
  }
  
  p.draw = () => {
    p.background(220)
    p.fill(255, 0, 0)
    p.ellipse(p.mouseX, p.mouseY, 50, 50)
  }
}

// In your component:
<P5Sketch sketch={mySketch} />
```

### With Custom Styling

```jsx
<P5Sketch 
  sketch={mySketch}
  className="my-sketch"
  style={{ 
    border: '2px solid #ddd',
    borderRadius: '8px',
    margin: '20px 0'
  }}
/>
```

### In Blog Posts

You can use the P5Sketch component in your blog post templates or markdown content by importing it into your blog post template.

## Props

- `sketch` (function): The p5.js sketch function that takes a p5 instance as parameter
- `className` (string, optional): CSS class name to apply to the container
- `style` (object, optional): Inline styles to apply to the container

## Sketch Function Structure

Your sketch function should follow the standard p5.js pattern:

```jsx
const mySketch = (p) => {
  // Variables
  let x = 0
  let y = 0
  
  p.setup = () => {
    p.createCanvas(400, 300)
    // Initialization code
  }
  
  p.draw = () => {
    // Animation/drawing code that runs every frame
  }
  
  // Optional: other p5.js functions like mousePressed, keyPressed, etc.
  p.mousePressed = () => {
    // Handle mouse press
  }
}
```

## Examples

See `src/pages/p5-demo.js` for working examples including:
- Interactive circle following mouse
- Particle system
- Animated wave

## Testing

The component includes comprehensive tests. Run them with:

```bash
yarn test src/components/p5-sketch/p5-sketch.test.js
```

## Notes

- The component automatically handles cleanup when unmounting
- Each sketch runs in its own p5 instance
- The canvas is created inside a div container that you can style
- Make sure your sketch function is defined outside your React component to avoid recreation on every render 