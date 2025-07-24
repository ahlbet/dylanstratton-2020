import React, { useState, useEffect, useRef, useCallback } from 'react'
import MarkovGeneratorAPIClient from '../../utils/markov-generator-api-client'
import './DynamicMarkovText.css'

const DynamicMarkovText = ({ className = '' }) => {
  const [generatedLines, setGeneratedLines] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [currentlyTyping, setCurrentlyTyping] = useState(null) // Single typing line
  const [pendingLines, setPendingLines] = useState([]) // Queue of lines to type
  const generatorRef = useRef(null)
  const intervalRef = useRef(null)
  const audioCheckIntervalRef = useRef(null)
  const typewriterTimeoutRef = useRef(null)
  const currentTypingInstanceRef = useRef(null) // Track active typing instance
  const prevShouldShowContentRef = useRef(false) // Track content visibility changes
  const isCurrentlyTypingRef = useRef(false) // Track if actively typing to prevent race conditions
  const totalLinesStartedRef = useRef(0) // Track total lines started (immediate updates)

  // Initialize the markov generator API client
  useEffect(() => {
    const initializeGenerator = async () => {
      try {
        const generator = new MarkovGeneratorAPIClient()
        const isAvailable = await generator.isAvailable()

        if (isAvailable) {
          generatorRef.current = generator
          console.log('✅ Markov generator API client initialized')
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
    const audioElements = document.querySelectorAll('audio')
    let isAnyAudioPlaying = false

    for (let audio of audioElements) {
      if (!audio.paused && !audio.ended && audio.readyState >= 2) {
        isAnyAudioPlaying = true
        break
      }
    }

    // Only log when audio state actually changes
    if (audioPlaying !== isAnyAudioPlaying) {
      // Audio state changed - no logging needed
    }

    setAudioPlaying(isAnyAudioPlaying)
  }, [])

  // Start/stop generation based on audio playback
  useEffect(() => {
    if (audioPlaying && generatorRef.current && !intervalRef.current) {
      setIsGenerating(true)

      // Test immediate generation - only if no content is currently being processed and under limit
      if (
        !currentlyTyping &&
        pendingLines.length === 0 &&
        totalLinesStartedRef.current < 20
      ) {
        // Async immediate generation
        const generateImmediateLine = async () => {
          try {
            const testLine = await generatorRef.current.generateText(600, 2)
            if (testLine && testLine.length > 20) {
              // Check if this exact text is already being typed or in the queue
              const isDuplicate =
                currentlyTyping?.originalText === testLine ||
                pendingLines.some((line) => line.text === testLine) ||
                generatedLines.includes(testLine)

              if (!isDuplicate) {
                addTypewriterLine(testLine)
              }
            }
          } catch (error) {
            console.error('❌ Immediate test failed:', error)
          }
        }

        generateImmediateLine()
      }

      // Generate text every 1-2 seconds while audio is playing
      const intervalTime = 1000 + Math.random() * 1000

      intervalRef.current = setInterval(async () => {
        // Don't generate new text if we've hit the limit
        if (totalLinesStartedRef.current >= 20) {
          return
        }

        if (generatorRef.current) {
          try {
            const newLine = await generatorRef.current.generateText(600, 2)

            if (newLine && newLine.length > 20) {
              // Check if this exact text is already being typed or in the queue
              const isDuplicate =
                currentlyTyping?.originalText === newLine ||
                pendingLines.some((line) => line.text === newLine) ||
                generatedLines.includes(newLine)

              if (!isDuplicate) {
                addTypewriterLine(newLine)
              }
            } else {
              console.warn('⚠️ Generated text too short or empty:', newLine)
            }
          } catch (error) {
            console.error('❌ Error during text generation:', error)
          }
        } else {
          console.error('❌ No generator available for text generation')
        }
      }, intervalTime)
    } else if (!audioPlaying) {
      // Audio stopped - clean up
      if (isGenerating) {
        setIsGenerating(false)
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [audioPlaying, currentlyTyping, pendingLines, generatedLines])

  // Set up audio monitoring
  useEffect(() => {
    // Check immediately
    checkAudioPlayback()

    // Then check every 500ms
    audioCheckIntervalRef.current = setInterval(checkAudioPlayback, 500)

    // Also listen for audio events on the document
    const handleAudioPlay = () => {
      // Use the same delayed check for consistency
      setTimeout(() => {
        const audioElements = document.querySelectorAll('audio')
        let isAnyAudioPlaying = false

        for (let audio of audioElements) {
          if (!audio.paused && !audio.ended && audio.readyState >= 2) {
            isAnyAudioPlaying = true
            break
          }
        }
        setAudioPlaying(isAnyAudioPlaying)
      }, 50) // Shorter delay for play events
    }

    const handleAudioPause = () => {
      // Delay check to see if any other audio is playing
      setTimeout(checkAudioPlayback, 100)
    }

    document.addEventListener('play', handleAudioPlay, true)
    document.addEventListener('pause', handleAudioPause, true)
    document.addEventListener('ended', handleAudioPause, true)

    return () => {
      if (audioCheckIntervalRef.current) {
        clearInterval(audioCheckIntervalRef.current)
      }
      document.removeEventListener('play', handleAudioPlay, true)
      document.removeEventListener('pause', handleAudioPause, true)
      document.removeEventListener('ended', handleAudioPause, true)
    }
  }, [checkAudioPlayback])

  // Start typing a line (moved before useEffect to avoid circular dependency)
  const startTypingLine = useCallback((text) => {
    const uniqueId = Math.random().toString(36).substring(7)

    // Check if already typing this exact text to prevent duplicates
    if (currentlyTyping && currentlyTyping.originalText === text) {
      return
    }

    // Don't start new typing if something is actively typing (use ref for immediate check)
    if (isCurrentlyTypingRef.current) {
      // Add to queue instead of interrupting
      setPendingLines((prev) => {
        const newQueue = [...prev, { text, isComplete: false }]
        return newQueue
      })
      return
    }

    // Clear any existing timeout to prevent conflicts
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current)
      typewriterTimeoutRef.current = null
    }

    // Clear any existing typing state to prevent race conditions
    if (currentlyTyping) {
      setCurrentlyTyping(null)
    }

    const words = text.split(' ')

    // Set both state and ref for reliable tracking
    const typingState = {
      text: '',
      isComplete: false,
      originalText: text,
      wordCount: words.length,
      uniqueId: uniqueId, // Track which instance is typing
    }

    // Set the ref immediately to prevent race conditions
    isCurrentlyTypingRef.current = true

    // Use a small delay to ensure state is cleared before setting new state
    setTimeout(() => {
      setCurrentlyTyping(typingState)
      currentTypingInstanceRef.current = uniqueId // Track in ref for reliable access

      let wordIndex = 0
      const typeNextWord = () => {
        // Check if this instance should still be running using ref (more reliable than closure)
        if (currentTypingInstanceRef.current !== uniqueId) {
          return
        }

        // Also check if typing was cleared entirely
        if (!currentTypingInstanceRef.current) {
          return
        }

        if (wordIndex < words.length) {
          const currentWords = words.slice(0, wordIndex + 1)
          const newText = currentWords.join(' ')

          setCurrentlyTyping((prev) => {
            // If prev is null, it means the state was cleared, so we need to restore it
            if (!prev) {
              return {
                text: newText,
                isComplete: wordIndex === words.length - 1,
                originalText: text,
                wordCount: words.length,
                uniqueId: uniqueId,
                currentWordIndex: wordIndex,
              }
            }

            // Double-check we're still the active instance
            if (prev.uniqueId && prev.uniqueId !== uniqueId) {
              return prev
            }
            const updated = {
              ...prev,
              text: newText,
              isComplete: wordIndex === words.length - 1,
              currentWordIndex: wordIndex,
            }
            return updated
          })

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
                  currentTypingInstanceRef.current = null // Clear ref too
                  setCurrentlyTyping(null)
                  isCurrentlyTypingRef.current = false // Clear the typing ref
                  return currentPending
                }
              })
            }, 100)
          }
        }
      }

      const initialDelay = 200
      typewriterTimeoutRef.current = setTimeout(typeNextWord, initialDelay)
    }, 50) // Small delay to ensure state is cleared
  }, []) // Keep empty to prevent recreation during renders

  // Process pending lines queue (now handled directly in completion logic)
  useEffect(() => {
    // Only process queue if nothing is typing AND we haven't handled it in completion
    if (!currentlyTyping && pendingLines.length > 0) {
      const nextLine = pendingLines[0]
      setPendingLines((prev) => prev.slice(1)) // Remove first item
      startTypingLine(nextLine.text)
    }
  }, [currentlyTyping, pendingLines, startTypingLine])

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

  // Additional cleanup effect for rapid audio state changes
  useEffect(() => {
    if (!audioPlaying && currentlyTyping) {
      // If audio stops while typing, let the current typing complete
      // Don't clear the typing state immediately - let it finish naturally
    }
  }, [audioPlaying, currentlyTyping])

  // Clear generated text when audio stops for a while
  useEffect(() => {
    if (!audioPlaying) {
      const clearTimer = setTimeout(() => {
        if (!audioPlaying) {
          // Double check after delay

          // Clear any active timeouts first
          if (typewriterTimeoutRef.current) {
            clearTimeout(typewriterTimeoutRef.current)
            typewriterTimeoutRef.current = null
          }

          // Clear all state
          setGeneratedLines([])
          setPendingLines([])
          totalLinesStartedRef.current = 0 // Reset the counter

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
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
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
    const currentShouldShowContent =
      generatedLines.length > 0 || !!currentlyTyping

    if (prevShouldShowContentRef.current !== currentShouldShowContent) {
      prevShouldShowContentRef.current = currentShouldShowContent
    }
  }, [generatedLines.length, !!currentlyTyping])

  if (!generatorRef.current) {
    return null
  }

  const shouldShowContent = generatedLines.length > 0 || !!currentlyTyping

  return (
    <div className={`dynamic-markov-text ${className}`}>
      {shouldShowContent ? (
        <div className="generated-content">
          {generatedLines.map((line, index) => (
            <blockquote key={`complete-${index}`} className="generated-line">
              {line}
            </blockquote>
          ))}
          {currentlyTyping && (
            <blockquote
              key={`typing-${currentlyTyping.uniqueId}`}
              className="generated-line typing"
            >
              {currentlyTyping.text}
              {!currentlyTyping.isComplete && (
                <span className="typing-cursor">|</span>
              )}
            </blockquote>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default DynamicMarkovText
