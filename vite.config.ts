import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin, type ViteDevServer, type PreviewServer } from 'vite'
import { Readable } from 'node:stream'

// Function to resolve Pinterest pin/shortlink to direct video or image URL
async function extractPinterestMedia(inputUrl: string): Promise<{
  success: boolean;
  mediaType?: 'video' | 'image';
  mediaUrl?: string;
  title?: string;
  thumbnailUrl?: string;
  originalUrl?: string;
  resolvedUrl?: string;
  error?: string;
}> {
  try {
    let target = inputUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }

    const res = await fetch(target, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      return {
        success: false,
        error: `Pinterest returned HTTP status ${res.status}`,
      };
    }

    const finalUrl = res.url;
    const html = await res.text();

    // 1. JSON-LD VideoObject check
    const jsonLdMatches = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi
    );
    if (jsonLdMatches) {
      for (const block of jsonLdMatches) {
        const content = block.replace(/<\/?script[^>]*>/gi, '').trim();
        try {
          const parsed = JSON.parse(content);
          if (parsed['@type'] === 'VideoObject' && parsed.contentUrl) {
            return {
              success: true,
              mediaType: 'video',
              mediaUrl: parsed.contentUrl,
              title: parsed.name,
              thumbnailUrl: parsed.thumbnailUrl,
              originalUrl: inputUrl,
              resolvedUrl: finalUrl,
            };
          }
        } catch {
          // ignore JSON-LD parse errors
        }
      }
    }

    // 2. Direct MP4 videos on pinimg CDN (e.g. expMp4)
    const mp4Matches = html.match(
      /https?:\\?\/\\?\/v\d*\.pinimg\.com\\?\/videos\\?\/[^\s"'<>]+\.mp4/gi
    );
    if (mp4Matches && mp4Matches.length > 0) {
      const cleanUrls = Array.from(
        new Set(mp4Matches.map((u) => u.replace(/\\\//g, '/')))
      );
      const best =
        cleanUrls.find((u) => u.includes('720w') || u.includes('1080w')) ||
        cleanUrls[0];
      return {
        success: true,
        mediaType: 'video',
        mediaUrl: best,
        originalUrl: inputUrl,
        resolvedUrl: finalUrl,
      };
    }

    // 3. m3u8 HLS converted to expMp4 720w
    const hlsMatches = html.match(
      /https?:\\?\/\\?\/v\d*\.pinimg\.com\\?\/videos\\?\/iht\\?\/hls\\?\/([0-9a-fA-F/]+)\.m3u8/i
    );
    if (hlsMatches && hlsMatches[1]) {
      const pathParts = hlsMatches[1].replace(/\\\//g, '/');
      const candidateMp4 = `https://v1.pinimg.com/videos/iht/expMp4/${pathParts}_720w.mp4`;
      return {
        success: true,
        mediaType: 'video',
        mediaUrl: candidateMp4,
        originalUrl: inputUrl,
        resolvedUrl: finalUrl,
      };
    }

    // 4. Any other MP4 URL found in page
    const genericMp4 = html.match(/https?:\\?\/\\?\/[^\s"'<>]+\.mp4/gi);
    if (genericMp4 && genericMp4.length > 0) {
      const cleanUrls = Array.from(
        new Set(genericMp4.map((u) => u.replace(/\\\//g, '/')))
      );
      const best =
        cleanUrls.find((u) => u.includes('720w') || u.includes('1080w')) ||
        cleanUrls[0];
      return {
        success: true,
        mediaType: 'video',
        mediaUrl: best,
        originalUrl: inputUrl,
        resolvedUrl: finalUrl,
      };
    }

    // 5. Image pins: check originals or 736x
    const origImages = html.match(
      /https?:\\?\/\\?\/i\.pinimg\.com\\?\/originals\\?\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi
    );
    if (origImages && origImages.length > 0) {
      return {
        success: true,
        mediaType: 'image',
        mediaUrl: origImages[0].replace(/\\\//g, '/'),
        originalUrl: inputUrl,
        resolvedUrl: finalUrl,
      };
    }

    const img736 = html.match(
      /https?:\\?\/\\?\/i\.pinimg\.com\\?\/736x\\?\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi
    );
    if (img736 && img736.length > 0) {
      return {
        success: true,
        mediaType: 'image',
        mediaUrl: img736[0].replace(/\\\//g, '/'),
        originalUrl: inputUrl,
        resolvedUrl: finalUrl,
      };
    }

    return {
      success: false,
      error:
        'Could not find any video or high-resolution image on this Pinterest pin.',
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Unknown error during Pinterest resolution',
    };
  }
}

function registerMediaMiddlewares(server: ViteDevServer | PreviewServer) {
  // 1. Resolve Pinterest URL to direct media endpoint
  server.middlewares.use('/api/resolve-pinterest', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const queryIndex = req.url ? req.url.indexOf('?url=') : -1;
    if (queryIndex === -1) {
      res.statusCode = 400;
      res.end(
        JSON.stringify({ success: false, error: 'Missing ?url= parameter' })
      );
      return;
    }

    const targetUrl = decodeURIComponent(req.url!.slice(queryIndex + 5));
    try {
      const result = await extractPinterestMedia(targetUrl);
      res.statusCode = result.success ? 200 : 422;
      res.end(JSON.stringify(result));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: msg }));
    }
  });

  // 2. Proxy streaming media with CORS & auto Pinterest resolution
  server.middlewares.use('/api/proxy-media', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const queryIndex = req.url ? req.url.indexOf('?url=') : -1;
    if (queryIndex === -1) {
      res.statusCode = 400;
      res.end('Missing ?url= parameter');
      return;
    }

    let targetUrl = decodeURIComponent(req.url!.slice(queryIndex + 5)).trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Auto-resolve if user passes a Pinterest pin link directly to proxy-media
    if (
      /pin\.it\//i.test(targetUrl) ||
      /pinterest\.[a-z.]+\/pin\//i.test(targetUrl)
    ) {
      const pinRes = await extractPinterestMedia(targetUrl);
      if (!pinRes.success || !pinRes.mediaUrl) {
        res.statusCode = 404;
        res.end(`Failed to resolve Pinterest media: ${pinRes.error}`);
        return;
      }
      targetUrl = pinRes.mediaUrl;
    }

    try {
      const reqHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://www.pinterest.com/',
        Accept: '*/*',
      };
      if (req.headers.range) {
        reqHeaders['range'] = req.headers.range as string;
      }

      const upstreamRes = await fetch(targetUrl, {
        headers: reqHeaders,
      });

      if (!upstreamRes.ok && upstreamRes.status !== 206) {
        res.statusCode = upstreamRes.status;
        res.end(`Upstream returned ${upstreamRes.status}`);
        return;
      }

      res.statusCode = upstreamRes.status;
      const contentType =
        upstreamRes.headers.get('content-type') ||
        (targetUrl.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream');
      const contentLength = upstreamRes.headers.get('content-length');
      const contentRange = upstreamRes.headers.get('content-range');
      const acceptRanges = upstreamRes.headers.get('accept-ranges') || 'bytes';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', acceptRanges);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (contentRange) res.setHeader('Content-Range', contentRange);

      if (upstreamRes.body) {
        const readable = Readable.fromWeb(upstreamRes.body as any);
        readable.pipe(res);
      } else {
        const buf = await upstreamRes.arrayBuffer();
        res.end(Buffer.from(buf));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      res.statusCode = 502;
      res.end(`Failed to proxy media: ${msg}`);
    }
  });
}

function mediaProxyPlugin(): Plugin {
  return {
    name: 'media-proxy-plugin',
    configureServer(server) {
      registerMediaMiddlewares(server);
    },
    configurePreviewServer(server) {
      registerMediaMiddlewares(server);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mediaProxyPlugin()],
})
