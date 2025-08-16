import React, { useState } from 'react'
import { Button } from '../ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Post {
  id: string
  date: string
  content: string
}

interface PostCalendarProps {
  posts: Post[]
  onDateClick?: (date: Date) => void
}

export function PostCalendar({ posts, onDateClick }: PostCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 7)) // August 2025

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Get first day of month and adjust for Monday start (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  )
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  )
  const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7 // Adjust so Monday = 0
  const daysInMonth = lastDayOfMonth.getDate()

  // Create calendar grid
  const calendarDays = []

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Get posts for a specific day
  const getPostsForDay = (day: number) => {
    const dateStr = `${String(day).padStart(2, '0')}`
    const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0')
    const yearStr = String(currentDate.getFullYear()).slice(-2)

    return posts.filter((post) => {
      // Match various date formats like "25aug13", "August 13, 2025", etc.
      const postDate = post.date.toLowerCase()
      const postId = post.id.toLowerCase()

      // Check if post ID matches format like "25aug13"
      if (
        postId.includes(
          `${yearStr}${monthNames[currentDate.getMonth()].toLowerCase().slice(0, 3)}${dateStr}`
        ) ||
        postId.includes(
          `${dateStr}${monthNames[currentDate.getMonth()].toLowerCase().slice(0, 3)}${yearStr}`
        )
      ) {
        return true
      }

      // Check if date string matches
      if (
        postDate.includes(
          `${monthNames[currentDate.getMonth()].toLowerCase()} ${day},`
        ) ||
        postDate.includes(
          `${monthNames[currentDate.getMonth()].toLowerCase()} ${String(day).padStart(2, '0')},`
        )
      ) {
        return true
      }

      return false
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    )
  }

  return (
    <div className="bg-black text-white border border-gray-800 rounded-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-800"
          >
            Today
          </Button>
        </div>

        <h2 className="text-lg text-gray-300">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white px-2"
            >
              Month
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white px-2"
            >
              Week
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white px-2"
            >
              List
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-1">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs text-gray-400 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const postsForDay = day ? getPostsForDay(day) : []
            const hasToday = day && isToday(day)

            return (
              <div
                key={index}
                className={`
                  min-h-[80px] p-2 border border-gray-800 hover:bg-gray-900/50 transition-colors cursor-pointer
                  ${day ? 'bg-gray-950' : 'bg-transparent'}
                  ${hasToday ? 'bg-gray-800 border-gray-700' : ''}
                `}
                onClick={() =>
                  day &&
                  onDateClick &&
                  onDateClick(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      day
                    )
                  )
                }
              >
                {day && (
                  <>
                    <div
                      className={`text-sm mb-1 ${hasToday ? 'text-white' : 'text-gray-300'}`}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {postsForDay.map((post, postIndex) => (
                        <div
                          key={postIndex}
                          className="text-xs px-1 py-0.5 bg-red-600/20 text-red-400 rounded border border-red-600/30 truncate"
                          title={post.content}
                        >
                          {post.id}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
