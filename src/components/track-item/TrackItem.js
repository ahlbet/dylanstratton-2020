import React from 'react'
import { Play, Pause } from 'lucide-react'
import './TrackItem.css'

const TrackItem = ({
  track,
  index,
  isCurrentTrack,
  isPlayingCurrent,
  onTrackClick,
  onTrackRef,
  showDownloadButton = false,
  onDownload,
  isMobile = false,
}) => {
  return (
    <div
      key={index}
      className={`track-item ${isCurrentTrack ? 'current-track' : ''}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onTrackClick(index)
      }}
      ref={(el) => onTrackRef && onTrackRef(index, el)}
    >
      {/* Play/Pause Button */}
      <div className="play-pause-button">
        {isPlayingCurrent ? <Pause size={16} /> : <Play size={16} />}
      </div>

      {/* Track Info */}
      <div className="track-info">
        <div className="track-title">{track.title}</div>
        <div className="track-meta">
          {track.artist} • {track.album}
        </div>
      </div>

      {/* Duration */}
      <div className="track-duration">{track.duration}</div>

      {/* Download Button */}
      {showDownloadButton && !isMobile && onDownload && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDownload(track.downloadUrl, track.downloadFilename)
          }}
          className="download-button"
          title="Download audio file"
        >
          ⬇
        </button>
      )}
    </div>
  )
}

export default TrackItem
