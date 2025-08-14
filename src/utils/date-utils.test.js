const {
  transformDate,
  getMonthAbbreviations,
  isValidNameFormat,
} = require('./date-utils')

describe('date-utils', () => {
  describe('transformDate', () => {
    test('should transform valid date format with random time', () => {
      const result = transformDate('25may05')

      // Should return ISO string with time
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

      // Should parse year correctly (25 -> 2025) - allow for timezone shifts
      expect(result).toMatch(/^2025-05-0[56]/)
    })

    test('should transform valid date format without random time', () => {
      const result = transformDate('25may05', false)

      // Should return just date portion
      expect(result).toBe('2025-05-05')
    })

    test('should handle years 00-49 as 2000s', () => {
      const result = transformDate('24jun19', false)
      expect(result).toBe('2024-06-19')
    })

    test('should handle years 50-99 as 1900s', () => {
      const result = transformDate('75dec31', false)
      expect(result).toBe('1975-12-31')
    })

    test('should handle all months correctly', () => {
      const months = [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
      ]

      months.forEach((month, index) => {
        const result = transformDate(`25${month}15`, false) // Use false to avoid timezone issues
        const expectedMonth = String(index + 1).padStart(2, '0')
        expect(result).toBe(`2025-${expectedMonth}-15`)
      })
    })

    test('should handle case-insensitive month names', () => {
      expect(transformDate('25MAY05')).toMatch(/^2025-05-0[56]/)
      expect(transformDate('25May05')).toMatch(/^2025-05-0[56]/)
      expect(transformDate('25may05')).toMatch(/^2025-05-0[56]/)
    })

    test('should throw error for invalid name format', () => {
      expect(() => transformDate('invalid')).toThrow(
        'Invalid name format. Expected format like "25may05" or "24jun19", got "invalid"'
      )
    })

    test('should throw error for invalid month', () => {
      expect(() => transformDate('25xxx05')).toThrow('Invalid month: xxx')
    })

    test('should handle edge case dates', () => {
      // Leap year - use false to avoid timezone issues
      expect(transformDate('24feb29', false)).toBe('2024-02-29')

      // End of month - use false to avoid timezone issues
      expect(transformDate('25dec31', false)).toBe('2025-12-31')

      // Beginning of month - use false to avoid timezone issues
      expect(transformDate('25jan01', false)).toBe('2025-01-01')
    })

    test('should handle century boundary correctly', () => {
      // Year 49 -> 2049 (49 < 50, so 2000 + 49)
      expect(transformDate('49dec31', false)).toBe('2049-12-31')

      // Year 50 -> 1950 (50 >= 50, so 1900 + 50)
      expect(transformDate('50jan01', false)).toBe('1950-01-01')

      // Year 00 -> 2000 (0 < 50, so 2000 + 0)
      expect(transformDate('00jan01', false)).toBe('2000-01-01')

      // Year 99 -> 1999 (99 >= 50, so 1900 + 99)
      expect(transformDate('99dec31', false)).toBe('1999-12-31')
    })

    test('should set consistent time when randomTime is false', () => {
      const result1 = transformDate('25may05', false)
      const result2 = transformDate('25may05', false)

      // Both should return the same time (noon)
      expect(result1).toBe(result2)
      expect(result1).toBe('2025-05-05')
    })

    test('should return different times when randomTime is true', () => {
      const result1 = transformDate('25may05', true)
      const result2 = transformDate('25may05', true)

      // Times should be different (random)
      expect(result1).not.toBe(result2)

      // But dates should be the same (allowing for timezone shifts)
      expect(result1).toMatch(/^2025-05-0[56]/)
      expect(result2).toMatch(/^2025-05-0[56]/)
    })
  })

  describe('getMonthAbbreviations', () => {
    test('should return all 12 month abbreviations', () => {
      const months = getMonthAbbreviations()

      expect(months).toHaveLength(12)
      expect(months).toEqual([
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
      ])
    })

    test('should return months in correct order', () => {
      const months = getMonthAbbreviations()

      expect(months[0]).toBe('jan')
      expect(months[11]).toBe('dec')
      expect(months[5]).toBe('jun')
    })

    test('should return lowercase month abbreviations', () => {
      const months = getMonthAbbreviations()

      months.forEach((month) => {
        expect(month).toBe(month.toLowerCase())
      })
    })
  })

  describe('isValidNameFormat', () => {
    test('should return true for valid formats', () => {
      const validFormats = [
        '25may05',
        '24jun19',
        '00jan01',
        '99dec31',
        '50mar15',
        '75aug22',
      ]

      validFormats.forEach((format) => {
        expect(isValidNameFormat(format)).toBe(true)
      })
    })

    test('should return false for invalid formats', () => {
      const invalidFormats = [
        'invalid',
        '25may',
        'may05',
        '25may5',
        '25may005',
        '25may 05',
        '25-may-05',
        '25may05extra',
        'extra25may05',
        '',
        '   ',
        null,
        undefined,
      ]

      invalidFormats.forEach((format) => {
        expect(isValidNameFormat(format)).toBe(false)
      })
    })

    test('should handle case sensitivity correctly', () => {
      expect(isValidNameFormat('25MAY05')).toBe(true)
      expect(isValidNameFormat('25May05')).toBe(true)
      expect(isValidNameFormat('25may05')).toBe(true)
    })

    test('should handle edge cases', () => {
      expect(isValidNameFormat('00jan01')).toBe(true)
      expect(isValidNameFormat('99dec31')).toBe(true)
      expect(isValidNameFormat('50mar15')).toBe(true)
    })
  })

  describe('integration tests', () => {
    test('should work together: validate then transform', () => {
      const testName = '25may05'

      // First validate
      expect(isValidNameFormat(testName)).toBe(true)

      // Then transform
      const result = transformDate(testName)
      expect(result).toMatch(/^2025-05-0[56]/)
    })

    test('should work with month abbreviations from getMonthAbbreviations', () => {
      const months = getMonthAbbreviations()

      months.forEach((month, index) => {
        const testName = `25${month}15`

        // Should be valid format
        expect(isValidNameFormat(testName)).toBe(true)

        // Should transform correctly
        const result = transformDate(testName, false)
        const expectedMonth = String(index + 1).padStart(2, '0')
        expect(result).toBe(`2025-${expectedMonth}-15`)
      })
    })

    test('should handle all valid combinations', () => {
      const months = getMonthAbbreviations()
      const years = ['00', '25', '49', '50', '75', '99']
      const days = ['01', '15', '31']

      months.forEach((month, monthIndex) => {
        years.forEach((year) => {
          days.forEach((day) => {
            const testName = `${year}${month}${day}`

            // Should be valid format
            expect(isValidNameFormat(testName)).toBe(true)

            // Should transform without throwing
            expect(() => transformDate(testName)).not.toThrow()
          })
        })
      })
    })
  })
})
