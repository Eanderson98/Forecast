# Forecast

A work-management app (boards, table, kanban, calendar, timeline, people) built with React + TypeScript + Vite, backed by a small Express + Postgres server for persistence. See `../server/` for the backend.

## Project layout

```
app/       this frontend (Vite + React)
server/    Express API + Postgres persistence (see server/README or below)
```

## How persistence works

The app is a **shared, single-tenant** tool — there's no login. Everyone hitting the same hosted URL reads and writes the same data. Everything except per-tab UI state (open modals, search text, which filters are active, which tab you're on) is saved to the database:

- On load, the app fetches the shared state from `GET /api/state`.
- After any change, it waits ~800ms (debounced) and pushes the whole state back with `PUT /api/state`.
- If two browsers/devices save around the same time, the **last save wins** — there's no real-time merge or conflict resolution. For a small team using one shared board at a time this is rarely an issue in practice, but it's worth knowing.
- If no backend is reachable at all (e.g. this app running as a standalone static preview with no server), it falls back to local-only in-memory state after a few seconds — fully usable, just nothing persists.

Task file attachments are the one thing that *isn't* in that JSONB blob: the files themselves are saved to the server's own disk (`UPLOADS_DIR`, see below), and only their metadata (name, size, type) rides along in the regular state save. Self-hosting with Docker Compose already mounts a volume for this; self-hosting without Docker, make sure `UPLOADS_DIR` points somewhere that survives a restart.

## Local development

You need three things running: Postgres, the API server, and the Vite dev server.

```bash
# 1. Postgres (either local or via Docker)
docker run -d --name forecast-db -e POSTGRES_USER=forecast -e POSTGRES_PASSWORD=forecast \
  -e POSTGRES_DB=forecast -p 5432:5432 postgres:16-alpine

# 2. The API server
cd server
cp .env.example .env   # DATABASE_URL already points at the container above
npm install
npm run dev             # http://localhost:3001

# 3. The frontend, in another terminal
cd app
npm install
npm run dev              # http://localhost:5173, proxies /api to :3001
```

Open http://localhost:5173 — changes you make are saved to Postgres within ~800ms.

## Self-hosting (recommended: Docker Compose)

From the repo root:

```bash
docker compose up --build
```

This builds the frontend, starts the API server (which also serves the built frontend as static files), and starts Postgres — all in one command. Once it's up, the whole app is at **http://localhost:3001**. Data survives restarts (`docker compose down && docker compose up` keeps it — only `docker compose down -v` wipes the database volume).

To run it on a real server, put a reverse proxy (Caddy, nginx, Traefik) in front of port 3001 for TLS, and change the `db`/`app` service ports in `docker-compose.yml` if 3001/5432 are already taken.

## Self-hosting without Docker

```bash
# Build the frontend
cd app && npm install && npm run build

# Point the server at a real Postgres database and run it
cd ../server
npm install
DATABASE_URL=postgres://user:pass@host:5432/dbname npm start
```

The server creates its one table (`app_state`) automatically on first boot — no separate migration step needed. It serves the built frontend from `app/dist` by default; set `STATIC_DIR` if you've moved that build elsewhere.

## Environment variables (server)

| Variable       | Required | Default                          |
|----------------|----------|-----------------------------------|
| `DATABASE_URL` | yes      | —                                  |
| `PORT`         | no       | `3001`                             |
| `STATIC_DIR`   | no       | `<repo>/app/dist`                  |
| `UPLOADS_DIR`  | no       | `<repo>/server/uploads`            |

File uploads are capped at 25MB each (see `MAX_UPLOAD_BYTES` in `server/src/index.js`) and served back as attachments, never rendered inline — an uploaded HTML or SVG file is downloaded, not executed.

## Scripts (this package)

- `npm run dev` — Vite dev server
- `npm run build` — production build to `dist/`
- `npm run build:artifact` — single-file build (used for standalone previews with no backend)
- `npm run lint` — Oxlint
