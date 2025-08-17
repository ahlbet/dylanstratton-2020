# Hooks

This directory contains custom React hooks used throughout the application.

## useIsMobile

A hook to detect if the user is on a mobile device. This hook replaces inline mobile detection logic and provides a centralized, reusable way to determine if the user is on a mobile device.

### Usage

```javascript
import useIsMobile from '../hooks/use-is-mobile'

function MyComponent() {
  const isMobile = useIsMobile()

  return <div>{isMobile ? 'Mobile View' : 'Desktop View'}</div>
}
```

### Features

- **User Agent Detection**: Detects iPhone, iPad, iPod, and Android devices
- **Responsive Updates**: Listens for orientation changes and window resize events
- **SSR Safe**: Handles server-side rendering gracefully
- **Performance Optimized**: Only sets up event listeners when needed
- **Automatic Cleanup**: Properly removes event listeners on unmount

### Implementation Details

The hook uses a regex pattern to match common mobile user agent strings and sets up event listeners for:

- `orientationchange` - Useful for tablets that can rotate
- `resize` - Handles responsive design changes

### Return Value

- `boolean` - `true` if the user is on a mobile device, `false` otherwise

## usePresignedUrl

A hook for generating and caching presigned URLs for audio files.

## useScrollToTrack

A hook for managing scroll behavior in audio playlists.

---

For more details on each hook, see their individual files and test files.
