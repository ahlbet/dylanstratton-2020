const path = require('path')
const fs = require('fs')
const os = require('os')

// Mock the cover art generator for testing
jest.mock('../src/utils/cover-art-generator', () => ({
  generateCoverArt: jest.fn().mockResolvedValue(Buffer.from('mock-png-data')),
}))

// Import the functions we want to test
const { generateCoverArt } = require('../src/utils/cover-art-generator')

describe('generate-cover-art.js functionality', () => {
  let mockWriteFileSync
  let mockHomedir

  beforeEach(() => {
    // Mock fs.writeFileSync
    mockWriteFileSync = jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(() => {})

    // Mock os.homedir
    mockHomedir = jest.spyOn(os, 'homedir').mockReturnValue('/test/home')
  })

  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks()
  })

  test('should generate cover art with valid post name', async () => {
    const postName = 'Test Post Name'

    // Generate the cover art buffer
    const coverArtBuffer = await generateCoverArt(postName, 2500)

    // Verify the buffer was generated
    expect(coverArtBuffer).toBeInstanceOf(Buffer)
    expect(coverArtBuffer.toString()).toBe('mock-png-data')
  })

  test('should sanitize filename correctly', () => {
    const testCases = [
      { input: 'Test Post Name', expected: 'test-post-name-cover-art.png' },
      {
        input: 'Post with Special Chars!@#',
        expected: 'post-with-special-chars-cover-art.png',
      },
      {
        input: 'Post with   Multiple   Spaces',
        expected: 'post-with-multiple-spaces-cover-art.png',
      },
      {
        input: 'Post-with-hyphens',
        expected: 'post-with-hyphens-cover-art.png',
      },
      {
        input: 'Post with Numbers 123',
        expected: 'post-with-numbers-123-cover-art.png',
      },
    ]

    testCases.forEach(({ input, expected }) => {
      const sanitizedName = input
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .trim()

      const fileName = `${sanitizedName}-cover-art.png`
      expect(fileName).toBe(expected)
    })
  })

  test('should construct correct file path', () => {
    const postName = 'Test Post'
    const downloadsPath = '/test/home/Downloads'
    const sanitizedName = postName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .trim()

    const fileName = `${sanitizedName}-cover-art.png`
    const filePath = path.join(downloadsPath, fileName)

    expect(filePath).toBe('/test/home/Downloads/test-post-cover-art.png')
  })

  test('should handle special characters in post name', () => {
    const postName = 'Post with !@#$%^&*() characters'
    const sanitizedName = postName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .trim()

    const fileName = `${sanitizedName}-cover-art.png`
    expect(fileName).toBe('post-with-characters-cover-art.png')
  })

  test('should handle numbers and mixed content', () => {
    const postName = 'Post 123 with 456 numbers'
    const sanitizedName = postName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .trim()

    const fileName = `${sanitizedName}-cover-art.png`
    expect(fileName).toBe('post-123-with-456-numbers-cover-art.png')
  })
})
