import { formatDuration, isLocalDev, extractFilenameFromStoragePath, generateTrackTitle, getNextTrackIndex, getPreviousTrackIndex } from './audio-utils'

describe('audio-utils', () => {
  describe('formatDuration', () => {
    it('formats seconds correctly', () => {
      expect(formatDuration(0)).toBe('0:00')
      expect(formatDuration(30)).toBe('0:30')
      expect(formatDuration(60)).toBe('1:00')
      expect(formatDuration(90)).toBe('1:30')
      expect(formatDuration(125)).toBe('2:05')
      expect(formatDuration(3600)).toBe('60:00')
    })

    it('handles edge cases', () => {
      expect(formatDuration(NaN)).toBe('0:00')
      expect(formatDuration(0)).toBe('0:00')
      expect(formatDuration(-1)).toBe('0:00')
    })
  })

  describe('isLocalDev', () => {
    const originalEnv = process.env.NODE_ENV
    const originalWindow = global.window

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
      global.window = originalWindow
    })

    it('returns false in test environment', () => {
      process.env.NODE_ENV = 'test'
      expect(isLocalDev()).toBe(false)
    })

    it('returns false when window is undefined', () => {
      process.env.NODE_ENV = 'development'
      delete (global as any).window
      expect(isLocalDev()).toBe(false)
    })

    it('returns true in local development', () => {
      process.env.NODE_ENV = 'development'
      global.window = {
        location: { hostname: 'localhost' }
      } as any
      expect(isLocalDev()).toBe(true)
    })

    it('returns false for non-localhost in development', () => {
      process.env.NODE_ENV = 'development'
      global.window = {
        location: { hostname: 'example.com' }
      } as any
      expect(isLocalDev()).toBe(false)
    })
  })

  describe('extractFilenameFromStoragePath', () => {
    it('extracts filename from storage path', () => {
      expect(extractFilenameFromStoragePath('/path/to/file.wav')).toBe('file')
      expect(extractFilenameFromStoragePath('file.mp3')).toBe('file')
      expect(extractFilenameFromStoragePath('/nested/path/with/dots/file.name.wav')).toBe('file.name')
      expect(extractFilenameFromStoragePath('')).toBe('')
    })
  })

  describe('generateTrackTitle', () => {
    it('generates title from storage path', () => {
      const track = {
        id: '123',
        daily_id: '2024-01-01',
        storage_path: '/path/to/song-title.wav'
      }
      expect(generateTrackTitle(track)).toBe('song-title')
    })

    it('falls back to daily_id and id when no storage path', () => {
      const track = {
        id: '123',
        daily_id: '2024-01-01'
      }
      expect(generateTrackTitle(track)).toBe('2024-01-01-123')
    })
  })

  describe('getNextTrackIndex', () => {
    it('returns next track index', () => {
      expect(getNextTrackIndex(0, 3)).toBe(1)
      expect(getNextTrackIndex(1, 3)).toBe(2)
      expect(getNextTrackIndex(2, 3)).toBe(0) // wraps around
    })

    it('handles edge cases', () => {
      expect(getNextTrackIndex(null, 3)).toBe(0)
      expect(getNextTrackIndex(0, 0)).toBe(0)
    })
  })

  describe('getPreviousTrackIndex', () => {
    it('returns previous track index', () => {
      expect(getPreviousTrackIndex(1, 3)).toBe(0)
      expect(getPreviousTrackIndex(2, 3)).toBe(1)
      expect(getPreviousTrackIndex(0, 3)).toBe(2) // wraps around
    })

    it('handles edge cases', () => {
      expect(getPreviousTrackIndex(null, 3)).toBe(0)
      expect(getPreviousTrackIndex(0, 0)).toBe(0)
    })
  })
})
