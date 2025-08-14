import * as p5utils from './index'

describe('p5 utils barrel exports', () => {
  test('re-exports named utilities from submodules', () => {
    // shape-generator
    expect(typeof p5utils.generateSeedFromText).toBe('function')
    expect(typeof p5utils.generateTatShapePositions).toBe('function')

    // audio-analysis
    expect(typeof p5utils.FREQUENCY_RANGES).toBe('object')
    expect(typeof p5utils.getFrequencyEnergy).toBe('function')
    expect(typeof p5utils.smoothFrequencyData).toBe('function')
    expect(typeof p5utils.analyzeFrequencyBands).toBe('function')
    expect(typeof p5utils.getFrequencyBands).toBe('function')

    // particle-system
    expect(typeof p5utils.Particle).toBe('function')
    expect(typeof p5utils.calculateParticleCount).toBe('function')
    expect(typeof p5utils.calculateMaxParticles).toBe('function')
    expect(typeof p5utils.calculateCanvasScale).toBe('function')
    expect(typeof p5utils.calculateStaggeredSpawn).toBe('function')

    // spawn-positions
    expect(typeof p5utils.updateTatShapePositions).toBe('function')
    expect(typeof p5utils.addDynamicMovementToPositions).toBe('function')
    expect(typeof p5utils.calculateTatSpawnPosition).toBe('function')
    expect(typeof p5utils.calculateFallbackSpawnPosition).toBe('function')
    expect(typeof p5utils.calculateSpawnPosition).toBe('function')

    // canvas-setup
    expect(typeof p5utils.getContainerDimensions).toBe('function')
    expect(typeof p5utils.setupCanvas).toBe('function')
    expect(typeof p5utils.setupAudioContext).toBe('function')
    expect(typeof p5utils.setupFFT).toBe('function')
    expect(typeof p5utils.handleWindowResize).toBe('function')
    expect(typeof p5utils.setupAudioReactiveCanvas).toBe('function')
    expect(typeof p5utils.initializeFrequencyData).toBe('function')

    // sketch-animation-loop
    expect(typeof p5utils.createAudioReactiveAnimationLoop).toBe('function')
    expect(typeof p5utils.createSimpleParticleLoop).toBe('function')
    expect(typeof p5utils.createParticleSpawningLoop).toBe('function')
  })

  test('exposes namespaced submodules for backward compatibility', () => {
    expect(typeof p5utils.shapeGenerator).toBe('object')
    expect(typeof p5utils.audioAnalysis).toBe('object')
    expect(typeof p5utils.particleSystem).toBe('object')
    expect(typeof p5utils.spawnPositions).toBe('object')
    expect(typeof p5utils.canvasSetup).toBe('object')
    expect(typeof p5utils.sketchAnimationLoop).toBe('object')
  })
})

import {
  // Shape generator exports
  generateSeedFromText,
  generateTatShapePositions,

  // Audio analysis exports
  FREQUENCY_RANGES,
  getFrequencyEnergy,
  smoothFrequencyData,
  analyzeFrequencyBands,
  getFrequencyBands,

  // Particle system exports
  Particle,
  calculateParticleCount,
  calculateMaxParticles,
  calculateCanvasScale,
  calculateStaggeredSpawn,

  // Spawn positions exports
  updateTatShapePositions,
  addDynamicMovementToPositions,
  calculateTatSpawnPosition,
  calculateFallbackSpawnPosition,
  calculateSpawnPosition,

  // Canvas setup exports
  getContainerDimensions,
  setupCanvas,
  setupAudioContext,
  setupFFT,
  handleWindowResize,
  setupAudioReactiveCanvas,
  initializeFrequencyData,

  // Sketch animation loop exports
  createAudioReactiveAnimationLoop,
  createSimpleParticleLoop,
  createParticleSpawningLoop,

  // Namespaced exports
  shapeGenerator,
  audioAnalysis,
  particleSystem,
  spawnPositions,
  canvasSetup,
  sketchAnimationLoop,
} from './index'

// Mock the individual modules
jest.mock('./spawn-positions', () => ({
  updateTatShapePositions: jest.fn(),
  addDynamicMovementToPositions: jest.fn(),
  calculateTatSpawnPosition: jest.fn(),
  calculateFallbackSpawnPosition: jest.fn(),
  calculateSpawnPosition: jest.fn(),
}))

jest.mock('./sketch-animation-loop', () => ({
  createAudioReactiveAnimationLoop: jest.fn(),
  createSimpleParticleLoop: jest.fn(),
  createParticleSpawningLoop: jest.fn(),
}))

describe('p5 index exports', () => {
  test('should export all shape generator functions', () => {
    expect(generateSeedFromText).toBeDefined()
    expect(generateTatShapePositions).toBeDefined()
    expect(typeof generateSeedFromText).toBe('function')
    expect(typeof generateTatShapePositions).toBe('function')
  })

  test('should export all audio analysis functions and constants', () => {
    expect(FREQUENCY_RANGES).toBeDefined()
    expect(getFrequencyEnergy).toBeDefined()
    expect(smoothFrequencyData).toBeDefined()
    expect(analyzeFrequencyBands).toBeDefined()
    expect(getFrequencyBands).toBeDefined()
    expect(typeof getFrequencyEnergy).toBe('function')
    expect(typeof smoothFrequencyData).toBe('function')
    expect(typeof analyzeFrequencyBands).toBe('function')
    expect(typeof getFrequencyBands).toBe('function')
  })

  test('should export all particle system functions and classes', () => {
    expect(Particle).toBeDefined()
    expect(calculateParticleCount).toBeDefined()
    expect(calculateMaxParticles).toBeDefined()
    expect(calculateCanvasScale).toBeDefined()
    expect(calculateStaggeredSpawn).toBeDefined()
    expect(typeof calculateParticleCount).toBe('function')
    expect(typeof calculateMaxParticles).toBe('function')
    expect(typeof calculateCanvasScale).toBe('function')
    expect(typeof calculateStaggeredSpawn).toBe('function')
  })

  test('should export all spawn positions functions', () => {
    expect(updateTatShapePositions).toBeDefined()
    expect(addDynamicMovementToPositions).toBeDefined()
    expect(calculateTatSpawnPosition).toBeDefined()
    expect(calculateFallbackSpawnPosition).toBeDefined()
    expect(calculateSpawnPosition).toBeDefined()
    expect(typeof updateTatShapePositions).toBe('function')
    expect(typeof addDynamicMovementToPositions).toBe('function')
    expect(typeof calculateTatSpawnPosition).toBe('function')
    expect(typeof calculateFallbackSpawnPosition).toBe('function')
    expect(typeof calculateSpawnPosition).toBe('function')
  })

  test('should export all canvas setup functions', () => {
    expect(getContainerDimensions).toBeDefined()
    expect(setupCanvas).toBeDefined()
    expect(setupAudioContext).toBeDefined()
    expect(setupFFT).toBeDefined()
    expect(handleWindowResize).toBeDefined()
    expect(setupAudioReactiveCanvas).toBeDefined()
    expect(initializeFrequencyData).toBeDefined()
    expect(typeof getContainerDimensions).toBe('function')
    expect(typeof setupCanvas).toBe('function')
    expect(typeof setupAudioContext).toBe('function')
    expect(typeof setupFFT).toBe('function')
    expect(typeof handleWindowResize).toBe('function')
    expect(typeof setupAudioReactiveCanvas).toBe('function')
    expect(typeof initializeFrequencyData).toBe('function')
  })

  test('should export all sketch animation loop functions', () => {
    expect(createAudioReactiveAnimationLoop).toBeDefined()
    expect(createSimpleParticleLoop).toBeDefined()
    expect(createParticleSpawningLoop).toBeDefined()
    expect(typeof createAudioReactiveAnimationLoop).toBe('function')
    expect(typeof createSimpleParticleLoop).toBe('function')
    expect(typeof createParticleSpawningLoop).toBe('function')
  })

  test('should export namespaced objects for backward compatibility', () => {
    expect(shapeGenerator).toBeDefined()
    expect(audioAnalysis).toBeDefined()
    expect(particleSystem).toBeDefined()
    expect(spawnPositions).toBeDefined()
    expect(canvasSetup).toBeDefined()
    expect(sketchAnimationLoop).toBeDefined()

    // Check that namespaced objects contain the expected functions
    expect(shapeGenerator.generateSeedFromText).toBeDefined()
    expect(audioAnalysis.FREQUENCY_RANGES).toBeDefined()
    expect(particleSystem.Particle).toBeDefined()
    expect(spawnPositions.calculateSpawnPosition).toBeDefined()
    expect(canvasSetup.setupCanvas).toBeDefined()
    expect(sketchAnimationLoop.createAudioReactiveAnimationLoop).toBeDefined()
  })
})
