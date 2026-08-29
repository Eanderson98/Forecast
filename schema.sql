-- Forecast is a shared, no-login app, so its persisted state lives in a
-- single JSONB blob: one row holds everything the frontend needs to
-- restore on load (clients, workspaces, tasks, people, taxonomies, table
-- column settings). See app/src/api.ts for the exact shape it reads/writes.
--
-- This file is applied automatically on first boot by the Postgres Docker
-- image (mounted at /docker-entrypoint-initdb.d/); for a manual setup, run
-- it once yourself: psql "$DATABASE_URL" -f server/schema.sql
CREATE TABLE IF NOT EXISTS app_state (
  id integer PRIMARY KEY DEFAULT 1,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_state_single_row CHECK (id = 1)
);
