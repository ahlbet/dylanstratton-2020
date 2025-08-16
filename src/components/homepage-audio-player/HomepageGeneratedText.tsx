import React from 'react'
import { Button } from '../ui/button'
import { FileText, CalendarIcon } from 'lucide-react'

interface MarkovText {
  id: string
  content: string
  coherencyLevel: string
}

interface HomepageGeneratedTextProps {
  processedTexts: MarkovText[]
}

export const HomepageGeneratedText: React.FC<HomepageGeneratedTextProps> = ({
  processedTexts,
}) => {
  return (
    <div className="my-8">
      <h3 className="text-sm text-gray-400 mb-4 uppercase tracking-wide">
        Generated Text
      </h3>
      <div className="space-y-4">
        {processedTexts.length === 0 ? (
          <p className="text-gray-400">No generated text available</p>
        ) : (
          processedTexts.map((text) => (
            <div key={text.id} className="text-gray-300 leading-relaxed">
              <p className="text-gray-300 leading-relaxed">{text.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
