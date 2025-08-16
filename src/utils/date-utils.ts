/**
 * Transform a name in format "25may05" to a date string
 * @param name - The name in format "YYmonDD" (e.g., "25may05")
 * @param randomTime - Whether to add random time (default: true)
 * @returns ISO string in format "YYYY-MM-DDTHH:mm:ss.sssZ" if randomTime=true, or "YYYY-MM-DD" if randomTime=false
 */
const transformDate = (name: string, randomTime: boolean = true): string => {
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
  const monthMap: Record<string, number> = {
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

    // Return full ISO string with time when randomTime is requested
    return date.toISOString()
  } else {
    // For consistent display, use noon
    date.setHours(12, 0, 0)
    // Return just date portion when no random time
    return date.toISOString().slice(0, 10)
  }
}

/**
 * Get a list of all valid month abbreviations
 * @returns Array of month abbreviations
 */
const getMonthAbbreviations = (): string[] => [
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
 * @param name - The name to validate
 * @returns True if valid format
 */
const isValidNameFormat = (name: string): boolean => {
  return /^(\d{2})([a-z]{3})(\d{2})$/i.test(name)
}

export {
  transformDate,
  getMonthAbbreviations,
  isValidNameFormat,
}
