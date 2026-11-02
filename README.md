# MobiOs Spin & Win @ INFOTEL — Authoritative Backend

Production-ready backend for the **MobiOs Spin & Win** exhibition application at INFOTEL. Built with NestJS, TypeScript, MySQL 8, Prisma ORM, Socket.IO, and Swagger OpenAPI.

---

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

### 5. Start Development Server
```bash
npm run start:dev
```
The server will start on `http://localhost:3000`.

- **Swagger Documentation:** `http://localhost:3000/api/docs`
- **REST Base URL:** `http://localhost:3000/api/v1`
- **Socket.IO Gateway:** `ws://localhost:3000/events`

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
