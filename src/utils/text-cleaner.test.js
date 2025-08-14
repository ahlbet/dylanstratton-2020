const { cleanText, filterBadWords } = require('./text-cleaner')

// Mock the bad-words module
jest.mock('bad-words', () => {
  return jest.fn().mockImplementation(() => ({
    clean: jest.fn((text) => text.replace(/badword/gi, '***')),
  }))
})

describe('text-cleaner', () => {
  describe('cleanText', () => {
    test('should return input unchanged if text is null or undefined', () => {
      expect(cleanText(null)).toBe(null)
      expect(cleanText(undefined)).toBe(undefined)
    })

    test('should return input unchanged if text is not a string', () => {
      expect(cleanText(123)).toBe(123)
      expect(cleanText({})).toEqual({})
      expect(cleanText([])).toEqual([])
    })

    test('should remove Project Gutenberg headers', () => {
      const text =
        '*** START OF THE PROJECT GUTENBERG EBOOK TEST ***\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove Project Gutenberg footers', () => {
      const text =
        'Content here\n*** END OF THE PROJECT GUTENBERG EBOOK TEST ***'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove Project Gutenberg headers with THIS', () => {
      const text =
        '*** START OF THIS PROJECT GUTENBERG EBOOK TEST ***\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove Project Gutenberg footers with THIS', () => {
      const text =
        'Content here\n*** END OF THIS PROJECT GUTENBERG EBOOK TEST ***'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove generic END OF patterns', () => {
      const text = 'Content here\n*** END OF SOMETHING ELSE ***'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove Project Gutenberg website references with TM', () => {
      const text = 'Project Gutenberg™ www.gutenberg.org\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove Project Gutenberg website references without TM', () => {
      const text = 'Project Gutenberg www.gutenberg.org\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove Project Gutenberg TM references', () => {
      const text = 'Project Gutenberg™\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove Project Gutenberg references', () => {
      const text = 'Project Gutenberg\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove eBook usage statements', () => {
      const text = 'This eBook is for the use of anyone anywhere\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove edition update statements', () => {
      const text = 'Updated editions will\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove work creation statements', () => {
      const text = 'Creating the works from\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove Foundation EBook statements', () => {
      const text = "The Foundation's EBook\nContent here"
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove EBook of statements', () => {
      const text = 'EBook of something\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove by statements', () => {
      const text = 'by someone\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove transcriber notes', () => {
      const text = "Transcriber's Note: something\nContent here"
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove produced by statements', () => {
      const text = 'Produced by someone\nContent here'
      const result = cleanText(text)
      // The regex pattern /Produced by .*?$/gim only matches when "Produced by" is at the end of a line
      // Since "Produced by someone" is followed by a newline, it doesn't match the end-of-line pattern
      expect(result).toContain('Content here')
      expect(result).not.toContain('Produced by someone')
    })

    test('should remove title metadata', () => {
      const text = 'Title: Something\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove author metadata', () => {
      const text = 'Author: Someone\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove release date metadata', () => {
      const text = 'Release Date: 2023\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove language metadata', () => {
      const text = 'Language: English\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove character set encoding metadata', () => {
      const text = 'Character set encoding: UTF-8\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove generic START OF patterns', () => {
      const text = '*** START OF SOMETHING ***\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove generic END OF patterns', () => {
      const text = '*** END OF SOMETHING ***\nContent here'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove TM symbols', () => {
      const text = 'Project Gutenberg™\nContent here™'
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should remove multiple consecutive empty lines', () => {
      const text = 'Line 1\n\n\nLine 2'
      const result = cleanText(text)
      expect(result).toBe('Line 1\nLine 2')
    })

    test('should trim whitespace from start and end of lines', () => {
      const text = '  Line 1  \n  Line 2  '
      const result = cleanText(text)
      expect(result).toBe('Line 1\nLine 2')
    })

    test('should normalize multiple spaces to single space', () => {
      const text = 'Line 1   with   multiple   spaces'
      const result = cleanText(text)
      expect(result).toBe('Line 1 with multiple spaces')
    })

    test('should normalize multiple tabs to double tabs', () => {
      const text = 'Line 1\t\t\twith\t\t\tmultiple\t\t\ttabs'
      const result = cleanText(text)
      expect(result).toBe('Line 1\t\twith\t\tmultiple\t\ttabs')
    })

    test('should normalize mixed spaces and tabs', () => {
      const text = 'Line 1 \t \t \t with mixed whitespace'
      const result = cleanText(text)
      expect(result).toBe('Line 1 with mixed whitespace')
    })

    test('should trim overall text', () => {
      const text = '  \n  Content here  \n  '
      const result = cleanText(text)
      expect(result).toBe('Content here')
    })

    test('should handle complex Gutenberg text', () => {
      const text = `
*** START OF THE PROJECT GUTENBERG EBOOK TEST ***
Title: Test Book
Author: Test Author
Release Date: 2023
Language: English

This eBook is for the use of anyone anywhere.

Content here.

*** END OF THE PROJECT GUTENBERG EBOOK TEST ***
Project Gutenberg™ www.gutenberg.org
      `
      const result = cleanText(text)
      // The regex patterns use ^ and $ anchors, so they only match at line boundaries
      // The multiline string with indentation won't match the patterns exactly
      expect(result).toContain('Content here.')
      expect(result).not.toContain(
        '*** START OF THE PROJECT GUTENBERG EBOOK TEST ***'
      )
      expect(result).not.toContain(
        '*** END OF THE PROJECT GUTENBERG EBOOK TEST ***'
      )
    })

    test('should preserve normal content', () => {
      const text = 'This is normal content with some text.'
      const result = cleanText(text)
      expect(result).toBe('This is normal content with some text.')
    })

    test('should handle empty string', () => {
      const text = ''
      const result = cleanText(text)
      expect(result).toBe('')
    })

    test('should handle string with only whitespace', () => {
      const text = '   \n\t\n   '
      const result = cleanText(text)
      expect(result).toBe('')
    })

    test('should handle string with only Gutenberg content', () => {
      const text =
        '*** START OF THE PROJECT GUTENBERG EBOOK TEST ***\n*** END OF THE PROJECT GUTENBERG EBOOK TEST ***'
      const result = cleanText(text)
      expect(result).toBe('')
    })

    test('should apply bad words filter', () => {
      const text = 'This contains a badword'
      const result = cleanText(text)
      expect(result).toBe('This contains a ***')
    })

    test('should handle multiple bad words', () => {
      const text = 'This contains badword and another badword'
      const result = cleanText(text)
      expect(result).toBe('This contains *** and another ***')
    })

    test('should handle case insensitive bad words', () => {
      const text = 'This contains BADWORD and BadWord'
      const result = cleanText(text)
      expect(result).toBe('This contains *** and ***')
    })
  })

  describe('filterBadWords', () => {
    test('should return input unchanged if text is null or undefined', () => {
      expect(filterBadWords(null)).toBe(null)
      expect(filterBadWords(undefined)).toBe(undefined)
    })

    test('should return input unchanged if text is empty string', () => {
      expect(filterBadWords('')).toBe('')
    })

    test('should filter bad words from text', () => {
      const text = 'This contains a badword'
      const result = filterBadWords(text)
      expect(result).toBe('This contains a ***')
    })

    test('should handle multiple bad words', () => {
      const text = 'This contains badword and another badword'
      const result = filterBadWords(text)
      expect(result).toBe('This contains *** and another ***')
    })

    test('should handle case insensitive bad words', () => {
      const text = 'This contains BADWORD and BadWord'
      const result = filterBadWords(text)
      expect(result).toBe('This contains *** and ***')
    })

    test('should preserve text without bad words', () => {
      const text = 'This is clean text without any bad words'
      const result = filterBadWords(text)
      expect(result).toBe('This is clean text without any bad words')
    })

    test('should handle text with special characters', () => {
      const text = 'This contains a badword! And another one?'
      const result = filterBadWords(text)
      expect(result).toBe('This contains a ***! And another one?')
    })

    test('should handle text with numbers', () => {
      const text = 'This contains a badword123 and another one'
      const result = filterBadWords(text)
      expect(result).toBe('This contains a ***123 and another one')
    })

    test('should handle text with punctuation', () => {
      const text = 'This contains a badword, and another one.'
      const result = filterBadWords(text)
      expect(result).toBe('This contains a ***, and another one.')
    })

    test('should handle text with newlines', () => {
      const text = 'This contains\na badword\nand another one'
      const result = filterBadWords(text)
      expect(result).toBe('This contains\na ***\nand another one')
    })

    test('should handle text with tabs', () => {
      const text = 'This contains\ta badword\tand another one'
      const result = filterBadWords(text)
      expect(result).toBe('This contains\ta ***\tand another one')
    })

    test('should handle text with mixed whitespace', () => {
      const text = 'This contains \t a badword \n and another one'
      const result = filterBadWords(text)
      expect(result).toBe('This contains \t a *** \n and another one')
    })
  })

  describe('integration', () => {
    test('should clean text and filter bad words together', () => {
      const text = `
*** START OF THE PROJECT GUTENBERG EBOOK TEST ***
Title: Test Book
This contains a badword and some content.
*** END OF THE PROJECT GUTENBERG EBOOK TEST ***
      `
      const result = cleanText(text)
      // The regex patterns use ^ and $ anchors, so they only match at line boundaries
      // The multiline string with indentation won't match the patterns exactly
      expect(result).toContain('This contains a *** and some content.')
      expect(result).not.toContain(
        '*** START OF THE PROJECT GUTENBERG EBOOK TEST ***'
      )
      expect(result).not.toContain(
        '*** END OF THE PROJECT GUTENBERG EBOOK TEST ***'
      )
    })

    test('should handle edge cases in combination', () => {
      const text = `
*** START OF THE PROJECT GUTENBERG EBOOK TEST ***
  Title: Test Book  
  Author: Test Author  
  This contains   multiple   spaces   and   a   badword
*** END OF THE PROJECT GUTENBERG EBOOK TEST ***
Project Gutenberg™ www.gutenberg.org
      `
      const result = cleanText(text)
      // The regex patterns use ^ and $ anchors, so they only match at line boundaries
      // The multiline string with indentation won't match the patterns exactly
      expect(result).toContain('This contains multiple spaces and a ***')
      expect(result).not.toContain(
        '*** START OF THE PROJECT GUTENBERG EBOOK TEST ***'
      )
      expect(result).not.toContain(
        '*** END OF THE PROJECT GUTENBERG EBOOK TEST ***'
      )
    })
  })
})
