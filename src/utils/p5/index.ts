// Import all modules for namespaced exports
import * as shapeGenerator from './shape-generator'
import * as audioAnalysis from './audio-analysis'
import * as particleSystem from './particle-system'
import * as spawnPositions from './spawn-positions'
import * as canvasSetup from './canvas-setup'
import * as sketchAnimationLoop from './sketch-animation-loop'

// Re-export all individual methods from each utility module
export {
  generateSeedFromText,
  generateTatShapePositions,
  generateSpawnPositions,
  generateEnhancedSpawnPositions,
} from './shape-generator'

export {
  FREQUENCY_RANGES,
  getFrequencyEnergy,
  smoothFrequencyData,
  analyzeFrequencyBands,
  getFrequencyBands,
} from './audio-analysis'

export {
  Particle,
  calculateParticleCount,
  calculateMaxParticles,
  calculateCanvasScale,
  calculateStaggeredSpawn,
} from './particle-system'

export {
  updateTatShapePositions,
  addDynamicMovementToPositions,
  calculateTatSpawnPosition,
  calculateFallbackSpawnPosition,
  calculateSpawnPosition,
} from './spawn-positions'

export {
  getContainerDimensions,
  setupCanvas,
  setupAudioContext,
  setupFFT,
  handleWindowResize,
  setupAudioReactiveCanvas,
  initializeFrequencyData,
} from './canvas-setup'

export {
  createAudioReactiveAnimationLoop,
  createSimpleParticleLoop,
  createParticleSpawningLoop,
} from './sketch-animation-loop'

// Export namespaced objects for backward compatibility
export {
  shapeGenerator,
  audioAnalysis,
  particleSystem,
  spawnPositions,
  canvasSetup,
  sketchAnimationLoop,
}
