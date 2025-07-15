import React, { useEffect, useRef, useState, useCallback } from 'react'
import ResponsiveAudioPlayer from '../custom-audio-player/responsive-audio-player'

const AudioPlayerRenderer = ({ htmlContent }) => {
  const [audioPlayers, setAudioPlayers] = useState([])
  const [processedContent, setProcessedContent] = useState('')

  // Extract audio URLs from HTML content
  const extractAudioUrls = useCallback((html) => {
    const audioRegex =
      /<code class="language-text">audio:\s*(https?:\/\/[^<]+)<\/code>/g
    const audioUrls = []
    let match

    while ((match = audioRegex.exec(html)) !== null) {
      audioUrls.push(match[1].trim())
    }

    return audioUrls
  }, [])

  useEffect(() => {
    if (!htmlContent) {
      setProcessedContent('')
      setAudioPlayers([])
      return
    }

    // Extract audio URLs from the HTML content
    const audioUrls = extractAudioUrls(htmlContent)
    setAudioPlayers(audioUrls)

    // Process the HTML content to remove audio references
    let processedHtml = htmlContent
    const audioRegex =
      /<code class="language-text">audio:\s*(https?:\/\/[^<]+)<\/code>/g
    processedHtml = processedHtml.replace(audioRegex, '')

    setProcessedContent(processedHtml)
  }, [htmlContent, extractAudioUrls])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setAudioPlayers([])
    }
  }, [])

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: processedContent }} />
      {audioPlayers.map((src, index) => (
        <ResponsiveAudioPlayer key={`${src}-${index}`} src={src} />
      ))}
    </div>
  )
}

export default AudioPlayerRenderer
