import React, { useState, useEffect, useRef, useCallback } from 'react'
import MarkovGeneratorAPIClient from '../../utils/markov-generator-api-client'
import './DynamicMarkovText.css'

const DynamicMarkovText = ({ className = '' }) => {
  const [generatedLines, setGeneratedLines] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [currentlyTyping, setCurrentlyTyping] = useState(null)
  const [pendingLines, setPendingLines] = useState([])
  const generatorRef = useRef(null)
  const audioCheckIntervalRef = useRef(null)
  const typewriterTimeoutRef = useRef(null)
  const currentTypingInstanceRef = useRef(null)
  const prevShouldShowContentRef = useRef(false)
  const isCurrentlyTypingRef = useRef(false)
  const totalLinesStartedRef = useRef(0)

  // Initialize the markov generator API client
  useEffect(() => {
    const initializeGenerator = async () => {
      try {
        const generator = new MarkovGeneratorAPIClient()
        const isAvailable = await generator.isAvailable()

        if (isAvailable) {
          generatorRef.current = generator
        } else {
          console.error('❌ Markov generator API is not available')
        }
      } catch (error) {
        console.error(
          '❌ Error initializing markov generator API client:',
          error
        )
      }
    }

    initializeGenerator()
  }, [])

  // Check audio playback state
  const checkAudioPlayback = useCallback(() => {
    const audioElements = document.querySelectorAll('audio, video')
    let isPlaying = false

    audioElements.forEach((audio) => {
      if (!audio.paused && !audio.ended && audio.currentTime > 0) {
        isPlaying = true
      }
    })

    setAudioPlaying(isPlaying)
  }, [])

  // Start/stop generation based on audio playback
  useEffect(() => {
    if (audioPlaying && generatorRef.current && !isGenerating) {
      setIsGenerating(true)

      // Load initial batch of texts
      const loadInitialBatch = async () => {
        try {
          await generatorRef.current.loadTextBatch(20)
          // Add first text after loading
          setTimeout(() => {
            addNextTextFromQueue()
          }, 500)
        } catch (error) {
          console.error('❌ Failed to load initial text batch:', error)
        }
      }

      loadInitialBatch()
    } else if (!audioPlaying) {
      // Audio stopped - clean up
      if (isGenerating) {
        setIsGenerating(false)
      }
    }

    return () => {
      // Cleanup
    }
  }, [audioPlaying, isGenerating])

  // Set up audio monitoring
  useEffect(() => {
    // Check immediately
    checkAudioPlayback()

    // Set up interval to check audio state
    audioCheckIntervalRef.current = setInterval(checkAudioPlayback, 1000)

    return () => {
      if (audioCheckIntervalRef.current) {
        clearInterval(audioCheckIntervalRef.current)
        audioCheckIntervalRef.current = null
      }
    }
  }, [checkAudioPlayback])

  // Function to add next text from queue
  const addNextTextFromQueue = useCallback(() => {
    if (totalLinesStartedRef.current >= 20) {
      return
    }

    if (generatorRef.current) {
      try {
        // Get next text from queue
        const newLine = generatorRef.current.getNextText()

        if (newLine && newLine.length > 20) {
          // Check if this exact text is already being typed or in the queue
          const isDuplicate =
            currentlyTyping?.originalText === newLine ||
            pendingLines.some((line) => line.text === newLine) ||
            generatedLines.includes(newLine)

          if (!isDuplicate) {
            addTypewriterLine(newLine)
          } else {
            // Try next text
            setTimeout(addNextTextFromQueue, 100)
          }
        } else if (!newLine) {
          // Queue is empty, load more texts
          generatorRef.current.loadTextBatch(20).then(() => {
            // Try to add a text immediately after loading
            setTimeout(addNextTextFromQueue, 100)
          })
        }
      } catch (error) {
        console.error('❌ Error during text generation:', error)
      }
    }
  }, [currentlyTyping, pendingLines, generatedLines])

  // Start typing a line
  const startTypingLine = useCallback(
    (text) => {
      if (isCurrentlyTypingRef.current) {
        return // Already typing
      }

      isCurrentlyTypingRef.current = true
      currentTypingInstanceRef.current = text

      setCurrentlyTyping({
        text: '',
        originalText: text,
        isComplete: false,
      })

      const words = text.split(' ')
      let wordIndex = 0

      const typeNextWord = () => {
        if (wordIndex < words.length) {
          setCurrentlyTyping((prev) => ({
            ...prev,
            text: words.slice(0, wordIndex + 1).join(' '),
          }))

          wordIndex++
          if (wordIndex < words.length) {
            const nextDelay = 150 + Math.random() * 100
            typewriterTimeoutRef.current = setTimeout(typeNextWord, nextDelay)
          } else {
            // Line completed
            setTimeout(() => {
              // Add completed line to permanent display
              setGeneratedLines((prev) => {
                const newGenerated = [...prev, text]
                return newGenerated
              })

              // Check if there are pending lines to start immediately
              setPendingLines((currentPending) => {
                if (currentPending.length > 0) {
                  const nextLine = currentPending[0]
                  const remainingPending = currentPending.slice(1)

                  // Start typing the next line immediately
                  setTimeout(() => startTypingLine(nextLine.text), 50)

                  return remainingPending
                } else {
                  // Clear any remaining timeout to prevent race conditions
                  if (typewriterTimeoutRef.current) {
                    clearTimeout(typewriterTimeoutRef.current)
                    typewriterTimeoutRef.current = null
                  }
                  currentTypingInstanceRef.current = null
                  setCurrentlyTyping(null)
                  isCurrentlyTypingRef.current = false

                  // Add next text from queue if we haven't hit the limit
                  if (totalLinesStartedRef.current < 20) {
                    setTimeout(addNextTextFromQueue, 500)
                  }

                  return currentPending
                }
              })
            }, 100)
          }
        }
      }

      const initialDelay = 200
      typewriterTimeoutRef.current = setTimeout(typeNextWord, initialDelay)
    },
    [addNextTextFromQueue]
  )

  // Simplified addTypewriterLine - just adds to queue
  const addTypewriterLine = useCallback(
    (text) => {
      if (totalLinesStartedRef.current >= 20) {
        return
      }

      // Increment the counter when we start a new line
      totalLinesStartedRef.current += 1

      if (!currentlyTyping) {
        // Start typing immediately if nothing is currently typing
        startTypingLine(text)
      } else {
        // Add to queue instead of interrupting current typing
        setPendingLines((prev) => {
          const newQueue = [...prev, { text, isComplete: false }]
          return newQueue
        })
      }
    },
    [currentlyTyping, startTypingLine]
  )

  // Clear generated text when audio stops for a while
  useEffect(() => {
    if (!audioPlaying) {
      const clearTimer = setTimeout(() => {
        if (!audioPlaying) {
          // Clear any active timeouts first
          if (typewriterTimeoutRef.current) {
            clearTimeout(typewriterTimeoutRef.current)
            typewriterTimeoutRef.current = null
          }

          // Clear all state
          setGeneratedLines([])
          setPendingLines([])
          totalLinesStartedRef.current = 0

          // Only clear typing state if not actively typing
          if (!isCurrentlyTypingRef.current) {
            setCurrentlyTyping(null)
            isCurrentlyTypingRef.current = false
            currentTypingInstanceRef.current = null
          }
        }
      }, 30000) // Clear after 30 seconds of no audio

      return () => clearTimeout(clearTimer)
    }
  }, [audioPlaying])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioCheckIntervalRef.current) {
        clearInterval(audioCheckIntervalRef.current)
      }
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current)
      }
    }
  }, [])

  // Track when content visibility changes
  useEffect(() => {
    const shouldShowContent = generatedLines.length > 0 || !!currentlyTyping
    if (shouldShowContent !== prevShouldShowContentRef.current) {
      prevShouldShowContentRef.current = shouldShowContent
    }
  }, [generatedLines.length, !!currentlyTyping])

  if (!generatorRef.current) {
    return null
  }

  const shouldShowContent = generatedLines.length > 0 || !!currentlyTyping

  return (
    <div className={`dynamic-markov-text ${className}`}>
      {shouldShowContent && (
        <div className="generated-content">
          {/* Display completed lines */}
          {generatedLines.map((line, index) => (
            <blockquote key={`complete-${index}`} className="generated-line">
              {line}
            </blockquote>
          ))}

          {/* Display currently typing line */}
          {currentlyTyping && (
            <blockquote className="generated-line typing">
              {currentlyTyping.text}
              <span className="typing-cursor">|</span>
            </blockquote>
          )}
        </div>
      )}
    </div>
  )
}

export default DynamicMarkovText
