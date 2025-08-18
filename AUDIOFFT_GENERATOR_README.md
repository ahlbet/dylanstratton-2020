# AudioFFT Generator for Blog Posts

This feature creates visually unique AudioFFT visualizations for each blog post based on the post's metadata, ensuring that every blog post has a distinct visual identity while maintaining consistency in the overall aesthetic.

## Features

### 🎨 **Unique Visual Identity**
- Each blog post generates a completely different visual appearance
- Deterministic generation ensures the same post always looks the same
- Visual variations based on multiple blog post properties

### 🔧 **Configurable Parameters**
- **Color Palette**: Primary, secondary, and accent hues
- **Shape Patterns**: Random, grid, spiral, and wave distributions
- **Particle Behavior**: Count, size, movement speed, and oscillation
- **Layout Options**: Symmetry levels and spawn patterns
- **Special Effects**: Trails, pulse, and ripple effects

### 📊 **Blog Post Metadata Integration**
- **Title**: Primary influence on visual identity
- **Date**: Temporal variations in appearance
- **Daily ID**: Numeric influence on patterns
- **Markov Text**: Content-based variations
- **Cover Art**: URL-based subtle variations

## Usage

### Basic Usage

```tsx
import EnhancedAudioFFT from './components/audio-fft/EnhancedAudioFFT'

function BlogPost() {
  return (
    <div>
      <h1>My Blog Post</h1>
      <EnhancedAudioFFT />
    </div>
  )
}
```

### Advanced Usage with Custom Metadata

```tsx
import AudioFFT from './components/audio-fft/AudioFFT'

function CustomBlogPost() {
  const customMetadata = {
    title: 'Custom Post',
    date: '2025-01-27T10:30:00.000Z',
    daily_id: '42',
    markovText: 'Custom markov content',
    cover_art: 'https://example.com/cover.png'
  }

  return (
    <div>
      <h1>Custom Blog Post</h1>
      <AudioFFT 
        markovText="Custom markov text"
        blogPostMetadata={customMetadata}
      />
    </div>
  )
}
```

### Using the Hook Directly

```tsx
import { useBlogPostMetadata } from './hooks/use-blog-post-metadata'
import AudioFFT from './components/audio-fft/AudioFFT'

function BlogPostWithHook() {
  const blogPostMetadata = useBlogPostMetadata()
  
  return (
    <div>
      <h1>Blog Post with Hook</h1>
      <AudioFFT 
        blogPostMetadata={blogPostMetadata}
      />
    </div>
  )
}
```

## How It Works

### 1. **Seed Generation**
The system combines multiple blog post properties to create a unique seed:

```typescript
const generateBlogPostSeed = (metadata: BlogPostMetadata): number => {
  let seed = 0
  
  // Title (most important for visual identity)
  if (metadata.title) {
    for (let i = 0; i < metadata.title.length; i++) {
      seed += metadata.title.charCodeAt(i) * (i + 1) * 3
    }
  }
  
  // Daily ID
  if (metadata.daily_id) {
    seed += Number(metadata.daily_id) * 1000
  }
  
  // Date components
  if (metadata.date) {
    const date = new Date(metadata.date)
    seed += date.getFullYear() * 10000
    seed += (date.getMonth() + 1) * 100
    seed += date.getDate()
  }
  
  // Additional factors...
  
  return Math.abs(seed) % 1000000
}
```

### 2. **Visual Style Generation**
The seed determines various visual parameters:

```typescript
const generateVisualStyle = (seed: number) => {
  return {
    // Color variations
    primaryHue: seed % 360,
    secondaryHue: (seed * 137) % 360,
    accentHue: (seed * 73) % 360,
    
    // Pattern variations
    spawnPattern: seed % 4, // 0: random, 1: grid, 2: spiral, 3: wave
    symmetryLevel: seed % 3, // 0: none, 1: horizontal, 2: both axes
    
    // Animation variations
    movementSpeed: 0.5 + ((seed % 100) / 100) * 2.0,
    oscillationStrength: 5 + (seed % 20),
    
    // Special effects
    enableTrails: (seed % 3) === 0,
    enablePulse: (seed % 2) === 0,
    enableRipple: (seed % 4) === 0,
  }
}
```

### 3. **Spawn Pattern Variations**

#### Random Distribution (Pattern 0)
- Particles distributed randomly across the canvas
- Density controlled by the seed

#### Grid Pattern (Pattern 1)
- Particles arranged in a grid formation
- 33% chance of particle per grid cell
- Subtle randomization within each cell

#### Spiral Pattern (Pattern 2)
- Particles arranged in expanding spiral
- 8 complete rotations
- Radius variation based on seed

#### Wave Pattern (Pattern 3)
- Particles follow sine wave pattern
- Horizontal distribution with vertical wave motion
- Frequency and amplitude variations

### 4. **Shape Variations**
Enhanced shape types include:
- `horizontalLine` - Horizontal line with vertical variation
- `verticalLine` - Vertical line with horizontal variation
- `circle` - Circular pattern with radius variation
- `triangle` - Triangular pattern with edge distribution
- `square` - Square pattern with corner and edge particles
- `cross` - Cross pattern with horizontal and vertical lines
- `diamond` - Diamond pattern with rotated coordinate system

## Customization

### Adding New Spawn Patterns

```typescript
// In shape-generator.js
export const generateSpawnPositions = (seed, canvasWidth, canvasHeight, pattern = 0, density = 1.0, margin = 5) => {
  const positions = []
  
  switch (pattern) {
    // ... existing patterns ...
    
    case 4: // New custom pattern
      // Your custom pattern logic here
      break
  }
  
  return positions
}
```

### Adding New Shape Types

```typescript
// In shape-generator.js
export const generateShapePositions = (centerX, centerY, shapeType, canvasDimensions, shapeSeed, margin = 5) => {
  const positions = []
  
  switch (shapeType) {
    // ... existing shapes ...
    
    case 'customShape':
      // Your custom shape logic here
      break
  }
  
  return positions
}
```

### Modifying Visual Style Parameters

```typescript
// In AudioFFT.tsx
const generateVisualStyle = (seed: number) => {
  return {
    // ... existing parameters ...
    
    // Add your custom parameters
    customParameter: seed % 100,
    customRange: 0.1 + ((seed % 90) / 100) * 0.9,
  }
}
```

## Examples

### Blog Post "25jul01"
- **Title**: "25jul01" → Influences primary color palette
- **Daily ID**: "23" → Affects spawn pattern density
- **Date**: "2025-07-01" → Influences temporal variations
- **Result**: Unique spiral pattern with blue-red color scheme

### Blog Post "24jul01"
- **Title**: "24jul01" → Different color palette
- **Daily ID**: "2" → Different density and pattern
- **Date**: "2024-07-01" → Different temporal characteristics
- **Result**: Grid pattern with green-purple color scheme

## Testing

Run the test suite to ensure everything works correctly:

```bash
yarn test src/components/audio-fft/
yarn test src/hooks/use-blog-post-metadata
```

## Performance Considerations

- **Deterministic Generation**: Seeds are calculated once per component mount
- **Efficient Rendering**: Visual style parameters are computed once and reused
- **Memory Management**: Proper cleanup of p5 instances and event listeners
- **Responsive Design**: Canvas resizing handled efficiently with debouncing

## Browser Compatibility

- **Modern Browsers**: Full support for all features
- **Audio Context**: Requires user interaction for audio playback
- **Canvas API**: Standard HTML5 Canvas support required
- **ES6+ Features**: Requires modern JavaScript support

## Troubleshooting

### Common Issues

1. **No Visual Output**
   - Check browser console for errors
   - Ensure p5.js is loaded
   - Verify audio context is available

2. **Performance Issues**
   - Reduce particle count in visual style
   - Check for memory leaks in p5 cleanup
   - Monitor canvas resize frequency

3. **Inconsistent Appearance**
   - Verify blog post metadata is being passed correctly
   - Check seed generation logic
   - Ensure deterministic behavior

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG_AUDIOFFT=true yarn start
```

This will log seed values, visual style parameters, and generation steps to the console.

## Future Enhancements

- **3D Visualizations**: Add depth and perspective
- **More Patterns**: Additional spawn and shape patterns
- **Animation Presets**: Predefined animation styles
- **User Preferences**: Allow users to customize their experience
- **Export Options**: Save visualizations as images or videos
