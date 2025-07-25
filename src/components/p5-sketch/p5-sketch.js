import React, { useEffect, useRef, useState } from 'react'
import { applyMobileFix } from '../../utils/p5-mobile-fix'

const P5Sketch = ({ sketch, className = '', style = {} }) => {
  const canvasRef = useRef(null)
  const p5InstanceRef = useRef(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !sketch || !canvasRef.current) return

    // Dynamically import p5 only on client side
    import('p5')
      .then((p5Module) => {
        const p5 = p5Module.default

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
      })
      .catch((error) => {
        console.error('Failed to load p5.js:', error)
      })
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
