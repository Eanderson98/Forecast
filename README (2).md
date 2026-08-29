# Forecast

A work-management app (boards, table, kanban, calendar, timeline, people) built with React + TypeScript + Vite, backed by a small Express + Postgres server for persistence.

## Layout

```
app/       the frontend (Vite + React + TypeScript) — see app/README.md
server/    the API + Postgres persistence layer — see server/README.md
docker-compose.yml   one-command self-hosting (builds app/, runs server/ + Postgres)
```

`app/src/main.tsx` is the frontend's entry point; `app/src/App.tsx` is the root component. Everything else in `app/src/` is organized by kind (`components/`, `styles/`, `utils/`) or is a single top-level module (`store.ts`, `types.ts`, `api.ts`, `persistence.ts`, `data.ts`, `selectors.ts`).

## Quick start (self-hosting)

```bash
docker compose up --build
```

Then open **http://localhost:3001**. See `app/README.md` for local development without Docker, environment variables, and how persistence works.
