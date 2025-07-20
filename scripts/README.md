# P5.js Sketch Conversion Script

This script converts standalone p5.js sketches to work with the P5Sketch React component wrapper.

## Usage

```bash
node scripts/convert-sketch.js <input-sketch-path> <output-component-path> [component-name]
```

### Examples

```bash
# Convert a sketch from your p5-sketchbook
node scripts/convert-sketch.js /Users/dylanstratton/Code/p5-sketchbook/Grid/sketch.js src/components/grid-sketch/grid-sketch.js GridSketch

# Convert another sketch
node scripts/convert-sketch.js ../p5-sketchbook/AnotherSketch/sketch.js src/components/another-sketch/another-sketch.js AnotherSketch
```

## What the script does

1. **Reads the original sketch file** - Parses the standalone p5.js code
2. **Extracts global variables** - Converts them to local scope within the sketch function
3. **Converts global functions** - Transforms `setup()`, `draw()`, and other functions to p5 instance methods
4. **Handles class definitions** - Preserves and converts class structures
5. **Converts p5.js functions** - Adds `p.` prefix to all p5.js function calls
6. **Creates React component** - Wraps the sketch in a React component using P5Sketch

## Output

The script creates a React component that:
- Imports the P5Sketch wrapper
- Defines the sketch function with proper p5 instance usage
- Exports a React component that can be used in your Gatsby site

## Manual adjustments

After conversion, you may need to make some manual adjustments:

1. **Canvas size** - Change `p.createCanvas(p.windowWidth, p.windowHeight)` to fixed dimensions like `p.createCanvas(800, 600)`
2. **Function calls** - Ensure all p5.js functions are properly prefixed with `p.`
3. **Variable scope** - Check that variables are properly scoped within the sketch function

## Example output

```jsx
import React from 'react'
import P5Sketch from '../p5-sketch/p5-sketch'

const MySketchSketch = (p) => {
  // Global variables converted to local scope
  let particles = [];
  let margin = 50;

  p.setup = () => {
    p.createCanvas(800, 600);
    p.background(0);
  }

  p.draw = () => {
    // Your drawing code here
  }
}

const MySketch = ({ className = '', style = {} }) => {
  return (
    <P5Sketch 
      sketch={MySketchSketch}
      className={className}
      style={style}
    />
  )
}

export default MySketch
```

## Testing

After conversion, you can test your sketch by:
1. Creating a test page that imports the component
2. Running the development server with `yarn start`
3. Visiting the test page to see the sketch in action

## Limitations

- The script may not handle all edge cases perfectly
- Complex sketches with unusual structures may need manual adjustments
- Some p5.js functions might need manual conversion
- The script focuses on common p5.js patterns and may miss specialized usage 