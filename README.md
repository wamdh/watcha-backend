# WATCHA Production Backend

A high-performance, modular Node.js/Express backend service written in TypeScript for the WATCHA Android streaming application.

## 🚀 Overview
The WATCHA backend handles all server-side operations, external API communication, search orchestration, source discovery, and caching:
- **TMDB Integration**: Secure server-side TMDB API communication with private `TMDB_READ_ACCESS_TOKEN`. No secrets on mobile.
- **Aggregated Catalog**: Dedicated `/api/v1/catalog/home` endpoint returning all home screen shelves in a single payload.
- **Source Discovery**: Secure query of approved Stremio addons (Torrentio) with SSRF protection, resolution parsing, and stream normalization.
- **Provider-Based Caching**: In-memory LRU/TTL cache with optional Redis support and request deduplication (`singleflight` pattern).
- **Health & Readiness**: Operational monitoring endpoints for cloud orchestrators (Render).

---

## 🛠 Tech Stack
- **Runtime**: Node.js 20+
- **Language**: TypeScript (Strict mode)
- **Framework**: Express 4
- **Validation**: Zod
- **Logging**: Pino (Structured JSON logging with secret redaction)
- **Testing**: Vitest & Supertest
- **Security**: Helmet, CORS, SSRF protection, rate limiting

---

## 📦 Setup & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your TMDB Read Access Token:
```bash
cp .env.example .env
```
Key variables:
- `PORT`: Server port (default: `10000`)
- `HOST`: Server host (default: `0.0.0.0`)
- `TMDB_READ_ACCESS_TOKEN`: Your TMDB API v4/v3 Bearer token
- `ALLOWED_ORIGINS`: Allowed origins or `*`
- `REDIS_URL`: Optional Redis connection string (falls back to memory if empty)

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build & Run Production
```bash
npm run build
npm start
```

### 5. Run Tests
```bash
npm test
npm run typecheck
```

---

## 🌐 API Endpoints (`/api/v1`)
- `GET /api/v1/health` — Basic service health check
- `GET /api/v1/health/ready` — Readiness check (TMDB auth, cache, memory)
- `GET /api/v1/app/config` — Mobile configuration & capabilities
- `GET /api/v1/catalog/home` — Aggregated home screen catalog
- `GET /api/v1/catalog/trending?type=all|movie|tv&timeWindow=day|week&page=1`
- `GET /api/v1/catalog/popular?type=movie|tv&page=1`
- `GET /api/v1/catalog/top-rated?type=movie|tv&page=1`
- `GET /api/v1/movies/:id` — Complete movie details with cast, trailers, and similar
- `GET /api/v1/series/:id` — Complete series details with seasons summary
- `GET /api/v1/series/:id/seasons/:seasonNumber` — Season and episode details
- `GET /api/v1/search?q=query&type=all|movie|tv&page=1` — Multilingual search
- `GET /api/v1/sources/:mediaType/:id?season=X&episode=Y` — Source discovery (direct & torrents with upstream tracker extraction)

---

## 📱 Mobile Client Integration (WATCHA 0.2)
- **Progressive Playback Contract**: Source discovery returns full `infoHash`, `fileIdx`, `trackers`, `fileSizeBytes`, `resolution`, and `codec`.
- **Decoupled Architecture**: Video bytes stream directly from the P2P network to Android loopback; Render handles discovery & metadata only.
- **Upstream Trackers**: High-speed Tier-1 public trackers are enriched for robust peer discovery.

---

## 🚢 Render Deployment
This repository includes a `render.yaml` blueprint:
1. Connect this GitHub repository in Render.
2. Select **Web Service**.
3. Set `TMDB_READ_ACCESS_TOKEN` in Render Environment Variables.
4. Render builds with `npm install && npm run build` and runs `npm start`.
5. Health check endpoint: `/api/v1/health`.
