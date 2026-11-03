export class AudioMixer {
  private ctx: AudioContext | null = null;
  private bgGain: GainNode | null = null;
  private overlayGain: GainNode | null = null;
  private customAudioGain: GainNode | null = null;
  private exportDest: MediaStreamAudioDestinationNode | null = null;

  private connectedBgElement: HTMLMediaElement | null = null;
  private connectedOverlayElement: HTMLMediaElement | null = null;
  private connectedCustomAudioElement: HTMLMediaElement | null = null;

  private bgSource: MediaElementAudioSourceNode | null = null;
  private overlaySource: MediaElementAudioSourceNode | null = null;
  private customAudioSource: MediaElementAudioSourceNode | null = null;

  public init() {
    if (this.ctx) return;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.bgGain = this.ctx.createGain();
    this.overlayGain = this.ctx.createGain();
    this.customAudioGain = this.ctx.createGain();
    this.exportDest = this.ctx.createMediaStreamDestination();

    // Route gains to both speakers and export destination
    this.bgGain.connect(this.ctx.destination);
    this.bgGain.connect(this.exportDest);

    this.overlayGain.connect(this.ctx.destination);
    this.overlayGain.connect(this.exportDest);

    this.customAudioGain.connect(this.ctx.destination);
    this.customAudioGain.connect(this.exportDest);
  }

  public async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // User interaction might be required
      }
    }
  }

  public connectBg(element: HTMLMediaElement) {
    this.init();
    if (!this.ctx || !this.bgGain) return;
    if (this.connectedBgElement === element) return;

    try {
      this.connectedBgElement = element;
      this.bgSource = this.ctx.createMediaElementSource(element);
      this.bgSource.connect(this.bgGain);
    } catch {
      // Element might already be connected
    }
  }

  public connectOverlay(element: HTMLMediaElement) {
    this.init();
    if (!this.ctx || !this.overlayGain) return;
    if (this.connectedOverlayElement === element) return;

    try {
      this.connectedOverlayElement = element;
      this.overlaySource = this.ctx.createMediaElementSource(element);
      this.overlaySource.connect(this.overlayGain);
    } catch {
      // Element might already be connected
    }
  }

  public connectCustomAudio(element: HTMLMediaElement) {
    this.init();
    if (!this.ctx || !this.customAudioGain) return;
    if (this.connectedCustomAudioElement === element) return;

    try {
      this.connectedCustomAudioElement = element;
      this.customAudioSource = this.ctx.createMediaElementSource(element);
      this.customAudioSource.connect(this.customAudioGain);
    } catch {
      // Element might already be connected
    }
  }

  public setBgVolume(volume: number, muted: boolean, stripAudio: boolean = false) {
    if (!this.bgGain || !this.ctx) return;
    const val = stripAudio || muted ? 0 : Math.max(0, Math.min(1, volume));
    this.bgGain.gain.setValueAtTime(val, this.ctx.currentTime);
  }

  public setOverlayVolume(volume: number, muted: boolean, stripAudio: boolean = false) {
    if (!this.overlayGain || !this.ctx) return;
    const val = stripAudio || muted ? 0 : Math.max(0, Math.min(1, volume));
    this.overlayGain.gain.setValueAtTime(val, this.ctx.currentTime);
  }

  public setCustomAudioVolume(volume: number, muted: boolean) {
    if (!this.customAudioGain || !this.ctx) return;
    const val = muted ? 0 : Math.max(0, Math.min(1, volume));
    this.customAudioGain.gain.setValueAtTime(val, this.ctx.currentTime);
  }

  public getAudioTracks(): MediaStreamTrack[] {
    if (this.exportDest) {
      return this.exportDest.stream.getAudioTracks();
    }
    return [];
  }
}
