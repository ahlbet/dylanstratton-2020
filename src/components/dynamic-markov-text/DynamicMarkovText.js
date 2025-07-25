import React, { useState, useEffect, useRef, useCallback } from 'react'
import MarkovGeneratorAPIClient from '../../utils/markov-generator-api-client'
import './DynamicMarkovText.css'

const DynamicMarkovText = ({ className = '' }) => {
  const [generatedLines, setGeneratedLines] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const audioStopTimeoutRef = useRef(null)
  const [currentlyTyping, setCurrentlyTyping] = useState(null)
  const [pendingLines, setPendingLines] = useState([])
  const generatorRef = useRef(null)
  const audioCheckIntervalRef = useRef(null)
  const typewriterTimeoutRef = useRef(null)
  const currentTypingInstanceRef = useRef(null)
  const prevShouldShowContentRef = useRef(false)
  const isCurrentlyTypingRef = useRef(false)
  const totalLinesStartedRef = useRef(0)
  const prevAudioElementRef = useRef(null)

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
    let currentAudioElement = null

    audioElements.forEach((audio) => {
      if (!audio.paused && !audio.ended && audio.currentTime > 0) {
        isPlaying = true
        currentAudioElement = audio
      }
    })

    // Track the current audio element
    if (
      currentAudioElement &&
      currentAudioElement !== prevAudioElementRef.current
    ) {
      prevAudioElementRef.current = currentAudioElement
    }

    // Clear any existing timeout when audio is playing
    if (isPlaying) {
      if (audioStopTimeoutRef.current) {
        clearTimeout(audioStopTimeoutRef.current)
        audioStopTimeoutRef.current = null
      }
      setAudioPlaying(true)
    } else {
      // Add a delay before considering audio as stopped (to handle auto-advance)
      if (!audioStopTimeoutRef.current) {
        audioStopTimeoutRef.current = setTimeout(() => {
          setAudioPlaying(false)
          audioStopTimeoutRef.current = null
        }, 200) // 200ms delay to handle auto-advance transitions
      }
    }
  }, [])

  // Start/stop generation based on audio playback
  useEffect(() => {
    if (audioPlaying && generatorRef.current) {
      // Only start generating if we haven't started yet
      if (!isGenerating && generatedLines.length === 0 && !currentlyTyping) {
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
      } else if (
        isGenerating &&
        !typewriterTimeoutRef.current &&
        totalLinesStartedRef.current < 20
      ) {
        if (!currentlyTyping) {
          // Audio resumed and we're generating but not typing - add next text from queue
          setTimeout(addNextTextFromQueue, 500)
        } else {
          // Resume typing from where we left off
          const words = currentlyTyping.originalText.split(' ')
          const currentWordCount = currentlyTyping.text.split(' ').length

          if (currentWordCount < words.length) {
            // Reset the typing flag so we can continue
            isCurrentlyTypingRef.current = false

            // Set the current typing state to where we left off
            setCurrentlyTyping({
              text: currentlyTyping.text,
              originalText: currentlyTyping.originalText,
              isComplete: false,
            })

            // Start the typing process from the current word
            let wordIndex = currentWordCount

            const typeNextWord = () => {
              if (wordIndex < words.length) {
                setCurrentlyTyping((prev) => ({
                  ...prev,
                  text: words.slice(0, wordIndex + 1).join(' '),
                }))

                wordIndex++
                if (wordIndex < words.length) {
                  const nextDelay = 150 + Math.random() * 100
                  typewriterTimeoutRef.current = setTimeout(
                    typeNextWord,
                    nextDelay
                  )
                } else {
                  // Line completed
                  setTimeout(() => {
                    // Add completed line to permanent display
                    setGeneratedLines((prev) => {
                      const newGenerated = [
                        ...prev,
                        currentlyTyping.originalText,
                      ]
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
            typewriterTimeoutRef.current = setTimeout(
              typeNextWord,
              initialDelay
            )
          }
        }
      }
    } else if (!audioPlaying) {
      // Audio paused - pause typing but don't reset state
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current)
        typewriterTimeoutRef.current = null
      }
    }

    return () => {
      // Cleanup
    }
  }, [
    audioPlaying,
    isGenerating,
    generatedLines.length,
    currentlyTyping,
    pendingLines.length,
  ])

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

      // Increment the counter when we actually start typing
      totalLinesStartedRef.current += 1

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
      if (audioStopTimeoutRef.current) {
        clearTimeout(audioStopTimeoutRef.current)
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
