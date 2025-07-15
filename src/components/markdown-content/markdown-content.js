import React from 'react'
import AudioPlayer from '../audio-player/audio-player'

const MarkdownContent = ({ content }) => {
  // Parse the content to find audio references
  const parseContent = (htmlContent) => {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent

    // Find all audio code blocks and replace them with our custom component
    const audioBlocks = tempDiv.querySelectorAll('pre code.language-audio')

    audioBlocks.forEach((block) => {
      const audioUrl = block.textContent.trim()
      const audioPlayer = document.createElement('div')
      audioPlayer.className = 'custom-audio-player'
      audioPlayer.setAttribute('data-audio-url', audioUrl)
      block.parentElement.parentElement.replaceChild(
        audioPlayer,
        block.parentElement
      )
    })

    return tempDiv.innerHTML
  }

  const [parsedContent, setParsedContent] = React.useState('')

  React.useEffect(() => {
    if (content) {
      setParsedContent(parseContent(content))
    }
  }, [content])

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: parsedContent }} />
      {/* Render custom audio players */}
      {parsedContent && (
        <div>
          {Array.from(document.querySelectorAll('.custom-audio-player')).map(
            (el, index) => {
              const audioUrl = el.getAttribute('data-audio-url')
              return (
                <AudioPlayer
                  key={`audio-${index}`}
                  src={audioUrl}
                  className="markdown-audio-player"
                />
              )
            }
          )}
        </div>
      )}
    </div>
  )
}

export default MarkdownContent
