import '@testing-library/jest-dom'
import React from 'react'

// Make React available globally for tests
global.React = React

// Mock HTMLMediaElement methods that are not implemented in JSDOM
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: jest.fn(),
})

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockResolvedValue(undefined),
})

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: jest.fn(),
})

Object.defineProperty(HTMLMediaElement.prototype, 'addEventListener', {
  writable: true,
  value: jest.fn(),
})

Object.defineProperty(HTMLMediaElement.prototype, 'removeEventListener', {
  writable: true,
  value: jest.fn(),
})
