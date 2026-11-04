import type { ChromaKeySettings } from '../types';

export class WebGLChromaProcessor {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;

  // Uniform locations
  private uImageLoc: WebGLUniformLocation | null = null;
  private uKeyColorLoc: WebGLUniformLocation | null = null;
  private uSimilarityLoc: WebGLUniformLocation | null = null;
  private uSmoothnessLoc: WebGLUniformLocation | null = null;
  private uSpillLoc: WebGLUniformLocation | null = null;
  private uEnabledLoc: WebGLUniformLocation | null = null;

  private isInitialized = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1280;
    this.canvas.height = 720;
    this.initWebGL();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  private initWebGL() {
    this.gl = this.canvas.getContext('webgl', {
      premultipliedAlpha: false,
      alpha: true,
      preserveDrawingBuffer: true,
    });

    if (!this.gl) {
      console.warn('WebGL not supported, will use 2D canvas fallback');
      return;
    }

    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    // Advanced YCbCr chroma keying shader
    const fsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      uniform vec3 u_keyColor;
      uniform float u_similarity;
      uniform float u_smoothness;
      uniform float u_spill;
      uniform bool u_enabled;

      vec3 rgb2ycbcr(vec3 c) {
        float y = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
        float cb = -0.168736 * c.r - 0.331264 * c.g + 0.5 * c.b + 0.5;
        float cr = 0.5 * c.r - 0.418688 * c.g - 0.081312 * c.b + 0.5;
        return vec3(y, cb, cr);
      }

      void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        if (!u_enabled) {
          gl_FragColor = color;
          return;
        }

        vec3 keyYCbCr = rgb2ycbcr(u_keyColor);
        vec3 colorYCbCr = rgb2ycbcr(color.rgb);

        // Distance in CbCr chrominance plane
        float chromDist = distance(colorYCbCr.yz, keyYCbCr.yz);

        float edge0 = u_similarity;
        float edge1 = u_similarity + max(u_smoothness, 0.001);
        float alpha = smoothstep(edge0, edge1, chromDist);

        // Green spill suppression on boundary pixels
        vec3 outRgb = color.rgb;
        if (u_spill > 0.0) {
          float maxNonGreen = max(outRgb.r, outRgb.b);
          if (outRgb.g > maxNonGreen) {
            outRgb.g = mix(outRgb.g, maxNonGreen, u_spill);
          }
        }

        gl_FragColor = vec4(outRgb, color.a * alpha);
      }
    `;

    const gl = this.gl;
    const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);

    if (!vs || !fs) return;

    this.program = gl.createProgram();
    if (!this.program) return;

    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('WebGL Program link error:', gl.getProgramInfoLog(this.program));
      return;
    }

    gl.useProgram(this.program);

    // Get locations
    const posLoc = gl.getAttribLocation(this.program, 'a_position');
    const texLoc = gl.getAttribLocation(this.program, 'a_texCoord');

    this.uImageLoc = gl.getUniformLocation(this.program, 'u_image');
    this.uKeyColorLoc = gl.getUniformLocation(this.program, 'u_keyColor');
    this.uSimilarityLoc = gl.getUniformLocation(this.program, 'u_similarity');
    this.uSmoothnessLoc = gl.getUniformLocation(this.program, 'u_smoothness');
    this.uSpillLoc = gl.getUniformLocation(this.program, 'u_spill');
    this.uEnabledLoc = gl.getUniformLocation(this.program, 'u_enabled');

    // Quad geometry: full clip space [-1, -1] to [1, 1]
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Texture coords (WebGL Y is flipped relative to 2D image)
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        0.0, 0.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0,
      ]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    // Texture setup
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.isInitialized = true;
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private hexToRgb(hex: string): [number, number, number] {
    const cleanHex = hex.replace('#', '');
    const bigint = parseInt(cleanHex, 16);
    if (isNaN(bigint)) return [0, 1, 0];
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;
    return [r, g, b];
  }

  public process(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    settings: ChromaKeySettings
  ): HTMLCanvasElement {
    const gl = this.gl;
    if (!gl || !this.isInitialized || !this.program) {
      return this.fallback2DProcess(source, settings);
    }

    const sourceWidth =
      source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const sourceHeight =
      source instanceof HTMLVideoElement ? source.videoHeight : source.height;

    if (!sourceWidth || !sourceHeight) {
      return this.canvas;
    }

    if (this.canvas.width !== sourceWidth || this.canvas.height !== sourceHeight) {
      this.canvas.width = sourceWidth;
      this.canvas.height = sourceHeight;
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);

    // Upload frame texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    try {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source
      );
    } catch {
      return this.fallback2DProcess(source, settings);
    }

    gl.uniform1i(this.uImageLoc, 0);
    gl.uniform1i(this.uEnabledLoc, settings.enabled ? 1 : 0);

    const [kr, kg, kb] = this.hexToRgb(settings.color);
    gl.uniform3f(this.uKeyColorLoc, kr, kg, kb);
    gl.uniform1f(this.uSimilarityLoc, settings.similarity);
    gl.uniform1f(this.uSmoothnessLoc, settings.smoothness);
    gl.uniform1f(this.uSpillLoc, settings.spill);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return this.canvas;
  }

  // Fallback CPU 2D processing if WebGL is unavailable
  private fallbackCanvas: HTMLCanvasElement | null = null;
  private fallback2DProcess(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    settings: ChromaKeySettings
  ): HTMLCanvasElement {
    if (!this.fallbackCanvas) {
      this.fallbackCanvas = document.createElement('canvas');
    }
    const canvas = this.fallbackCanvas;
    const width =
      source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const height =
      source instanceof HTMLVideoElement ? source.videoHeight : source.height;

    if (!width || !height) return canvas;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvas;

    ctx.drawImage(source, 0, 0, width, height);

    if (!settings.enabled) {
      return canvas;
    }

    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const [kr, kg, kb] = this.hexToRgb(settings.color);

      const keyCb = -0.168736 * kr - 0.331264 * kg + 0.5 * kb + 0.5;
      const keyCr = 0.5 * kr - 0.418688 * kg - 0.081312 * kb + 0.5;

      const sim = settings.similarity;
      const smooth = Math.max(settings.smoothness, 0.001);
      const spill = settings.spill;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;

        const cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 0.5;
        const cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 0.5;

        const dCb = cb - keyCb;
        const dCr = cr - keyCr;
        const dist = Math.sqrt(dCb * dCb + dCr * dCr);

        if (dist < sim) {
          data[i + 3] = 0;
        } else if (dist < sim + smooth) {
          const factor = (dist - sim) / smooth;
          data[i + 3] = Math.floor(data[i + 3] * factor);
        }

        if (spill > 0 && data[i + 3] > 0) {
          const maxRB = Math.max(data[i], data[i + 2]);
          if (data[i + 1] > maxRB) {
            data[i + 1] = Math.floor(data[i + 1] * (1 - spill) + maxRB * spill);
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    } catch {
      // In case canvas is tainted, safely return drawn canvas without crash
    }
    return canvas;
  }
}
