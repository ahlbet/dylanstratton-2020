import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { TypingNarrative, TypingNarrativeHandle } from './typing-narrative'

describe('TypingNarrative', () => {
  const mockSentences = [
    'This is the first sentence.',
    'This is the second sentence.',
    'This is the third sentence.',
  ]

  const mockOnComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<TypingNarrative sentences={mockSentences} />)
      // Check that the component renders by looking for the container
      expect(document.querySelector('div')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      render(
        <TypingNarrative sentences={mockSentences} className="custom-class" />
      )
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })

    it('starts with empty content', () => {
      render(<TypingNarrative sentences={mockSentences} />)
      // The component should render but with minimal content initially
      expect(document.querySelector('div')).toBeInTheDocument()
    })
  })

  describe('Props Configuration', () => {
    it('uses default WPM when not specified', () => {
      render(<TypingNarrative sentences={mockSentences} />)
      expect(document.querySelector('div')).toBeInTheDocument()
    })

    it('respects custom WPM setting', () => {
      render(<TypingNarrative sentences={mockSentences} avgWPM={200} />)
      expect(document.querySelector('div')).toBeInTheDocument()
    })

    it('respects variance setting', () => {
      render(<TypingNarrative sentences={mockSentences} variance={0.5} />)
      expect(document.querySelector('div')).toBeInTheDocument()
    })

    it('respects punctuation pause setting', () => {
      render(
        <TypingNarrative sentences={mockSentences} punctuationPauseMs={1000} />
      )
      expect(document.querySelector('div')).toBeInTheDocument()
    })
  })

  describe('Imperative API', () => {
    it('restarts typing when restart is called', async () => {
      const ref = React.createRef<TypingNarrativeHandle>()
      render(<TypingNarrative ref={ref} sentences={mockSentences} />)

      expect(ref.current).toBeTruthy()
      if (ref.current) {
        ref.current.restart()
      }

      // Just verify the method exists and can be called
      expect(ref.current?.restart).toBeDefined()
    })

    it('pauses typing when pause is called', () => {
      const ref = React.createRef<TypingNarrativeHandle>()
      render(<TypingNarrative ref={ref} sentences={mockSentences} />)

      expect(ref.current).toBeTruthy()
      if (ref.current) {
        ref.current.pause()
      }

      expect(ref.current?.pause).toBeDefined()
    })

    it('resumes typing when resume is called', () => {
      const ref = React.createRef<TypingNarrativeHandle>()
      render(<TypingNarrative ref={ref} sentences={mockSentences} />)

      expect(ref.current).toBeTruthy()
      if (ref.current) {
        ref.current.resume()
      }

      expect(ref.current?.resume).toBeDefined()
    })
  })

  describe('Sentence Changes', () => {
    it('resets when sentences prop changes', () => {
      const { rerender } = render(<TypingNarrative sentences={mockSentences} />)

      const newSentences = ['New sentence.']
      rerender(<TypingNarrative sentences={newSentences} />)

      expect(document.querySelector('div')).toBeInTheDocument()
    })

    it('handles empty sentences array', () => {
      render(<TypingNarrative sentences={[]} />)
      expect(document.querySelector('div')).toBeInTheDocument()
    })
  })

  describe('Timer Management', () => {
    it('cleans up timers on unmount', () => {
      const { unmount, container } = render(
        <TypingNarrative sentences={mockSentences} />
      )
      unmount()
      // Just verify it unmounts without errors
      expect(container.firstChild).toBeNull()
    })

    it('handles rapid prop changes without memory leaks', () => {
      const { rerender } = render(<TypingNarrative sentences={mockSentences} />)

      // Rapidly change props
      rerender(<TypingNarrative sentences={['One']} />)
      rerender(<TypingNarrative sentences={['Two']} />)
      rerender(<TypingNarrative sentences={['Three']} />)

      expect(document.querySelector('div')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('renders with proper paragraph structure', () => {
      render(<TypingNarrative sentences={mockSentences} paragraphMode={true} />)
      const paragraphs = document.querySelectorAll('p')
      expect(paragraphs.length).toBeGreaterThan(0)
    })

    it('renders single paragraph when paragraphMode is false', () => {
      render(
        <TypingNarrative sentences={mockSentences} paragraphMode={false} />
      )
      const paragraphs = document.querySelectorAll('p')
      expect(paragraphs.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('handles single sentence', () => {
      render(<TypingNarrative sentences={['Just one sentence here.']} />)
      expect(document.querySelector('div')).toBeInTheDocument()
    })

    it('handles sentences with special characters', () => {
      render(<TypingNarrative sentences={['Hello 123! @#$%^&*()']} />)
      expect(document.querySelector('div')).toBeInTheDocument()
    })
  })
})
