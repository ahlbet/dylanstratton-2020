# SongsTable Component

A comprehensive table component for displaying songs with advanced sorting, filtering, and pagination capabilities.

## Features

- **Full-width table layout** with responsive design
- **Sortable columns** for all data fields (Title, Post Title, Date, Duration)
- **Real-time search/filtering** across all text fields
- **Pagination** with configurable items per page (default: 20)
- **Mobile-responsive** with optimized mobile view using TrackItem components
- **Modern dark theme** consistent with the site design

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `audioUrlsWithMetadata` | Array | Yes | Array of song objects with metadata |

## Song Object Structure

Each song object should contain:

```javascript
{
  title: string,           // Song title
  postTitle: string,       // Blog post title
  postDate: string,        // Date string (e.g., "January 1, 2024")
  duration: number,        // Duration in seconds (can be null)
  storagePath: string,     // Storage path for audio file
  url: string | null       // Direct URL (if available)
}
```

## Sorting

- **Click any column header** to sort by that column
- **Click again** to reverse sort order
- **Visual indicators** show current sort direction (↑ ↓ ↕)
- **Default sort** is by post date (newest first)

## Filtering

- **Real-time search** as you type
- **Searches across** title, post title, and date fields
- **Case-insensitive** matching
- **Resets pagination** when filtering

## Pagination

- **20 items per page** by default
- **Smart page numbers** showing relevant range
- **Navigation buttons** (First, Previous, Next, Last)
- **Results counter** showing current range and total

## Mobile View

On mobile devices, the component automatically switches to:
- **Simplified list layout** using TrackItem components
- **Vertical stacking** for better mobile UX
- **Touch-friendly** pagination controls
- **Full-width search** input

## Usage Example

```javascript
import SongsTable from '../components/songs-table/SongsTable'

const AllSongsPage = ({ audioData }) => {
  return (
    <div>
      <h1>All Songs</h1>
      <SongsTable audioUrlsWithMetadata={audioData} />
    </div>
  )
}
```

## Styling

The component uses CSS classes for styling:
- `.songs-table-container` - Main container
- `.songs-table` - Table element
- `.sortable-header` - Sortable column headers
- `.song-row` - Individual song rows
- `.pagination` - Pagination controls

## Dependencies

- `TrackItem` component (for mobile view)
- `useIsMobile` hook (for responsive behavior)
- CSS file: `SongsTable.css`

## Accessibility

- **Keyboard navigation** support for sorting
- **Screen reader** friendly with proper ARIA labels
- **High contrast** design for better visibility
- **Focus indicators** for interactive elements
