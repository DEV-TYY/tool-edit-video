import type {
  BackgroundSettings,
  OverlaySettings,
  LayerTransform,
  VideoFilter,
  TextOverlay,
} from '../types';

export interface BoundingBox {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number; // radians
  corners: { x: number; y: number }[];
  rotateHandle: { x: number; y: number };
}

export type HitTarget =
  | 'none'
  | 'move'
  | 'rotate'
  | 'scale-tl'
  | 'scale-tr'
  | 'scale-bl'
  | 'scale-br';

export class CanvasCompositor {
  public static getFilterString(filter?: VideoFilter): string {
    if (!filter) return 'none';
    const parts: string[] = [];

    // Preset base effects
    switch (filter.preset) {
      case 'bnw':
        parts.push('grayscale(100%)');
        break;
      case 'sepia':
        parts.push('sepia(80%)');
        break;
      case 'vintage':
        parts.push('sepia(45%) contrast(110%) saturate(125%)');
        break;
      case 'cyberpunk':
        parts.push('hue-rotate(285deg) saturate(190%) contrast(125%)');
        break;
      case 'warm':
        parts.push('sepia(25%) saturate(145%) hue-rotate(-12deg)');
        break;
      case 'cool':
        parts.push('hue-rotate(180deg) saturate(115%) brightness(105%)');
        break;
      case 'dramatic':
        parts.push('contrast(160%) brightness(90%) saturate(130%)');
        break;
      case 'invert':
        parts.push('invert(100%)');
        break;
    }

    if (filter.brightness !== 100) parts.push(`brightness(${filter.brightness}%)`);
    if (filter.contrast !== 100) parts.push(`contrast(${filter.contrast}%)`);
    if (filter.saturation !== 100) parts.push(`saturate(${filter.saturation}%)`);
    if (filter.hueRotate !== 0) parts.push(`hue-rotate(${filter.hueRotate}deg)`);
    if (filter.blur > 0) parts.push(`blur(${filter.blur}px)`);

    return parts.length > 0 ? parts.join(' ') : 'none';
  }

  public static calculateOverlayRect(
    canvasWidth: number,
    canvasHeight: number,
    videoWidth: number,
    videoHeight: number,
    transform: LayerTransform
  ): {
    centerX: number;
    centerY: number;
    drawWidth: number;
    drawHeight: number;
  } {
    const centerX = (transform.x / 100) * canvasWidth;
    const centerY = (transform.y / 100) * canvasHeight;

    const baseWidth = canvasWidth * 0.5;
    const aspect = videoHeight > 0 ? videoWidth / videoHeight : 16 / 9;
    const drawWidth = baseWidth * transform.scale;
    const drawHeight = drawWidth / aspect;

    return { centerX, centerY, drawWidth, drawHeight };
  }

  public static getBoundingBox(
    canvasWidth: number,
    canvasHeight: number,
    videoWidth: number,
    videoHeight: number,
    transform: LayerTransform
  ): BoundingBox {
    const { centerX, centerY, drawWidth, drawHeight } = this.calculateOverlayRect(
      canvasWidth,
      canvasHeight,
      videoWidth,
      videoHeight,
      transform
    );

    const rad = (transform.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const hw = drawWidth / 2;
    const hh = drawHeight / 2;

    const localCorners = [
      { x: -hw, y: -hh }, // top-left
      { x: hw, y: -hh },  // top-right
      { x: hw, y: hh },   // bottom-right
      { x: -hw, y: hh },  // bottom-left
    ];

    const corners = localCorners.map((pt) => ({
      x: centerX + pt.x * cos - pt.y * sin,
      y: centerY + pt.x * sin + pt.y * cos,
    }));

    // Rotate handle is 30px above the top center
    const handleDist = hh + 30;
    const rotateHandle = {
      x: centerX + handleDist * sin,
      y: centerY - handleDist * cos,
    };

    return {
      centerX,
      centerY,
      width: drawWidth,
      height: drawHeight,
      rotation: rad,
      corners,
      rotateHandle,
    };
  }

  public static getTextBoundingBox(
    canvasWidth: number,
    canvasHeight: number,
    textItem: TextOverlay
  ): BoundingBox {
    const centerX = (textItem.x / 100) * canvasWidth;
    const centerY = (textItem.y / 100) * canvasHeight;

    const approxCharWidth = textItem.fontSize * 0.58;
    const textLen = Math.max(1, textItem.text.length);
    const drawWidth = Math.max(50, textLen * approxCharWidth * textItem.scale + 24);
    const drawHeight = Math.max(34, textItem.fontSize * 1.3 * textItem.scale + 16);

    const rad = (textItem.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const hw = drawWidth / 2;
    const hh = drawHeight / 2;

    const localCorners = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh },
    ];

    const corners = localCorners.map((pt) => ({
      x: centerX + pt.x * cos - pt.y * sin,
      y: centerY + pt.x * sin + pt.y * cos,
    }));

    const handleDist = hh + 25;
    const rotateHandle = {
      x: centerX + handleDist * sin,
      y: centerY - handleDist * cos,
    };

    return {
      centerX,
      centerY,
      width: drawWidth,
      height: drawHeight,
      rotation: rad,
      corners,
      rotateHandle,
    };
  }

  public static hitTest(
    mouseX: number,
    mouseY: number,
    box: BoundingBox
  ): HitTarget {
    const handleRadius = 10;

    // Check rotate handle
    const distRotate = Math.hypot(
      mouseX - box.rotateHandle.x,
      mouseY - box.rotateHandle.y
    );
    if (distRotate <= handleRadius + 4) {
      return 'rotate';
    }

    // Check corner handles
    const targets: HitTarget[] = [
      'scale-tl',
      'scale-tr',
      'scale-br',
      'scale-bl',
    ];
    for (let i = 0; i < 4; i++) {
      const c = box.corners[i];
      if (Math.hypot(mouseX - c.x, mouseY - c.y) <= handleRadius + 4) {
        return targets[i];
      }
    }

    // Check inside bounding box
    const dx = mouseX - box.centerX;
    const dy = mouseY - box.centerY;
    const cos = Math.cos(-box.rotation);
    const sin = Math.sin(-box.rotation);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    const hw = box.width / 2;
    const hh = box.height / 2;

    if (
      localX >= -hw &&
      localX <= hw &&
      localY >= -hh &&
      localY <= hh
    ) {
      return 'move';
    }

    return 'none';
  }

  public static renderBackground(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    bgSettings: BackgroundSettings,
    bgSource: HTMLVideoElement | HTMLImageElement | null
  ) {
    ctx.save();

    // Default background color
    ctx.fillStyle = bgSettings.solidColor || '#0f172a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (
      bgSource &&
      ((bgSource instanceof HTMLVideoElement && bgSource.videoWidth > 0) ||
        (bgSource instanceof HTMLImageElement && bgSource.naturalWidth > 0))
    ) {
      const srcW =
        bgSource instanceof HTMLVideoElement
          ? bgSource.videoWidth
          : bgSource.naturalWidth;
      const srcH =
        bgSource instanceof HTMLVideoElement
          ? bgSource.videoHeight
          : bgSource.naturalHeight;

      // Apply Filter
      const filterStr = this.getFilterString(bgSettings.filter);
      if (filterStr !== 'none') {
        ctx.filter = filterStr;
      }

      // Apply Background Flip & Rotation around canvas center
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      if (bgSettings.rotation) {
        ctx.rotate((bgSettings.rotation * Math.PI) / 180);
      }
      ctx.scale(bgSettings.flipH ? -1 : 1, bgSettings.flipV ? -1 : 1);
      ctx.translate(-canvasWidth / 2, -canvasHeight / 2);

      if (bgSettings.fit === 'fill') {
        ctx.drawImage(bgSource, 0, 0, canvasWidth, canvasHeight);
      } else if (bgSettings.fit === 'contain') {
        const ratio = Math.min(canvasWidth / srcW, canvasHeight / srcH);
        const w = srcW * ratio;
        const h = srcH * ratio;
        const x = (canvasWidth - w) / 2;
        const y = (canvasHeight - h) / 2;
        ctx.drawImage(bgSource, x, y, w, h);
      } else {
        // 'cover'
        const ratio = Math.max(canvasWidth / srcW, canvasHeight / srcH);
        const w = srcW * ratio;
        const h = srcH * ratio;
        const x = (canvasWidth - w) / 2;
        const y = (canvasHeight - h) / 2;
        ctx.drawImage(bgSource, x, y, w, h);
      }
    } else {
      // Draw subtle studio grid if no background loaded
      this.drawStudioGrid(ctx, canvasWidth, canvasHeight);
    }

    ctx.restore();
  }

  private static drawStudioGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '500 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No background video uploaded', width / 2, height / 2);
    ctx.restore();
  }

  public static renderOverlay(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    keyedCanvas: HTMLCanvasElement,
    overlaySettings: OverlaySettings
  ) {
    if (keyedCanvas.width === 0 || keyedCanvas.height === 0) return;

    const { centerX, centerY, drawWidth, drawHeight } = this.calculateOverlayRect(
      canvasWidth,
      canvasHeight,
      keyedCanvas.width,
      keyedCanvas.height,
      overlaySettings.transform
    );

    ctx.save();

    // Apply Filter to Overlay
    const filterStr = this.getFilterString(overlaySettings.filter);
    if (filterStr !== 'none') {
      ctx.filter = filterStr;
    }

    ctx.translate(centerX, centerY);
    ctx.rotate((overlaySettings.transform.rotation * Math.PI) / 180);
    ctx.scale(
      overlaySettings.transform.flipH ? -1 : 1,
      overlaySettings.transform.flipV ? -1 : 1
    );
    ctx.globalAlpha = overlaySettings.transform.opacity;

    ctx.drawImage(
      keyedCanvas,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();
  }

  public static renderText(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    textItem: TextOverlay
  ) {
    if (!textItem.text.trim()) return;
    const x = (textItem.x / 100) * canvasWidth;
    const y = (textItem.y / 100) * canvasHeight;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((textItem.rotation * Math.PI) / 180);
    ctx.scale(textItem.scale, textItem.scale);
    ctx.globalAlpha = textItem.opacity;

    const fontStyle = `${textItem.italic ? 'italic ' : ''}${
      textItem.bold ? 'bold ' : ''
    }${textItem.fontSize}px "${textItem.fontFamily}", sans-serif`;
    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(textItem.text);
    const textWidth = metrics.width;
    const textHeight = textItem.fontSize * 1.25;

    // Background pill/box
    if (
      textItem.backgroundColor &&
      textItem.backgroundColor !== 'transparent'
    ) {
      ctx.fillStyle = textItem.backgroundColor;
      const padX = 14;
      const padY = 8;
      ctx.beginPath();
      ctx.roundRect(
        -textWidth / 2 - padX,
        -textHeight / 2 - padY,
        textWidth + padX * 2,
        textHeight + padY * 2,
        8
      );
      ctx.fill();
    }

    // Shadow
    if (textItem.shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;
    } else {
      ctx.shadowColor = 'transparent';
    }

    // Stroke outline
    if (
      textItem.strokeWidth > 0 &&
      textItem.strokeColor &&
      textItem.strokeColor !== 'transparent'
    ) {
      ctx.strokeStyle = textItem.strokeColor;
      ctx.lineWidth = textItem.strokeWidth;
      ctx.lineJoin = 'round';
      ctx.strokeText(textItem.text, 0, 0);
    }

    // Text fill
    ctx.fillStyle = textItem.color;
    ctx.fillText(textItem.text, 0, 0);

    ctx.restore();
  }

  public static renderGizmo(
    ctx: CanvasRenderingContext2D,
    box: BoundingBox,
    hoveredTarget: HitTarget,
    isDragging: boolean,
    color: string = '#38bdf8'
  ) {
    ctx.save();

    // Draw connecting line to rotate handle
    const topCenter = {
      x: (box.corners[0].x + box.corners[1].x) / 2,
      y: (box.corners[0].y + box.corners[1].y) / 2,
    };
    ctx.beginPath();
    ctx.moveTo(topCenter.x, topCenter.y);
    ctx.lineTo(box.rotateHandle.x, box.rotateHandle.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw bounding box polygon
    ctx.beginPath();
    ctx.moveTo(box.corners[0].x, box.corners[0].y);
    for (let i = 1; i < 4; i++) {
      ctx.lineTo(box.corners[i].x, box.corners[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = hoveredTarget === 'move' || isDragging ? '#60a5fa' : color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center pivot dot
    ctx.beginPath();
    ctx.arc(box.centerX, box.centerY, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Draw rotate handle
    ctx.beginPath();
    ctx.arc(box.rotateHandle.x, box.rotateHandle.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = hoveredTarget === 'rotate' ? color : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw corner handles
    const targets: HitTarget[] = [
      'scale-tl',
      'scale-tr',
      'scale-br',
      'scale-bl',
    ];
    for (let i = 0; i < 4; i++) {
      const c = box.corners[i];
      const isTargetHovered = hoveredTarget === targets[i];
      ctx.fillStyle = isTargetHovered ? color : '#ffffff';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(c.x - 6, c.y - 6, 12, 12);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}
