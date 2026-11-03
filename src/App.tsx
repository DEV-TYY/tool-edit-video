import { useState, useRef, useEffect, useCallback } from 'react';
import type {
  BackgroundSettings,
  OverlaySettings,
  CanvasDimensions,
  ExportProgress,
  TextOverlay,
  CustomAudioSettings,
  VideoFilter,
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PreviewCanvas } from './components/PreviewCanvas';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';
import { AudioMixer } from './utils/audioMixer';
import { VideoExporter } from './utils/videoExporter';
import {
  generateSampleBackgroundVideo,
  generateSampleGreenScreenVideo,
} from './utils/sampleMedia';
import './App.css';

export default function App() {
  // Dimension settings
  const [dimensions, setDimensions] = useState<CanvasDimensions>({
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
  });

  // Background settings
  const [bgSettings, setBgSettings] = useState<BackgroundSettings>({
    type: 'video',
    file: null,
    url: null,
    solidColor: '#090d16',
    fit: 'cover',
    volume: 1,
    muted: false,
    stripAudio: false,
    flipH: false,
    flipV: false,
    rotation: 0,
    filter: {
      preset: 'none',
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hueRotate: 0,
      blur: 0,
    },
  });

  // Overlay settings
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
    file: null,
    url: null,
    volume: 1,
    muted: false,
    stripAudio: false,
    transform: {
      x: 50,
      y: 50,
      scale: 0.65,
      rotation: 0,
      flipH: false,
      flipV: false,
      opacity: 1,
    },
    chromaKey: {
      enabled: true,
      color: '#00ff00',
      similarity: 0.35,
      smoothness: 0.12,
      spill: 0.5,
    },
    filter: {
      preset: 'none',
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hueRotate: 0,
      blur: 0,
    },
  });

  // Text Overlays
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  // Custom Audio track
  const [customAudio, setCustomAudio] = useState<CustomAudioSettings>({
    file: null,
    url: null,
    name: '',
    volume: 1,
    muted: false,
    loop: true,
  });

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(5);
  const [isLooping, setIsLooping] = useState(true);

  // Demo loading state
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  // Export state
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0,
    currentTime: 0,
    totalTime: 0,
    exportedBlobUrl: null,
    error: null,
  });
  const [showExportModal, setShowExportModal] = useState(false);

  // HTML Element references
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const overlayVideoRef = useRef<HTMLVideoElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Utilities
  const audioMixerRef = useRef<AudioMixer>(new AudioMixer());
  const exporterRef = useRef<VideoExporter>(new VideoExporter());

  // Connect AudioMixer when video/audio elements load
  const setupAudio = useCallback(() => {
    const mixer = audioMixerRef.current;
    if (bgVideoRef.current && bgSettings.url) {
      mixer.connectBg(bgVideoRef.current);
    }
    if (overlayVideoRef.current && overlaySettings.url) {
      mixer.connectOverlay(overlayVideoRef.current);
    }
    if (customAudioRef.current && customAudio.url) {
      mixer.connectCustomAudio(customAudioRef.current);
    }

    mixer.setBgVolume(bgSettings.volume, bgSettings.muted, bgSettings.stripAudio);
    mixer.setOverlayVolume(overlaySettings.volume, overlaySettings.muted, overlaySettings.stripAudio);
    mixer.setCustomAudioVolume(customAudio.volume, customAudio.muted);
  }, [
    bgSettings.url,
    bgSettings.volume,
    bgSettings.muted,
    bgSettings.stripAudio,
    overlaySettings.url,
    overlaySettings.volume,
    overlaySettings.muted,
    overlaySettings.stripAudio,
    customAudio.url,
    customAudio.volume,
    customAudio.muted,
  ]);

  useEffect(() => {
    setupAudio();
  }, [setupAudio]);

  // Recalculate composite duration from loaded videos
  const updateDuration = useCallback(() => {
    let maxDur = 0;
    if (bgVideoRef.current && !isNaN(bgVideoRef.current.duration) && bgVideoRef.current.duration > 0) {
      maxDur = Math.max(maxDur, bgVideoRef.current.duration);
    }
    if (
      overlayVideoRef.current &&
      !isNaN(overlayVideoRef.current.duration) &&
      overlayVideoRef.current.duration > 0
    ) {
      maxDur = Math.max(maxDur, overlayVideoRef.current.duration);
    }
    if (maxDur > 0) {
      setDuration(maxDur);
    }
  }, []);

  // Seek handler
  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    if (bgVideoRef.current && bgSettings.url) {
      bgVideoRef.current.currentTime = time;
    }
    if (overlayVideoRef.current && overlaySettings.url) {
      overlayVideoRef.current.currentTime = time;
    }
    if (customAudioRef.current && customAudio.url) {
      const audioDuration = customAudioRef.current.duration || 1;
      customAudioRef.current.currentTime = customAudio.loop
        ? time % audioDuration
        : Math.min(time, audioDuration);
    }
  }, [bgSettings.url, overlaySettings.url, customAudio.url, customAudio.loop]);

  // Play / Pause toggle
  const handleTogglePlay = useCallback(async () => {
    await audioMixerRef.current.resume();

    const bgVid = bgVideoRef.current;
    const ovVid = overlayVideoRef.current;
    const aud = customAudioRef.current;

    if (isPlaying) {
      if (bgVid) bgVid.pause();
      if (ovVid) ovVid.pause();
      if (aud) aud.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= duration && duration > 0) {
        handleSeek(0);
      }
      const plays: Promise<void>[] = [];
      if (bgVid && bgSettings.url) plays.push(bgVid.play().catch(() => {}));
      if (ovVid && overlaySettings.url) plays.push(ovVid.play().catch(() => {}));
      if (aud && customAudio.url) plays.push(aud.play().catch(() => {}));
      await Promise.all(plays);
      setIsPlaying(true);
    }
  }, [isPlaying, currentTime, duration, bgSettings.url, overlaySettings.url, customAudio.url, handleSeek]);

  // Sync playback time loop
  const animIdRef = useRef<number>(0);
  useEffect(() => {
    const syncPlayback = () => {
      const bgVid = bgVideoRef.current;
      const ovVid = overlayVideoRef.current;
      const aud = customAudioRef.current;

      const currentT =
        bgVid && !bgVid.paused
          ? bgVid.currentTime
          : ovVid && !ovVid.paused
          ? ovVid.currentTime
          : currentTime;

      if (isPlaying) {
        setCurrentTime(currentT);

        // Check if finished
        if (currentT >= duration && duration > 0) {
          if (isLooping) {
            if (bgVid) {
              bgVid.currentTime = 0;
              bgVid.play().catch(() => {});
            }
            if (ovVid) {
              ovVid.currentTime = 0;
              ovVid.play().catch(() => {});
            }
            if (aud) {
              aud.currentTime = 0;
              aud.play().catch(() => {});
            }
            setCurrentTime(0);
          } else {
            if (bgVid) bgVid.pause();
            if (ovVid) ovVid.pause();
            if (aud) aud.pause();
            setIsPlaying(false);
          }
        }
      }

      animIdRef.current = requestAnimationFrame(syncPlayback);
    };

    animIdRef.current = requestAnimationFrame(syncPlayback);
    return () => cancelAnimationFrame(animIdRef.current);
  }, [isPlaying, duration, isLooping, currentTime]);

  // Upload Background File
  const handleUploadBgFile = (file: File) => {
    const isVideo = file.type.startsWith('video/');
    const url = URL.createObjectURL(file);

    if (isVideo) {
      setBgSettings((prev) => ({
        ...prev,
        type: 'video',
        file,
        url,
      }));
    } else {
      setBgSettings((prev) => ({
        ...prev,
        type: 'image',
        file,
        url,
      }));
    }
  };

  // Upload Overlay File
  const handleUploadOverlayFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setOverlaySettings((prev) => ({
      ...prev,
      file,
      url,
    }));
  };

  // Upload Custom Audio File
  const handleUploadAudioFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setCustomAudio({
      file,
      url,
      name: file.name,
      volume: 1,
      muted: false,
      loop: true,
    });
  };

  // Text management
  const handleAddText = () => {
    const newId = 'text-' + Date.now();
    const newText: TextOverlay = {
      id: newId,
      text: 'Sample Title',
      x: 50,
      y: 25,
      fontSize: 42,
      fontFamily: 'system-ui',
      color: '#ffffff',
      backgroundColor: 'transparent',
      strokeColor: '#000000',
      strokeWidth: 3,
      bold: true,
      italic: false,
      shadow: true,
      opacity: 1,
      rotation: 0,
      scale: 1,
    };
    setTextOverlays((prev) => [...prev, newText]);
    setSelectedTextId(newId);
  };

  const handleUpdateText = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleDeleteText = (id: string) => {
    setTextOverlays((prev) => prev.filter((t) => t.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  };

  // Filter updates
  const handleUpdateBgFilter = (filter: Partial<VideoFilter>) => {
    setBgSettings((prev) => ({
      ...prev,
      filter: { ...prev.filter, ...filter },
    }));
  };

  const handleUpdateOverlayFilter = (filter: Partial<VideoFilter>) => {
    setOverlaySettings((prev) => ({
      ...prev,
      filter: { ...prev.filter, ...filter },
    }));
  };

  // Load sample demo assets
  const handleLoadDemo = async () => {
    try {
      setIsLoadingDemo(true);
      if (isPlaying) {
        handleTogglePlay();
      }

      const [sampleBgUrl, sampleOverlayUrl] = await Promise.all([
        generateSampleBackgroundVideo(),
        generateSampleGreenScreenVideo(),
      ]);

      setBgSettings((prev) => ({
        ...prev,
        type: 'video',
        file: null,
        url: sampleBgUrl,
        stripAudio: false,
        flipH: false,
        flipV: false,
        rotation: 0,
        filter: {
          preset: 'none',
          brightness: 100,
          contrast: 100,
          saturation: 100,
          hueRotate: 0,
          blur: 0,
        },
      }));

      setOverlaySettings((prev) => ({
        ...prev,
        file: null,
        url: sampleOverlayUrl,
        stripAudio: false,
        chromaKey: {
          ...prev.chromaKey,
          enabled: true,
          color: '#00ff00',
          similarity: 0.35,
          smoothness: 0.12,
          spill: 0.5,
        },
        transform: {
          x: 50,
          y: 50,
          scale: 0.65,
          rotation: 0,
          flipH: false,
          flipV: false,
          opacity: 1,
        },
        filter: {
          preset: 'none',
          brightness: 100,
          contrast: 100,
          saturation: 100,
          hueRotate: 0,
          blur: 0,
        },
      }));

      // Add a stylish sample text overlay
      setTextOverlays([
        {
          id: 'demo-text',
          text: 'CHROMA STUDIO ✨',
          x: 50,
          y: 18,
          fontSize: 38,
          fontFamily: 'Impact',
          color: '#fef08a',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          strokeColor: '#000000',
          strokeWidth: 2,
          bold: true,
          italic: false,
          shadow: true,
          opacity: 1,
          rotation: 0,
          scale: 1,
        },
      ]);
      setSelectedTextId(null);

      setCurrentTime(0);
      setDuration(5);
    } catch (err) {
      console.error('Failed to load demo:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  // Reset all media
  const handleReset = () => {
    if (isPlaying) {
      handleTogglePlay();
    }
    setBgSettings({
      type: 'video',
      file: null,
      url: null,
      solidColor: '#090d16',
      fit: 'cover',
      volume: 1,
      muted: false,
      stripAudio: false,
      flipH: false,
      flipV: false,
      rotation: 0,
      filter: {
        preset: 'none',
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hueRotate: 0,
        blur: 0,
      },
    });
    setOverlaySettings({
      file: null,
      url: null,
      volume: 1,
      muted: false,
      stripAudio: false,
      transform: {
        x: 50,
        y: 50,
        scale: 0.65,
        rotation: 0,
        flipH: false,
        flipV: false,
        opacity: 1,
      },
      chromaKey: {
        enabled: true,
        color: '#00ff00',
        similarity: 0.35,
        smoothness: 0.12,
        spill: 0.5,
      },
      filter: {
        preset: 'none',
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hueRotate: 0,
        blur: 0,
      },
    });
    setTextOverlays([]);
    setSelectedTextId(null);
    setCustomAudio({
      file: null,
      url: null,
      name: '',
      volume: 1,
      muted: false,
      loop: true,
    });
    setCurrentTime(0);
  };

  // Start Video Export
  const handleExport = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPlaying) {
      handleTogglePlay();
    }

    setShowExportModal(true);
    setExportProgress({
      isExporting: true,
      progress: 0,
      currentTime: 0,
      totalTime: duration,
      exportedBlobUrl: null,
      error: null,
    });

    try {
      const audioTracks = audioMixerRef.current.getAudioTracks();
      const exporter = exporterRef.current;

      const blob = await exporter.exportVideo({
        canvas,
        audioTracks,
        bgVideo: bgVideoRef.current,
        overlayVideo: overlayVideoRef.current,
        customAudio: customAudioRef.current,
        duration: duration > 0 ? duration : 5,
        fps: 30,
        onProgress: (percent, currentT, totalT) => {
          setExportProgress((prev) => ({
            ...prev,
            progress: percent,
            currentTime: currentT,
            totalTime: totalT,
          }));
        },
      });

      const blobUrl = URL.createObjectURL(blob);
      setExportProgress((prev) => ({
        ...prev,
        isExporting: false,
        progress: 100,
        exportedBlobUrl: blobUrl,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message !== 'Export was cancelled by user.') {
        setExportProgress((prev) => ({
          ...prev,
          isExporting: false,
          error: message,
        }));
      } else {
        setShowExportModal(false);
      }
    }
  };

  // Keyboard shortcut for Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const hasMedia = Boolean(bgSettings.url || overlaySettings.url || customAudio.url || textOverlays.length > 0);

  return (
    <div className="app-container">
      {/* Hidden media elements for hardware-accelerated playback */}
      {bgSettings.url && bgSettings.type === 'video' && (
        <video
          ref={bgVideoRef}
          src={bgSettings.url}
          playsInline
          muted={bgSettings.muted || bgSettings.stripAudio}
          crossOrigin="anonymous"
          onLoadedMetadata={updateDuration}
          className="hidden"
        />
      )}

      {bgSettings.url && bgSettings.type === 'image' && (
        <img
          ref={bgImageRef}
          src={bgSettings.url}
          crossOrigin="anonymous"
          alt="background"
          className="hidden"
        />
      )}

      {overlaySettings.url && (
        <video
          ref={overlayVideoRef}
          src={overlaySettings.url}
          playsInline
          muted={overlaySettings.muted || overlaySettings.stripAudio}
          crossOrigin="anonymous"
          onLoadedMetadata={updateDuration}
          className="hidden"
        />
      )}

      {customAudio.url && (
        <audio
          ref={customAudioRef}
          src={customAudio.url}
          loop={customAudio.loop}
          muted={customAudio.muted}
          className="hidden"
        />
      )}

      {/* Main App Layout */}
      <Header
        dimensions={dimensions}
        onDimensionChange={setDimensions}
        onLoadDemo={handleLoadDemo}
        isLoadingDemo={isLoadingDemo}
        onExportClick={handleExport}
        onReset={handleReset}
        hasMedia={hasMedia}
      />

      <main className="editor-main-layout">
        {/* Left Sidebar */}
        <Sidebar
          bgSettings={bgSettings}
          overlaySettings={overlaySettings}
          textOverlays={textOverlays}
          selectedTextId={selectedTextId}
          customAudio={customAudio}
          onUpdateBgSettings={(newSettings) =>
            setBgSettings((prev) => ({ ...prev, ...newSettings }))
          }
          onUpdateOverlaySettings={(newSettings) =>
            setOverlaySettings((prev) => ({ ...prev, ...newSettings }))
          }
          onUpdateOverlayTransform={(newTransform) =>
            setOverlaySettings((prev) => ({
              ...prev,
              transform: { ...prev.transform, ...newTransform },
            }))
          }
          onUpdateChromaKey={(newChroma) =>
            setOverlaySettings((prev) => ({
              ...prev,
              chromaKey: { ...prev.chromaKey, ...newChroma },
            }))
          }
          onUpdateBgFilter={handleUpdateBgFilter}
          onUpdateOverlayFilter={handleUpdateOverlayFilter}
          onAddText={handleAddText}
          onSelectText={setSelectedTextId}
          onUpdateText={handleUpdateText}
          onDeleteText={handleDeleteText}
          onUpdateCustomAudio={(newAudio) =>
            setCustomAudio((prev) => ({ ...prev, ...newAudio }))
          }
          onUploadBgFile={handleUploadBgFile}
          onUploadOverlayFile={handleUploadOverlayFile}
          onUploadAudioFile={handleUploadAudioFile}
        />

        {/* Center / Right Editor Workspace */}
        <section className="editor-stage">
          <PreviewCanvas
            dimensions={dimensions}
            bgSettings={bgSettings}
            overlaySettings={overlaySettings}
            textOverlays={textOverlays}
            selectedTextId={selectedTextId}
            onSelectText={setSelectedTextId}
            onUpdateText={handleUpdateText}
            onUpdateOverlayTransform={(newTransform) =>
              setOverlaySettings((prev) => ({
                ...prev,
                transform: { ...prev.transform, ...newTransform },
              }))
            }
            onPickKeyColor={(hex) =>
              setOverlaySettings((prev) => ({
                ...prev,
                chromaKey: { ...prev.chromaKey, color: hex, enabled: true },
              }))
            }
            bgVideoRef={bgVideoRef}
            overlayVideoRef={overlayVideoRef}
            bgImageRef={bgImageRef}
            onRegisterCanvas={(canvas) => {
              canvasRef.current = canvas;
            }}
          />

          <Timeline
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            isLooping={isLooping}
            onToggleLoop={() => setIsLooping(!isLooping)}
            onResetTime={() => handleSeek(0)}
          />
        </section>
      </main>

      {/* Export & Download Modal */}
      {showExportModal && (
        <ExportModal
          progress={exportProgress}
          onCancel={() => {
            exporterRef.current.cancel();
            setShowExportModal(false);
          }}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
