/**
 * Full-stack Express server for ClipGrab
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { isValidYouTubeUrl, normalizeYouTubeUrl } from './src/lib/validators.js';
import { checkRateLimit } from './src/lib/rateLimit.js';
import { fetchVideoInfo, spawnDownloadStream, sanitizeFilename } from './src/lib/ytdlp.js';
import { FetchInfoResponse } from './src/types.js';

const getRootDir = () => {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    return path.dirname(fileURLToPath(import.meta.url));
  }
  return process.cwd();
};

const app = express();
const PORT = 3000;

// Enable JSON body parser
app.use(express.json());

// Helper to get client IP
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

/**
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ClipGrab', timestamp: new Date().toISOString() });
});

/**
 * POST /api/fetch-info
 * Extracts metadata and categorized formats for a given YouTube URL
 */
app.post('/api/fetch-info', async (req: Request, res: Response): Promise<void> => {
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp);

  if (!rateCheck.allowed) {
    const errorResponse: FetchInfoResponse = {
      success: false,
      error: `Rate limit exceeded. Please wait ${Math.ceil(rateCheck.resetTimeMs / 1000)} seconds before trying again.`,
      errorCode: 'RATE_LIMITED',
    };
    res.status(429).json(errorResponse);
    return;
  }

  const { url } = req.body || {};

  if (!url || typeof url !== 'string' || !isValidYouTubeUrl(url)) {
    const errorResponse: FetchInfoResponse = {
      success: false,
      error: 'Please enter a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=...)',
      errorCode: 'INVALID_URL',
    };
    res.status(400).json(errorResponse);
    return;
  }

  const normalizedUrl = normalizeYouTubeUrl(url);

  // Set up an abort controller for timeout (default 45s)
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, 45000);

  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
    clearTimeout(timeoutId);
  });

  try {
    const result = await fetchVideoInfo(normalizedUrl, abortController.signal);
    clearTimeout(timeoutId);

    // Check optional MAX_DOWNLOAD_DURATION_SECONDS
    const maxDuration = parseInt(process.env.MAX_DOWNLOAD_DURATION_SECONDS || '0', 10);
    if (maxDuration > 0 && result.metadata.duration > maxDuration) {
      const errorResponse: FetchInfoResponse = {
        success: false,
        error: `Video exceeds the maximum allowed length of ${Math.round(maxDuration / 60)} minutes.`,
        errorCode: 'SERVER_ERROR',
      };
      res.status(400).json(errorResponse);
      return;
    }

    const response: FetchInfoResponse = {
      success: true,
      metadata: result.metadata,
      formats: result.formats,
    };

    res.json(response);
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (abortController.signal.aborted) {
      res.status(408).json({
        success: false,
        error: 'The request took too long to process. Please try again later.',
        errorCode: 'TIMEOUT',
      });
      return;
    }

    const errorCode = err.errorCode || 'SERVER_ERROR';
    const message = err.message || 'An unexpected error occurred while extracting video data.';

    res.status(errorCode === 'VIDEO_NOT_FOUND' ? 404 : 500).json({
      success: false,
      error: message,
      errorCode,
      details: err.stack,
    });
  }
});

/**
 * GET /api/download
 * Direct streaming download handler. Streams video/audio directly to client
 */
app.get('/api/download', (req: Request, res: Response): void => {
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp);

  if (!rateCheck.allowed) {
    res.status(429).send(`Rate limit reached. Please wait ${Math.ceil(rateCheck.resetTimeMs / 1000)} seconds.`);
    return;
  }

  const rawUrl = req.query.url as string;
  const formatId = (req.query.formatId as string) || 'best';
  const customTitle = (req.query.title as string) || 'clipgrab_audio';
  const customArtist = (req.query.artist as string) || 'ClipGrab';
  const customDuration = parseInt((req.query.duration as string) || '180', 10);
  const rawExt = (req.query.ext as string) || '';

  if (!rawUrl || !isValidYouTubeUrl(rawUrl)) {
    res.status(400).send('Invalid or missing YouTube URL.');
    return;
  }

  const normalizedUrl = normalizeYouTubeUrl(rawUrl);
  const abortController = new AbortController();

  // Create stream with audio transcoding and metadata
  const { child, stream, targetExt, contentType } = spawnDownloadStream({
    url: normalizedUrl,
    formatId,
    title: customTitle,
    artist: customArtist,
    duration: customDuration,
    signal: abortController.signal,
  });

  const ext = rawExt || targetExt;
  const sanitizedTitle = sanitizeFilename(customTitle, 'clipgrab_download');
  const safeFilename = `${sanitizedTitle}.${ext}`;
  const encodedFilename = encodeURIComponent(safeFilename);

  let headersSent = false;

  const sendHeadersIfNeeded = () => {
    if (!headersSent && !res.headersSent) {
      headersSent = true;
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeFilename.replace(/"/g, '')}"; filename*=UTF-8''${encodedFilename}`
      );
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  };

  if (stream) {
    sendHeadersIfNeeded();
    stream.pipe(res);
    req.on('close', () => {
      abortController.abort();
    });
    return;
  }

  if (child && child.stdout) {
    child.stdout.on('data', (chunk) => {
      sendHeadersIfNeeded();
      res.write(chunk);
    });

    child.stdout.on('end', () => {
      sendHeadersIfNeeded();
      res.end();
    });

    child.stderr?.on('data', (data) => {
      if (process.env.DEBUG) {
        console.error(`[media stderr]: ${data.toString().slice(0, 100)}`);
      }
    });

    child.on('error', (err) => {
      console.error('Child process error, piping pure stream fallback:', err);
      if (!headersSent && !res.headersSent) {
        const fallback = spawnDownloadStream({
          url: normalizedUrl,
          formatId: 'wav',
          title: customTitle,
          artist: customArtist,
          duration: customDuration,
        });
        if (fallback.stream) {
          sendHeadersIfNeeded();
          fallback.stream.pipe(res);
        } else {
          res.status(500).send(`Streaming error: ${err.message}`);
        }
      } else {
        res.end();
      }
    });

    child.on('close', (code) => {
      if (code !== 0 && !headersSent && !res.headersSent) {
        const fallback = spawnDownloadStream({
          url: normalizedUrl,
          formatId: 'wav',
          title: customTitle,
          artist: customArtist,
          duration: customDuration,
        });
        if (fallback.stream) {
          sendHeadersIfNeeded();
          fallback.stream.pipe(res);
        } else {
          res.status(500).send('Failed to stream media from source.');
        }
      } else {
        res.end();
      }
    });

    // Terminate child process immediately if the browser disconnects or cancels
    req.on('close', () => {
      abortController.abort();
      if (!child.killed) {
        try {
          child.kill('SIGTERM');
        } catch {
          // Ignored
        }
      }
    });
    return;
  }

  // Final fallback
  sendHeadersIfNeeded();
  res.end();
});

// ----------------------------------------------------
// VITE & STATIC SERVING
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClipGrab server active at http://0.0.0.0:${PORT}`);
  });
}

startServer();
