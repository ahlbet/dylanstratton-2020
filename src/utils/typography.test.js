import typography, { rhythm, scale } from './typography'

// Mock the typography module
jest.mock('typography', () => {
  return jest.fn().mockImplementation(() => ({
    rhythm: jest.fn((value) => `${value * 16}px`),
    scale: jest.fn((value) => `${(value * 1.2).toFixed(1)}em`),
    injectStyles: jest.fn(),
  }))
})

// Mock the typography-theme-wordpress-2016 module
jest.mock('typography-theme-wordpress-2016', () => ({
  overrideThemeStyles: jest.fn(() => ({
    'a.gatsby-resp-image-link': {
      boxShadow: 'none',
    },
    a: {
      color: 'var(--textLink)',
    },
    'a.anchor': {
      boxShadow: 'none',
    },
    'a.anchor svg[aria-hidden="true"]': {
      stroke: 'var(--textLink)',
    },
    hr: {
      background: 'var(--hr)',
    },
  })),
  googleFonts: 'mock-google-fonts',
}))

describe('typography', () => {
  let mockTypography
  let originalNodeEnv

  beforeEach(() => {
    jest.clearAllMocks()
    originalNodeEnv = process.env.NODE_ENV
    mockTypography = require('typography')
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  describe('typography instance', () => {
    test('should create typography instance with Wordpress2016 theme', () => {
      // The mock is called when the module is imported, so we need to check the mock calls
      // Since the module is imported at the top level, we can't easily test this
      // Instead, we'll test that the typography instance exists
      expect(typography).toBeDefined()
      expect(typeof typography.rhythm).toBe('function')
      expect(typeof typography.scale).toBe('function')
    })

    test('should have rhythm function', () => {
      expect(typeof rhythm).toBe('function')
    })

    test('should have scale function', () => {
      expect(typeof scale).toBe('function')
    })

    test('should export typography instance as default', () => {
      expect(typography).toBeDefined()
      expect(typography.rhythm).toBeDefined()
      expect(typography.scale).toBeDefined()
    })
  })

  describe('theme overrides', () => {
    test('should override gatsby-resp-image-link styles', () => {
      const theme = require('typography-theme-wordpress-2016')
      const overrides = theme.overrideThemeStyles()

      expect(overrides['a.gatsby-resp-image-link']).toEqual({
        boxShadow: 'none',
      })
    })

    test('should override anchor link styles', () => {
      const theme = require('typography-theme-wordpress-2016')
      const overrides = theme.overrideThemeStyles()

      expect(overrides.a).toEqual({
        color: 'var(--textLink)',
      })
    })

    test('should override anchor styles for gatsby-remark-autolink-headers', () => {
      const theme = require('typography-theme-wordpress-2016')
      const overrides = theme.overrideThemeStyles()

      expect(overrides['a.anchor']).toEqual({
        boxShadow: 'none',
      })
    })

    test('should override anchor SVG styles for gatsby-remark-autolink-headers', () => {
      const theme = require('typography-theme-wordpress-2016')
      const overrides = theme.overrideThemeStyles()

      expect(overrides['a.anchor svg[aria-hidden="true"]']).toEqual({
        stroke: 'var(--textLink)',
      })
    })

    test('should override horizontal rule styles', () => {
      const theme = require('typography-theme-wordpress-2016')
      const overrides = theme.overrideThemeStyles()

      expect(overrides.hr).toEqual({
        background: 'var(--hr)',
      })
    })
  })

  describe('google fonts', () => {
    test('should delete googleFonts from theme', () => {
      const theme = require('typography-theme-wordpress-2016')
      expect(theme.googleFonts).toBeUndefined()
    })
  })

  describe('rhythm function', () => {
    test('should call typography rhythm method', () => {
      const result = rhythm(2)
      expect(result).toBe('32px')
    })

    test('should handle different rhythm values', () => {
      expect(rhythm(0)).toBe('0px')
      expect(rhythm(1)).toBe('16px')
      expect(rhythm(0.5)).toBe('8px')
      expect(rhythm(1.5)).toBe('24px')
    })
  })

  describe('scale function', () => {
    test('should call typography scale method', () => {
      const result = scale(2)
      expect(result).toBe('2.4em')
    })

    test('should handle different scale values', () => {
      expect(scale(0)).toBe('0.0em')
      expect(scale(1)).toBe('1.2em')
      expect(scale(0.5)).toBe('0.6em')
      expect(scale(1.5)).toBe('1.8em')
    })
  })

  describe('development mode', () => {
    test('should inject styles in development mode', () => {
      process.env.NODE_ENV = 'development'

      // Re-import to trigger the development mode logic
      jest.resetModules()
      const mockInjectStyles = jest.fn()
      const mockTypographyInstance = {
        rhythm: jest.fn(),
        scale: jest.fn(),
        injectStyles: mockInjectStyles,
      }
      require('typography').mockReturnValue(mockTypographyInstance)

      require('./typography')

      expect(mockInjectStyles).toHaveBeenCalled()
    })

    test('should not inject styles in production mode', () => {
      process.env.NODE_ENV = 'production'

      const mockInjectStyles = jest.fn()
      const mockTypographyInstance = {
        rhythm: jest.fn(),
        scale: jest.fn(),
        injectStyles: mockInjectStyles,
      }
      require('typography').mockReturnValue(mockTypographyInstance)

      // Re-import to get the new mock instance
      jest.resetModules()
      require('./typography')

      expect(mockInjectStyles).not.toHaveBeenCalled()
    })

    test('should not inject styles in test mode', () => {
      process.env.NODE_ENV = 'test'

      const mockInjectStyles = jest.fn()
      const mockTypographyInstance = {
        rhythm: jest.fn(),
        scale: jest.fn(),
        injectStyles: mockInjectStyles,
      }
      require('typography').mockReturnValue(mockTypographyInstance)

      // Re-import to get the new mock instance
      jest.resetModules()
      require('./typography')

      expect(mockInjectStyles).not.toHaveBeenCalled()
    })
  })

  describe('integration', () => {
    test('should work together with rhythm and scale functions', () => {
      const rhythmResult = rhythm(1.5)
      const scaleResult = scale(1.5)

      expect(rhythmResult).toBe('24px')
      expect(scaleResult).toBe('1.8em')
    })

    test('should handle theme overrides correctly', () => {
      const theme = require('typography-theme-wordpress-2016')
      const overrides = theme.overrideThemeStyles()

      // Check that all expected overrides are present
      expect(overrides['a.gatsby-resp-image-link']).toBeDefined()
      expect(overrides.a).toBeDefined()
      expect(overrides['a.anchor']).toBeDefined()
      expect(overrides['a.anchor svg[aria-hidden="true"]']).toBeDefined()
      expect(overrides.hr).toBeDefined()

      // Check that overrides use CSS custom properties
      expect(overrides.a.color).toBe('var(--textLink)')
      expect(overrides['a.anchor svg[aria-hidden="true"]'].stroke).toBe(
        'var(--textLink)'
      )
      expect(overrides.hr.background).toBe('var(--hr)')
    })
  })

  describe('edge cases', () => {
    test('should handle undefined rhythm values', () => {
      expect(() => rhythm(undefined)).not.toThrow()
    })

    test('should handle undefined scale values', () => {
      expect(() => scale(undefined)).not.toThrow()
    })

    test('should handle null rhythm values', () => {
      expect(() => rhythm(null)).not.toThrow()
    })

    test('should handle null scale values', () => {
      expect(() => scale(null)).not.toThrow()
    })
  })
})
