export interface ExportOptions {
  canvas: HTMLCanvasElement;
  audioTracks: MediaStreamTrack[];
  bgVideo: HTMLVideoElement | null;
  overlayVideo: HTMLVideoElement | null;
  customAudio?: HTMLAudioElement | null;
  duration: number;
  fps?: number;
  onProgress: (percent: number, currentTime: number, totalTime: number) => void;
}

export class VideoExporter {
  private mediaRecorder: MediaRecorder | null = null;
  private isCancelled = false;
  private recordedChunks: Blob[] = [];

  public static getSupportedMimeType(): string {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
    ];

    for (const mime of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }
    return 'video/webm';
  }

  public cancel() {
    this.isCancelled = true;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignored
      }
    }
  }

  public async exportVideo(options: ExportOptions): Promise<Blob> {
    this.isCancelled = false;
    this.recordedChunks = [];

    const {
      canvas,
      audioTracks,
      bgVideo,
      overlayVideo,
      customAudio,
      duration,
      fps = 30,
      onProgress,
    } = options;

    if (duration <= 0) {
      throw new Error('Video duration must be greater than zero.');
    }

    // Capture visual stream from canvas
    const canvasStream = canvas.captureStream(fps);
    const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks(), ...audioTracks];
    const combinedStream = new MediaStream(combinedTracks);

    const mimeType = VideoExporter.getSupportedMimeType();
    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 8_000_000, // 8 Mbps high quality
    });
    this.mediaRecorder = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    // Prepare media at start
    if (bgVideo) {
      bgVideo.pause();
      bgVideo.currentTime = 0;
    }
    if (overlayVideo) {
      overlayVideo.pause();
      overlayVideo.currentTime = 0;
    }
    if (customAudio) {
      customAudio.pause();
      customAudio.currentTime = 0;
    }

    // Wait a brief tick for seek to settle
    await new Promise((resolve) => setTimeout(resolve, 200));

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        if (this.isCancelled) {
          reject(new Error('Export was cancelled by user.'));
          return;
        }

        const blob = new Blob(this.recordedChunks, {
          type: mimeType.split(';')[0] || 'video/webm',
        });
        resolve(blob);
      };

      recorder.onerror = (e) => {
        reject(new Error('MediaRecorder error: ' + String(e)));
      };

      recorder.start(100);

      // Play media in sync
      const playPromises: Promise<void>[] = [];
      if (bgVideo) playPromises.push(bgVideo.play().catch(() => {}));
      if (overlayVideo) playPromises.push(overlayVideo.play().catch(() => {}));
      if (customAudio) playPromises.push(customAudio.play().catch(() => {}));

      Promise.all(playPromises);

      const startTime = performance.now();
      const checkInterval = 100; // ms

      const intervalId = setInterval(() => {
        if (this.isCancelled) {
          clearInterval(intervalId);
          if (bgVideo) bgVideo.pause();
          if (overlayVideo) overlayVideo.pause();
          if (customAudio) customAudio.pause();
          return;
        }

        const elapsed = (performance.now() - startTime) / 1000;
        const currentT = Math.min(elapsed, duration);
        const percent = Math.min(100, Math.round((currentT / duration) * 100));

        onProgress(percent, currentT, duration);

        if (elapsed >= duration) {
          clearInterval(intervalId);
          if (bgVideo) bgVideo.pause();
          if (overlayVideo) overlayVideo.pause();
          if (customAudio) customAudio.pause();
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        }
      }, checkInterval);
    });
  }
}
