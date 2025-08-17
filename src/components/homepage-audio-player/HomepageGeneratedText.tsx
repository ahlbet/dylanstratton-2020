import React, { useEffect, useState } from 'react'
import TypingNarrative from '../typing-narrative/typing-narrative'
import MarkovGeneratorAPIClient from '../../utils/markov-generator-api-client'

interface MarkovText {
  id: string
  content: string
  coherencyLevel: string
}

interface HomepageGeneratedTextProps {
  processedTexts: MarkovText[]
  currentBlogPostDate: string
}

export const HomepageGeneratedText: React.FC<HomepageGeneratedTextProps> = ({
  processedTexts,
  currentBlogPostDate,
}) => {
  const [texts, setTexts] = useState<string[]>([])
  // Initialize the markov generator API client
  useEffect(() => {
    const fetchTextsFromGenerator = async () => {
      try {
        const generator = new MarkovGeneratorAPIClient()
        const isAvailable = await generator.isAvailable()

        if (isAvailable) {
          const texts = await generator.loadTextBatch(20)
          setTexts(texts as string[])
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

    fetchTextsFromGenerator()
  }, [currentBlogPostDate])

  return (
    <div className="my-8 px-6">
      <h3 className="text-sm text-gray-400 mb-4 uppercase tracking-wide">
        {currentBlogPostDate}
      </h3>
      <div className="space-y-4">
        {processedTexts.length === 0 ? (
          <p className="text-gray-400">No thoughts for this day</p>
        ) : (
          processedTexts.map((text) => (
            <div key={text.id} className="text-gray-300 leading-relaxed">
              <p className="text-gray-300 leading-relaxed">{text.content}</p>
            </div>
          ))
        )}
        <TypingNarrative sentences={texts} />
      </div>
    </div>
  )
}
