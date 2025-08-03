// custom typefaces
import 'typeface-montserrat'
import 'typeface-merriweather'

import 'prismjs/themes/prism.css'

import React from 'react'
import { UserPreferencesProvider } from './src/components/calendar/user-preferences-context'

export const wrapRootElement = ({ element }) => {
  return <UserPreferencesProvider>{element}</UserPreferencesProvider>
}

// Initialize Plausible for custom event tracking
export const onClientEntry = () => {
  // Initialize plausible function for custom events
  window.plausible =
    window.plausible ||
    function () {
      ;(window.plausible.q = window.plausible.q || []).push(arguments)
    }

  // Initialize global FFT instance for audio-reactive components
  window.initializeGlobalFFT = () => {
    if (window.__globalFFTInstance) {
      return window.__globalFFTInstance
    }

    if (typeof window === 'undefined' || !window.p5) {
      return null
    }

    try {
      const P5 = window.p5

      // Create a global FFT instance that can be shared across components
      const globalFFT = new P5.FFT(0.9, 2048)

      // Store it globally
      window.__globalFFTInstance = globalFFT

      return globalFFT
    } catch (error) {
      console.error('Failed to create global FFT instance:', error)
      return null
    }
  }

  // Clear global FFT on hot reload to prevent stale references
  if (module.hot) {
    module.hot.accept(() => {
      window.__globalFFTInstance = null
    })
  }

  // Initialize FFT when p5 is available
  if (window.p5) {
    window.initializeGlobalFFT()
  } else {
    // Wait for p5 to load
    const checkP5 = () => {
      if (window.p5) {
        window.initializeGlobalFFT()
      } else {
        setTimeout(checkP5, 100)
      }
    }
    checkP5()
  }
}
