import React, { useEffect, useRef, useState } from 'react'
import { applyMobileFix } from '../../utils/p5-mobile-fix'

// Types
interface P5SketchProps {
  sketch: (p: any) => void
  className?: string
  style?: React.CSSProperties
}

interface P5Instance {
  remove: () => void
}

declare global {
  interface Window {
    p5: any
  }
}

const P5Sketch: React.FC<P5SketchProps> = ({ sketch, className = '', style = {} }) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<P5Instance | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !sketch || !canvasRef.current) return

    // Check if p5 is available globally (loaded via CDN)
    if (typeof window === 'undefined' || !window.p5) {
      console.warn('p5 not available, waiting...')
      return
    }

    const p5 = window.p5

    // Clean up any existing p5 instance
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove()
    }

    // Create new p5 instance
    p5InstanceRef.current = new p5(sketch, canvasRef.current)

    // Apply mobile fix to prevent excessive windowResized calls
    applyMobileFix(p5InstanceRef.current)

    // Cleanup function
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove()
        p5InstanceRef.current = null
      }
    }
  }, [sketch, isClient])

  if (!isClient) {
    return (
      <div
        className={className}
        style={{
          ...style,
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
        }}
      ></div>
    )
  }

  return <div ref={canvasRef} className={className} style={style} />
}

export default P5Sketch
