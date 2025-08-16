# TrackItem Component

A reusable React component for displaying individual audio tracks in a playlist or audio player interface.

## Features

- Play/pause button with visual feedback
- Track information display (title, artist, album)
- Duration display
- Optional download button
- Current track highlighting
- Mobile-responsive design
- Customizable styling

## Props

| Prop                 | Type     | Default  | Description                                                  |
| -------------------- | -------- | -------- | ------------------------------------------------------------ |
| `track`              | Object   | Required | Track object containing title, artist, album, duration, etc. |
| `index`              | Number   | Required | Index of the track in the playlist                           |
| `isCurrentTrack`     | Boolean  | false    | Whether this track is currently selected                     |
| `isPlayingCurrent`   | Boolean  | false    | Whether the current track is currently playing               |
| `onTrackClick`       | Function | Required | Callback when track is clicked                               |
| `onTrackRef`         | Function | Optional | Callback for setting track element refs                      |
| `showDownloadButton` | Boolean  | false    | Whether to show the download button                          |
| `onDownload`         | Function | Optional | Callback when download button is clicked                     |
| `isMobile`           | Boolean  | false    | Whether the component is on mobile                           |

## Track Object Structure

The `track` prop should have the following structure:

```javascript
{
  title: "Track Title",
  artist: "Artist Name",
  album: "Album Name",
  duration: "3:45",
  downloadUrl: "https://example.com/track.wav",
  downloadFilename: "track.wav"
}
```

## Usage Examples

### Basic Usage

```javascript
import TrackItem from './components/track-item/TrackItem'
;<TrackItem
  track={track}
  index={0}
  isCurrentTrack={false}
  isPlayingCurrent={false}
  onTrackClick={(index) => console.log('Track clicked:', index)}
/>
```

### With Download Button

```javascript
<TrackItem
  track={track}
  index={0}
  isCurrentTrack={true}
  isPlayingCurrent={true}
  onTrackClick={handleTrackClick}
  showDownloadButton={true}
  onDownload={(url, filename) => downloadFile(url, filename)}
/>
```

### With Track References

```javascript
<TrackItem
  track={track}
  index={0}
  isCurrentTrack={false}
  isPlayingCurrent={false}
  onTrackClick={handleTrackClick}
  onTrackRef={(index, element) => setTrackRef(index, element)}
/>
```

## Styling

The component uses CSS classes for styling instead of inline styles. The CSS file (`TrackItem.css`) handles all the visual styling including:

- `.track-item` - Main container with flexbox layout, borders, and transitions
- `.track-item.current-track` - Current track styling with accent color and border
- `.track-item:hover` - Hover state with subtle background change
- `.track-item .play-pause-button` - Play/pause button container with proper spacing
- `.track-item .track-info` - Track information container with flexbox layout
- `.track-item .track-title` - Track title text with proper typography and overflow handling
- `.track-item .track-meta` - Artist and album text with secondary styling
- `.track-item .track-duration` - Duration text with right alignment
- `.track-item .download-button` - Download button with hover effects and transitions

The component automatically applies the appropriate CSS classes based on its state (e.g., `current-track` when `isCurrentTrack` is true).

## Dependencies

- React
- lucide-react (for Play/Pause icons)

## Used In

- BlogAudioPlayer component
- AllSongsPlaylist component
