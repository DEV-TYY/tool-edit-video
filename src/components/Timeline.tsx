import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Repeat,
} from 'lucide-react';

interface TimelineProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  onResetTime: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
  isLooping,
  onToggleLoop,
  onResetTime,
}) => {
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
  };

  const step = (delta: number) => {
    const next = Math.max(0, Math.min(duration, currentTime + delta));
    onSeek(next);
  };

  return (
    <div className="timeline-container">
      {/* Scrubber slider track */}
      <div className="timeline-scrubber">
        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : 1}
          step={0.01}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="timeline-slider"
        />
        <div
          className="timeline-progress-fill"
          style={{
            width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Control bar */}
      <div className="timeline-controls">
        <div className="timeline-buttons-left">
          <button
            className="ctrl-btn"
            onClick={onResetTime}
            title="Rewind to start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            className="ctrl-btn"
            onClick={() => step(-0.1)}
            title="Step backward 1 frame"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            className="ctrl-btn-primary"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <button
            className="ctrl-btn"
            onClick={() => step(0.1)}
            title="Step forward 1 frame"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            className={`ctrl-btn ${isLooping ? 'active' : ''}`}
            onClick={onToggleLoop}
            title={isLooping ? 'Looping enabled' : 'Looping disabled'}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        <div className="timeline-time-display">
          <span className="current-time">{formatTime(currentTime)}</span>
          <span className="time-divider">/</span>
          <span className="duration-time">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
