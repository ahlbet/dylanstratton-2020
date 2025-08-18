/**
 * Plausible Analytics utility functions for audio tracking
 *
 * Tracking Strategy:
 * - songPlay: Triggered when any track starts playing (from context playTrack)
 * - songPause: Triggered when tracks are paused
 * - trackNavigate: Triggered when using next/previous buttons
 * - audioDownload: Triggered when individual files are downloaded
 * - audioZipDownload: Triggered when ZIP files are downloaded
 *
 * Note: We avoid duplicate tracking by not having separate "track selection" events
 * since songPlay already captures when users select and play tracks.
 */

// Define types for track objects
interface Track {
  title?: string
  artist?: string
  album?: string
}

// Define types for tracking properties
interface TrackProperties {
  track_title: string
  track_artist: string
  track_album: string
  post_name: string
  track_index: number
  total_tracks: number
}

// Extend window interface for Plausible
declare global {
  interface Window {
    plausible: (eventName: string, options?: { props: Record<string, any> }) => void
  }
}

// Check if Plausible is available
const isPlausibleAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.plausible
}

// Base function to track events with Plausible
const trackEvent = (eventName: string, properties: Record<string, any> = {}): void => {
  if (!isPlausibleAvailable()) return

  window.plausible(eventName, {
    props: properties,
  })
}

// Audio event tracking functions
export const trackAudioEvent = {
  // Track song play events
  songPlay: (
    track: Track | null | undefined,
    postName: string | null | undefined,
    trackIndex: number | null | undefined,
    totalTracks: number | null | undefined,
    playerType: string = 'unknown'
  ): void => {
    trackEvent('song-play', {
      track_title: track?.title || 'Unknown Track',
      track_artist: track?.artist || 'Unknown Artist',
      track_album: track?.album || 'Unknown Album',
      post_name: postName || 'Unknown Post',
      track_index: trackIndex || 1,
      total_tracks: totalTracks || 1,
      player_type: playerType,
    })
  },

  // Track song pause events
  songPause: (
    track: Track | null | undefined,
    postName: string | null | undefined,
    trackIndex: number | null | undefined,
    totalTracks: number | null | undefined,
    playerType: string = 'unknown'
  ): void => {
    trackEvent('song-pause', {
      track_title: track?.title || 'Unknown Track',
      track_artist: track?.artist || 'Unknown Artist',
      track_album: track?.album || 'Unknown Album',
      post_name: postName || 'Unknown Post',
      track_index: trackIndex || 1,
      total_tracks: totalTracks || 1,
      player_type: playerType,
    })
  },

  // Track track navigation (next/previous buttons)
  trackNavigate: (
    track: Track | null | undefined,
    postName: string | null | undefined,
    trackIndex: number | null | undefined,
    totalTracks: number | null | undefined,
    direction: string,
    playerType: string = 'unknown'
  ): void => {
    trackEvent('track-navigate', {
      direction: direction, // 'next' or 'previous'
      track_title: track?.title || 'Unknown Track',
      track_artist: track?.artist || 'Unknown Artist',
      track_album: track?.album || 'Unknown Album',
      post_name: postName || 'Unknown Post',
      track_index: trackIndex || 1,
      total_tracks: totalTracks || 1,
      player_type: playerType,
    })
  },

  // Track individual audio file downloads
  audioDownload: (filename: string, postName: string | null | undefined): void => {
    trackEvent('audio-download', {
      filename: filename,
      post_name: postName || 'Unknown Post',
      file_extension: filename?.split('.').pop() || 'unknown',
      download_method: 'direct',
    })
  },

  // Track failed audio downloads
  audioDownloadFailed: (filename: string, postName: string | null | undefined, errorType: string = 'network_error'): void => {
    trackEvent('audio-download-failed', {
      filename: filename,
      post_name: postName || 'Unknown Post',
      error_type: errorType,
    })
  },

  // Track ZIP downloads
  audioZipDownload: (postName: string | null | undefined, numFiles: number | null | undefined, zipFilename: string | null | undefined): void => {
    trackEvent('audio-zip-download', {
      post_name: postName || 'Unknown Post',
      num_files: numFiles || 0,
      zip_filename: zipFilename || 'unknown.zip',
    })
  },

  // Track ZIP download failures
  audioZipDownloadFailed: (postName: string | null | undefined, errorType: string = 'network_error'): void => {
    trackEvent('audio-zip-download-failed', {
      post_name: postName || 'Unknown Post',
      error_type: errorType,
    })
  },
}

// Helper function to get track properties consistently
export const getTrackProperties = (
  track: Track | null | undefined,
  postName: string | null | undefined,
  trackIndex: number | null | undefined,
  totalTracks: number | null | undefined
): TrackProperties => {
  return {
    track_title: track?.title || 'Unknown Track',
    track_artist: track?.artist || 'Unknown Artist',
    track_album: track?.album || 'Unknown Album',
    post_name: postName || 'Unknown Post',
    track_index: trackIndex || 1,
    total_tracks: totalTracks || 1,
  }
}

// Helper function to get post name from track (fallback logic)
export const getPostName = (track: Track | null | undefined, fallbackPostName: string | null | undefined): string => {
  return track?.artist || fallbackPostName || 'Unknown Post'
}
