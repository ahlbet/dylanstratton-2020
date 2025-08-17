import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'

/**
 * TypingNarrative
 *
 * A lightweight React component that "types" an array of sentences,
 * adding one word at a time with realistic, human-like pacing.
 *
 * Reset behavior:
 *  - If the `sentences` prop changes (new blog post), the component clears
 *    all previously typed text and starts fresh from the new sentences.
 *
 * Usage:
 *  <TypingNarrative sentences={myTwentySentences} />
 *
 * Optional controls via props and imperative API are documented below.
 */
export type TypingNarrativeHandle = {
  /** Immediately clears and restarts typing from the beginning. */
  restart: () => void
  /** Pause/resume typing without resetting progress. */
  pause: () => void
  resume: () => void
}

export type TypingNarrativeProps = {
  /** Array of sentences to type. Typically length 20. */
  sentences: string[]
  /** Average words-per-minute (WPM). Default ~170 (natural reading pace). */
  avgWPM?: number
  /** Random variance applied to each word delay (0.0–1.0). Default 0.35. */
  variance?: number
  /** Extra pause after words that end with punctuation (ms). Default 260. */
  punctuationPauseMs?: number
  /** Optional className for the wrapper. */
  className?: string
  /** Render each sentence inside its own <p>. Default true. */
  paragraphMode?: boolean
  /** Called when all words have been typed. */
  onComplete?: () => void
}

function usePrevious<T>(val: T) {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => {
    ref.current = val
  }, [val])
  return ref.current
}

const PUNCTUATION_RE = /[\.,;:!?]$/

// Compute a human-ish delay for a given word.
function computeDelayMs(
  word: string,
  wpm: number,
  variance: number,
  punctuationPauseMs: number
) {
  const baseMsPerWord = 60000 / Math.max(60, Math.min(400, wpm)) // clamp sane WPM range
  const lengthFactor =
    0.85 + Math.min(0.6, word.replace(/[^A-Za-z0-9]/g, '').length * 0.03) // longer words take longer
  const jitter =
    1 + (Math.random() * 2 - 1) * Math.min(0.95, Math.max(0, variance)) // +/- variance
  const punctPause = PUNCTUATION_RE.test(word) ? punctuationPauseMs : 0
  return Math.round(baseMsPerWord * lengthFactor * jitter + punctPause)
}

export const TypingNarrative = forwardRef<
  TypingNarrativeHandle,
  TypingNarrativeProps
>(function TypingNarrative(
  {
    sentences,
    avgWPM = 170,
    variance = 0.35,
    punctuationPauseMs = 260,
    className,
    paragraphMode = true,
    onComplete,
  },
  ref
) {
  // Flatten sentences into a list of words while remembering sentence boundaries.
  const wordStream = useMemo(() => {
    const words: { w: string; sIdx: number }[] = []
    sentences.forEach((s, sIdx) => {
      // Split on whitespace but keep punctuation as part of the word
      const parts = s.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean)
      for (const p of parts) words.push({ w: p, sIdx })
    })
    return words
  }, [sentences])

  const [typedWordsPerSentence, setTypedWordsPerSentence] = useState<
    string[][]
  >(() => sentences.map(() => []))
  const [cursor, setCursor] = useState(0) // index into wordStream
  const [isPaused, setPaused] = useState(false)

  const timerRef = useRef<number | null>(null)

  const prevSentences = usePrevious(sentences)

  // Reset when sentences prop changes (e.g., switching blog posts)
  useEffect(() => {
    const changed = prevSentences !== undefined && prevSentences !== sentences
    if (changed) {
      clearTimer()
      setTypedWordsPerSentence(sentences.map(() => []))
      setCursor(0)
      setPaused(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences])

  // Imperative API
  useImperativeHandle(
    ref,
    () => ({
      restart() {
        clearTimer()
        setTypedWordsPerSentence(sentences.map(() => []))
        setCursor(0)
        setPaused(false)
      },
      pause() {
        setPaused(true)
        clearTimer()
      },
      resume() {
        if (!isPaused) return
        setPaused(false)
      },
    }),
    [sentences, isPaused]
  )

  function clearTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // Core typing loop
  useEffect(() => {
    if (isPaused) return
    if (cursor >= wordStream.length) {
      clearTimer()
      onComplete?.()
      return
    }

    const { w, sIdx } = wordStream[cursor]
    const delay = computeDelayMs(w, avgWPM, variance, punctuationPauseMs)

    timerRef.current = window.setTimeout(() => {
      setTypedWordsPerSentence((prev) => {
        const next = prev.map((arr) => [...arr])
        // Ensure we have the right number of sentence buckets
        while (next.length < sentences.length) next.push([])
        if (!next[sIdx]) next[sIdx] = []
        next[sIdx] = [...next[sIdx], w]
        return next
      })
      setCursor((c) => c + 1)
    }, delay)

    return clearTimer
  }, [
    cursor,
    isPaused,
    wordStream,
    avgWPM,
    variance,
    punctuationPauseMs,
    onComplete,
    sentences.length,
  ])

  // Render
  if (paragraphMode) {
    return (
      <div className={className}>
        {sentences.map((_, i) => (
          <p key={i} className="text-gray-300 leading-relaxed">
            {typedWordsPerSentence[i]?.join(' ')}
          </p>
        ))}
      </div>
    )
  }

  // Single paragraph mode (all sentences in one block)
  const flatText = typedWordsPerSentence.map((w) => w.join(' ')).join(' ')
  return (
    <div className={className}>
      <p className="text-gray-300 leading-relaxed">{flatText}</p>
    </div>
  )
})

export default TypingNarrative

/*
  Notes:
  - The timing model uses WPM + word-length multipliers + random jitter + punctuation pauses.
  - To reset when navigating between Gatsby pages, just pass a new `sentences` array and
    the component will clear & restart automatically.
  - If you need to key off route changes instead, you can pass a different `key` prop
    to this component per page.

  Example:

  import TypingNarrative from "./TypingNarrative";

  export function BlogTyping({ sentences }: { sentences: string[] }) {
    return (
      <TypingNarrative
        sentences={sentences}
        avgWPM={165}
        variance={0.4}
        punctuationPauseMs={300}
        className="prose prose-invert max-w-none"
      />
    );
  }
*/
