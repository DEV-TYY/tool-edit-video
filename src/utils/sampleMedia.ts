/**
 * Generates sample background and green screen videos procedurally
 * using HTML5 Canvas + MediaRecorder and Web Audio API.
 * This allows instant 1-click testing right out of the box!
 */

export async function generateSampleBackgroundVideo(): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  const audioCtx = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const dest = audioCtx.createMediaStreamDestination();

  // Create gentle ambient synth chord
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(dest);

  osc1.start();
  osc2.start();

  const canvasStream = canvas.captureStream(30);
  const stream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const totalFrames = 30 * 5; // 5 seconds @ 30fps
  let frame = 0;

  return new Promise((resolve) => {
    recorder.onstop = () => {
      osc1.stop();
      osc2.stop();
      audioCtx.close();
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(URL.createObjectURL(blob));
    };

    recorder.start();

    function render() {
      const t = frame / 30; // seconds

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 720);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#312e81');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      // Distant mountains
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(0, 520);
      ctx.lineTo(250, 360);
      ctx.lineTo(500, 520);
      ctx.lineTo(750, 340);
      ctx.lineTo(1050, 530);
      ctx.lineTo(1280, 410);
      ctx.lineTo(1280, 720);
      ctx.lineTo(0, 720);
      ctx.closePath();
      ctx.fill();

      // Glowing Synthwave Sun
      const sunY = 380 - Math.sin(t * 0.5) * 20;
      const sunGrad = ctx.createRadialGradient(640, sunY, 10, 640, sunY, 180);
      sunGrad.addColorStop(0, '#fef08a');
      sunGrad.addColorStop(0.4, '#f43f5e');
      sunGrad.addColorStop(0.8, '#8b5cf6');
      sunGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');

      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(640, sunY, 160, 0, Math.PI * 2);
      ctx.fill();

      // Moving Grid Ground
      ctx.save();
      const horizonY = 520;
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, horizonY, 1280, 720 - horizonY);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      const offset = (t * 80) % 40;

      // Horizontal moving grid lines
      for (let y = horizonY; y < 720; y += 20 + (y - horizonY) * 0.4) {
        const adjustedY = y + (offset * (y - horizonY)) / 200;
        if (adjustedY < 720) {
          ctx.beginPath();
          ctx.moveTo(0, adjustedY);
          ctx.lineTo(1280, adjustedY);
          ctx.stroke();
        }
      }

      // Perspective vertical grid lines
      for (let x = -400; x <= 1680; x += 80) {
        ctx.beginPath();
        ctx.moveTo(640, horizonY);
        ctx.lineTo(x, 720);
        ctx.stroke();
      }
      ctx.restore();

      // Moving twinkling stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137.5 + t * 15) % 1280;
        const sy = (i * 47) % 350;
        const radius = (Math.sin(t * 3 + i) + 1.2) * 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(render);
      } else {
        recorder.stop();
      }
    }

    render();
  });
}

export async function generateSampleGreenScreenVideo(): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  const audioCtx = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const dest = audioCtx.createMediaStreamDestination();

  // Bleep bloop sound
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(440, audioCtx.currentTime);

  osc.connect(gain);
  gain.connect(dest);
  osc.start();

  const canvasStream = canvas.captureStream(30);
  const stream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const totalFrames = 30 * 5; // 5 seconds
  let frame = 0;

  return new Promise((resolve) => {
    recorder.onstop = () => {
      osc.stop();
      audioCtx.close();
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(URL.createObjectURL(blob));
    };

    recorder.start();

    function render() {
      const t = frame / 30; // seconds

      // Frequency wobble for cute robot sound
      osc.frequency.setValueAtTime(
        400 + Math.sin(t * 6) * 150 + Math.cos(t * 12) * 80,
        audioCtx.currentTime
      );

      // 1. Pure chroma green background (#00FF00)
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(0, 0, 640, 640);

      // 2. Animated floating character / mascot
      ctx.save();
      const bounce = Math.sin(t * 4) * 25;
      const angle = Math.sin(t * 2) * 0.15;
      const cx = 320;
      const cy = 320 + bounce;

      // Character shadow
      ctx.fillStyle = 'rgba(0, 100, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(320, 520, 90 + bounce * 0.4, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Robot Body (Vibrant Metallic Purple & Cyan)
      const bodyGrad = ctx.createLinearGradient(-80, -90, 80, 90);
      bodyGrad.addColorStop(0, '#38bdf8');
      bodyGrad.addColorStop(0.5, '#818cf8');
      bodyGrad.addColorStop(1, '#c084fc');

      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(-85, -80, 170, 160, 36);
      ctx.fill();
      ctx.stroke();

      // Glass Visor Screen
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.roundRect(-65, -55, 130, 75, 20);
      ctx.fill();

      // Glowing Eyes
      const blink = Math.sin(t * 5) > 0.95 ? 2 : 12;
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;
      // Left eye
      ctx.beginPath();
      ctx.ellipse(-30, -20, 12, blink, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right eye
      ctx.beginPath();
      ctx.ellipse(30, -20, 12, blink, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      // Smiling mouth
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Antenna
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, -80);
      ctx.lineTo(0, -115);
      ctx.stroke();

      // Glowing antenna light
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, -125, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Floating Hands
      const handWaveL = Math.sin(t * 6) * 15;
      const handWaveR = Math.cos(t * 6) * 15;

      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 5;

      // Left hand
      ctx.beginPath();
      ctx.arc(-110, handWaveL, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right hand
      ctx.beginPath();
      ctx.arc(110, handWaveR, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(render);
      } else {
        recorder.stop();
      }
    }

    render();
  });
}
