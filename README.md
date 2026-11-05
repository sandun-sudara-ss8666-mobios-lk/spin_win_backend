# MobiOs Spin & Win @ INFOTEL — Authoritative Backend

Production-ready backend for the **MobiOs Spin & Win** exhibition application at INFOTEL. Built with NestJS, TypeScript, MySQL 8, Prisma ORM, Socket.IO, and Swagger OpenAPI.

---

## Environment modes and media URLs

Public connection settings live in `.env.development` and `.env.production`. Keep database credentials, JWT secrets, and display secrets in the ignored `.env` file or server environment. Mode settings take precedence over `.env`; exported shell/server variables take precedence over both.

- Local backend: `npm run start:dev` selects development settings and listens on port 3010. REST routes have no prefix (for example, `/merchants`).
- Production backend: `npm run build`, then `npm run start:prod` selects production settings. Nginx must strip the public `/api/v1/` prefix as shown below.
- `PUBLIC_MEDIA_BASE_URL` is `http://localhost:3010/` locally and `https://spin-n-win.mobios.lk/api/v1/` in production. For testing on another device, replace localhost with the backend machine's LAN address and update the frontend development URLs too.

The database keeps existing relative upload paths. HTTP responses and spin/wheel socket payloads expand owned `logoUrl`, `videoUrl`, and `iconUrl` paths into complete URLs. Existing external URLs and null values are preserved. The frontend can use returned image URLs directly. This requires no data migration; restart the backend and frontend after changing environment settings.

For example, the stored `/api/v1/merchant-logos/<uuid>.png` becomes `http://localhost:3010/merchant-logos/<uuid>.png` locally. An existing file must be present under `MERCHANT_LOGO_DIR` (default `uploads/merchant-logos`); changing a URL does not copy files between local and production servers. Persist both logo and video directories across deployments.

Configuration follows [NestJS environment file precedence](https://docs.nestjs.com/techniques/configuration).

## Key Capabilities

- **Dynamic Rolling Pacing Engine:** Rolling time-based release evaluated in real-time against authoritative server time during spins without cron jobs.
- **Strict Priority Curves:** Monotonic weighting curve with preview endpoint ensuring higher-ranked prizes get higher relative odds with true random outcomes.
- **Server-Authoritative Spin Engine:** Atomic MySQL InnoDB locking (`SELECT ... FOR UPDATE` & conditional decrement) guaranteeing hard inventory bounds, double-spin prevention, and crash recovery.
- **Exhibition Day Lifecycle:** Transactional `UPCOMING` -> `IN_PROGRESS` -> `COMPLETED` state machine. Exactly one active day per exhibition with automated carry-forward transfer and independent pause/resume controls.
- **Rotating QR Code & Visitor Claims:** 15-second rotating QR tokens with concurrency-safe atomic claims and Sri Lankan phone normalization (`+94 7X XXX XXXX`).
- **Award Handover & Cancellation:** Real-time cancellation workflow with `IMMEDIATE_RETURN`, `RETURN_TO_PACING`, or `RETIRE` resolution modes and immutable audit ledger.
- **Real-Time WebSockets:** Socket.IO gateway with authenticated room subscriptions for QR displays, Big Wheel screens, staff queues, and admin dashboards.

---

## Prerequisites

- **Node.js:** v20+ (tested on Node v24.3.0)
- **MySQL:** 8.0+ (running on `localhost:3306`)
- **Package Manager:** `npm`

## Reward celebration videos

Admins can upload, replace, remove, and enable a video from reward creation/editing. `POST /rewards` and `PATCH /rewards/:id` accept JSON as before, or multipart form data with a `video` file and the reward fields. Send `isVideoShow` as a boolean (`true`/`false` strings in multipart); send `removeVideo: true` on an update to remove the video. Enable playback only after a video is attached. In multipart requests, encode `customDailyAllocations` as a JSON object string.

Upload browser-compatible MP4 files; H.264 video with AAC audio is recommended. The browser checks a maximum duration of 10 seconds and resolution of 1920 × 1080 (or portrait equivalent), along with the filename, MIME type, and 15,000,000-byte size limit. The backend independently enforces the size limit and checks the MP4 container signature, then saves the original bytes with a unique filename. No external video tools or conversion are required. Duration, resolution, and codecs are not verified on the server; browser checks can be bypassed, so this workflow is intended for trusted staff uploads. Files that cannot play use the existing celebration fallback.

Accepted files are saved under `uploads/video` (override with `REWARD_VIDEO_DIR`). The database stores their public `/api/v1/reward-videos/<uuid>.mp4` URL and `isVideoShow`, which defaults to false for existing rewards. Nest serves `/reward-videos`; the existing Nginx `/api/v1/` proxy prefix applies publicly. UUID filenames allow immutable caching. Persist and back up the uploads directory alongside the database, and make it writable by the backend process. Replaced/removed files are deleted after the reward update succeeds.

Before deploying this feature:

1. Run `npx prisma migrate deploy` and `npx prisma generate`, then build/restart the backend.
2. Allow at least **16 MB** multipart request bodies in the reverse proxy (for Nginx, `client_max_body_size 16m;`) and retain the existing `/api/v1/` forwarding behavior. The application still enforces its 15 MB file limit.

The active wheel response exposes each slice's `rewardId`, `videoUrl`, and `isVideoShow`. Spin responses expose the same video metadata on the awarded reward. Updating a reward notifies connected wheel displays to reload their metadata.

The frontend preloads enabled videos for both winning and non-winning slices on the active wheel, with two downloads at a time. It downloads each complete file into a Blob and prepares a video element before considering it ready. At wheel stop it selects the ready video once; an unfinished download never delays a win or appears halfway through a popup. Playback runs once inside the popup, respects the display mute setting, and suppresses the synthetic outcome sound. Missing/unready files, decoding errors, blocked audible autoplay, and playback stalls fall back to the existing winning or non-winning display and sound. Closing the popup pauses the video; changing wheels/unmounting releases obsolete Blob URLs. The browser must permit audible playback for the display origin; if it rejects playback, fallback remains available.

Verification commands: `npm test -- --runInBand --watchman=false test/unit` in the backend, and `npm test` / `npm run build` in the frontend. Database integration tests require a dedicated disposable database; the video HTTP tests use an in-memory store and do not modify a real database.

---

## Quick Start & Local Setup

### 1. Install Dependencies
```bash
cd spin_win_backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and verify database credentials:
```bash
cp .env.example .env
```
Default connection string:
```env
DATABASE_URL="mysql://root:12345678@localhost:3306/mobios_spin_win"
DATABASE_URL_TEST="mysql://root:12345678@localhost:3306/mobios_spin_win_test"
```

### 3. Run Database Migrations
```bash
npx prisma migrate dev
```

### 4. Run Idempotent Database Seed
Populates the initial admin account, 3 exhibition days, 4 merchants, 10 prizes, and the default 12-slice wheel:
```bash
npx prisma db seed
```

### Production seed

Set `DATABASE_URL`, `INITIAL_ADMIN_EMAIL`, and `INITIAL_ADMIN_PASSWORD` in the
process environment, then run:

```bash
npm run seed:production
```

This command does not load `.env.production`; export its values through your
shell or deployment environment first. Admin login uses the configured email as
the username. Passwords are bcrypt hashed; the seed has no default admin password.
`INITIAL_ADMIN_NAME` defaults to `MobiOs Infotel Admin`.

The seed creates `MobiOs Spin & Win @ INFOTEL`, with description
`Flagship interactive exhibition experience for INFOTEL visitors`, timezone
`Asia/Colombo`, and operating hours `09:00:00`–`21:00:00`. Override these using
`SEED_EXHIBITION_NAME`, `SEED_EXHIBITION_DESCRIPTION`, `DEFAULT_TIMEZONE`,
`DEFAULT_PACING_START_TIME`, and `DEFAULT_PACING_END_TIME`.

The explicit dates in `prisma/seed-production.ts` are:

| Day | Date | Label |
| --- | --- | --- |
| 1 | 2026-11-06 | Day 1 - November 6 |
| 2 | 2026-11-07 | Day 2 - November 7 |
| 3 | 2026-11-08 | Day 3 - November 8 |

New days start as `UPCOMING`; start the appropriate day through the admin panel.
The dates stay fixed regardless of the year the seed runs.

Only TEXTWARE and Eventure are created, with all four vouchers assigned to
Eventure: මනමාල කුරුල්ලෝ (500), ජැක් සහ මායා බෝංචි වැල (150),
ගරු කටානයකතුමනි (50), and Doctors’ Night @ Sky Lounge (90).
Initial stock is allocated across the exhibition days, with any remainder on
the first day.

Reruns preserve existing admin credentials, exhibition settings, day statuses,
merchant settings, and remaining inventory. Missing days are created; existing
Eventure rewards are skipped. Run one seed process at a time. The setup runs in
one transaction. Configure the wheel separately to include these rewards.

### 5. Start Development Server
```bash
npm run start:dev
```
The server will start on `http://localhost:3000`.

- **Swagger Documentation:** `http://localhost:3000/api/docs`
- **REST Base URL:** `http://localhost:3000` (no backend route prefix)
- **Health Check:** `http://localhost:3000/health` (public liveness check; does not query the database)
- **Socket.IO Gateway:** `ws://localhost:3000/events`

### Nginx deployment

The frontend production environment uses:

```env
VITE_API_BASE_URL=https://spin-n-win.mobios.lk/api/v1/
VITE_SOCKET_URL=https://spin-n-win.mobios.lk/api/v1/events
```

Rebuild the frontend after changing these values. Nginx must strip `/api/v1/`
from upstream requests and support WebSocket upgrades. For example, inside the
HTTPS server block (adjust the backend port to match `PORT`):

```nginx
location /api/v1/ {
    proxy_pass http://127.0.0.1:3010/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 75s;
}
```

The trailing slash in `proxy_pass` strips the public prefix. REST requests such
as `/api/v1/auth/login` reach `/auth/login`. Socket.IO uses namespace `/events`
with public transport path `/api/v1/socket.io/`, forwarded to `/socket.io/`.
Uploaded merchant logos at `/api/v1/merchant-logos/...` reach `/merchant-logos/...`.
Swagger is available through `/api/v1/api/docs`.

Check the running backend through Nginx:

```bash
curl --fail https://spin-n-win.mobios.lk/api/v1/health
```

Expected HTTP 200 response includes `"success": true` and `"data": { "status": "ok" }`.

---

## Running Verification Tests & Linter

```bash
# Run unit and integration test suites
npm test

# Run ESLint check
npm run lint

# Build production bundle
npm run build
```

---

## Default Credentials (Local Seed)

- **Admin Email:** `admin@mobios.lk`
- **Admin Password:** `AdminPassword@2026`
- **Display Shared Secret Token:** `mobios-display-screen-auth-token-key-2026`
