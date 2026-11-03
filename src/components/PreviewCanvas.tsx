import React, { useRef, useEffect, useState, useCallback } from 'react';
import type {
  BackgroundSettings,
  OverlaySettings,
  CanvasDimensions,
  LayerTransform,
  TextOverlay,
} from '../types';
import { WebGLChromaProcessor } from '../utils/webglChroma';
import {
  CanvasCompositor,
  type BoundingBox,
  type HitTarget,
} from '../utils/canvasCompositor';
import {
  Pipette,
  Maximize2,
  Minimize2,
  Crosshair,
  RotateCcw,
  Eye,
  EyeOff,
  Type,
} from 'lucide-react';

interface PreviewCanvasProps {
  dimensions: CanvasDimensions;
  bgSettings: BackgroundSettings;
  overlaySettings: OverlaySettings;
  textOverlays: TextOverlay[];
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
  onUpdateText: (id: string, updates: Partial<TextOverlay>) => void;
  onUpdateOverlayTransform: (transform: Partial<LayerTransform>) => void;
  onPickKeyColor: (hex: string) => void;
  bgVideoRef: React.RefObject<HTMLVideoElement | null>;
  overlayVideoRef: React.RefObject<HTMLVideoElement | null>;
  bgImageRef: React.RefObject<HTMLImageElement | null>;
  onRegisterCanvas: (canvas: HTMLCanvasElement) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  dimensions,
  bgSettings,
  overlaySettings,
  textOverlays,
  selectedTextId,
  onSelectText,
  onUpdateText,
  onUpdateOverlayTransform,
  onPickKeyColor,
  bgVideoRef,
  overlayVideoRef,
  bgImageRef,
  onRegisterCanvas,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chromaProcessorRef = useRef<WebGLChromaProcessor | null>(null);

  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const [showGizmo, setShowGizmo] = useState(true);
  const [hoveredTarget, setHoveredTarget] = useState<HitTarget>('none');
  const [activeDragTarget, setActiveDragTarget] = useState<HitTarget>('none');
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Drag interaction state
  const dragTypeRef = useRef<'overlay' | 'text' | null>(null);

  const dragStartRef = useRef<{
    target: HitTarget;
    startX: number;
    startY: number;
    initialTransform?: LayerTransform;
    initialText?: TextOverlay;
    initialBox: BoundingBox;
  } | null>(null);

  // Initialize WebGL processor once
  useEffect(() => {
    if (!chromaProcessorRef.current) {
      chromaProcessorRef.current = new WebGLChromaProcessor();
    }
  }, []);

  // Register main canvas for recording
  useEffect(() => {
    if (canvasRef.current) {
      onRegisterCanvas(canvasRef.current);
    }
  }, [onRegisterCanvas]);

  // Main rendering loop
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;

    // 1. Render Background
    const bgSource =
      bgSettings.type === 'video'
        ? bgVideoRef.current
        : bgSettings.type === 'image'
        ? bgImageRef.current
        : null;

    CanvasCompositor.renderBackground(ctx, width, height, bgSettings, bgSource);

    // 2. Render Overlay (if loaded)
    const overlayVid = overlayVideoRef.current;
    if (overlayVid && overlayVid.videoWidth > 0 && chromaProcessorRef.current) {
      const keyedCanvas = chromaProcessorRef.current.process(
        overlayVid,
        overlaySettings.chromaKey
      );

      CanvasCompositor.renderOverlay(
        ctx,
        width,
        height,
        keyedCanvas,
        overlaySettings
      );

      // Render Overlay Gizmo if active and no text is selected
      if (showGizmo && !isEyedropperActive && !selectedTextId) {
        const box = CanvasCompositor.getBoundingBox(
          width,
          height,
          keyedCanvas.width,
          keyedCanvas.height,
          overlaySettings.transform
        );
        CanvasCompositor.renderGizmo(
          ctx,
          box,
          hoveredTarget,
          isDragging && dragTypeRef.current === 'overlay',
          '#38bdf8'
        );
      }
    }

    // 3. Render Text Overlays
    for (const textItem of textOverlays) {
      CanvasCompositor.renderText(ctx, width, height, textItem);
    }

    // 4. Render Selected Text Gizmo
    if (showGizmo && !isEyedropperActive && selectedTextId) {
      const activeText = textOverlays.find((t) => t.id === selectedTextId);
      if (activeText) {
        const textBox = CanvasCompositor.getTextBoundingBox(
          width,
          height,
          activeText
        );
        CanvasCompositor.renderGizmo(
          ctx,
          textBox,
          hoveredTarget,
          isDragging && dragTypeRef.current === 'text',
          '#f59e0b'
        );
      }
    }
  }, [
    dimensions,
    bgSettings,
    overlaySettings,
    textOverlays,
    selectedTextId,
    showGizmo,
    hoveredTarget,
    isDragging,
    isEyedropperActive,
    bgVideoRef,
    overlayVideoRef,
    bgImageRef,
  ]);

  useEffect(() => {
    let animId: number;
    const loop = () => {
      renderFrame();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderFrame]);

  // Convert mouse coordinates to internal canvas coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Eyedropper sampling
  const handleEyedropperClick = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const pixel = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
      const hex =
        '#' +
        ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
          .toString(16)
          .slice(1);
      onPickKeyColor(hex);
      setIsEyedropperActive(false);
    } catch (err) {
      console.warn('Eyedropper read error:', err);
    }
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (isEyedropperActive) {
      handleEyedropperClick(x, y);
      return;
    }

    // 1. Check if clicking on Selected Text Gizmo
    if (selectedTextId) {
      const activeText = textOverlays.find((t) => t.id === selectedTextId);
      if (activeText) {
        const textBox = CanvasCompositor.getTextBoundingBox(
          dimensions.width,
          dimensions.height,
          activeText
        );
        const hit = CanvasCompositor.hitTest(x, y, textBox);
        if (hit !== 'none') {
          setIsDragging(true);
          setActiveDragTarget(hit);
          dragTypeRef.current = 'text';
          dragStartRef.current = {
            target: hit,
            startX: x,
            startY: y,
            initialText: { ...activeText },
            initialBox: textBox,
          };
          return;
        }
      }
    }

    // 2. Check if clicking on any other Text Item
    for (let i = textOverlays.length - 1; i >= 0; i--) {
      const item = textOverlays[i];
      const box = CanvasCompositor.getTextBoundingBox(
        dimensions.width,
        dimensions.height,
        item
      );
      const hit = CanvasCompositor.hitTest(x, y, box);
      if (hit !== 'none') {
        onSelectText(item.id);
        setIsDragging(true);
        setActiveDragTarget(hit);
        dragTypeRef.current = 'text';
        dragStartRef.current = {
          target: hit,
          startX: x,
          startY: y,
          initialText: { ...item },
          initialBox: box,
        };
        return;
      }
    }

    // 3. Check if clicking on Overlay Video
    const overlayVid = overlayVideoRef.current;
    if (overlayVid && overlayVid.videoWidth > 0) {
      const box = CanvasCompositor.getBoundingBox(
        dimensions.width,
        dimensions.height,
        overlayVid.videoWidth,
        overlayVid.videoHeight,
        overlaySettings.transform
      );
      const hit = CanvasCompositor.hitTest(x, y, box);
      if (hit !== 'none') {
        onSelectText(null); // deselect text
        setIsDragging(true);
        setActiveDragTarget(hit);
        dragTypeRef.current = 'overlay';
        dragStartRef.current = {
          target: hit,
          startX: x,
          startY: y,
          initialTransform: { ...overlaySettings.transform },
          initialBox: box,
        };
        return;
      }
    }

    // Clicked on empty space -> deselect text
    onSelectText(null);
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    if (isEyedropperActive) return;

    if (!isDragging) {
      // Hover hit-testing
      if (selectedTextId) {
        const activeText = textOverlays.find((t) => t.id === selectedTextId);
        if (activeText) {
          const textBox = CanvasCompositor.getTextBoundingBox(
            dimensions.width,
            dimensions.height,
            activeText
          );
          const hit = CanvasCompositor.hitTest(x, y, textBox);
          if (hit !== 'none') {
            setHoveredTarget(hit);
            return;
          }
        }
      }

      const overlayVid = overlayVideoRef.current;
      if (overlayVid && overlayVid.videoWidth > 0) {
        const box = CanvasCompositor.getBoundingBox(
          dimensions.width,
          dimensions.height,
          overlayVid.videoWidth,
          overlayVid.videoHeight,
          overlaySettings.transform
        );
        const hit = CanvasCompositor.hitTest(x, y, box);
        setHoveredTarget(hit);
        return;
      }

      setHoveredTarget('none');
      return;
    }

    // Active drag handling
    const drag = dragStartRef.current;
    if (!drag) return;

    const { target, startX, startY, initialTransform, initialText, initialBox } = drag;
    const dx = x - startX;
    const dy = y - startY;

    // A. Dragging Overlay Video
    if (dragTypeRef.current === 'overlay' && initialTransform) {
      if (target === 'move') {
        const deltaXPercent = (dx / dimensions.width) * 100;
        const deltaYPercent = (dy / dimensions.height) * 100;
        onUpdateOverlayTransform({
          x: Math.round(
            Math.max(0, Math.min(100, initialTransform.x + deltaXPercent)) * 10
          ) / 10,
          y: Math.round(
            Math.max(0, Math.min(100, initialTransform.y + deltaYPercent)) * 10
          ) / 10,
        });
      } else if (target === 'rotate') {
        const angleNow = Math.atan2(y - initialBox.centerY, x - initialBox.centerX);
        const angleStart = Math.atan2(
          startY - initialBox.centerY,
          startX - initialBox.centerX
        );
        const deltaAngleDeg = ((angleNow - angleStart) * 180) / Math.PI;
        let newRot = Math.round(initialTransform.rotation + deltaAngleDeg);
        while (newRot > 180) newRot -= 360;
        while (newRot < -180) newRot += 360;
        onUpdateOverlayTransform({ rotation: newRot });
      } else if (target.startsWith('scale')) {
        const distNow = Math.hypot(x - initialBox.centerX, y - initialBox.centerY);
        const distStart = Math.hypot(
          startX - initialBox.centerX,
          startY - initialBox.centerY
        );
        if (distStart > 0) {
          const factor = distNow / distStart;
          const newScale = Math.max(
            0.1,
            Math.min(3.0, Math.round(initialTransform.scale * factor * 100) / 100)
          );
          onUpdateOverlayTransform({ scale: newScale });
        }
      }
    }

    // B. Dragging Text Overlay
    if (dragTypeRef.current === 'text' && initialText && selectedTextId) {
      if (target === 'move') {
        const deltaXPercent = (dx / dimensions.width) * 100;
        const deltaYPercent = (dy / dimensions.height) * 100;
        onUpdateText(selectedTextId, {
          x: Math.round(
            Math.max(0, Math.min(100, initialText.x + deltaXPercent)) * 10
          ) / 10,
          y: Math.round(
            Math.max(0, Math.min(100, initialText.y + deltaYPercent)) * 10
          ) / 10,
        });
      } else if (target === 'rotate') {
        const angleNow = Math.atan2(y - initialBox.centerY, x - initialBox.centerX);
        const angleStart = Math.atan2(
          startY - initialBox.centerY,
          startX - initialBox.centerX
        );
        const deltaAngleDeg = ((angleNow - angleStart) * 180) / Math.PI;
        let newRot = Math.round(initialText.rotation + deltaAngleDeg);
        while (newRot > 180) newRot -= 360;
        while (newRot < -180) newRot += 360;
        onUpdateText(selectedTextId, { rotation: newRot });
      } else if (target.startsWith('scale')) {
        const distNow = Math.hypot(x - initialBox.centerX, y - initialBox.centerY);
        const distStart = Math.hypot(
          startX - initialBox.centerX,
          startY - initialBox.centerY
        );
        if (distStart > 0) {
          const factor = distNow / distStart;
          const newScale = Math.max(
            0.2,
            Math.min(3.0, Math.round(initialText.scale * factor * 100) / 100)
          );
          onUpdateText(selectedTextId, { scale: newScale });
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveDragTarget('none');
    dragStartRef.current = null;
    dragTypeRef.current = null;
  };

  // Cursor style
  const getCursor = () => {
    if (isEyedropperActive) return 'crosshair';
    if (isDragging) {
      if (activeDragTarget === 'move') return 'grabbing';
      if (activeDragTarget === 'rotate') return 'grab';
      return 'nwse-resize';
    }
    if (hoveredTarget === 'move') return 'move';
    if (hoveredTarget === 'rotate') return 'grab';
    if (hoveredTarget === 'scale-tl' || hoveredTarget === 'scale-br')
      return 'nwse-resize';
    if (hoveredTarget === 'scale-tr' || hoveredTarget === 'scale-bl')
      return 'nesw-resize';
    return 'default';
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`preview-container ${isFullscreen ? 'fullscreen' : ''}`}
    >
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{ cursor: getCursor() }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Floating Quick Controls Toolbar */}
        <div className="canvas-toolbar">
          <button
            className={`canvas-tool-btn ${showGizmo ? 'active' : ''}`}
            onClick={() => setShowGizmo(!showGizmo)}
            title={showGizmo ? 'Hide transform box' : 'Show transform box'}
          >
            {showGizmo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            className={`canvas-tool-btn ${isEyedropperActive ? 'active-pulse' : ''}`}
            onClick={() => setIsEyedropperActive(!isEyedropperActive)}
            title="Eyedropper: Click anywhere to sample green screen color"
          >
            <Pipette className="w-4 h-4" />
          </button>

          <button
            className="canvas-tool-btn"
            onClick={() =>
              onUpdateOverlayTransform({ x: 50, y: 50, rotation: 0, scale: 0.6 })
            }
            title="Reset overlay to center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            className="canvas-tool-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Floating Text Indicator */}
        {selectedTextId && (
          <div className="text-selection-pill">
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span>Editing Text Overlay</span>
            <button
              className="text-xs text-slate-400 hover:text-white ml-1 underline"
              onClick={() => onSelectText(null)}
            >
              Done
            </button>
          </div>
        )}

        {/* Floating Eyedropper Hint */}
        {isEyedropperActive && (
          <div className="eyedropper-banner">
            <Crosshair className="w-4 h-4 animate-spin text-amber-300" />
            <span>Click on the video canvas to pick the chroma key color</span>
            <button
              className="text-xs underline ml-2 opacity-80 hover:opacity-100"
              onClick={() => setIsEyedropperActive(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
