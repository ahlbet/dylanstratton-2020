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

  // Register service worker for audio caching
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration)
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })
    })
  }
}
