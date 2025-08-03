import React from 'react'
import { UserPreferencesProvider } from './src/components/calendar/user-preferences-context'

export const wrapRootElement = ({ element }) => {
  return <UserPreferencesProvider>{element}</UserPreferencesProvider>
}

export const onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents([
    <script
      key="plausible-analytics"
      defer
      data-domain="dylanstratton.com"
      src="https://plausible.io/js/script.file-downloads.outbound-links.pageview-props.tagged-events.js"
    />,
    // 1) p5 core
    React.createElement('script', {
      key: 'p5',
      src: 'https://cdn.jsdelivr.net/npm/p5@1.4.2/lib/p5.min.js',
    }),
    // 2) p5.sound addon
    React.createElement('script', {
      key: 'p5-sound',
      src: 'https://cdn.jsdelivr.net/npm/p5@1.4.2/lib/addons/p5.sound.min.js',
    }),
  ])
}
