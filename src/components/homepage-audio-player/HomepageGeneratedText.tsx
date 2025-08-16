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
    <div className="mb-8">
      <h3 className="text-sm text-gray-400 mb-4 uppercase tracking-wide">
        Generated Text
      </h3>
      <div className="space-y-4">
        {processedTexts.length === 0 ? (
          <p className="text-gray-400">No generated text available</p>
        ) : (
          processedTexts.map((text) => (
            <div key={text.id} className="bg-gray-900 p-4 rounded-lg">
              <p className="text-gray-300 leading-relaxed">
                {text.text_content}
              </p>
              <div className="flex items-center space-x-2 mt-3">
                <Button variant="ghost" size="sm" className="p-1 text-red-400">
                  <FileText className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1 text-gray-400">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
