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
  ])
}
