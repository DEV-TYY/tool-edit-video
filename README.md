# ChromaStudio 🎬
### Real-Time Video Background & Green Screen Compositor

A web application built with React, TypeScript, and WebGL to compose videos with background layers, overlaid green-screen video, filters, text captions, and custom audio.

---

## ✨ Features

1. **Background Layer**:
   - Upload background videos (MP4, WebM, MOV) or images (JPG, PNG, WebP) or choose a solid color backdrop.
   - Fit modes: **Cover** (fills canvas), **Contain** (preserves aspect ratio), and **Fill** (stretches).
   - **Flip & Rotate**: Flip Horizontal, Flip Vertical, and Rotate 90°.
   - **Color Filters**: Presets (Vintage, Cyberpunk, Warm, Cool, B&W, Sepia, Dramatic, Invert) + Brightness, Contrast, Saturation sliders.
   - **Remove Original Audio**: One-click button to strip original background audio.

2. **Overlay Layer (Absolute Positioning & Transform)**:
   - Upload any foreground / picture-in-picture / green screen video.
   - **Interactive Canvas Gizmo**: Drag overlay video directly on the preview to move it anywhere, drag corner handles to scale, or drag the top pin to rotate.
   - **Flip & Mirror**: Flip Horizontal, Flip Vertical, and precise rotation.
   - **Color Filters**: Apply color grading directly to the overlay subject.
   - **Remove Original Audio**: Strip overlay audio so only background or custom music plays.

3. **High-Performance WebGL Green Screen Removal (Chroma Key)**:
   - **GPU YCbCr Chrominance Keying**: Fast 60 FPS real-time chroma keying without CPU lag.
   - **Eyedropper Tool**: Click anywhere on the video preview to sample the exact green hue.
   - **Color Presets**: Pure Green (`#00FF00`), Studio Green (`#00B140`), Blue Screen (`#0028FF`), and Magenta (`#FF00FF`).
   - **Fine-Tuning Controls**: Similarity / Range, Edge Smoothness, and Green Spill Suppression.

4. **Text Overlays & Captions**:
   - Add multiple custom text layers (titles, subtitles, memes, badges).
   - Interactive canvas dragging, rotation, and scaling.
   - Customize font family, font size, text color, box/pill background, outline stroke color/width, bold, italic, and drop shadow.

5. **Sound, Music & Audio Stripping**:
   - **Remove Original Video Audio**: Selectively strip background or overlay original audio tracks.
   - **Custom Audio Track (BGM)**: Upload MP3, WAV, AAC soundtracks or voiceover.
   - Independent volume sliders, mute toggles, and loop options.

6. **1-Click Demo Generator**:
   - Click **"Try Demo Sample"** to instantly generate procedural animated synthwave background video + an animated retro green-screen robot + stylized text overlay with synthesized audio chords.

7. **Video Export & Download**:
   - Exports the composite video with synced mixed audio into `.webm` at native resolution (1080p / 720p).
   - Live progress indicator with video preview before downloading.

---

## 🚀 Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
