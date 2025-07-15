import React, { useState, useEffect } from 'react'
import CustomAudioPlayer from './custom-audio-player'
import MobileAudioPlayer from './mobile-audio-player'

const ResponsiveAudioPlayer = ({ src, title, className = '' }) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 750)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  if (isMobile) {
    return <MobileAudioPlayer src={src} title={title} className={className} />
  }

  return <CustomAudioPlayer src={src} title={title} className={className} />
}

export default ResponsiveAudioPlayer
