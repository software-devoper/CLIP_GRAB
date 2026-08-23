import express, { Request, Response } from 'express';
import { isValidYouTubeUrl, normalizeYouTubeUrl } from '../src/lib/validators.js';
import { checkRateLimit } from '../src/lib/rateLimit.js';
import { fetchVideoInfo, spawnDownloadStream, sanitizeFilename } from '../src/lib/ytdlp.js';
import { FetchInfoResponse } from '../src/types.js';

const app = express();

app.use(express.json());

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ClipGrab', timestamp: new Date().toISOString() });
});

// Fetch info
app.post('/api/fetch-info', async (req: Request, res: Response): Promise<void> => {
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp);

  if (!rateCheck.allowed) {
    const errorResponse: FetchInfoResponse = {
      success: false,
      error: 'Too many requests. Please wait a moment before trying again.',
      errorCode: 'RATE_LIMITED',
    };
    res.status(429).json(errorResponse);
    return;
  }

  const { url } = req.body;

  if (!url || typeof url !== 'string' || !isValidYouTubeUrl(url)) {
    const errorResponse: FetchInfoResponse = {
      success: false,
      error: 'Please provide a valid YouTube video URL or ID.',
      errorCode: 'INVALID_URL',
    };
    res.status(400).json(errorResponse);
    return;
  }

  const normalizedUrl = normalizeYouTubeUrl(url);

  try {
    const info = await fetchVideoInfo(normalizedUrl);
    res.json({
      success: true,
      metadata: info.metadata,
      formats: info.formats,
    });
  } catch (err: any) {
    console.error('Extraction error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to extract video information.',
      errorCode: err.code || 'SERVER_ERROR',
    });
  }
});

// Download stream
app.get('/api/download', (req: Request, res: Response): void => {
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

  const { child, stream, targetExt, contentType } = spawnDownloadStream({
    url: normalizedUrl,
    formatId,
    title: customTitle,
    artist: customArtist,
    duration: customDuration,
    signal: abortController.signal,
  });

  const ext = rawExt || targetExt;
  const sanitizedTitle = sanitizeFilename(customTitle);
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
      console.error('Child process error in Vercel API handler:', err);
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

  sendHeadersIfNeeded();
  res.end();
});

export default app;
