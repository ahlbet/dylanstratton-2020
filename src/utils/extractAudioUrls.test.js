import { extractAudioUrls, removeAudioFromHtml } from './extractAudioUrls'

describe('extractAudioUrls', () => {
  test('should extract audio URLs from HTML content with audio elements', () => {
    const html = `
      <div>
        <p>Some text here.</p>
        
        <audio src="https://example.com/audio1.wav"></audio>
        <audio src="https://example.com/audio2.mp3"></audio>
        
        <p>More text.</p>
      </div>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/audio1.wav',
      'https://example.com/audio2.mp3',
    ])
  })

  test('should handle HTML with no audio elements', () => {
    const html = `
      <div>
        <p>This is just text content with no audio files.</p>
        <p>Some more text here.</p>
      </div>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([])
  })

  test('should handle empty HTML', () => {
    const html = ''
    const urls = extractAudioUrls(html)
    expect(urls).toEqual([])
  })

  test('should handle HTML with only audio elements', () => {
    const html = '<audio src="https://example.com/audio.wav"></audio>'
    const urls = extractAudioUrls(html)
    expect(urls).toEqual(['https://example.com/audio.wav'])
  })

  test('should extract multiple audio URLs from same line', () => {
    const html =
      '<audio src="https://example.com/audio1.wav"></audio><audio src="https://example.com/audio2.mp3"></audio><audio src="https://example.com/audio3.ogg"></audio>'
    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/audio1.wav',
      'https://example.com/audio2.mp3',
      'https://example.com/audio3.ogg',
    ])
  })

  test('should handle various audio file extensions', () => {
    const html = `
      <audio src="https://example.com/file.wav"></audio>
      <audio src="https://example.com/file.mp3"></audio>
      <audio src="https://example.com/file.ogg"></audio>
      <audio src="https://example.com/file.flac"></audio>
      <audio src="https://example.com/file.aac"></audio>
      <audio src="https://example.com/file.m4a"></audio>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/file.wav',
      'https://example.com/file.mp3',
      'https://example.com/file.ogg',
      'https://example.com/file.flac',
      'https://example.com/file.aac',
      'https://example.com/file.m4a',
    ])
  })

  test('should ignore non-audio elements', () => {
    const html = `
      <img src="image.jpg" />
      <audio src="https://example.com/audio.wav"></audio>
      <a href="doc.pdf">Document</a>
      <video src="video.mp4"></video>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual(['https://example.com/audio.wav'])
  })

  test('should handle HTML with mixed content', () => {
    const html = `
      <h1>Title</h1>
      
      <a href="https://example.com">Link</a>
      <audio src="https://example.com/audio.wav"></audio>
      
      <h2>Subtitle</h2>
      
      <audio src="https://example.com/another.mp3"></audio>
      
      <img src="image.png" />
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/audio.wav',
      'https://example.com/another.mp3',
    ])
  })

  test('should handle HTML with complex formatting', () => {
    const html = `
      <h1><strong>Bold Title</strong></h1>
      
      <p><em>Italic text</em> with <audio src="https://example.com/audio.wav"></audio></p>
      
      <blockquote>Blockquote with <audio src="https://example.com/audio2.mp3"></audio></blockquote>
      
      <pre><code>
      <audio src="https://example.com/audio3.ogg"></audio>
      </code></pre>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/audio.wav',
      'https://example.com/audio2.mp3',
      'https://example.com/audio3.ogg',
    ])
  })

  test('should handle HTML with quoted and unquoted src attributes', () => {
    const html = `
      <audio src="https://example.com/audio1.wav"></audio>
      <audio src=https://example.com/audio2.mp3></audio>
      <audio src='https://example.com/audio3.ogg'></audio>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/audio1.wav',
      'https://example.com/audio2.mp3',
      'https://example.com/audio3.ogg',
    ])
  })

  test('should handle HTML with code blocks containing audio URLs', () => {
    const html = `
      <code>audio: https://example.com/audio1.wav</code>
      <code>audio: https://example.com/audio2.mp3</code>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/audio1.wav',
      'https://example.com/audio2.mp3',
    ])
  })

  test('should handle HTML with plain text audio patterns', () => {
    const html = `
      <p>Check out this audio: <code>audio: https://example.com/audio.wav</code></p>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual(['https://example.com/audio.wav'])
  })

  test('should filter out invalid URLs', () => {
    const html = `
      <audio src="https://example.com/audio.wav"></audio>
      <audio src="invalid-url"></audio>
      <audio src="not-an-audio.txt"></audio>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual(['https://example.com/audio.wav'])
  })

  test('should handle HTML with multiple lines between audio elements', () => {
    const html = `
      <audio src="https://example.com/audio1.wav"></audio>
      
      
      
      <audio src="https://example.com/audio2.mp3"></audio>
      
      
      
      <audio src="https://example.com/audio3.ogg"></audio>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/audio1.wav',
      'https://example.com/audio2.mp3',
      'https://example.com/audio3.ogg',
    ])
  })

  test('should handle HTML with audio elements at the beginning and end', () => {
    const html = `
      <audio src="https://example.com/first.wav"></audio>
      
      <p>Content in the middle.</p>
      
      <audio src="https://example.com/last.mp3"></audio>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/first.wav',
      'https://example.com/last.mp3',
    ])
  })

  test('should handle HTML with only whitespace', () => {
    const html = '   \n  \t  \n  '
    const urls = extractAudioUrls(html)
    expect(urls).toEqual([])
  })

  test('should handle null or undefined input', () => {
    expect(extractAudioUrls(null)).toEqual([])
    expect(extractAudioUrls(undefined)).toEqual([])
  })

  test('should handle non-string input', () => {
    expect(extractAudioUrls(123)).toEqual([])
    expect(extractAudioUrls({})).toEqual([])
    expect(extractAudioUrls([])).toEqual([])
    expect(extractAudioUrls(true)).toEqual([])
  })

  test('should handle HTML with audio elements in different containers', () => {
    const html = `
      <div>
        <audio src="https://example.com/audio1.wav"></audio>
      </div>
      <section>
        <audio src="https://example.com/audio2.mp3"></audio>
      </section>
      <article>
        <audio src="https://example.com/audio3.ogg"></audio>
      </article>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/audio1.wav',
      'https://example.com/audio2.mp3',
      'https://example.com/audio3.ogg',
    ])
  })

  test('should handle HTML with nested audio elements', () => {
    const html = `
      <div>
        <p>
          <audio src="https://example.com/nested.wav"></audio>
        </p>
      </div>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual(['https://example.com/nested.wav'])
  })

  test('should handle URLs with query parameters', () => {
    const html = `
      <audio src="https://example.com/audio.wav?v=123&t=456"></audio>
      <audio src="https://example.com/audio.mp3?cache=true"></audio>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/audio.wav?v=123&t=456',
      'https://example.com/audio.mp3?cache=true',
    ])
  })

  test('should handle URLs with fragments', () => {
    const html = `
      <audio src="https://example.com/audio.wav#section1"></audio>
      <audio src="https://example.com/audio.mp3#timestamp=30"></audio>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/audio.wav#section1',
      'https://example.com/audio.mp3#timestamp=30',
    ])
  })

  test('should handle code blocks with different formatting', () => {
    const html = `
      <code>audio: https://example.com/audio1.wav</code>
      <code>audio: https://example.com/audio2.mp3</code>
      <code>audio: https://example.com/audio3.ogg</code>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/audio1.wav',
      'https://example.com/audio2.mp3',
      'https://example.com/audio3.ogg',
    ])
  })

  test('should handle plain text patterns with different formatting', () => {
    const html = `
      <p>Audio: <code>audio: https://example.com/audio1.wav</code></p>
      <p>Check: <code>audio: https://example.com/audio2.mp3</code></p>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/audio1.wav',
      'https://example.com/audio2.mp3',
    ])
  })

  test('should filter out non-HTTP/HTTPS URLs', () => {
    const html = `
      <audio src="ftp://example.com/audio.wav"></audio>
      <audio src="file:///local/audio.mp3"></audio>
      <audio src="https://example.com/audio.ogg"></audio>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual(['https://example.com/audio.ogg'])
  })

  test('should filter out URLs without valid audio extensions', () => {
    const html = `
      <audio src="https://example.com/audio.wav"></audio>
      <audio src="https://example.com/audio.txt"></audio>
      <audio src="https://example.com/audio.pdf"></audio>
      <audio src="https://example.com/audio.mp3"></audio>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/audio.wav',
      'https://example.com/audio.mp3',
    ])
  })

  test('should handle duplicate URLs and return unique ones', () => {
    const html = `
      <audio src="https://example.com/audio.wav"></audio>
      <audio src="https://example.com/audio.wav"></audio>
      <code>audio: https://example.com/audio.wav</code>
      <code>audio: https://example.com/audio.mp3</code>
      <code>audio: https://example.com/audio.mp3</code>
    `

    const urls = extractAudioUrls(html)
    expect(urls).toEqual([
      'https://example.com/audio.wav',
      'https://example.com/audio.mp3',
    ])
  })
})

describe('removeAudioFromHtml', () => {
  test('should remove audio elements from HTML', () => {
    const html = `
      <p>Some text here.</p>
      <audio src="https://example.com/audio.wav"></audio>
      <p>More text here.</p>
    `

    const result = removeAudioFromHtml(html)
    expect(result).not.toContain('<audio')
    expect(result).toContain('Some text here.')
    expect(result).toContain('More text here.')
  })

  test('should remove paragraph elements containing audio elements', () => {
    const html = `
      <p>Some text here.</p>
      <p><audio src="https://example.com/audio.wav"></audio></p>
      <p>More text here.</p>
    `

    const result = removeAudioFromHtml(html)
    expect(result).not.toContain('<audio')
    expect(result).not.toContain('<p></p>')
    expect(result).toContain('Some text here.')
    expect(result).toContain('More text here.')
  })

  test('should remove code blocks with audio URLs', () => {
    const html = `
      <p>Some text here.</p>
      <code>audio: https://example.com/audio.wav</code>
      <p>More text here.</p>
    `

    const result = removeAudioFromHtml(html)
    expect(result).not.toContain('audio: https://example.com/audio.wav')
    expect(result).toContain('Some text here.')
    expect(result).toContain('More text here.')
  })

  test('should remove paragraph elements containing audio code blocks', () => {
    const html = `
      <p>Some text here.</p>
      <p><code>audio: https://example.com/audio.wav</code></p>
      <p>More text here.</p>
    `

    const result = removeAudioFromHtml(html)
    expect(result).not.toContain('audio: https://example.com/audio.wav')
    expect(result).not.toContain('<p></p>')
    expect(result).toContain('Some text here.')
    expect(result).toContain('More text here.')
  })

  test('should clean up empty paragraphs', () => {
    const html = `
      <p>Some text here.</p>
      <p></p>
      <p>More text here.</p>
    `

    const result = removeAudioFromHtml(html)
    expect(result).not.toContain('<p></p>')
    expect(result).toContain('Some text here.')
    expect(result).toContain('More text here.')
  })

  test('should clean up double line breaks', () => {
    const html = `
      <p>Some text here.</p>


      <p>More text here.</p>
    `

    const result = removeAudioFromHtml(html)
    expect(result).not.toContain('\n\n\n')
    expect(result).toContain('Some text here.')
    expect(result).toContain('More text here.')
  })

  test('should handle HTML with no audio content', () => {
    const html = `
      <p>Some text here.</p>
      <p>More text here.</p>
    `

    const result = removeAudioFromHtml(html)
    expect(result).toBe(html)
  })

  test('should handle empty HTML', () => {
    const html = ''
    const result = removeAudioFromHtml(html)
    expect(result).toBe('')
  })

  test('should handle HTML with only whitespace', () => {
    const html = '   \n  \t  \n  '
    const result = removeAudioFromHtml(html)
    expect(result).toBe('')
  })

  test('should handle null or undefined input', () => {
    expect(removeAudioFromHtml(null)).toBe(null)
    expect(removeAudioFromHtml(undefined)).toBe(undefined)
  })

  test('should handle non-string input', () => {
    expect(removeAudioFromHtml(123)).toBe(123)
    expect(removeAudioFromHtml({})).toStrictEqual({})
    expect(removeAudioFromHtml([])).toStrictEqual([])
    expect(removeAudioFromHtml(true)).toBe(true)
  })

  test('should handle complex HTML with multiple audio elements', () => {
    const html = `
      <div>
        <h1>Title</h1>
        <p>Introduction text.</p>
        
        <p><audio src="https://example.com/audio1.wav"></audio></p>
        
        <h2>Section 1</h2>
        <p>Content here.</p>
        
        <code>audio: https://example.com/audio2.mp3</code>
        
        <p>More content.</p>
        
        <audio src="https://example.com/audio3.ogg"></audio>
        
        <p>Final text.</p>
      </div>
    `

    const result = removeAudioFromHtml(html)
    expect(result).not.toContain('<audio')
    expect(result).not.toContain('audio: https://example.com/audio2.mp3')
    expect(result).toContain('Title')
    expect(result).toContain('Introduction text.')
    expect(result).toContain('Section 1')
    expect(result).toContain('Content here.')
    expect(result).toContain('More content.')
    expect(result).toContain('Final text.')
  })

  test('should preserve non-audio HTML elements', () => {
    const html = `
      <div>
        <h1>Title</h1>
        <p>Text with <strong>bold</strong> and <em>italic</em> content.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <blockquote>Quote here</blockquote>
        <audio src="https://example.com/audio.wav"></audio>
      </div>
    `

    const result = removeAudioFromHtml(html)
    expect(result).not.toContain('<audio')
    expect(result).toContain('<h1>Title</h1>')
    expect(result).toContain('<strong>bold</strong>')
    expect(result).toContain('<em>italic</em>')
    expect(result).toContain('<ul>')
    expect(result).toContain('<li>Item 1</li>')
    expect(result).toContain('<li>Item 2</li>')
    expect(result).toContain('<blockquote>Quote here</blockquote>')
  })
})
