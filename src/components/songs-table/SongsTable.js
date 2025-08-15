import React, { useState, useMemo } from 'react'
import { Play, Pause, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import TrackItem from '../track-item/TrackItem'
import useIsMobile from '../../hooks/use-is-mobile'
import { useAudioPlayer } from '../../contexts/audio-player-context/audio-player-context'
import './SongsTable.css'

const SongsTable = ({ audioUrlsWithMetadata }) => {
  const isMobile = useIsMobile()
  const {
    playlist,
    currentIndex,
    isPlaying,
    playTrack,
    setPlaylist,
    setIsPlaying,
  } = useAudioPlayer()
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null,
  })
  const [filterText, setFilterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Sort and filter the data
  const processedData = useMemo(() => {
    if (!audioUrlsWithMetadata || audioUrlsWithMetadata.length === 0) {
      return []
    }

    let filtered = audioUrlsWithMetadata.filter((item) => {
      if (!filterText) return true
      const searchText = filterText.toLowerCase()
      return (
        item.title?.toLowerCase().includes(searchText) ||
        item.postTitle?.toLowerCase().includes(searchText) ||
        item.postDate?.toLowerCase().includes(searchText)
      )
    })

    // Sort the data only if sortConfig.key and sortConfig.direction are set
    if (sortConfig.key && sortConfig.direction) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key]
        let bValue = b[sortConfig.key]

        // Handle date sorting
        if (sortConfig.key === 'postDate') {
          aValue = new Date(aValue || 0)
          bValue = new Date(bValue || 0)
        }

        // Handle duration sorting
        if (sortConfig.key === 'duration') {
          aValue = aValue || 0
          bValue = bValue || 0
        }

        // Handle string sorting
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }, [audioUrlsWithMetadata, sortConfig, filterText])

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = processedData.slice(startIndex, endIndex)

  const handleSort = (key) => {
    setSortConfig((prev) => {
      // If clicking on a different column, start with ascending
      if (prev.key !== key) {
        return { key, direction: 'asc' }
      }

      // If clicking on the same column, toggle between ascending and descending
      return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
    })
    setCurrentPage(1) // Reset to first page when sorting
  }

  const handleFilterChange = (e) => {
    setFilterText(e.target.value)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handlePlayTrack = (item, index) => {
    // Convert the item to the format expected by the audio player
    const track = {
      url: item.url || item.storagePath,
      title: item.title,
      artist: item.postTitle,
      album: item.postDate,
      duration: item.duration,
    }

    // Check if this specific track is currently playing
    const isCurrentTrack =
      currentIndex !== null &&
      playlist.length > 0 &&
      playlist[currentIndex]?.url === track.url

    if (isCurrentTrack && isPlaying) {
      // If it's the current track and playing, pause it
      setIsPlaying(false)
    } else {
      // Just play the track - let the audio player handle the playlist
      playTrack(index, [track])
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const SortableHeader = ({ columnKey, children, className = '' }) => (
    <th
      className={`sortable-header ${className}`}
      onClick={() => handleSort(columnKey)}
    >
      {children}
      <span className="sort-indicator">
        {sortConfig.key === columnKey ? (
          sortConfig.direction === 'asc' ? (
            <ChevronUp size={16} data-testid="chevron-up-icon" />
          ) : (
            <ChevronDown size={16} data-testid="chevron-down-icon" />
          )
        ) : (
          <Minus size={16} data-testid="minus-icon" />
        )}
      </span>
    </th>
  )

  if (isMobile) {
    // Mobile view - use a simplified list
    return (
      <div className="songs-table-mobile">
        <div className="mobile-filters">
          <input
            type="text"
            placeholder="Search songs..."
            value={filterText}
            onChange={handleFilterChange}
            className="mobile-search-input"
          />
        </div>
        <div className="mobile-songs-list">
          {currentData.length > 0 ? (
            currentData.map((item, index) => (
              <TrackItem
                key={`${item.storagePath || item.url}-${index}`}
                track={{
                  title: item.title,
                  artist: item.postTitle,
                  album: item.postDate,
                  duration: formatDuration(item.duration),
                  downloadUrl: item.url || item.storagePath,
                  downloadFilename: `${item.title}.wav`,
                }}
                index={startIndex + index}
                isCurrentTrack={false}
                isPlayingCurrent={false}
                onTrackClick={() => {}} // Will be handled by parent
                showDownloadButton={false}
                isMobile={true}
              />
            ))
          ) : (
            <div className="no-songs-message">No songs found</div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="mobile-pagination">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="page-info">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="songs-table-container">
      {/* Filters and Search */}
      <div className="table-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search songs, titles, or dates..."
            value={filterText}
            onChange={handleFilterChange}
            className="search-input"
          />
        </div>
        <div className="results-info">
          Showing {startIndex + 1}-{Math.min(endIndex, processedData.length)} of{' '}
          {processedData.length} songs
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="songs-table">
          <thead>
            <tr>
              <th className="play-header">Play</th>
              <SortableHeader columnKey="title">Title</SortableHeader>
              <SortableHeader columnKey="postTitle">Post Title</SortableHeader>
              <SortableHeader columnKey="postDate">Date</SortableHeader>
              <SortableHeader columnKey="duration" className="duration-header">
                Duration
              </SortableHeader>
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((item, index) => {
                const isCurrentTrack =
                  currentIndex !== null &&
                  playlist.length > 0 &&
                  playlist[currentIndex]?.url === (item.url || item.storagePath)

                return (
                  <tr
                    key={`${item.storagePath || item.url}-${index}`}
                    className="song-row"
                    onClick={() => handlePlayTrack(item, index)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="play-cell">
                      <div className="play-button-container">
                        <button
                          className="play-button"
                          onClick={(e) => {
                            e.stopPropagation() // Prevent row click from triggering
                            handlePlayTrack(item, index)
                          }}
                          title={
                            isCurrentTrack && isPlaying
                              ? 'Pause track'
                              : 'Play track'
                          }
                        >
                          {isCurrentTrack && isPlaying ? (
                            <Pause size={16} data-testid="play-icon" />
                          ) : (
                            <Play size={16} data-testid="play-icon" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="title-cell">{item.title}</td>
                    <td className="post-title-cell">{item.postTitle}</td>
                    <td className="date-cell">{item.postDate}</td>
                    <td className="duration-cell">
                      {formatDuration(item.duration)}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="5" className="no-songs-cell">
                  No songs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>

          <div className="page-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Last
          </button>
        </div>
      )}
    </div>
  )
}

export default SongsTable
