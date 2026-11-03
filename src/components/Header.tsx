import React from 'react';
import { Video, Sparkles, Download, RefreshCw, Smartphone, Monitor, Square } from 'lucide-react';
import type { CanvasDimensions } from '../types';

interface HeaderProps {
  dimensions: CanvasDimensions;
  onDimensionChange: (dims: CanvasDimensions) => void;
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
  onExportClick: () => void;
  onReset: () => void;
  hasMedia: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  dimensions,
  onDimensionChange,
  onLoadDemo,
  isLoadingDemo,
  onExportClick,
  onReset,
  hasMedia,
}) => {
  const setPreset = (aspect: '16:9' | '9:16' | '1:1') => {
    if (aspect === '16:9') {
      onDimensionChange({ width: 1280, height: 720, aspectRatio: '16:9' });
    } else if (aspect === '9:16') {
      onDimensionChange({ width: 720, height: 1280, aspectRatio: '9:16' });
    } else if (aspect === '1:1') {
      onDimensionChange({ width: 720, height: 720, aspectRatio: '1:1' });
    }
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon">
          <Video className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="brand-title">
            Chroma<span>Studio</span>
          </h1>
          <p className="brand-subtitle">Green Screen & Overlay Video Editor</p>
        </div>
      </div>

      <div className="header-presets">
        <span className="preset-label">Aspect:</span>
        <button
          className={`preset-btn ${dimensions.aspectRatio === '16:9' ? 'active' : ''}`}
          onClick={() => setPreset('16:9')}
          title="16:9 Landscape (YouTube, TV)"
        >
          <Monitor className="w-4 h-4" />
          <span>16:9</span>
        </button>
        <button
          className={`preset-btn ${dimensions.aspectRatio === '9:16' ? 'active' : ''}`}
          onClick={() => setPreset('9:16')}
          title="9:16 Portrait (Shorts, TikTok, Reels)"
        >
          <Smartphone className="w-4 h-4" />
          <span>9:16</span>
        </button>
        <button
          className={`preset-btn ${dimensions.aspectRatio === '1:1' ? 'active' : ''}`}
          onClick={() => setPreset('1:1')}
          title="1:1 Square (Instagram)"
        >
          <Square className="w-4 h-4" />
          <span>1:1</span>
        </button>
        <span className="res-badge">
          {dimensions.width}×{dimensions.height}
        </span>
      </div>

      <div className="header-actions">
        <button
          className="btn-demo"
          onClick={onLoadDemo}
          disabled={isLoadingDemo}
          title="Load sample background and green screen character"
        >
          <Sparkles className={`w-4 h-4 text-amber-300 ${isLoadingDemo ? 'animate-spin' : ''}`} />
          <span>{isLoadingDemo ? 'Generating...' : 'Try Demo Sample'}</span>
        </button>

        {hasMedia && (
          <button className="btn-secondary" onClick={onReset} title="Clear all media">
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        )}

        <button
          className="btn-primary"
          onClick={onExportClick}
          disabled={!hasMedia || isLoadingDemo}
          title="Export composite video"
        >
          <Download className="w-4 h-4" />
          <span>Export Video</span>
        </button>
      </div>
    </header>
  );
};
