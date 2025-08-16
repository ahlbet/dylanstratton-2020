import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { HomepageAudioControls } from './HomepageAudioControls'

// Mock the Button component from UI
jest.mock('../ui/button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    size,
    className,
    disabled,
    'aria-label': ariaLabel,
  }: any) => {
    // Create unique test IDs based on aria-label to distinguish between buttons
    const testId =
      ariaLabel === 'Previous track'
        ? 'button-previous'
        : ariaLabel === 'Next track'
          ? 'button-next'
          : 'button-play-pause'

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={className}
        aria-label={ariaLabel}
        data-testid={testId}
      >
        {children}
      </button>
    )
  },
}))

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Pause: ({ className }: any) => (
    <div data-testid="pause-icon" className={className}>
      Pause
    </div>
  ),
  Play: ({ className }: any) => (
    <div data-testid="play-icon" className={className}>
      Play
    </div>
  ),
  SkipBack: ({ className }: any) => (
    <div data-testid="skip-back-icon" className={className}>
      SkipBack
    </div>
  ),
  SkipForward: ({ className }: any) => (
    <div data-testid="skip-forward-icon" className={className}>
      SkipForward
    </div>
  ),
  Volume2: ({ className }: any) => (
    <div data-testid="volume2-icon" className={className}>
      Volume2
    </div>
  ),
  VolumeX: ({ className }: any) => (
    <div data-testid="volume-x-icon" className={className}>
      VolumeX
    </div>
  ),
}))

// Mock the audio utils
jest.mock('../../utils/audio-utils', () => ({
  formatDuration: (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  },
}))

describe('HomepageAudioControls', () => {
  const defaultProps = {
    isPlaying: false,
    isLoading: false,
    currentTime: 30,
    duration: 120,
    volume: 0.5,
    isMuted: false,
    onPlayPause: jest.fn(),
    onNextTrack: jest.fn(),
    onPreviousTrack: jest.fn(),
    onVolumeChange: jest.fn(),
    onTimeChange: jest.fn(),
    onMuteToggle: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<HomepageAudioControls {...defaultProps} />)
      expect(screen.getByTestId('button-play-pause')).toBeInTheDocument()
      expect(screen.getByTestId('button-previous')).toBeInTheDocument()
      expect(screen.getByTestId('button-next')).toBeInTheDocument()
    })

    it('displays all control buttons', () => {
      render(<HomepageAudioControls {...defaultProps} />)

      expect(screen.getByTestId('skip-back-icon')).toBeInTheDocument()
      expect(screen.getByTestId('play-icon')).toBeInTheDocument()
      expect(screen.getByTestId('skip-forward-icon')).toBeInTheDocument()
    })

    it('shows play icon when not playing', () => {
      render(<HomepageAudioControls {...defaultProps} />)
      expect(screen.getByTestId('play-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('pause-icon')).not.toBeInTheDocument()
    })

    it('shows pause icon when playing', () => {
      render(<HomepageAudioControls {...defaultProps} isPlaying={true} />)
      expect(screen.getByTestId('pause-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('play-icon')).not.toBeInTheDocument()
    })

    it('shows loading spinner when loading', () => {
      render(<HomepageAudioControls {...defaultProps} isLoading={true} />)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Play/Pause Controls', () => {
    it('calls onPlayPause when play/pause button is clicked', () => {
      const onPlayPause = jest.fn()
      render(
        <HomepageAudioControls {...defaultProps} onPlayPause={onPlayPause} />
      )

      const playButton = screen.getByTestId('button-play-pause')
      fireEvent.click(playButton)

      expect(onPlayPause).toHaveBeenCalledTimes(1)
    })

    it('disables play/pause button when loading', () => {
      render(<HomepageAudioControls {...defaultProps} isLoading={true} />)

      const playButton = screen.getByTestId('button-play-pause')
      expect(playButton).toBeDisabled()
    })

    it('calls onNextTrack when next button is clicked', () => {
      const onNextTrack = jest.fn()
      render(
        <HomepageAudioControls {...defaultProps} onNextTrack={onNextTrack} />
      )

      const nextButton = screen.getByTestId('button-next')
      fireEvent.click(nextButton)

      expect(onNextTrack).toHaveBeenCalledTimes(1)
    })

    it('calls onPreviousTrack when previous button is clicked', () => {
      const onPreviousTrack = jest.fn()
      render(
        <HomepageAudioControls
          {...defaultProps}
          onPreviousTrack={onPreviousTrack}
        />
      )

      const prevButton = screen.getByTestId('button-previous')
      fireEvent.click(prevButton)

      expect(onPreviousTrack).toHaveBeenCalledTimes(1)
    })
  })

  describe('Progress Bar', () => {
    it('displays current time and duration', () => {
      render(
        <HomepageAudioControls
          {...defaultProps}
          currentTime={45}
          duration={180}
        />
      )

      expect(screen.getByText('0:45')).toBeInTheDocument()
      expect(screen.getByText('3:00')).toBeInTheDocument()
    })

    it('calculates progress bar width correctly', () => {
      render(
        <HomepageAudioControls
          {...defaultProps}
          currentTime={60}
          duration={120}
        />
      )

      const progressBarFill = screen.getByTestId('progress-bar-fill')
      expect(progressBarFill).toHaveStyle({ width: '50%' })
    })

    it('calls onTimeChange when progress bar is clicked', () => {
      const onTimeChange = jest.fn()
      render(
        <HomepageAudioControls {...defaultProps} onTimeChange={onTimeChange} />
      )

      const progressBar = screen.getByRole('progressbar')
      fireEvent.click(progressBar)

      expect(onTimeChange).toHaveBeenCalled()
    })

    it('handles zero duration gracefully', () => {
      render(<HomepageAudioControls {...defaultProps} duration={0} />)

      expect(screen.getByText('0:00')).toBeInTheDocument()
      expect(screen.getByText('0:00')).toBeInTheDocument()
    })
  })

  describe('Volume Control', () => {
    it('displays volume icon', () => {
      render(<HomepageAudioControls {...defaultProps} />)
      expect(screen.getByTestId('volume2-icon')).toBeInTheDocument()
    })

    it('shows Volume2 icon when not muted', () => {
      render(<HomepageAudioControls {...defaultProps} isMuted={false} />)
      expect(screen.getByTestId('volume2-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('volume-x-icon')).not.toBeInTheDocument()
    })

    it('shows VolumeX icon when muted', () => {
      render(<HomepageAudioControls {...defaultProps} isMuted={true} />)
      expect(screen.getByTestId('volume-x-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('volume2-icon')).not.toBeInTheDocument()
    })

    it('calls onMuteToggle when volume icon is clicked', () => {
      const onMuteToggle = jest.fn()
      render(
        <HomepageAudioControls {...defaultProps} onMuteToggle={onMuteToggle} />
      )

      const volumeButton = screen.getByRole('button', { name: /mute/i })
      fireEvent.click(volumeButton)

      expect(onMuteToggle).toHaveBeenCalledTimes(1)
    })

    it('has correct aria-label for mute/unmute', () => {
      const { rerender } = render(
        <HomepageAudioControls {...defaultProps} isMuted={false} />
      )

      expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument()

      rerender(<HomepageAudioControls {...defaultProps} isMuted={true} />)
      expect(
        screen.getByRole('button', { name: /unmute/i })
      ).toBeInTheDocument()
    })

    it('displays volume slider with correct value', () => {
      render(<HomepageAudioControls {...defaultProps} volume={0.75} />)

      const volumeSlider = screen.getByRole('slider')
      expect(volumeSlider).toHaveValue('0.75')
    })

    it('calls onVolumeChange when volume slider is adjusted', () => {
      const onVolumeChange = jest.fn()
      render(
        <HomepageAudioControls
          {...defaultProps}
          onVolumeChange={onVolumeChange}
        />
      )

      const volumeSlider = screen.getByRole('slider')
      fireEvent.change(volumeSlider, { target: { value: '0.8' } })

      expect(onVolumeChange).toHaveBeenCalledWith(0.8)
    })

    it('has correct volume slider attributes', () => {
      render(<HomepageAudioControls {...defaultProps} />)

      const volumeSlider = screen.getByRole('slider')
      expect(volumeSlider).toHaveAttribute('min', '0')
      expect(volumeSlider).toHaveAttribute('max', '1')
      expect(volumeSlider).toHaveAttribute('step', '0.01')
    })

    it('shows volume level background correctly', () => {
      render(<HomepageAudioControls {...defaultProps} volume={0.6} />)

      const volumeBackground = screen.getByTestId('volume-background')
      expect(volumeBackground).toHaveStyle({ width: '60%' })
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-labels for all buttons', () => {
      render(<HomepageAudioControls {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: /previous track/i })
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /next track/i })
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument()
    })

    it('has proper aria-label for play/pause button based on state', () => {
      const { rerender } = render(
        <HomepageAudioControls {...defaultProps} isPlaying={false} />
      )
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()

      rerender(<HomepageAudioControls {...defaultProps} isPlaying={true} />)
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    })

    it('has proper role for volume slider', () => {
      render(<HomepageAudioControls {...defaultProps} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles very small volume values', () => {
      render(<HomepageAudioControls {...defaultProps} volume={0.001} />)

      const volumeSlider = screen.getByRole('slider')
      expect(volumeSlider).toHaveValue('0.001')
    })

    it('handles maximum volume value', () => {
      render(<HomepageAudioControls {...defaultProps} volume={1} />)

      const volumeSlider = screen.getByRole('slider')
      expect(volumeSlider).toHaveValue('1')
    })

    it('handles zero volume', () => {
      render(<HomepageAudioControls {...defaultProps} volume={0} />)

      const volumeSlider = screen.getByRole('slider')
      expect(volumeSlider).toHaveValue('0')
    })

    it('handles negative current time gracefully', () => {
      render(<HomepageAudioControls {...defaultProps} currentTime={-10} />)
      expect(screen.getByText('-1:-10')).toBeInTheDocument()
    })

    it('handles very large duration values', () => {
      render(<HomepageAudioControls {...defaultProps} duration={9999} />)
      expect(screen.getByText('166:39')).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('applies correct CSS classes for volume control', () => {
      render(<HomepageAudioControls {...defaultProps} />)

      const volumeContainer = screen.getByTestId('volume-control-container')
      expect(volumeContainer).toHaveClass(
        'flex',
        'items-center',
        'space-x-2',
        'mt-4'
      )
    })

    it('applies correct CSS classes for volume slider', () => {
      render(<HomepageAudioControls {...defaultProps} />)

      const volumeSlider = screen.getByRole('slider')
      expect(volumeSlider).toHaveClass(
        'absolute',
        'inset-0',
        'w-full',
        'h-1',
        'appearance-none',
        'cursor-pointer',
        'bg-transparent'
      )
    })

    it('applies correct CSS classes for progress bar', () => {
      render(<HomepageAudioControls {...defaultProps} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass(
        'w-full',
        'bg-gray-800',
        'rounded-full',
        'h-1',
        'cursor-pointer'
      )
    })
  })
})
