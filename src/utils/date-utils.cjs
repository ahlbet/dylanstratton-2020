/**
 * Transform a name in format "25may05" to a date string "2025-05-05T12:00:00.000Z"
 * @param {string} name - The name in format "YYmonDD" (e.g., "25may05")
 * @param {boolean} randomTime - Whether to add random time (default: true)
 * @returns {string} ISO date string in format "YYYY-MM-DDTHH:mm:ss.sssZ"
 */
const transformDate = (name, randomTime = true) => {
  // Parse name format like "25may05" or "24jun19"
  const match = name.match(/^(\d{2})([a-z]{3})(\d{2})$/i)
  if (!match) {
    throw new Error(
      `Invalid name format. Expected format like "25may05" or "24jun19", got "${name}"`
    )
  }

  const [, year, month, day] = match

  // Convert 2-digit year to 4-digit year (assuming 20xx for years 00-99)
  const fullYear =
    parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year)

  // Convert month abbreviation to month number
  const monthMap = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  }

  const monthNum = monthMap[month.toLowerCase()]
  if (monthNum === undefined) {
    throw new Error(`Invalid month: ${month}`)
  }

  // Create date object
  const date = new Date(fullYear, monthNum, parseInt(day))

  // Add random time (hours: 0-23, minutes: 0-59, seconds: 0-59)
  if (randomTime) {
    const randomHours = Math.floor(Math.random() * 24)
    const randomMinutes = Math.floor(Math.random() * 60)
    const randomSeconds = Math.floor(Math.random() * 60)

    date.setHours(randomHours, randomMinutes, randomSeconds)
  } else {
    // For consistent display, use noon
    date.setHours(12, 0, 0)
  }

  return date.toISOString()
}

/**
 * Get a list of all valid month abbreviations
 * @returns {string[]} Array of month abbreviations
 */
const getMonthAbbreviations = () => [
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

/**
 * Validate if a name follows the expected format
 * @param {string} name - The name to validate
 * @returns {boolean} True if valid format
 */
const isValidNameFormat = (name) => {
  return /^(\d{2})([a-z]{3})(\d{2})$/i.test(name)
}

// Export for CommonJS
module.exports = {
  transformDate,
  getMonthAbbreviations,
  isValidNameFormat,
}
