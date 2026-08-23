# ClipGrab — Technical Specification & Application Architecture

## 1. Overview

**ClipGrab** is a lightweight, stateless, high-performance web application designed to convert and download YouTube videos and audio tracks. Users simply paste a YouTube video URL into a single input field to instantly inspect all available media formats and stream the desired video (with audio), video-only (ultra-high resolution up to 4K/2K), or audio-only (high-bitrate MP3/M4A) streams directly to their browser. The application requires no user accounts, database, logins, or sessions; it streams media on-the-fly directly from `yt-dlp` and `FFmpeg` to client HTTP response streams with zero disk persistence.

---

## 2. Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  USER BROWSER                                     |
|  - Modern Tailwind UI (Dark/Light Mode)                                           |
|  - UrlInputForm & VideoInfoCard Components                                        |
|  - Grouped Category Tabs: Video (with Audio) | Video Only | Audio Only            |
+--------------------------+-----------------------------------+--------------------+
                           |                                   |
                POST /api/fetch-info                   GET /api/download?...
                           |                                   |
+--------------------------v-----------------------------------v--------------------+
|                             CLIPGRAB FULL-STACK SERVER                            |
|  - Express.js HTTP Engine (Port 3000)                                             |
|  - In-Memory Sliding Window Rate Limiter (IP-based)                               |
|  - URL Normalization & Validation Layer (regex for watch/shorts/youtu.be)         |
+--------------------------+-----------------------------------+--------------------+
                           |                                   |
                           | `yt-dlp -J --no-playlist`         | `yt-dlp -f ... -o -`
                           |                                   | (or `-x --audio-format mp3`)
+--------------------------v-----------------------------------v--------------------+
|                         SYSTEM BINARIES / CHILD PROCESS                           |
|  - yt-dlp (Metadata & Stream Extraction)                                          |
|  - FFmpeg (Real-time MP3 / Audio Transcoding & Multiplexing)                      |
+--------------------------+-----------------------------------+--------------------+
                           |                                   |
                JSON Metadata Output                  Direct Chunked stdout Stream
                           |                                   |
                           +-----------------> (Piped directly to Browser Response)
                                               (No intermediate disk writes)
```

---

## 3. Full Tech Stack List

- **Frontend & UI Framework**:
  - React 19 + TypeScript
  - Tailwind CSS v4 (with modern `@tailwindcss/vite` plugin)
  - Lucide React (feather icons, loaders, status indicators)
  - Motion / Transition animations
- **Backend & Server Engine**:
  - Node.js (v20+ LTS)
  - Express.js v4 (JSON body parsing, route handlers, error middleware)
  - `child_process.spawn` (non-blocking streaming and large stdout buffer handling)
- **Media Extraction & Audio Processing**:
  - `yt-dlp` (Latest binary for extracting metadata and media streams)
  - `FFmpeg` (Audio encoding to 320/192/128 kbps MP3 and video muxing)
- **Development & Production Tooling**:
  - Vite 6 (Development middleware and client bundle compiler)
  - `esbuild` (Fast CommonJS server bundling into `dist/server.cjs`)
  - `tsx` (Native TypeScript execution for development server)
- **Containerization**:
  - Docker (Debian Bookworm Slim base with Python 3, FFmpeg, and yt-dlp pre-configured)

---

## 4. API Endpoints

### 4.1. `GET /api/health`
Checks server uptime and service status.
- **Method**: `GET`
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "ClipGrab",
    "timestamp": "2026-08-23T02:30:00.000Z"
  }
  ```

---

### 4.2. `POST /api/fetch-info`
Validates a YouTube URL, queries `yt-dlp` for raw JSON metadata, and returns categorized, formatted download options.

- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
  }
  ```
- **Success Response Shape** (`200 OK`):
  ```json
  {
    "success": true,
    "metadata": {
      "id": "aqz-KE-bpKQ",
      "title": "Big Buck Bunny 4K 60fps",
      "channel": "Blender Foundation",
      "channelUrl": "https://www.youtube.com/@BlenderFoundation",
      "duration": 596,
      "durationFormatted": "09:56",
      "thumbnail": "https://i.ytimg.com/vi/aqz-KE-bpKQ/maxresdefault.jpg",
      "viewCount": 15420100,
      "viewCountFormatted": "15.4M views",
      "uploadDate": "2014-04-12",
      "originalUrl": "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
    },
    "formats": {
      "videoWithAudio": [
        {
          "formatId": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]",
          "label": "1080p Full HD (MP4)",
          "quality": "1080p",
          "ext": "mp4",
          "resolution": "1920x1080",
          "filesizeApprox": 125829120,
          "filesizeFormatted": "120 MB",
          "hasVideo": true,
          "hasAudio": true,
          "note": "High Quality Merged"
        },
        {
          "formatId": "22",
          "label": "720p (MP4)",
          "quality": "720p",
          "ext": "mp4",
          "resolution": "1280x720",
          "filesizeApprox": 52428800,
          "filesizeFormatted": "50.0 MB",
          "hasVideo": true,
          "hasAudio": true,
          "note": "Direct Stream"
        }
      ],
      "videoOnly": [
        {
          "formatId": "313",
          "label": "4K (2160p) 60fps Video Only (WEBM)",
          "quality": "4K (2160p)",
          "ext": "webm",
          "resolution": "3840x2160",
          "fps": 60,
          "filesizeApprox": 587202560,
          "filesizeFormatted": "560 MB",
          "hasVideo": true,
          "hasAudio": false,
          "note": "Ultra HD Video Stream"
        }
      ],
      "audioOnly": [
        {
          "formatId": "mp3_320",
          "label": "MP3 Audio (320 kbps - High Quality)",
          "quality": "320 kbps",
          "ext": "mp3",
          "bitrate": 320,
          "filesizeApprox": 23840000,
          "filesizeFormatted": "22.7 MB",
          "hasVideo": false,
          "hasAudio": true,
          "isAudioConversion": true,
          "note": "Best MP3 Audio"
        },
        {
          "formatId": "140",
          "label": "M4A Audio (128 kbps)",
          "quality": "128 kbps",
          "ext": "m4a",
          "bitrate": 128,
          "filesizeApprox": 9536000,
          "filesizeFormatted": "9.1 MB",
          "hasVideo": false,
          "hasAudio": true,
          "note": "High Compatibility AAC"
        }
      ]
    }
  }
  ```
- **Error Response Shape** (`400`, `404`, `429`, `500`):
  ```json
  {
    "success": false,
    "error": "This video is unavailable, private, or has been removed.",
    "errorCode": "VIDEO_NOT_FOUND"
  }
  ```

---

### 4.3. `GET /api/download`
Streams media directly to the client browser with appropriate `Content-Disposition` attachment headers and `Content-Type`.

- **Method**: `GET`
- **Query Parameters**:
  - `url` (*required*): The YouTube video URL.
  - `formatId` (*required*): Selected format identifier (e.g. `22`, `mp3_320`, `bestvideo+bestaudio`).
  - `title` (*optional*): Target video title for naming the downloaded file.
  - `ext` (*optional*): File extension (e.g., `mp4`, `mp3`, `webm`, `m4a`).
- **HTTP Response Headers**:
  - `Content-Type`: `video/mp4` | `audio/mpeg` | `video/webm` | `audio/mp4`
  - `Content-Disposition`: `attachment; filename="Safe_Title.mp4"; filename*=UTF-8''Safe_Title.mp4`
  - `Transfer-Encoding`: `chunked`
- **Streaming Behavior**: Standard chunked binary stream piped directly from `child_process.stdout` into Express `res`. Disconnecting the request automatically sends `SIGTERM` to the underlying child process.

---

## 5. Folder & File Structure

```
ClipGrab/
├── .env.example                     # Environment configuration template
├── .gitignore                       # Git exclusion rules
├── APPLICATION_SPEC.md              # Mandatory comprehensive technical spec
├── Dockerfile                       # Production container definition (Node, Python3, FFmpeg, yt-dlp)
├── index.html                       # HTML application entry point
├── metadata.json                    # Platform capabilities and application metadata
├── package.json                     # Project scripts and dependencies
├── server.ts                        # Express backend, rate limiting, and Vite middleware integration
├── tsconfig.json                    # TypeScript compiler configuration
├── vite.config.ts                   # Vite + Tailwind CSS plugins configuration
├── bin/
│   └── yt-dlp                       # Standalone executable binary
└── src/
    ├── App.tsx                      # Main React page component & dark mode manager
    ├── index.css                    # Tailwind CSS v4 styling rules
    ├── main.tsx                     # React 19 root bootstrap
    ├── types.ts                     # TypeScript shared interfaces & response schemas
    ├── components/
    │   ├── ErrorMessage.tsx         # Contextual error display with retry action
    │   ├── Footer.tsx               # Stateless guarantee, architecture info, legal disclaimer
    │   ├── FormatButton.tsx         # Single format item with download & direct stream link copy
    │   ├── FormatCategoryList.tsx   # 3-Category tabbed and grouped container
    │   ├── LoadingSkeleton.tsx      # Shimmer skeleton for smooth loading UX
    │   ├── Navbar.tsx               # Header, theme switcher, and stateless status badge
    │   ├── UrlInputForm.tsx         # Large input field, paste button, quick sample chips
    │   └── VideoInfoCard.tsx        # Video preview, duration badge, channel, and stats
    └── lib/
        ├── rateLimit.ts             # In-memory sliding-window IP rate limiter
        ├── validators.ts            # YouTube URL validation & ID extractor
        └── ytdlp.ts                 # yt-dlp child process wrapper, categorization & stream handler
```

---

## 6. Category Classification Logic

When `yt-dlp -J` returns the raw `formats` array, each format object is inspected:

1. **Audio & Video Detection**:
   - `hasVideo = Boolean(format.vcodec && format.vcodec !== 'none')`
   - `hasAudio = Boolean(format.acodec && format.acodec !== 'none')`

2. **Bucketing Strategy**:
   - **Category 1: Video (with Audio)**:
     - Direct progressive formats where `hasVideo === true` AND `hasAudio === true`.
     - Synthesized high-definition merged profiles (`bestvideo[height<=1080]+bestaudio/best`) mapped for 1080p, 720p, and 480p to provide full MP4 files when YouTube only stores video and audio tracks separately.
     - Sorted descending by resolution height (1080p $\rightarrow$ 720p $\rightarrow$ 480p $\rightarrow$ 360p) and total bitrate.
   - **Category 2: Video Only**:
     - Formats where `hasVideo === true` AND `hasAudio === false` (DASH video streams).
     - Captures 4K (2160p), 2K (1440p), and 1080p 60fps high-bitrate WebM/MP4 tracks.
     - Sorted descending by resolution height and frame rate (fps).
   - **Category 3: Audio Only**:
     - Standard audio streams where `hasVideo === false` AND `hasAudio === true` (e.g. M4A AAC, OPUS).
     - Dedicated MP3 transcoding options synthesized at `320 kbps` (High Quality), `192 kbps` (Standard), and `128 kbps` (Compact), powered by FFmpeg `-x --audio-format mp3`.
     - Sorted descending by audio bitrate (`abr`).

3. **Size Approximation**:
   - Uses `format.filesize` or `format.filesize_approx`. If omitted by YouTube, calculated dynamically via:
     $$\text{Filesize (Bytes)} \approx \frac{\text{Bitrate (kbps)} \times 1000 \times \text{Duration (seconds)}}{8}$$

---

## 7. Setup & Run Instructions

### 7.1. Local Development

1. **Prerequisites**:
   - Node.js 18+ and npm installed.
   - Python 3 and FFmpeg installed on your host machine:
     - **macOS**: `brew install python ffmpeg`
     - **Ubuntu/Debian**: `sudo apt update && sudo apt install -y python3 ffmpeg curl`
     - **Windows**: Install Python 3 and FFmpeg via `winget install Gyan.FFmpeg Python.Python.3`

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Ensure `yt-dlp` Binary is Present**:
   ```bash
   mkdir -p bin
   curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ./bin/yt-dlp
   chmod a+rx ./bin/yt-dlp
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

---

### 7.2. Docker Deployment

Build and run the single, self-contained container:

```bash
# Build the Docker image
docker build -t clipgrab:latest .

# Run container on port 3000
docker run -d -p 3000:3000 --name clipgrab-app clipgrab:latest
```

---

## 8. Deployment Notes

- **Vercel Serverless Limitation**:
  `yt-dlp` and `FFmpeg` are compiled system binaries requiring process execution (`child_process.spawn`) and Python/FFmpeg system runtime libraries. Standard serverless environments (such as basic Vercel Serverless Functions or AWS Lambda without custom binary layers) cannot execute arbitrary system binaries and will fail.
- **Recommended Hosting Environments**:
  - **Google Cloud Run** (Containerized execution with on-demand scaling)
  - **Docker VPS** (DigitalOcean, Linode, Hetzner)
  - **Render / Railway / Fly.io** (Docker container deployment mode)
  - **Self-hosted Kubernetes / Docker Swarm**

---

## 9. Known Limitations

1. **Stateless & No Authentication**: There is no database or user session store, so download histories are not persisted across browser sessions.
2. **In-Memory Rate Limiting**: The sliding-window IP rate limiter is stored in memory per process instance. In a multi-replica clustered environment, a shared Redis instance would be required for global rate limiting.
3. **Age-Restricted & Private Videos**: Videos marked as private or requiring user authentication/age verification cannot be extracted without providing authenticated YouTube cookies.
4. **Live Streams**: Active live streams cannot be downloaded until the broadcast completes and YouTube publishes the standard VOD formats.
5. **Bandwidth & CPU**: Real-time transcoding (such as on-the-fly MP3 conversion) utilizes server CPU and bandwidth. For heavy concurrency, dedicated container scaling is recommended.

---

## 10. Legal & Usage Note

> **Fair Use & Copyright Notice**:
> This tool is provided strictly for personal archiving, educational analysis, and downloading media that the user has the legal right to access and copy (including the user's own video uploads, works in the public domain, Creative Commons-licensed content, or videos where the rights holder has granted explicit download permission). Downloading and redistributing copyrighted material without the authorization of the copyright owner may violate YouTube's Terms of Service and applicable copyright laws in your jurisdiction. ClipGrab does not host, index, or store any media files on its servers.
