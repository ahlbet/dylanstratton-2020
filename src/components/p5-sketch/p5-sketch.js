import React, { useEffect, useRef } from 'react'
import p5 from 'p5'

const P5Sketch = ({ sketch, className = '', style = {} }) => {
  const canvasRef = useRef(null)
  const p5InstanceRef = useRef(null)

  useEffect(() => {
    if (!sketch || !canvasRef.current) return

    // Clean up any existing p5 instance
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove()
    }

    // Create new p5 instance
    p5InstanceRef.current = new p5(sketch, canvasRef.current)

    // Cleanup function
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove()
        p5InstanceRef.current = null
      }
    }
  }, [sketch])

  return <div ref={canvasRef} className={className} style={style} />
}

export default P5Sketch
