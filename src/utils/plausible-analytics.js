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

// Check if Plausible is available
const isPlausibleAvailable = () => {
  return typeof window !== 'undefined' && window.plausible
}

// Base function to track events with Plausible
const trackEvent = (eventName, properties = {}) => {
  if (!isPlausibleAvailable()) return

  window.plausible(eventName, {
    props: properties,
  })
}

// Audio event tracking functions
export const trackAudioEvent = {
  // Track song play events
  songPlay: (
    track,
    postName,
    trackIndex,
    totalTracks,
    playerType = 'unknown'
  ) => {
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
    track,
    postName,
    trackIndex,
    totalTracks,
    playerType = 'unknown'
  ) => {
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
    track,
    postName,
    trackIndex,
    totalTracks,
    direction,
    playerType = 'unknown'
  ) => {
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
  audioDownload: (filename, postName) => {
    trackEvent('audio-download', {
      filename: filename,
      post_name: postName || 'Unknown Post',
      file_extension: filename?.split('.').pop() || 'unknown',
      download_method: 'direct',
    })
  },

  // Track failed audio downloads
  audioDownloadFailed: (filename, postName, errorType = 'network_error') => {
    trackEvent('audio-download-failed', {
      filename: filename,
      post_name: postName || 'Unknown Post',
      error_type: errorType,
    })
  },

  // Track ZIP downloads
  audioZipDownload: (postName, numFiles, zipFilename) => {
    trackEvent('audio-zip-download', {
      post_name: postName || 'Unknown Post',
      num_files: numFiles || 0,
      zip_filename: zipFilename || 'unknown.zip',
    })
  },

  // Track ZIP download failures
  audioZipDownloadFailed: (postName, errorType = 'network_error') => {
    trackEvent('audio-zip-download-failed', {
      post_name: postName || 'Unknown Post',
      error_type: errorType,
    })
  },
}

// Helper function to get track properties consistently
export const getTrackProperties = (
  track,
  postName,
  trackIndex,
  totalTracks
) => {
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
export const getPostName = (track, fallbackPostName) => {
  return track?.artist || fallbackPostName || 'Unknown Post'
}
