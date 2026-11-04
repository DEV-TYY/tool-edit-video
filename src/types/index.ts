export interface LayerTransform {
  x: number; // percentage of canvas width (0 - 100)
  y: number; // percentage of canvas height (0 - 100)
  scale: number; // multiplier (0.1 - 3.0)
  rotation: number; // degrees (-180 to 180)
  flipH: boolean;
  flipV: boolean;
  opacity: number; // 0 - 1
}

export interface ChromaKeySettings {
  enabled: boolean;
  color: string; // hex '#00ff00'
  similarity: number; // 0.05 to 0.7
  smoothness: number; // 0.01 to 0.4
  spill: number; // 0.0 to 1.0
}

export interface VideoFilter {
  preset: string; // 'none' | 'vintage' | 'cyberpunk' | 'warm' | 'cool' | 'bnw' | 'sepia' | 'dramatic' | 'invert'
  brightness: number; // 0 to 200% (default 100)
  contrast: number; // 0 to 200% (default 100)
  saturation: number; // 0 to 200% (default 100)
  hueRotate: number; // -180 to 180 deg (default 0)
  blur: number; // 0 to 20 px (default 0)
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number; // percentage of canvas width (0 - 100)
  y: number; // percentage of canvas height (0 - 100)
  fontSize: number; // px (12 to 120)
  fontFamily: string; // 'system-ui' | 'Impact' | 'Georgia' | 'Courier New' | 'Comic Sans MS' | 'Trebuchet MS'
  color: string; // hex '#ffffff'
  backgroundColor: string; // hex or 'transparent'
  strokeColor: string; // hex or 'transparent'
  strokeWidth: number; // 0 to 10
  bold: boolean;
  italic: boolean;
  shadow: boolean;
  opacity: number; // 0 to 1
  rotation: number; // degrees (-180 to 180)
  scale: number; // multiplier (0.2 to 3.0)
}

export interface BackgroundSettings {
  type: 'video' | 'image' | 'color';
  file: File | null;
  url: string | null;
  sourceUrl?: string;
  solidColor: string;
  fit: 'cover' | 'contain' | 'fill';
  volume: number; // 0 - 1
  muted: boolean;
  stripAudio: boolean; // Completely remove original audio
  flipH: boolean;
  flipV: boolean;
  rotation: number; // 0, 90, 180, 270
  filter: VideoFilter;
}

export interface OverlaySettings {
  file: File | null;
  url: string | null;
  sourceUrl?: string;
  volume: number; // 0 - 1
  muted: boolean;
  stripAudio: boolean; // Completely remove original audio
  transform: LayerTransform;
  chromaKey: ChromaKeySettings;
  filter: VideoFilter;
}

export interface CustomAudioSettings {
  file: File | null;
  url: string | null;
  name: string;
  volume: number; // 0 - 1
  muted: boolean;
  loop: boolean;
}

export interface CanvasDimensions {
  width: number;
  height: number;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | 'custom';
}

export interface ExportProgress {
  isExporting: boolean;
  progress: number; // 0 - 100
  currentTime: number;
  totalTime: number;
  exportedBlobUrl: string | null;
  error: string | null;
}
