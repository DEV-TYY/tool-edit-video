import React, { useState } from 'react';
import {
  Upload,
  Layers,
  Sparkles,
  Sliders,
  Volume2,
  VolumeX,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  RotateCcw,
  CheckCircle,
  Video,
  Image as ImageIcon,
  Palette,
  Type,
  Music,
  Trash2,
  Plus,
  MicOff,
  Bold,
  Italic,
  Link as LinkIcon,
  Clipboard,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import type {
  BackgroundSettings,
  OverlaySettings,
  LayerTransform,
  ChromaKeySettings,
  TextOverlay,
  CustomAudioSettings,
  VideoFilter,
} from '../types';

interface SidebarProps {
  bgSettings: BackgroundSettings;
  overlaySettings: OverlaySettings;
  textOverlays: TextOverlay[];
  selectedTextId: string | null;
  customAudio: CustomAudioSettings;
  onUpdateBgSettings: (settings: Partial<BackgroundSettings>) => void;
  onUpdateOverlaySettings: (settings: Partial<OverlaySettings>) => void;
  onUpdateOverlayTransform: (transform: Partial<LayerTransform>) => void;
  onUpdateChromaKey: (chroma: Partial<ChromaKeySettings>) => void;
  onUpdateBgFilter: (filter: Partial<VideoFilter>) => void;
  onUpdateOverlayFilter: (filter: Partial<VideoFilter>) => void;
  onAddText: () => void;
  onSelectText: (id: string | null) => void;
  onUpdateText: (id: string, updates: Partial<TextOverlay>) => void;
  onDeleteText: (id: string) => void;
  onUpdateCustomAudio: (audio: Partial<CustomAudioSettings>) => void;
  onUploadBgFile: (file: File) => void;
  onUploadOverlayFile: (file: File) => void;
  onUploadAudioFile: (file: File) => void;
  onLoadBgUrl: (
    url: string,
    typeHint?: 'video' | 'image'
  ) => Promise<{ success: boolean; error?: string }>;
  onClearBg: () => void;
  onLoadOverlayUrl: (
    url: string
  ) => Promise<{ success: boolean; error?: string }>;
  onClearOverlay: () => void;
}

type TabType = 'bg' | 'overlay' | 'chroma' | 'text' | 'sound';

export const Sidebar: React.FC<SidebarProps> = ({
  bgSettings,
  overlaySettings,
  textOverlays,
  selectedTextId,
  customAudio,
  onUpdateBgSettings,
  onUpdateOverlaySettings,
  onUpdateOverlayTransform,
  onUpdateChromaKey,
  onUpdateBgFilter,
  onUpdateOverlayFilter,
  onAddText,
  onSelectText,
  onUpdateText,
  onDeleteText,
  onUpdateCustomAudio,
  onUploadBgFile,
  onUploadOverlayFile,
  onUploadAudioFile,
  onLoadBgUrl,
  onClearBg,
  onLoadOverlayUrl,
  onClearOverlay,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('bg');
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [showUploadDropzone, setShowUploadDropzone] = useState(false);

  // Overlay Link state
  const [overlayUrlInput, setOverlayUrlInput] = useState('');
  const [isLoadingOverlayUrl, setIsLoadingOverlayUrl] = useState(false);
  const [overlayUrlError, setOverlayUrlError] = useState<string | null>(null);
  const [showOverlayUploadDropzone, setShowOverlayUploadDropzone] = useState(false);

  const samplePresets = [
    {
      name: '📌 Pinterest (pin.it/1s37yq8Ry)',
      type: 'video' as const,
      url: 'https://pin.it/1s37yq8Ry',
    },
    {
      name: '🌺 Flower (Video)',
      type: 'video' as const,
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    },
    {
      name: '🎬 Friday (Video)',
      type: 'video' as const,
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
    },
    {
      name: '🏖️ Beach (Image)',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1280&q=80',
    },
    {
      name: '🌆 Neon City (Image)',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1280&q=80',
    },
  ];

  const overlaySamplePresets = [
    {
      name: '📌 Pinterest Video (pin.it/1s37yq8Ry)',
      url: 'https://pin.it/1s37yq8Ry',
    },
    {
      name: '🎬 Friday (Sample)',
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
    },
    {
      name: '🌺 Flower (Sample)',
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    },
  ];

  const handleApplyUrl = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl !== undefined ? overrideUrl : urlInput).trim();
    if (!targetUrl) {
      setUrlError('Please enter an image or video URL.');
      return;
    }
    setUrlError(null);
    setIsLoadingUrl(true);
    try {
      const res = await onLoadBgUrl(
        targetUrl,
        bgSettings.type === 'color' ? undefined : bgSettings.type
      );
      if (!res.success) {
        setUrlError(res.error || 'Failed to load media from link.');
      } else {
        setUrlInput('');
      }
    } catch {
      setUrlError('Network error while loading media link.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleApplyOverlayUrl = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl !== undefined ? overrideUrl : overlayUrlInput).trim();
    if (!targetUrl) {
      setOverlayUrlError('Please enter a video URL.');
      return;
    }
    setOverlayUrlError(null);
    setIsLoadingOverlayUrl(true);
    try {
      const res = await onLoadOverlayUrl(targetUrl);
      if (!res.success) {
        setOverlayUrlError(res.error || 'Failed to load overlay video link.');
      } else {
        setOverlayUrlInput('');
      }
    } catch {
      setOverlayUrlError('Network error while loading video link.');
    } finally {
      setIsLoadingOverlayUrl(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const trimmed = text.trim();
        setUrlInput(trimmed);
        setUrlError(null);
        if (
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('data:')
        ) {
          handleApplyUrl(trimmed);
        }
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e);
      setUrlError(
        'Clipboard access unavailable. Please paste directly into the input.'
      );
    }
  };

  const handlePasteOverlayFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const trimmed = text.trim();
        setOverlayUrlInput(trimmed);
        setOverlayUrlError(null);
        if (
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('data:')
        ) {
          handleApplyOverlayUrl(trimmed);
        }
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e);
      setOverlayUrlError(
        'Clipboard access unavailable. Please paste directly into the input.'
      );
    }
  };

  const handleClearBgMedia = () => {
    setUrlInput('');
    setUrlError(null);
    onClearBg();
  };

  const handleClearOverlayMedia = () => {
    setOverlayUrlInput('');
    setOverlayUrlError(null);
    onClearOverlay();
  };

  const presetColors = [
    { name: 'Pure Green', hex: '#00ff00' },
    { name: 'Studio Green', hex: '#00b140' },
    { name: 'Blue Screen', hex: '#0028ff' },
    { name: 'Magenta Screen', hex: '#ff00ff' },
  ];

  const filterPresets = [
    { id: 'none', name: 'Original' },
    { id: 'vintage', name: 'Vintage' },
    { id: 'cyberpunk', name: 'Cyberpunk' },
    { id: 'warm', name: 'Warm Sun' },
    { id: 'cool', name: 'Cool Teal' },
    { id: 'bnw', name: 'B & W' },
    { id: 'sepia', name: 'Sepia' },
    { id: 'dramatic', name: 'Dramatic' },
    { id: 'invert', name: 'Invert' },
  ];

  const selectedText = textOverlays.find((t) => t.id === selectedTextId);

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadBgFile(e.target.files[0]);
    }
  };

  const handleOverlayFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadOverlayFile(e.target.files[0]);
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadAudioFile(e.target.files[0]);
    }
  };

  return (
    <aside className="editor-sidebar">
      {/* Navigation Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`tab-btn ${activeTab === 'bg' ? 'active' : ''}`}
          onClick={() => setActiveTab('bg')}
          title="Background Layer"
        >
          <Layers className="w-4 h-4" />
          <span>BG</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'overlay' ? 'active' : ''}`}
          onClick={() => setActiveTab('overlay')}
          title="Overlay Video"
        >
          <Sliders className="w-4 h-4" />
          <span>Overlay</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'chroma' ? 'active' : ''}`}
          onClick={() => setActiveTab('chroma')}
          title="Green Screen Removal"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Chroma</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
          title="Text Captions"
        >
          <Type className="w-4 h-4 text-amber-400" />
          <span>Text</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'sound' ? 'active' : ''}`}
          onClick={() => setActiveTab('sound')}
          title="Audio & Sound"
        >
          <Music className="w-4 h-4 text-sky-400" />
          <span>Audio</span>
        </button>
      </div>

      <div className="sidebar-content">
        {/* ================= BACKGROUND TAB ================= */}
        {activeTab === 'bg' && (
          <div className="panel-section">
            <h3 className="section-title">Background Source</h3>

            {/* Type selector */}
            <div className="segment-group">
              <button
                className={`segment-btn ${bgSettings.type === 'video' ? 'active' : ''}`}
                onClick={() => onUpdateBgSettings({ type: 'video' })}
              >
                <Video className="w-4 h-4" />
                <span>Video</span>
              </button>
              <button
                className={`segment-btn ${bgSettings.type === 'image' ? 'active' : ''}`}
                onClick={() => onUpdateBgSettings({ type: 'image' })}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Image</span>
              </button>
              <button
                className={`segment-btn ${bgSettings.type === 'color' ? 'active' : ''}`}
                onClick={() => onUpdateBgSettings({ type: 'color' })}
              >
                <Palette className="w-4 h-4" />
                <span>Color</span>
              </button>
            </div>

            {/* Link (URL) Input & Media Source */}
            {bgSettings.type !== 'color' && (
              <div className="bg-link-container">
                {/* Active media card if already loaded */}
                {bgSettings.url && (
                  <div className="active-bg-card">
                    <div className="active-bg-header">
                      <div className="active-bg-icon">
                        {bgSettings.type === 'video' ? (
                          <Video className="w-4 h-4 text-sky-400" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="active-bg-info">
                        <span className="active-bg-type">
                          {bgSettings.type === 'video'
                            ? 'Video Background'
                            : 'Image Background'}
                        </span>
                        <span
                          className="active-bg-url"
                          title={bgSettings.sourceUrl || bgSettings.url}
                        >
                          {bgSettings.sourceUrl ||
                            (bgSettings.file
                              ? bgSettings.file.name
                              : 'Online Link')}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-icon-danger"
                        onClick={handleClearBgMedia}
                        title="Remove background"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="active-bg-status">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Loaded & Active</span>
                    </div>
                  </div>
                )}

                {/* URL input field */}
                <div className="bg-link-label-row">
                  <label className="control-label">
                    <LinkIcon className="w-3.5 h-3.5 mr-1 text-sky-400" />
                    <span>
                      Copy & Paste {bgSettings.type === 'video' ? 'Video' : 'Image'} Link
                    </span>
                  </label>
                  <button
                    type="button"
                    className="btn-text-action"
                    onClick={handlePasteFromClipboard}
                    title="Paste copied link from clipboard"
                  >
                    <Clipboard className="w-3 h-3 mr-1" />
                    <span>Paste Link</span>
                  </button>
                </div>

                <div className="bg-link-input-group">
                  <input
                    type="url"
                    className="bg-link-input"
                    placeholder={
                      bgSettings.type === 'video'
                        ? 'Paste video link (.mp4, pin.it/..., https://...)'
                        : 'Paste image link (.jpg, .png, pin.it/..., unsplash...)'
                    }
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      if (urlError) setUrlError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-apply-link"
                    onClick={() => handleApplyUrl()}
                    disabled={isLoadingUrl || !urlInput.trim()}
                    title="Set background from link"
                  >
                    {isLoadingUrl ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Load</span>
                    )}
                  </button>
                </div>

                {urlError && (
                  <div className="bg-link-error">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1">{urlError}</span>
                    <button
                      type="button"
                      className="ml-auto text-slate-400 hover:text-white"
                      onClick={() => setUrlError(null)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Preset Sample Links */}
                <div className="sample-presets-section">
                  <span className="sample-presets-label">
                    Quick Sample Links:
                  </span>
                  <div className="sample-presets-grid">
                    {samplePresets.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        className="sample-preset-pill"
                        onClick={() => {
                          setUrlInput(preset.url);
                          handleApplyUrl(preset.url);
                        }}
                        title={preset.url}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional local file upload toggle */}
                <div className="upload-fallback-toggle">
                  <button
                    type="button"
                    className="btn-link-subtle"
                    onClick={() => setShowUploadDropzone(!showUploadDropzone)}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    <span>
                      {showUploadDropzone
                        ? 'Hide file upload'
                        : 'Or upload file from computer'}
                    </span>
                  </button>
                </div>

                {showUploadDropzone && (
                  <div className="upload-dropzone mt-1">
                    <label className="dropzone-label">
                      <Upload className="w-6 h-6 text-sky-400 mb-1" />
                      <span className="dropzone-main-text">
                        {bgSettings.file
                          ? bgSettings.file.name
                          : `Choose local background ${bgSettings.type}`}
                      </span>
                      <span className="dropzone-sub-text">
                        {bgSettings.type === 'video'
                          ? 'MP4, WebM, MOV supported'
                          : 'JPG, PNG, WebP supported'}
                      </span>
                      <input
                        type="file"
                        accept={
                          bgSettings.type === 'video' ? 'video/*' : 'image/*'
                        }
                        onChange={handleBgFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Solid Color Picker */}
            {bgSettings.type === 'color' && (
              <div className="control-group">
                <label className="control-label">Background Color</label>
                <div className="color-picker-row">
                  <input
                    type="color"
                    value={bgSettings.solidColor}
                    onChange={(e) =>
                      onUpdateBgSettings({ solidColor: e.target.value })
                    }
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={bgSettings.solidColor}
                    onChange={(e) =>
                      onUpdateBgSettings({ solidColor: e.target.value })
                    }
                    className="text-input"
                  />
                </div>
              </div>
            )}

            {/* Fit mode */}
            {bgSettings.type !== 'color' && (
              <div className="control-group mt-4">
                <label className="control-label">Fit Mode</label>
                <div className="button-group">
                  {(['cover', 'contain', 'fill'] as const).map((mode) => (
                    <button
                      key={mode}
                      className={`btn-toggle ${bgSettings.fit === mode ? 'active' : ''}`}
                      onClick={() => onUpdateBgSettings({ fit: mode })}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Background Flip & Rotate */}
            <div className="control-group mt-4">
              <label className="control-label">Background Flip & Rotate</label>
              <div className="flex gap-2 mt-1.5">
                <button
                  className={`btn-toggle flex-1 ${bgSettings.flipH ? 'active' : ''}`}
                  onClick={() => onUpdateBgSettings({ flipH: !bgSettings.flipH })}
                  title="Flip Background Horizontally"
                >
                  <FlipHorizontal className="w-4 h-4 mr-1" />
                  <span>Flip H</span>
                </button>
                <button
                  className={`btn-toggle flex-1 ${bgSettings.flipV ? 'active' : ''}`}
                  onClick={() => onUpdateBgSettings({ flipV: !bgSettings.flipV })}
                  title="Flip Background Vertically"
                >
                  <FlipVertical className="w-4 h-4 mr-1" />
                  <span>Flip V</span>
                </button>
                <button
                  className="btn-toggle flex-1"
                  onClick={() =>
                    onUpdateBgSettings({
                      rotation: (bgSettings.rotation + 90) % 360,
                    })
                  }
                  title="Rotate Background 90°"
                >
                  <RotateCw className="w-4 h-4 mr-1" />
                  <span>90°</span>
                </button>
              </div>
            </div>

            {/* Background Filters */}
            <div className="control-group mt-4">
              <label className="control-label flex items-center justify-between">
                <span>Color Filters</span>
                <span className="text-xs text-sky-400 capitalize">
                  {bgSettings.filter.preset}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {filterPresets.map((f) => (
                  <button
                    key={f.id}
                    className={`preset-pill ${
                      bgSettings.filter.preset === f.id ? 'active' : ''
                    }`}
                    onClick={() => onUpdateBgFilter({ preset: f.id })}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              {/* Sliders for fine tuning */}
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Brightness</span>
                  <span>{bgSettings.filter.brightness}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={200}
                  value={bgSettings.filter.brightness}
                  onChange={(e) =>
                    onUpdateBgFilter({ brightness: parseInt(e.target.value) })
                  }
                  className="range-slider"
                />

                <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                  <span>Contrast</span>
                  <span>{bgSettings.filter.contrast}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={200}
                  value={bgSettings.filter.contrast}
                  onChange={(e) =>
                    onUpdateBgFilter({ contrast: parseInt(e.target.value) })
                  }
                  className="range-slider"
                />

                <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                  <span>Saturation</span>
                  <span>{bgSettings.filter.saturation}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={250}
                  value={bgSettings.filter.saturation}
                  onChange={(e) =>
                    onUpdateBgFilter({ saturation: parseInt(e.target.value) })
                  }
                  className="range-slider"
                />
              </div>
            </div>

            {/* Background Audio Volume & Strip Original Audio */}
            {bgSettings.type === 'video' && (
              <div className="control-group mt-5 pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <label className="control-label">Background Audio</label>
                  <button
                    className={`strip-audio-pill ${
                      bgSettings.stripAudio ? 'active-strip' : ''
                    }`}
                    onClick={() =>
                      onUpdateBgSettings({ stripAudio: !bgSettings.stripAudio })
                    }
                    title="Remove original background video sound completely"
                  >
                    <MicOff className="w-3.5 h-3.5 mr-1" />
                    <span>
                      {bgSettings.stripAudio
                        ? 'Audio Stripped'
                        : 'Remove Original Audio'}
                    </span>
                  </button>
                </div>

                {!bgSettings.stripAudio && (
                  <div className="slider-row mt-1">
                    <button
                      className="mute-btn"
                      onClick={() =>
                        onUpdateBgSettings({ muted: !bgSettings.muted })
                      }
                    >
                      {bgSettings.muted || bgSettings.volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-sky-400" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={bgSettings.muted ? 0 : bgSettings.volume}
                      onChange={(e) =>
                        onUpdateBgSettings({
                          volume: parseFloat(e.target.value),
                          muted: false,
                        })
                      }
                      className="range-slider"
                    />
                    <span className="slider-val">
                      {bgSettings.muted
                        ? '0%'
                        : `${Math.round(bgSettings.volume * 100)}%`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= OVERLAY TAB ================= */}
        {activeTab === 'overlay' && (
          <div className="panel-section">
            <h3 className="section-title">Overlay Video (Layer)</h3>

            {/* Overlay Video Link & Media Source */}
            <div className="bg-link-container">
              {/* Active Overlay Card if loaded */}
              {overlaySettings.url && (
                <div className="active-bg-card">
                  <div className="active-bg-header">
                    <div className="active-bg-icon">
                      <Video className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="active-bg-info">
                      <span className="active-bg-type">Overlay Video Active</span>
                      <span
                        className="active-bg-url"
                        title={overlaySettings.sourceUrl || overlaySettings.url}
                      >
                        {overlaySettings.sourceUrl ||
                          (overlaySettings.file
                            ? overlaySettings.file.name
                            : 'Online Video Link')}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-icon-danger"
                      onClick={handleClearOverlayMedia}
                      title="Remove overlay video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="active-bg-status">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Overlay Video Loaded</span>
                  </div>
                </div>
              )}

              {/* URL input field */}
              <div className="bg-link-label-row">
                <label className="control-label">
                  <LinkIcon className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  <span>Copy & Paste Video Link (Pinterest / MP4)</span>
                </label>
                <button
                  type="button"
                  className="btn-text-action"
                  onClick={handlePasteOverlayFromClipboard}
                  title="Paste copied link from clipboard"
                >
                  <Clipboard className="w-3 h-3 mr-1" />
                  <span>Paste Link</span>
                </button>
              </div>

              <div className="bg-link-input-group">
                <input
                  type="url"
                  className="bg-link-input"
                  placeholder="Paste link (pin.it/..., pinterest.com/pin/..., .mp4...)"
                  value={overlayUrlInput}
                  onChange={(e) => {
                    setOverlayUrlInput(e.target.value);
                    if (overlayUrlError) setOverlayUrlError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyOverlayUrl();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-apply-link"
                  onClick={() => handleApplyOverlayUrl()}
                  disabled={isLoadingOverlayUrl || !overlayUrlInput.trim()}
                  title="Set overlay from link"
                >
                  {isLoadingOverlayUrl ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Load</span>
                  )}
                </button>
              </div>

              {overlayUrlError && (
                <div className="bg-link-error">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1">{overlayUrlError}</span>
                  <button
                    type="button"
                    className="ml-auto text-slate-400 hover:text-white"
                    onClick={() => setOverlayUrlError(null)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Direct Pinterest Support Feature Box */}
              <div className="pinterest-tip-box">
                <div className="pinterest-tip-header">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Direct Pinterest Links Supported:</span>
                </div>
                <p className="pinterest-tip-text">
                  You can copy and paste Pinterest links directly (e.g. <code>https://pin.it/...</code> or <code>pinterest.com/pin/...</code>). The tool will automatically extract the video stream and apply chroma key!
                </p>
                <div className="pinterest-actions-row">
                  <button
                    type="button"
                    className="btn-pinterest-tool"
                    onClick={() => {
                      setOverlayUrlInput('https://pin.it/1s37yq8Ry');
                      handleApplyOverlayUrl('https://pin.it/1s37yq8Ry');
                    }}
                    title="Load requested Pinterest video: https://pin.it/1s37yq8Ry"
                  >
                    <Sparkles className="w-3 h-3 mr-1 text-emerald-400" />
                    <span>Try Sample: pin.it/1s37yq8Ry</span>
                  </button>
                </div>
              </div>

              {/* Preset Sample Links */}
              <div className="sample-presets-section">
                <span className="sample-presets-label">
                  Quick Sample Video Links:
                </span>
                <div className="sample-presets-grid">
                  {overlaySamplePresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      className="sample-preset-pill"
                      onClick={() => {
                        setOverlayUrlInput(preset.url);
                        handleApplyOverlayUrl(preset.url);
                      }}
                      title={preset.url}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional local file upload toggle */}
              <div className="upload-fallback-toggle">
                <button
                  type="button"
                  className="btn-link-subtle"
                  onClick={() =>
                    setShowOverlayUploadDropzone(!showOverlayUploadDropzone)
                  }
                >
                  <Upload className="w-3 h-3 mr-1" />
                  <span>
                    {showOverlayUploadDropzone
                      ? 'Hide file upload'
                      : 'Or upload video file from computer'}
                  </span>
                </button>
              </div>

              {showOverlayUploadDropzone && (
                <div
                  className="upload-dropzone mt-1"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      onUploadOverlayFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <label className="dropzone-label">
                    <Upload className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="dropzone-main-text">
                      {overlaySettings.file
                        ? overlaySettings.file.name
                        : 'Drop video here or click to select'}
                    </span>
                    <span className="dropzone-sub-text">
                      MP4, WebM, MOV supported (drag & drop)
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleOverlayFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Layout Quick Presets */}
            <div className="control-group mt-4">
              <label className="control-label">Position Presets</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="preset-pill"
                  onClick={() =>
                    onUpdateOverlayTransform({ x: 50, y: 50, scale: 0.7 })
                  }
                >
                  Center
                </button>
                <button
                  className="preset-pill"
                  onClick={() =>
                    onUpdateOverlayTransform({ x: 80, y: 80, scale: 0.35 })
                  }
                >
                  Bottom-Right (PIP)
                </button>
                <button
                  className="preset-pill"
                  onClick={() =>
                    onUpdateOverlayTransform({ x: 20, y: 20, scale: 0.35 })
                  }
                >
                  Top-Left (PIP)
                </button>
                <button
                  className="preset-pill"
                  onClick={() =>
                    onUpdateOverlayTransform({ x: 50, y: 50, scale: 1.0 })
                  }
                >
                  Fullscreen Fit
                </button>
              </div>
            </div>

            {/* Position X Slider */}
            <div className="control-group mt-4">
              <div className="flex justify-between items-center mb-1">
                <label className="control-label">Position X</label>
                <span className="slider-val">{overlaySettings.transform.x}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={0.5}
                value={overlaySettings.transform.x}
                onChange={(e) =>
                  onUpdateOverlayTransform({ x: parseFloat(e.target.value) })
                }
                className="range-slider"
              />
            </div>

            {/* Position Y Slider */}
            <div className="control-group mt-3">
              <div className="flex justify-between items-center mb-1">
                <label className="control-label">Position Y</label>
                <span className="slider-val">{overlaySettings.transform.y}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={0.5}
                value={overlaySettings.transform.y}
                onChange={(e) =>
                  onUpdateOverlayTransform({ y: parseFloat(e.target.value) })
                }
                className="range-slider"
              />
            </div>

            {/* Scale Slider */}
            <div className="control-group mt-3">
              <div className="flex justify-between items-center mb-1">
                <label className="control-label">Scale / Size</label>
                <span className="slider-val">
                  {Math.round(overlaySettings.transform.scale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={2.5}
                step={0.05}
                value={overlaySettings.transform.scale}
                onChange={(e) =>
                  onUpdateOverlayTransform({ scale: parseFloat(e.target.value) })
                }
                className="range-slider"
              />
            </div>

            {/* Rotation Slider */}
            <div className="control-group mt-3">
              <div className="flex justify-between items-center mb-1">
                <label className="control-label">Rotation</label>
                <span className="slider-val">
                  {overlaySettings.transform.rotation}°
                </span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={overlaySettings.transform.rotation}
                onChange={(e) =>
                  onUpdateOverlayTransform({
                    rotation: parseInt(e.target.value, 10),
                  })
                }
                className="range-slider"
              />
            </div>

            {/* Flip Horizontal & Vertical */}
            <div className="control-group mt-4">
              <label className="control-label">Flip & Mirror</label>
              <div className="flex gap-2 mt-1">
                <button
                  className={`btn-toggle flex-1 ${
                    overlaySettings.transform.flipH ? 'active' : ''
                  }`}
                  onClick={() =>
                    onUpdateOverlayTransform({
                      flipH: !overlaySettings.transform.flipH,
                    })
                  }
                >
                  <FlipHorizontal className="w-4 h-4 mr-1.5" />
                  <span>Flip Horizontal</span>
                </button>
                <button
                  className={`btn-toggle flex-1 ${
                    overlaySettings.transform.flipV ? 'active' : ''
                  }`}
                  onClick={() =>
                    onUpdateOverlayTransform({
                      flipV: !overlaySettings.transform.flipV,
                    })
                  }
                >
                  <FlipVertical className="w-4 h-4 mr-1.5" />
                  <span>Flip Vertical</span>
                </button>
              </div>
            </div>

            {/* Overlay Filters */}
            <div className="control-group mt-4">
              <label className="control-label flex items-center justify-between">
                <span>Overlay Color Filter</span>
                <span className="text-xs text-emerald-400 capitalize">
                  {overlaySettings.filter.preset}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {filterPresets.map((f) => (
                  <button
                    key={f.id}
                    className={`preset-pill ${
                      overlaySettings.filter.preset === f.id ? 'active' : ''
                    }`}
                    onClick={() => onUpdateOverlayFilter({ preset: f.id })}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="control-group mt-4">
              <div className="flex justify-between items-center mb-1">
                <label className="control-label">Opacity</label>
                <span className="slider-val">
                  {Math.round(overlaySettings.transform.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={overlaySettings.transform.opacity}
                onChange={(e) =>
                  onUpdateOverlayTransform({
                    opacity: parseFloat(e.target.value),
                  })
                }
                className="range-slider"
              />
            </div>

            {/* Reset transform button */}
            <button
              className="btn-reset-transform mt-3"
              onClick={() =>
                onUpdateOverlayTransform({
                  x: 50,
                  y: 50,
                  scale: 0.65,
                  rotation: 0,
                  flipH: false,
                  flipV: false,
                  opacity: 1,
                })
              }
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              <span>Reset Overlay Position</span>
            </button>

            {/* Overlay Audio & Strip Original Audio */}
            <div className="control-group mt-5 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <label className="control-label">Overlay Audio</label>
                <button
                  className={`strip-audio-pill ${
                    overlaySettings.stripAudio ? 'active-strip' : ''
                  }`}
                  onClick={() =>
                    onUpdateOverlaySettings({
                      stripAudio: !overlaySettings.stripAudio,
                    })
                  }
                  title="Remove original audio from overlay video"
                >
                  <MicOff className="w-3.5 h-3.5 mr-1" />
                  <span>
                    {overlaySettings.stripAudio
                      ? 'Audio Stripped'
                      : 'Remove Original Audio'}
                  </span>
                </button>
              </div>

              {!overlaySettings.stripAudio && (
                <div className="slider-row mt-1">
                  <button
                    className="mute-btn"
                    onClick={() =>
                      onUpdateOverlaySettings({
                        muted: !overlaySettings.muted,
                      })
                    }
                  >
                    {overlaySettings.muted || overlaySettings.volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={overlaySettings.muted ? 0 : overlaySettings.volume}
                    onChange={(e) =>
                      onUpdateOverlaySettings({
                        volume: parseFloat(e.target.value),
                        muted: false,
                      })
                    }
                    className="range-slider"
                  />
                  <span className="slider-val">
                    {overlaySettings.muted
                      ? '0%'
                      : `${Math.round(overlaySettings.volume * 100)}%`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= CHROMA KEY TAB ================= */}
        {activeTab === 'chroma' && (
          <div className="panel-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">Chroma Key (Green Screen)</h3>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={overlaySettings.chromaKey.enabled}
                  onChange={(e) =>
                    onUpdateChromaKey({ enabled: e.target.checked })
                  }
                />
                <span className="switch-slider" />
              </label>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Removes green screen (or custom color) from your overlay video in
              real-time using GPU WebGL YCbCr color keying.
            </p>

            {/* Key Color Picker */}
            <div className="control-group">
              <label className="control-label">Key Color to Remove</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  value={overlaySettings.chromaKey.color}
                  onChange={(e) => onUpdateChromaKey({ color: e.target.value })}
                  className="color-input"
                />
                <input
                  type="text"
                  value={overlaySettings.chromaKey.color}
                  onChange={(e) => onUpdateChromaKey({ color: e.target.value })}
                  className="text-input uppercase font-mono"
                />
              </div>

              {/* Preset Palette Badges */}
              <div className="preset-colors-row mt-2.5">
                {presetColors.map((c) => (
                  <button
                    key={c.hex}
                    className={`preset-color-chip ${
                      overlaySettings.chromaKey.color.toLowerCase() ===
                      c.hex.toLowerCase()
                        ? 'active'
                        : ''
                    }`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => onUpdateChromaKey({ color: c.hex })}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Similarity / Tolerance Slider */}
            <div className="control-group mt-4">
              <div className="flex justify-between items-center mb-1">
                <label className="control-label">
                  Similarity / Range
                  <span className="info-tooltip"> (Removal threshold)</span>
                </label>
                <span className="slider-val">
                  {Math.round(overlaySettings.chromaKey.similarity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.65}
                step={0.01}
                value={overlaySettings.chromaKey.similarity}
                onChange={(e) =>
                  onUpdateChromaKey({ similarity: parseFloat(e.target.value) })
                }
                className="range-slider"
              />
            </div>

            {/* Smoothness / Feathering Slider */}
            <div className="control-group mt-3">
              <div className="flex justify-between items-center mb-1">
                <label className="control-label">
                  Smoothness
                  <span className="info-tooltip"> (Soft edge blending)</span>
                </label>
                <span className="slider-val">
                  {Math.round(overlaySettings.chromaKey.smoothness * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.01}
                max={0.35}
                step={0.01}
                value={overlaySettings.chromaKey.smoothness}
                onChange={(e) =>
                  onUpdateChromaKey({ smoothness: parseFloat(e.target.value) })
                }
                className="range-slider"
              />
            </div>

            {/* Spill Suppression */}
            <div className="control-group mt-3">
              <div className="flex justify-between items-center mb-1">
                <label className="control-label">
                  Spill Suppression
                  <span className="info-tooltip"> (Removes green reflections)</span>
                </label>
                <span className="slider-val">
                  {Math.round(overlaySettings.chromaKey.spill * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={overlaySettings.chromaKey.spill}
                onChange={(e) =>
                  onUpdateChromaKey({ spill: parseFloat(e.target.value) })
                }
                className="range-slider"
              />
            </div>
          </div>
        )}

        {/* ================= TEXT TAB ================= */}
        {activeTab === 'text' && (
          <div className="panel-section">
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title mb-0">Text Overlays</h3>
              <button className="btn-add-text" onClick={onAddText}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Text</span>
              </button>
            </div>

            {/* Text items list */}
            {textOverlays.length === 0 ? (
              <div className="empty-text-state">
                <Type className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">
                  No text overlays yet. Click "Add Text" to insert titles,
                  subtitles, or captions.
                </p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {textOverlays.map((t) => (
                  <div
                    key={t.id}
                    className={`text-layer-card ${
                      selectedTextId === t.id ? 'active' : ''
                    }`}
                    onClick={() => onSelectText(t.id)}
                  >
                    <span className="text-layer-preview truncate">
                      {t.text || 'Empty Text'}
                    </span>
                    <button
                      className="text-layer-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteText(t.id);
                      }}
                      title="Delete Text"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Text Controls */}
            {selectedText && (
              <div className="selected-text-controls pt-3 border-t border-slate-800 space-y-3">
                <div className="control-group">
                  <label className="control-label">Text Content</label>
                  <input
                    type="text"
                    value={selectedText.text}
                    onChange={(e) =>
                      onUpdateText(selectedText.id, { text: e.target.value })
                    }
                    placeholder="Enter text..."
                    className="text-input"
                  />
                </div>

                {/* Font family & Font size */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="control-group">
                    <label className="control-label">Font Family</label>
                    <select
                      value={selectedText.fontFamily}
                      onChange={(e) =>
                        onUpdateText(selectedText.id, {
                          fontFamily: e.target.value,
                        })
                      }
                      className="text-input"
                    >
                      <option value="system-ui">Modern Sans</option>
                      <option value="Impact">Impact / Bold</option>
                      <option value="Georgia">Classic Serif</option>
                      <option value="Courier New">Monospace</option>
                      <option value="Trebuchet MS">Trebuchet</option>
                      <option value="Comic Sans MS">Casual / Comic</option>
                    </select>
                  </div>

                  <div className="control-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="control-label">Font Size</label>
                      <span className="slider-val">{selectedText.fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={120}
                      value={selectedText.fontSize}
                      onChange={(e) =>
                        onUpdateText(selectedText.id, {
                          fontSize: parseInt(e.target.value, 10),
                        })
                      }
                      className="range-slider"
                    />
                  </div>
                </div>

                {/* Styling Toggles: Bold, Italic, Shadow */}
                <div className="control-group">
                  <label className="control-label">Style Options</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      className={`btn-toggle flex-1 ${
                        selectedText.bold ? 'active' : ''
                      }`}
                      onClick={() =>
                        onUpdateText(selectedText.id, {
                          bold: !selectedText.bold,
                        })
                      }
                    >
                      <Bold className="w-3.5 h-3.5 mr-1" />
                      <span>Bold</span>
                    </button>
                    <button
                      className={`btn-toggle flex-1 ${
                        selectedText.italic ? 'active' : ''
                      }`}
                      onClick={() =>
                        onUpdateText(selectedText.id, {
                          italic: !selectedText.italic,
                        })
                      }
                    >
                      <Italic className="w-3.5 h-3.5 mr-1" />
                      <span>Italic</span>
                    </button>
                    <button
                      className={`btn-toggle flex-1 ${
                        selectedText.shadow ? 'active' : ''
                      }`}
                      onClick={() =>
                        onUpdateText(selectedText.id, {
                          shadow: !selectedText.shadow,
                        })
                      }
                    >
                      <span>Shadow</span>
                    </button>
                  </div>
                </div>

                {/* Text Color & Background Box */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="control-group">
                    <label className="control-label">Text Color</label>
                    <div className="color-picker-row">
                      <input
                        type="color"
                        value={selectedText.color}
                        onChange={(e) =>
                          onUpdateText(selectedText.id, {
                            color: e.target.value,
                          })
                        }
                        className="color-input"
                      />
                      <input
                        type="text"
                        value={selectedText.color}
                        onChange={(e) =>
                          onUpdateText(selectedText.id, {
                            color: e.target.value,
                          })
                        }
                        className="text-input"
                      />
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">Box Pill Bg</label>
                    <div className="color-picker-row">
                      <input
                        type="color"
                        value={
                          selectedText.backgroundColor === 'transparent'
                            ? '#000000'
                            : selectedText.backgroundColor
                        }
                        onChange={(e) =>
                          onUpdateText(selectedText.id, {
                            backgroundColor: e.target.value,
                          })
                        }
                        className="color-input"
                      />
                      <button
                        className="btn-toggle text-xs py-1 px-2"
                        onClick={() =>
                          onUpdateText(selectedText.id, {
                            backgroundColor:
                              selectedText.backgroundColor === 'transparent'
                                ? 'rgba(0,0,0,0.6)'
                                : 'transparent',
                          })
                        }
                      >
                        {selectedText.backgroundColor === 'transparent'
                          ? 'Add Box'
                          : 'Clear'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stroke Outline */}
                <div className="control-group">
                  <div className="flex justify-between items-center mb-1">
                    <label className="control-label">Outline Stroke Width</label>
                    <span className="slider-val">
                      {selectedText.strokeWidth}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={selectedText.strokeWidth}
                    onChange={(e) =>
                      onUpdateText(selectedText.id, {
                        strokeWidth: parseInt(e.target.value, 10),
                      })
                    }
                    className="range-slider"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= AUDIO / SOUND TAB ================= */}
        {activeTab === 'sound' && (
          <div className="panel-section">
            <h3 className="section-title">Sound & Audio Controls</h3>

            {/* Quick Strip Original Audio Actions */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 mb-4">
              <h4 className="text-xs font-semibold text-rose-300 flex items-center gap-1.5 mb-2">
                <MicOff className="w-4 h-4 text-rose-400" />
                <span>Original Video Audio</span>
              </h4>
              <p className="text-xs text-slate-400 mb-3">
                Quickly remove or mute the original audio from your uploaded
                videos so only your added music or voiceover plays.
              </p>

              <div className="flex flex-col gap-2">
                <button
                  className={`strip-audio-btn ${
                    bgSettings.stripAudio ? 'active' : ''
                  }`}
                  onClick={() =>
                    onUpdateBgSettings({ stripAudio: !bgSettings.stripAudio })
                  }
                >
                  <MicOff className="w-3.5 h-3.5" />
                  <span>
                    {bgSettings.stripAudio
                      ? '✓ Original Background Audio Removed'
                      : 'Remove Background Video Audio'}
                  </span>
                </button>

                <button
                  className={`strip-audio-btn ${
                    overlaySettings.stripAudio ? 'active' : ''
                  }`}
                  onClick={() =>
                    onUpdateOverlaySettings({
                      stripAudio: !overlaySettings.stripAudio,
                    })
                  }
                >
                  <MicOff className="w-3.5 h-3.5" />
                  <span>
                    {overlaySettings.stripAudio
                      ? '✓ Original Overlay Audio Removed'
                      : 'Remove Overlay Video Audio'}
                  </span>
                </button>
              </div>
            </div>

            {/* Add Custom Background Sound / Music */}
            <h4 className="text-xs font-semibold text-sky-300 flex items-center gap-1.5 mb-2">
              <Music className="w-4 h-4 text-sky-400" />
              <span>Add Custom Sound / Background Music (BGM)</span>
            </h4>

            <div className="upload-dropzone">
              <label className="dropzone-label">
                <Upload className="w-8 h-8 text-sky-400 mb-2" />
                <span className="dropzone-main-text">
                  {customAudio.file
                    ? customAudio.file.name
                    : customAudio.name || 'Upload Audio Track (MP3, WAV, AAC)'}
                </span>
                <span className="dropzone-sub-text">
                  Click to add custom sound effects or background soundtrack
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  className="hidden"
                />
              </label>
              {customAudio.url && (
                <div className="file-loaded-badge">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Custom sound ready</span>
                </div>
              )}
            </div>

            {/* Custom Audio Volume & Loop */}
            {customAudio.url && (
              <div className="mt-4 space-y-3">
                <div className="control-group">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="control-label">Custom Sound Volume</label>
                    <button
                      className="mute-btn"
                      onClick={() =>
                        onUpdateCustomAudio({ muted: !customAudio.muted })
                      }
                    >
                      {customAudio.muted || customAudio.volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-sky-400" />
                      )}
                    </button>
                  </div>
                  <div className="slider-row">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={customAudio.muted ? 0 : customAudio.volume}
                      onChange={(e) =>
                        onUpdateCustomAudio({
                          volume: parseFloat(e.target.value),
                          muted: false,
                        })
                      }
                      className="range-slider"
                    />
                    <span className="slider-val">
                      {customAudio.muted
                        ? '0%'
                        : `${Math.round(customAudio.volume * 100)}%`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300">
                    Loop Sound Across Video
                  </label>
                  <label className="switch-toggle">
                    <input
                      type="checkbox"
                      checked={customAudio.loop}
                      onChange={(e) =>
                        onUpdateCustomAudio({ loop: e.target.checked })
                      }
                    />
                    <span className="switch-slider" />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
